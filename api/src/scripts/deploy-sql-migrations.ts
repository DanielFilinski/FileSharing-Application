import { sql, getSql } from '../shared/db/sql';
import * as fs from 'fs';
import * as path from 'path';

interface Migration {
  version: string;
  filename: string;
  content: string;
}

const MIGRATIONS_DIR = path.resolve(__dirname, '../../../migrations');

async function loadMigrations(): Promise<Migration[]> {
  console.log('📂 Loading SQL migrations...');
  
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Migrations directory not found: ${MIGRATIONS_DIR}`);
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  const migrations: Migration[] = [];
  
  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const version = file.replace('.sql', '');
    
    migrations.push({
      version,
      filename: file,
      content
    });
    
    console.log(`📋 Loaded migration: ${file}`);
  }

  console.log(`✅ Loaded ${migrations.length} migrations`);
  return migrations;
}

async function createMigrationsTable(): Promise<void> {
  console.log('🔧 Creating migrations tracking table...');
  
  const pool = await getSql();
  
  const createTableSql = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='__Migrations' AND xtype='U')
    BEGIN
      CREATE TABLE __Migrations (
        Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        Version NVARCHAR(50) NOT NULL UNIQUE,
        Filename NVARCHAR(200) NOT NULL,
        ExecutedAt DATETIME2 DEFAULT GETDATE(),
        ExecutedBy NVARCHAR(200) DEFAULT SYSTEM_USER
      );
      
      CREATE INDEX IX_Migrations_Version ON __Migrations(Version);
      CREATE INDEX IX_Migrations_ExecutedAt ON __Migrations(ExecutedAt);
    END
  `;
  
  await pool.request().query(createTableSql);
  console.log('✅ Migrations table is ready');
}

async function getExecutedMigrations(): Promise<string[]> {
  const pool = await getSql();
  
  const result = await pool.request()
    .query('SELECT Version FROM __Migrations ORDER BY ExecutedAt');
    
  return result.recordset.map(row => row.Version);
}

async function executeMigration(migration: Migration): Promise<void> {
  console.log(`🚀 Executing migration: ${migration.filename}`);
  
  const pool = await getSql();
  const transaction = new sql.Transaction(pool);
  
  try {
    await transaction.begin();
    
    // Execute the migration SQL
    const request = new sql.Request(transaction);
    await request.query(migration.content);
    
    // Record the migration as executed
    await new sql.Request(transaction)
      .input('version', sql.NVarChar(50), migration.version)
      .input('filename', sql.NVarChar(200), migration.filename)
      .query(`
        INSERT INTO __Migrations (Version, Filename) 
        VALUES (@version, @filename)
      `);
    
    await transaction.commit();
    console.log(`✅ Migration ${migration.filename} executed successfully`);
    
  } catch (error: any) {
    await transaction.rollback();
    console.error(`❌ Migration ${migration.filename} failed:`, error.message);
    throw error;
  }
}

async function runMigrations(): Promise<void> {
  console.log('🚀 Starting SQL Database migration...');
  
  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const pool = await getSql();
    await pool.request().query('SELECT 1 AS TestConnection');
    console.log('✅ Database connection successful');
    
    // Create migrations tracking table
    await createMigrationsTable();
    
    // Load all migrations
    const migrations = await loadMigrations();
    
    if (migrations.length === 0) {
      console.log('ℹ️  No migrations found');
      return;
    }
    
    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations();
    console.log(`📊 Found ${executedMigrations.length} already executed migrations`);
    
    // Filter pending migrations
    const pendingMigrations = migrations.filter(
      m => !executedMigrations.includes(m.version)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✨ Database is up to date - no pending migrations');
      return;
    }
    
    console.log(`🔄 Found ${pendingMigrations.length} pending migrations to execute`);
    
    // Execute pending migrations
    for (const migration of pendingMigrations) {
      await executeMigration(migration);
    }
    
    console.log('🎉 All migrations completed successfully!');
    console.log('📊 Migration Summary:');
    console.log(`   Total migrations: ${migrations.length}`);
    console.log(`   Previously executed: ${executedMigrations.length}`);
    console.log(`   Newly executed: ${pendingMigrations.length}`);
    
  } catch (error: any) {
    console.error('💥 Migration failed:', error.message);
    
    // Provide helpful debug information
    if (error.code === 'ELOGIN') {
      console.error('🔐 Authentication failed. Check your SQL_USER and SQL_PASSWORD environment variables');
    } else if (error.code === 'ENOTFOUND') {
      console.error('🌐 Server not found. Check your SQL_SERVER environment variable');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('🚫 Connection refused. Check if SQL Server is running and accessible');
    }
    
    throw error;
  }
}

// Utility function to check database readiness
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    console.log('🏥 Checking database health...');
    
    const pool = await getSql();
    
    // Test basic connectivity
    await pool.request().query('SELECT 1 AS HealthCheck');
    
    // Check if our main tables exist
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) as TableCount
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
        AND TABLE_NAME IN ('Organizations', 'Employees', 'Clients', 'UserRoles')
    `);
    
    const tableCount = result.recordset[0].TableCount;
    
    if (tableCount === 4) {
      console.log('✅ Database health check passed - all core tables present');
      return true;
    } else {
      console.log(`⚠️  Database health check: only ${tableCount}/4 core tables found`);
      return false;
    }
    
  } catch (error: any) {
    console.error('❌ Database health check failed:', error.message);
    return false;
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('✨ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error.message);
      process.exit(1);
    });
}

export { runMigrations, checkDatabaseHealth };
