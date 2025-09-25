import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";
import { getContainer } from "../shared/db/cosmos";

/**
 * Escalates support cases to IT department when storage issues occur
 * Creates a support ticket and notifies relevant personnel
 */
export async function escalateCase(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Escalate case function processed a request.");

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
    context.log(`User ${userInfo.displayName} is escalating a case`);
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
    const { type, details, requestedAmount, currentAmount, storageType } = body;

    // Validate required fields
    if (!type) {
      return {
        status: 400,
        body: JSON.stringify({ error: "Case type is required" }),
      };
    }

    // Generate ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Determine priority based on case type
    let priority = "medium";
    if (type === "storage_insufficient" || type === "storage_critical") {
      priority = "high";
    } else if (type === "storage_urgent") {
      priority = "critical";
    }

    // Create support ticket record
    const ticket = {
      id: ticketId,
      type: "support-ticket",
      caseType: type,
      title: getTicketTitle(type),
      description: generateTicketDescription(type, details, requestedAmount, currentAmount, storageType),
      priority,
      status: "open",
      requester: {
        id: userInfo.oid,
        name: userInfo.displayName,
        email: userInfo.preferred_username || userInfo.upn,
        tenantId: userInfo.tid
      },
      organizationId: userInfo.tid,
      requestedAmount,
      currentAmount,
      storageType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: null,
      category: "infrastructure",
      subcategory: "storage"
    };

    // Save ticket to database
    const container = await getContainer();
    await container.items.create(ticket);

    // Log the escalation
    context.log(`Case escalated: ${ticketId} by ${userInfo.displayName} (${type})`);

    // In a real implementation, you would integrate with:
    // - Email service to notify IT team
    // - Teams/Slack notifications
    // - ITSM system (ServiceNow, Jira Service Management, etc.)
    // - SMS alerts for critical cases

    // Simulate IT notification process
    await simulateITNotification(context, ticket);

    return {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        ticketId,
        message: "Case successfully escalated to IT department",
        priority,
        estimatedResponseTime: getEstimatedResponseTime(priority)
      }),
    };

  } catch (error: any) {
    context.error(`Case escalation error: ${error.message}`);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: "Internal server error during case escalation" 
      }),
    };
  }
}

/**
 * Generates appropriate ticket title based on case type
 */
function getTicketTitle(caseType: string): string {
  switch (caseType) {
    case "storage_insufficient":
      return "Insufficient Storage Space - Allocation Request";
    case "storage_critical":
      return "Critical Storage Issue - Immediate Attention Required";
    case "storage_configuration":
      return "Storage Configuration Issue";
    case "sharepoint_access":
      return "SharePoint Access Issue";
    default:
      return "Storage Related Issue";
  }
}

/**
 * Generates detailed ticket description
 */
function generateTicketDescription(
  type: string, 
  details: any, 
  requestedAmount: number, 
  currentAmount: number, 
  storageType: string
): string {
  let description = `Case Type: ${type}\n\n`;
  
  if (requestedAmount) {
    description += `Requested Storage: ${requestedAmount}\n`;
  }
  
  if (currentAmount) {
    description += `Current Available: ${currentAmount}\n`;
  }
  
  if (storageType) {
    description += `Storage Type: ${storageType}\n`;
  }
  
  description += `\nIssue Details:\n${details || 'User encountered storage limitation during setup process.'}\n\n`;
  description += `Timestamp: ${new Date().toISOString()}\n`;
  description += `Requires immediate attention from IT infrastructure team.`;
  
  return description;
}

/**
 * Simulates IT notification process
 */
async function simulateITNotification(context: InvocationContext, ticket: any): Promise<void> {
  // In production, integrate with actual notification services
  context.log(`[IT NOTIFICATION] New ${ticket.priority} priority ticket: ${ticket.id}`);
  context.log(`[IT NOTIFICATION] Type: ${ticket.caseType}`);
  context.log(`[IT NOTIFICATION] Requester: ${ticket.requester.name}`);
  
  // Here you would integrate with:
  // - Microsoft Teams notifications
  // - Email alerts
  // - SMS for critical issues
  // - ITSM webhook notifications
}

/**
 * Returns estimated response time based on priority
 */
function getEstimatedResponseTime(priority: string): string {
  switch (priority) {
    case "critical":
      return "15 minutes";
    case "high":
      return "1 hour";
    case "medium":
      return "4 hours";
    case "low":
      return "24 hours";
    default:
      return "4 hours";
  }
}

app.http("escalateCase", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: escalateCase,
});
