import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";

interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  type: 'nas' | 'server' | 'shared_drive' | 'cloud_storage';
  availableSpace: number;
  totalSpace: number;
  status: 'online' | 'offline' | 'limited';
  accessType: 'smb' | 'ftp' | 'nfs' | 'http' | 'cloud_api';
  lastSeen: string;
  manufacturer?: string;
  model?: string;
}

/**
 * Scans the network for available storage devices
 * Returns a list of compatible storage devices with their current status
 */
export async function scanNetworkDevices(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Scan network devices function processed a request.");

  // Check request method
  if (req.method !== "GET") {
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
    context.log(`User ${userInfo.displayName} is scanning for network devices`);
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: "Invalid access token" }),
    };
  }

  try {
    // In a real implementation, this would:
    // 1. Scan local network subnets
    // 2. Check for SMB/CIFS shares
    // 3. Discover NAS devices via UPnP/SSDP
    // 4. Check cloud storage APIs
    // 5. Validate access permissions
    // 6. Test connection speeds
    
    // For now, we'll simulate discovered devices
    const simulatedDevices: NetworkDevice[] = await simulateNetworkScan(context);

    // Filter devices based on organization's network segment
    // In production, you'd implement actual network discovery
    const organizationDevices = filterByOrganizationNetwork(simulatedDevices, userInfo.tid);

    context.log(`Found ${organizationDevices.length} network storage devices`);

    return {
      status: 200,
      body: JSON.stringify({ 
        success: true,
        devices: organizationDevices,
        scanTime: new Date().toISOString(),
        totalFound: organizationDevices.length
      }),
    };

  } catch (error: any) {
    context.error(`Network scan error: ${error.message}`);
    return {
      status: 500,
      body: JSON.stringify({ 
        error: "Internal server error during network scan",
        success: false
      }),
    };
  }
}

/**
 * Simulates network device discovery
 * In production, replace with actual network scanning logic
 */
async function simulateNetworkScan(context: InvocationContext): Promise<NetworkDevice[]> {
  context.log("Starting network device simulation...");

  // Simulate scanning delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const devices: NetworkDevice[] = [
    {
      id: "nas-001",
      name: "Office NAS Server",
      ipAddress: "192.168.1.100",
      type: "nas",
      availableSpace: 2048, // GB
      totalSpace: 4096, // GB
      status: "online",
      accessType: "smb",
      lastSeen: new Date().toISOString(),
      manufacturer: "Synology",
      model: "DS920+"
    },
    {
      id: "server-001",
      name: "File Server MAIN-FS01",
      ipAddress: "192.168.1.50",
      type: "server",
      availableSpace: 5120, // GB
      totalSpace: 10240, // GB
      status: "online",
      accessType: "smb",
      lastSeen: new Date().toISOString(),
      manufacturer: "Dell",
      model: "PowerEdge R740"
    },
    {
      id: "cloud-001",
      name: "Azure Files Share",
      ipAddress: "azure-files.core.windows.net",
      type: "cloud_storage",
      availableSpace: 1000000, // GB (practically unlimited)
      totalSpace: 1000000, // GB
      status: "online",
      accessType: "cloud_api",
      lastSeen: new Date().toISOString(),
      manufacturer: "Microsoft",
      model: "Azure Files"
    },
    {
      id: "nas-002",
      name: "Backup NAS",
      ipAddress: "192.168.1.101",
      type: "nas",
      availableSpace: 512, // GB
      totalSpace: 2048, // GB
      status: "limited",
      accessType: "smb",
      lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      manufacturer: "QNAP",
      model: "TS-251D"
    },
    {
      id: "shared-001",
      name: "Department Shared Drive",
      ipAddress: "192.168.1.75",
      type: "shared_drive",
      availableSpace: 1024, // GB
      totalSpace: 2048, // GB
      status: "online",
      accessType: "smb",
      lastSeen: new Date().toISOString()
    }
  ];

  // Simulate some devices being offline randomly
  devices.forEach(device => {
    if (Math.random() < 0.1) { // 10% chance of being offline
      device.status = "offline";
      device.lastSeen = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    }
  });

  return devices;
}

/**
 * Filters devices based on organization's network
 * In production, implement proper network segmentation logic
 */
function filterByOrganizationNetwork(devices: NetworkDevice[], tenantId: string): NetworkDevice[] {
  // For simulation, return all devices
  // In production, filter based on:
  // - Network subnet access
  // - Organization permissions
  // - Security policies
  // - Domain membership
  
  return devices.filter(device => {
    // Simulate organization-specific filtering
    // Remove devices that are offline for too long
    if (device.status === "offline") {
      const lastSeenTime = new Date(device.lastSeen).getTime();
      const hoursSinceLastSeen = (Date.now() - lastSeenTime) / (1000 * 60 * 60);
      
      // Remove if offline for more than 2 hours
      if (hoursSinceLastSeen > 2) {
        return false;
      }
    }
    
    // Include all other devices
    return true;
  });
}

app.http("scanNetworkDevices", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: scanNetworkDevices,
});
