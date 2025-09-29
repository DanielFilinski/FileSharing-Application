param resourceBaseName string
param functionAppSKU string
param aadAppClientId string
param aadAppTenantId string
param aadAppOauthAuthorityHost string
@secure()
param aadAppClientSecret string
@secure()
param sqlServerAdminLogin string
@secure()
param sqlServerAdminPassword string
param location string = resourceGroup().location
param serverfarmsName string = resourceBaseName
param functionAppName string = resourceBaseName
param staticWebAppName string = resourceBaseName
param staticWebAppSku string
var teamsMobileOrDesktopAppClientId = '1fec8e78-bce4-4aaf-ab1b-5451cc387264'
var teamsWebAppClientId = '5e3ce6c0-2b1f-4285-8d4b-75ee78787346'
var officeWebAppClientId1 = '4345a7b9-9a63-4910-a426-35363201d503'
var officeWebAppClientId2 = '4765445b-32c6-49b0-83e6-1d93765276ca'
var outlookDesktopAppClientId = 'd3590ed6-52b3-4102-aeff-aad2292ab01c'
var outlookWebAppClientId = '00000002-0000-0ff1-ce00-000000000000'
var officeUwpPwaClientId = '0ec893e0-5785-4de6-99da-4ed124e5296c'
var outlookOnlineAddInAppClientId = 'bc59ab01-8403-45c6-8796-ac3ef710b3e3'
var outlookMobileAppClientId = '27922004-5251-4030-b22d-91ecd9a37ea4'
var allowedClientApplications = '"${teamsMobileOrDesktopAppClientId}","${teamsWebAppClientId}","${officeWebAppClientId1}","${officeWebAppClientId2}","${outlookDesktopAppClientId}","${outlookWebAppClientId}","${officeUwpPwaClientId}","${outlookOnlineAddInAppClientId}","${outlookMobileAppClientId}"'

// Azure SQL Server and Database
resource sqlServer 'Microsoft.Sql/servers@2021-11-01' = {
  name: '${resourceBaseName}-sql-server'
  location: location
  properties: {
    administratorLogin: sqlServerAdminLogin
    administratorLoginPassword: sqlServerAdminPassword
    publicNetworkAccess: 'Enabled'
    version: '12.0'
  }
}

resource sqlDatabase 'Microsoft.Sql/servers/databases@2021-11-01' = {
  parent: sqlServer
  name: 'filesharing-db'
  location: location
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5
  }
  properties: {
    maxSizeBytes: 2147483648 // 2GB
    collation: 'SQL_Latin1_General_CP1_CI_AS'
  }
}

// SQL Server Firewall Rules
resource sqlFirewallRuleAzure 'Microsoft.Sql/servers/firewallRules@2021-11-01' = {
  parent: sqlServer
  name: 'AllowAllWindowsAzureIps'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// Cosmos DB Account
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: '${resourceBaseName}-cosmos'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
      }
    }
  }
}

// Cosmos Database
resource cosmosDatabase 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmosAccount
  name: 'filesharing-cosmos-db'
  properties: {
    resource: {
      id: 'filesharing-cosmos-db'
    }
  }
}

// Cosmos DB Containers
resource documentsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'documents'
  properties: {
    resource: {
      id: 'documents'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

resource chatMessagesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'chat-messages'
  properties: {
    resource: {
      id: 'chat-messages'
      partitionKey: {
        paths: ['/conversationId']
        kind: 'Hash'
      }
    }
  }
}

resource auditEventsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'audit-events'
  properties: {
    resource: {
      id: 'audit-events'
      partitionKey: {
        paths: ['/organizationId']
        kind: 'Hash'
      }
    }
  }
}

resource userFavoritesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'user-favorites'
  properties: {
    resource: {
      id: 'user-favorites'
      partitionKey: {
        paths: ['/userId']
        kind: 'Hash'
      }
    }
  }
}

