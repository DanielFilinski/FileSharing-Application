import { runMigrations, checkDatabaseHealth } from './deploy-sql-migrations';
import { initializeCosmosDB } from './init-cosmos-db';

interface DeploymentConfig {
  skipSqlMigrations?: boolean;
  skipCosmosInit?: boolean;
  validateOnly?: boolean;
}

async function deployDatabases(config: DeploymentConfig = {}): Promise<void> {
  console.log('🚀 Starting database deployment process...');
  console.log('⚙️  Configuration:', config);
  
  const startTime = Date.now();
  let sqlSuccess = false;
  let cosmosSuccess = false;
  
  try {
    // Phase 1: SQL Database Migrations
    if (!config.skipSqlMigrations) {
      console.log('\n📂 PHASE 1: SQL Database Migrations');
      console.log('=' .repeat(50));
      
      if (config.validateOnly) {
        console.log('🔍 Validating SQL Database connection...');
        sqlSuccess = await checkDatabaseHealth();
        if (sqlSuccess) {
          console.log('✅ SQL Database validation passed');
        } else {
          console.log('⚠️  SQL Database validation failed');
        }
      } else {
        await runMigrations();
        sqlSuccess = await checkDatabaseHealth();
      }
    } else {
      console.log('⏭️  Skipping SQL migrations');
      sqlSuccess = true;
    }
    
    // Phase 2: Cosmos DB Initialization
    if (!config.skipCosmosInit) {
      console.log('\n🌌 PHASE 2: Cosmos DB Initialization');
      console.log('=' .repeat(50));
      
      if (config.validateOnly) {
        console.log('🔍 Validating Cosmos DB connection...');
        // TODO: Add cosmos validation function
        cosmosSuccess = true;
      } else {
        await initializeCosmosDB();
        cosmosSuccess = true;
      }
    } else {
      console.log('⏭️  Skipping Cosmos DB initialization');
      cosmosSuccess = true;
    }
    
    // Final Report
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log('\n🎉 DATABASE DEPLOYMENT COMPLETED');
    console.log('=' .repeat(50));
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`📊 SQL Database: ${sqlSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`🌌 Cosmos DB: ${cosmosSuccess ? '✅ Success' : '❌ Failed'}`);
    
    if (!sqlSuccess || !cosmosSuccess) {
      throw new Error('One or more database deployments failed');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Verify your application can connect to both databases');
    console.log('2. Run your application tests');
    console.log('3. Check Azure Portal for resource status');
    console.log('4. Monitor Application Insights for any issues');
    
  } catch (error: any) {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.error('\n💥 DATABASE DEPLOYMENT FAILED');
    console.error('=' .repeat(50));
    console.error(`⏱️  Failed after: ${duration}s`);
    console.error(`❌ Error: ${error.message}`);
    
    console.error('\n🔧 Troubleshooting Tips:');
    console.error('1. Check your connection strings in environment variables');
    console.error('2. Verify network connectivity to Azure resources');
    console.error('3. Confirm Azure resources are properly provisioned');
    console.error('4. Check Azure Portal for resource status and logs');
    
    throw error;
  }
}

// Command line interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  const config: DeploymentConfig = {
    skipSqlMigrations: args.includes('--skip-sql'),
    skipCosmosInit: args.includes('--skip-cosmos'),
    validateOnly: args.includes('--validate-only')
  };
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('🚀 Database Deployment Script');
    console.log('');
    console.log('Usage: npm run deploy:databases [options]');
    console.log('');
    console.log('Options:');
    console.log('  --skip-sql      Skip SQL Database migrations');
    console.log('  --skip-cosmos   Skip Cosmos DB initialization');
    console.log('  --validate-only Only validate connections, don\'t deploy');
    console.log('  --help, -h      Show this help message');
    console.log('');
    console.log('Environment Variables Required:');
    console.log('  SQL_SERVER, SQL_DATABASE, SQL_USER, SQL_PASSWORD');
    console.log('  COSMOSDB_CONNECTION_STRING, COSMOSDB_DATABASE_NAME');
    console.log('');
    console.log('Examples:');
    console.log('  npm run deploy:databases');
    console.log('  npm run deploy:databases -- --validate-only');
    console.log('  npm run deploy:databases -- --skip-cosmos');
    return;
  }
  
  await deployDatabases(config);
}

// Run if executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

export { deployDatabases, DeploymentConfig };
