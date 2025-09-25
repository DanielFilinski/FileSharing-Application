import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";
import { getContainer } from "../shared/db/cosmos";

/**
 * Allocates storage space for clients and validates available space
 * Handles both cloud and physical storage allocation
 */
export async function allocateStorage(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Allocate storage function processed a request.");

  // Check request method
  if (req.method !== "POST") {
    return {
      status: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check authorization token
  const accessToken: string = req.headers.get("Authorization")?.replace("Bearer ", "").trim();
  if (!accessToken) {
    return {
      status: 401,
      body: JSON.stringify({ error: "No access token provided" }),
    };
  }

  // Initialize authentication
  const oboAuthConfig: OnBehalfOfCredentialAuthConfig = {
    authorityHost: config.authorityHost,
    clientId: config.clientId,
    tenantId: config.tenantId,
    clientSecret: config.clientSecret,
  };

  let oboCredential: OnBehalfOfUserCredential;
  let userInfo: any;

  try {
    oboCredential = new OnBehalfOfUserCredential(accessToken, oboAuthConfig);
    userInfo = await oboCredential.getUserInfo();
    context.log(`User ${userInfo.displayName} is allocating storage`);
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: "Invalid access token" }),
    };
  }

  try {
    // Parse request body
    const body = await req.json();
    const { amount, unit, storageType, organizationId } = body;

    // Validate input
    if (!amount || !unit || !storageType) {
      return {
        status: 400,
        body: JSON.stringify({ 
          error: "Amount, unit, and storage type are required",
          success: false
        }),
      };
    }

    const amountNumber = parseInt(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return {
        status: 400,
        body: JSON.stringify({ 
          error: "Amount must be a positive number",
          success: false
        }),
      };
    }

    // Convert to bytes for consistency
    const multiplier = unit.toLowerCase() === 'gb' ? 1024 * 1024 * 1024 : 1024 * 1024;
    const totalBytes = amountNumber * multiplier;

    // Check available space limits
    const maxAllowedGB = 1000; // Maximum allowed allocation per organization
    const maxAllowedBytes = maxAllowedGB * 1024 * 1024 * 1024;

    if (totalBytes > maxAllowedBytes) {
      return {
        status: 200,
        body: JSON.stringify({ 
          success: false,
          error: "insufficient_space",
          message: `Requested ${amountNumber}${unit} exceeds maximum allowed ${maxAllowedGB}GB`,
          availableSpace: maxAllowedGB,
          requestedSpace: amountNumber
        }),
      };
    }

    // Get database container
    const container = await getContainer();

    // Check existing allocations for this organization
    const existingQuery = {
      query: "SELECT * FROM c WHERE c.type = 'storage-allocation' AND c.organizationId = @orgId",
      parameters: [{ name: "@orgId", value: organizationId || userInfo.tid }]
    };

    const existingAllocations = container.items.query(existingQuery);
    const existingResults = await existingAllocations.fetchAll();
    
    let totalExistingBytes = 0;
    for (const item of existingResults.resources) {
      totalExistingBytes += item.allocatedBytes || 0;
    }

    // Check if new allocation would exceed limits
    if (totalExistingBytes + totalBytes > maxAllowedBytes) {
      const availableBytes = maxAllowedBytes - totalExistingBytes;
      const availableGB = Math.floor(availableBytes / (1024 * 1024 * 1024));
      
      return {
        status: 200,
        body: JSON.stringify({ 
          success: false,
          error: "insufficient_space",
          message: `Not enough space available. Available: ${availableGB}GB, Requested: ${amountNumber}${unit}`,
          availableSpace: availableGB,
          requestedSpace: amountNumber
        }),
      };
    }

    // Create allocation record
    const allocationId = `allocation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const allocation = {
      id: allocationId,
      type: "storage-allocation",
      organizationId: organizationId || userInfo.tid,
      userId: userInfo.oid,
      userName: userInfo.displayName,
      storageType,
      allocatedAmount: amountNumber,
      allocatedUnit: unit,
      allocatedBytes: totalBytes,
      dmsAllocation: Math.floor(totalBytes / 2), // 50% for DMS
      portalAllocation: Math.floor(totalBytes / 2), // 50% for Portal
      createdAt: new Date().toISOString(),
      status: "active"
    };

    // Save allocation to database
    await container.items.create(allocation);

    context.log(`Storage allocated: ${amountNumber}${unit} for user ${userInfo.displayName}`);

    return {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        message: `Successfully allocated ${amountNumber}${unit}`,
        allocation: {
          id: allocationId,
          amount: amountNumber,
          unit: unit,
          dmsAllocation: Math.floor(amountNumber / 2),
          portalAllocation: Math.floor(amountNumber / 2),
          totalBytes
        }
      }),
    };

  } catch (error: any) {
    context.error(`Storage allocation error: ${error.message}`);
    return {
      status: 500,
      body: JSON.stringify({ 
        success: false,
        error: "Internal server error during storage allocation" 
      }),
    };
  }
}

app.http("allocateStorage", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: allocateStorage,
});
