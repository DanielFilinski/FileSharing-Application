import { CosmosClient } from '@azure/cosmos';

interface ContainerConfig {
  id: string;
  partitionKey: string;
  description: string;
}

const containers: ContainerConfig[] = [
  {
    id: 'documents',
    partitionKey: '/partitionKey',
    description: 'Document metadata and storage information'
  },
  {
    id: 'chat-messages',
    partitionKey: '/conversationId',
    description: 'Chat messages between employees and clients'
  },
  {
    id: 'audit-events',
    partitionKey: '/organizationId',
    description: 'System audit events and activity logs'
  },
  {
    id: 'user-favorites',
    partitionKey: '/userId',
    description: 'User favorite documents and preferences'
  },
  {
    id: 'document-versions',
    partitionKey: '/documentId',
    description: 'Document version history and changes'
  }
];

async function initializeCosmosDB(): Promise<void> {
  console.log('🚀 Starting Cosmos DB initialization...');
  
  const connectionString = process.env.COSMOSDB_CONNECTION_STRING;
  const databaseName = process.env.COSMOSDB_DATABASE_NAME || 'filesharing-cosmos-db';
  
  if (!connectionString) {
    throw new Error('COSMOSDB_CONNECTION_STRING environment variable is required');
  }

  try {
    const client = new CosmosClient(connectionString);
    
    // Create database if it doesn't exist
    console.log(`📦 Creating database: ${databaseName}`);
    const { database } = await client.databases.createIfNotExists({
      id: databaseName
    });
    console.log(`✅ Database ${databaseName} is ready`);

    // Create containers
    for (const containerConfig of containers) {
      console.log(`📋 Creating container: ${containerConfig.id}`);
      
      try {
        const { container } = await database.containers.createIfNotExists({
          id: containerConfig.id,
          partitionKey: {
            paths: [containerConfig.partitionKey]
          },
          indexingPolicy: {
            indexingMode: 'consistent',
            includedPaths: [
              {
                path: '/*'
              }
            ],
            excludedPaths: [
              {
                path: '/\"_etag\"/?'
              }
            ]
          }
        });
        
        console.log(`✅ Container '${containerConfig.id}' is ready`);
        console.log(`   Description: ${containerConfig.description}`);
        console.log(`   Partition Key: ${containerConfig.partitionKey}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to create container ${containerConfig.id}:`, error.message);
        throw error;
      }
    }

    console.log('🎉 Cosmos DB initialization completed successfully!');
    console.log('📊 Summary:');
    console.log(`   Database: ${databaseName}`);
    console.log(`   Containers: ${containers.length}`);
    containers.forEach(c => console.log(`   - ${c.id} (${c.partitionKey})`));
    
  } catch (error: any) {
    console.error('💥 Cosmos DB initialization failed:', error.message);
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.body?.message) {
      console.error(`   Details: ${error.body.message}`);
    }
    throw error;
  }
}

// Run initialization if this script is executed directly
if (require.main === module) {
  initializeCosmosDB()
    .then(() => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

export { initializeCosmosDB, containers };