resource documentVersionsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'document-versions'
  properties: {
    resource: {
      id: 'document-versions'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

resource documentHistoryEventsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'document-history-events'
  properties: {
    resource: {
      id: 'document-history-events'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/*'
          }
          {
            path: '/timestamp/?'
          }
          {
            path: '/eventType/?'
          }
          {
            path: '/userInfo/userEmail/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

resource signatureRequestsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'signature-requests'
  properties: {
    resource: {
      id: 'signature-requests'
      partitionKey: {
        paths: ['/id']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/organizationId/?'
          }
          {
            path: '/requesterId/?'
          }
          {
            path: '/status/?'
          }
          {
            path: '/createdAt/?'
          }
          {
            path: '/signers/*/userId/?'
          }
          {
            path: '/signers/*/email/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

resource signatureEventsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'signature-events'
  properties: {
    resource: {
      id: 'signature-events'
      partitionKey: {
        paths: ['/signatureRequestId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/signatureRequestId/?'
          }
          {
            path: '/eventType/?'
          }
          {
            path: '/timestamp/?'
          }
          {
            path: '/userId/?'
          }
          {
            path: '/signerEmail/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

resource signatureSettingsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'signature-settings'
  properties: {
    resource: {
      id: 'signature-settings'
      partitionKey: {
        paths: ['/organizationId']
        kind: 'Hash'
      }
    }
  }
}

resource signatureTemplatesContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'signature-templates'
  properties: {
    resource: {
      id: 'signature-templates'
      partitionKey: {
        paths: ['/organizationId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/organizationId/?'
          }
          {
            path: '/createdBy/?'
          }
          {
            path: '/createdAt/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
    }
  }
}

resource auditEventsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'audit-events'
  properties: {
    resource: {
      id: 'audit-events'
      partitionKey: {
        paths: ['/partitionKey']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/organizationId/?'
          }
          {
            path: '/timestamp/?'
          }
          {
            path: '/serverTimestamp/?'
          }
          {
            path: '/userId/?'
          }
          {
            path: '/category/?'
          }
          {
            path: '/action/?'
          }
          {
            path: '/resourceType/?'
          }
          {
            path: '/resourceId/?'
          }
          {
            path: '/success/?'
          }
          {
            path: '/severity/?'
          }
          {
            path: '/sessionId/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
          {
            path: '/metadata/*'
          }
        ]
        compositeIndexes: [
          [
            {
              path: '/organizationId'
              order: 'ascending'
            }
            {
              path: '/timestamp'
              order: 'descending'
            }
          ]
          [
            {
              path: '/userId'
              order: 'ascending'
            }
            {
              path: '/timestamp'
              order: 'descending'
            }
          ]
          [
            {
              path: '/category'
              order: 'ascending'
            }
            {
              path: '/timestamp'
              order: 'descending'
            }
          ]
        ]
      }
      defaultTtl: 31536000 // 1 year in seconds
    }
  }
}

resource auditSessionsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'audit-sessions'
  properties: {
    resource: {
      id: 'audit-sessions'
      partitionKey: {
        paths: ['/organizationId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/organizationId/?'
          }
          {
            path: '/userId/?'
          }
          {
            path: '/sessionId/?'
          }
          {
            path: '/startTime/?'
          }
          {
            path: '/endTime/?'
          }
          {
            path: '/status/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      defaultTtl: 7776000 // 90 days in seconds
    }
  }
}

resource auditReportsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'audit-reports'
  properties: {
    resource: {
      id: 'audit-reports'
      partitionKey: {
        paths: ['/organizationId']
        kind: 'Hash'
      }
      indexingPolicy: {
        indexingMode: 'consistent'
        includedPaths: [
          {
            path: '/organizationId/?'
          }
          {
            path: '/createdBy/?'
          }
          {
            path: '/status/?'
          }
          {
            path: '/createdAt/?'
          }
        ]
        excludedPaths: [
          {
            path: '/"_etag"/?'
          }
        ]
      }
      defaultTtl: 2592000 // 30 days in seconds
    }
  }
}

resource auditSettingsContainer 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2023-04-15' = {
  parent: cosmosDatabase
  name: 'audit-settings'
  properties: {
    resource: {
      id: 'audit-settings'
      partitionKey: {
        paths: ['/organizationId']
        kind: 'Hash'
      }
    }
  }
}

// Application Insights
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${resourceBaseName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    Flow_Type: 'Redfield'
    Request_Source: 'IbizaAIExtension'
  }
}

// Azure Static Web Apps that hosts your static web site
resource swa 'Microsoft.Web/staticSites@2022-09-01' = {
  name: staticWebAppName
  // SWA do not need location setting
  location: 'centralus'
  sku: {
    name: staticWebAppSku
    tier: staticWebAppSku
  }
  properties:{}
}

var siteDomain = swa.properties.defaultHostname
var tabEndpoint = 'https://${siteDomain}'
var aadApplicationIdUri = 'api://${siteDomain}/${aadAppClientId}'
var oauthAuthority = uri(aadAppOauthAuthorityHost, aadAppTenantId)

// Compute resources for Azure Functions
resource serverfarms 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: serverfarmsName
  kind: 'functionapp'
  location: location
  sku: {
    name: functionAppSKU // You can follow https://aka.ms/teamsfx-bicep-add-param-tutorial to add functionServerfarmsSku property to provisionParameters to override the default value "Y1".
  }
  properties: {}
}

// Azure Functions that hosts your function code
resource functionApp 'Microsoft.Web/sites@2021-02-01' = {
  name: functionAppName
  kind: 'functionapp'
  location: location
  properties: {
    serverFarmId: serverfarms.id
    httpsOnly: true
    siteConfig: {
      alwaysOn: true
      cors: {
        allowedOrigins: [ tabEndpoint ]
      }
      appSettings: [
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4' // Use Azure Functions runtime v4
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node' // Set runtime to NodeJS
        }
        {
          name: 'WEBSITE_RUN_FROM_PACKAGE'
          value: '1' // Run Azure Functions from a package file
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18' // Set NodeJS version to 18.x
        }
        {
          name: 'M365_CLIENT_ID'
          value: aadAppClientId
        }
        {
          name: 'M365_CLIENT_SECRET'
          value: aadAppClientSecret
        }
        {
          name: 'M365_TENANT_ID'
          value: aadAppTenantId
        }
        {
          name: 'M365_AUTHORITY_HOST'
          value: aadAppOauthAuthorityHost
        }
        {
          name: 'M365_APPLICATION_ID_URI'
          value: aadApplicationIdUri
        }
        {
          name: 'WEBSITE_AUTH_AAD_ACL'
          value: '{"allowed_client_applications": [${allowedClientApplications}]}'
        }
        {
          name: 'SQL_SERVER'
          value: sqlServer.properties.fullyQualifiedDomainName
        }
        {
          name: 'SQL_DATABASE'
          value: sqlDatabase.name
        }
        {
          name: 'SQL_USER'
          value: sqlServerAdminLogin
        }
        {
          name: 'SQL_PASSWORD'
          value: sqlServerAdminPassword
        }
        {
          name: 'SQL_TRUST_CERT'
          value: 'true'
        }
        {
          name: 'COSMOSDB_CONNECTION_STRING'
          value: cosmosAccount.listConnectionStrings().connectionStrings[0].connectionString
        }
        {
          name: 'COSMOSDB_DATABASE_NAME'
          value: cosmosDatabase.name
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsights.properties.InstrumentationKey
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsights.properties.ConnectionString
        }
      ]
      ftpsState: 'FtpsOnly'
    }
  }
}
var apiEndpoint = 'https://${functionApp.properties.defaultHostName}'

resource authSettings 'Microsoft.Web/sites/config@2021-02-01' = {
  parent: functionApp
  name: 'authsettings'
  properties: {
    enabled: true
    defaultProvider: 'AzureActiveDirectory'
    clientId: aadAppClientId
    issuer: '${oauthAuthority}/v2.0'
    allowedAudiences: [
      aadAppClientId
      aadApplicationIdUri
    ]
  }
}

// The output will be persisted in .env.{envName}. Visit https://aka.ms/teamsfx-actions/arm-deploy for more details.
output TAB_DOMAIN string = siteDomain
output TAB_HOSTNAME string = siteDomain
output TAB_ENDPOINT string = 'https://${siteDomain}'
output API_FUNCTION_ENDPOINT string = apiEndpoint
output AZURE_STATIC_WEB_APPS_RESOURCE_ID string = swa.id
output API_FUNCTION_RESOURCE_ID string = functionApp.id
output FUNCTION_APP_NAME string = functionAppName
output SQL_SERVER_NAME string = sqlServer.name
output SQL_DATABASE_NAME string = sqlDatabase.name
output COSMOS_ACCOUNT_NAME string = cosmosAccount.name
output COSMOS_DATABASE_NAME string = cosmosDatabase.name
output APP_INSIGHTS_NAME string = appInsights.name
output APP_INSIGHTS_INSTRUMENTATION_KEY string = appInsights.properties.InstrumentationKey
