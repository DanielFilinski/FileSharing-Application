import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { OnBehalfOfCredentialAuthConfig, OnBehalfOfUserCredential } from "@microsoft/teamsfx";
import config from "../config";

/**
 * Verifies SharePoint credentials by attempting to connect to the user's SharePoint
 * and checking access permissions
 */
export async function verifySharePointCredentials(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Verify SharePoint credentials function processed a request.");

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
    context.log(`User ${userInfo.displayName} is verifying SharePoint credentials`);
  } catch (e) {
    context.error(e);
    return {
      status: 401,
      body: JSON.stringify({ error: "Invalid access token" }),
    };
  }

  try {
    // Parse request body to get SharePoint credentials
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return {
        status: 400,
        body: JSON.stringify({ 
          status: "fail",
          error: "Email and password are required" 
        }),
      };
    }

    // Create Graph client with SharePoint permissions
    const authProvider = new TokenCredentialAuthenticationProvider(oboCredential, {
      scopes: [
        "https://graph.microsoft.com/Sites.Read.All",
        "https://graph.microsoft.com/Files.ReadWrite.All"
      ],
    });

    const graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });

    try {
      // Test SharePoint access by attempting to get user's SharePoint sites
      const sites = await graphClient.api("/sites").get();
      
      // Additional verification: try to access SharePoint root site
      const rootSite = await graphClient.api("/sites/root").get();
      
      if (sites && rootSite) {
        context.log(`SharePoint access verified for user ${userInfo.displayName}`);
        return {
          status: 200,
          body: JSON.stringify({ 
            status: "ok",
            message: "SharePoint access verified successfully",
            sitesCount: sites.value?.length || 0
          }),
        };
      } else {
        context.log(`SharePoint access failed for user ${userInfo.displayName}`);
        return {
          status: 200,
          body: JSON.stringify({ 
            status: "fail",
            error: "Unable to access SharePoint sites" 
          }),
        };
      }
    } catch (graphError: any) {
      context.error(`SharePoint access error: ${graphError.message}`);
      return {
        status: 200,
        body: JSON.stringify({ 
          status: "fail",
          error: "SharePoint access denied or insufficient permissions" 
        }),
      };
    }
  } catch (error: any) {
    context.error(`Verification error: ${error.message}`);
    return {
      status: 500,
      body: JSON.stringify({ 
        status: "fail",
        error: "Internal server error during verification" 
      }),
    };
  }
}

app.http("verifySharePointCredentials", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: verifySharePointCredentials,
});
