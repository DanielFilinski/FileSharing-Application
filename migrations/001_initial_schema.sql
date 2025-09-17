-- 001_initial_schema.sql — начальная схема Azure SQL

-- Организации
CREATE TABLE Organizations (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  TenantId NVARCHAR(255) UNIQUE NOT NULL,
  Name NVARCHAR(200) NOT NULL,
  DisplayName NVARCHAR(200),
  Domain NVARCHAR(100),
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Офисы
CREATE TABLE Offices (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Address NVARCHAR(500),
  City NVARCHAR(100),
  Country NVARCHAR(100),
  TimeZone NVARCHAR(50),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_Offices_OrganizationId ON Offices(OrganizationId);

-- Отделы
CREATE TABLE Departments (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(500),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_Departments_OrganizationId ON Departments(OrganizationId);

-- Сотрудники
CREATE TABLE Employees (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  AzureAdUserId NVARCHAR(255) UNIQUE NOT NULL,
  OfficeId UNIQUEIDENTIFIER NOT NULL,
  DepartmentId UNIQUEIDENTIFIER NOT NULL,
  Classification NVARCHAR(50) NOT NULL,
  Role NVARCHAR(100) NOT NULL,
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  FOREIGN KEY (OfficeId) REFERENCES Offices(Id),
  FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
);
CREATE INDEX IX_Employees_OrganizationId ON Employees(OrganizationId);
CREATE INDEX IX_Employees_OfficeId ON Employees(OfficeId);
CREATE INDEX IX_Employees_DepartmentId ON Employees(DepartmentId);
CREATE INDEX IX_Employees_AzureAdUserId ON Employees(AzureAdUserId);
CREATE INDEX IX_Employees_Classification ON Employees(Classification);
CREATE INDEX IX_Employees_IsActive ON Employees(IsActive);

-- Клиенты
CREATE TABLE Clients (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  FirstName NVARCHAR(100) NOT NULL,
  LastName NVARCHAR(100) NOT NULL,
  Email NVARCHAR(255) NOT NULL,
  Phone NVARCHAR(50),
  FirmName NVARCHAR(200),
  FirmAddress NVARCHAR(500),
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_Clients_OrganizationId ON Clients(OrganizationId);
CREATE INDEX IX_Clients_Email ON Clients(Email);
CREATE INDEX IX_Clients_IsActive ON Clients(IsActive);

-- Роли пользователей
CREATE TABLE UserRoles (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  UserType NVARCHAR(20) NOT NULL,
  Role NVARCHAR(50) NOT NULL,
  DocumentType NVARCHAR(100),
  OfficeId UNIQUEIDENTIFIER,
  DepartmentId UNIQUEIDENTIFIER,
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  FOREIGN KEY (OfficeId) REFERENCES Offices(Id),
  FOREIGN KEY (DepartmentId) REFERENCES Departments(Id)
);
CREATE INDEX IX_UserRoles_OrganizationId ON UserRoles(OrganizationId);
CREATE INDEX IX_UserRoles_UserId ON UserRoles(UserId);
CREATE INDEX IX_UserRoles_Role ON UserRoles(Role);
CREATE INDEX IX_UserRoles_UserType ON UserRoles(UserType);
CREATE INDEX IX_UserRoles_IsActive ON UserRoles(IsActive);

-- Настройки организации
CREATE TABLE OrganizationSettings (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER UNIQUE NOT NULL,
  StorageType NVARCHAR(20) DEFAULT 'cloud',
  SharePointSiteUrl NVARCHAR(500),
  DefaultApprovalFlow NVARCHAR(20) DEFAULT 'parallel',
  RequireManualValidation BIT DEFAULT 0,
  RequireApproval BIT DEFAULT 0,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);

-- Аудит
CREATE TABLE AuditLog (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  Action NVARCHAR(100) NOT NULL,
  EntityType NVARCHAR(50) NOT NULL,
  EntityId NVARCHAR(255),
  OldValues NVARCHAR(MAX),
  NewValues NVARCHAR(MAX),
  IpAddress NVARCHAR(45),
  UserAgent NVARCHAR(500),
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_AuditLog_OrganizationId ON AuditLog(OrganizationId);
CREATE INDEX IX_AuditLog_UserId ON AuditLog(UserId);
CREATE INDEX IX_AuditLog_CreatedAt ON AuditLog(CreatedAt);

-- Кэш Azure AD
CREATE TABLE AzureAdCache (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  AzureAdUserId NVARCHAR(255) NOT NULL,
  DisplayName NVARCHAR(200),
  Email NVARCHAR(255),
  JobTitle NVARCHAR(200),
  Department NVARCHAR(200),
  OfficeLocation NVARCHAR(200),
  LastSyncAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_AzureAdCache_OrganizationId ON AzureAdCache(OrganizationId);
CREATE INDEX IX_AzureAdCache_AzureAdUserId ON AzureAdCache(AzureAdUserId);



