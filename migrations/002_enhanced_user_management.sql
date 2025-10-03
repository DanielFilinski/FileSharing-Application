-- 002_enhanced_user_management.sql — расширение схемы для Enhanced User Management

-- Расширение таблицы Employees
ALTER TABLE Employees ADD
  FirstName NVARCHAR(100) NOT NULL DEFAULT '',
  LastName NVARCHAR(100) NOT NULL DEFAULT '',
  Email NVARCHAR(255) NOT NULL DEFAULT '',
  Phone NVARCHAR(50),
  ManagerId UNIQUEIDENTIFIER,
  ProfilePicture NVARCHAR(500),
  Skills NVARCHAR(MAX), -- JSON array of skills
  Certifications NVARCHAR(MAX), -- JSON array of certifications
  EmergencyContactName NVARCHAR(200),
  EmergencyContactPhone NVARCHAR(50),
  EmergencyContactRelationship NVARCHAR(100),
  WorkScheduleStartTime NVARCHAR(10),
  WorkScheduleEndTime NVARCHAR(10),
  WorkScheduleTimezone NVARCHAR(50),
  WorkScheduleDays NVARCHAR(20), -- JSON array of work days (0-6)
  LastLoginAt DATETIME2,
  CreatedBy NVARCHAR(255),
  UpdatedBy NVARCHAR(255),
  DeletedAt DATETIME2,
  DeletedBy NVARCHAR(255);

-- Добавляем индексы для новых полей Employees
CREATE INDEX IX_Employees_FirstName ON Employees(FirstName);
CREATE INDEX IX_Employees_LastName ON Employees(LastName);
CREATE INDEX IX_Employees_Email ON Employees(Email);
CREATE INDEX IX_Employees_ManagerId ON Employees(ManagerId);
CREATE INDEX IX_Employees_CreatedBy ON Employees(CreatedBy);
CREATE INDEX IX_Employees_LastLoginAt ON Employees(LastLoginAt);

-- Расширение таблицы Clients
ALTER TABLE Clients ADD
  BusinessType NVARCHAR(100),
  AccessLevel NVARCHAR(20) DEFAULT 'read',
  AssignedServiceProviderId UNIQUEIDENTIFIER,
  DocumentsAccess NVARCHAR(MAX), -- JSON array of document IDs
  LastActivityAt DATETIME2,
  CreatedBy NVARCHAR(255),
  UpdatedBy NVARCHAR(255),
  DeletedAt DATETIME2,
  DeletedBy NVARCHAR(255);

-- Добавляем индексы для новых полей Clients
CREATE INDEX IX_Clients_BusinessType ON Clients(BusinessType);
CREATE INDEX IX_Clients_AccessLevel ON Clients(AccessLevel);
CREATE INDEX IX_Clients_AssignedServiceProviderId ON Clients(AssignedServiceProviderId);
CREATE INDEX IX_Clients_CreatedBy ON Clients(CreatedBy);
CREATE INDEX IX_Clients_LastActivityAt ON Clients(LastActivityAt);

-- Расширение таблицы Departments
ALTER TABLE Departments ADD
  ManagerId UNIQUEIDENTIFIER NOT NULL,
  ManagerName NVARCHAR(200) NOT NULL,
  OfficeId UNIQUEIDENTIFIER,
  CanCreateUsers BIT DEFAULT 0,
  CanManageDocuments BIT DEFAULT 1,
  CanApproveDocuments BIT DEFAULT 0,
  CanManageWorkflows BIT DEFAULT 0,
  ParentDepartmentId UNIQUEIDENTIFIER,
  HierarchyLevel INT DEFAULT 1,
  Children NVARCHAR(MAX), -- JSON array of child department IDs
  Employees NVARCHAR(MAX), -- JSON array of employee IDs
  CreatedBy NVARCHAR(255),
  UpdatedBy NVARCHAR(255),
  DeletedAt DATETIME2,
  DeletedBy NVARCHAR(255);

-- Добавляем индексы для новых полей Departments
CREATE INDEX IX_Departments_ManagerId ON Departments(ManagerId);
CREATE INDEX IX_Departments_OfficeId ON Departments(OfficeId);
CREATE INDEX IX_Departments_ParentDepartmentId ON Departments(ParentDepartmentId);
CREATE INDEX IX_Departments_HierarchyLevel ON Departments(HierarchyLevel);
CREATE INDEX IX_Departments_CreatedBy ON Departments(CreatedBy);

-- Создаем таблицу для разрешений пользователей
CREATE TABLE UserPermissions (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  UserType NVARCHAR(20) NOT NULL, -- 'employee' or 'client'
  Permission NVARCHAR(100) NOT NULL,
  Resource NVARCHAR(100),
  IsGranted BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_UserPermissions_OrganizationId ON UserPermissions(OrganizationId);
CREATE INDEX IX_UserPermissions_UserId ON UserPermissions(UserId);
CREATE INDEX IX_UserPermissions_UserType ON UserPermissions(UserType);
CREATE INDEX IX_UserPermissions_Permission ON UserPermissions(Permission);

-- Создаем таблицу для активности пользователей
CREATE TABLE UserActivity (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  ActivityType NVARCHAR(50) NOT NULL, -- 'login', 'logout', 'document_view', 'document_edit', etc.
  Description NVARCHAR(500),
  Metadata NVARCHAR(MAX), -- JSON metadata
  IpAddress NVARCHAR(45),
  UserAgent NVARCHAR(500),
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_UserActivity_OrganizationId ON UserActivity(OrganizationId);
CREATE INDEX IX_UserActivity_UserId ON UserActivity(UserId);
CREATE INDEX IX_UserActivity_ActivityType ON UserActivity(ActivityType);
CREATE INDEX IX_UserActivity_CreatedAt ON UserActivity(CreatedAt);

-- Создаем таблицу для импорта/экспорта пользователей
CREATE TABLE UserImportExport (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  ImportExportType NVARCHAR(20) NOT NULL, -- 'import' or 'export'
  UserType NVARCHAR(20) NOT NULL, -- 'employees' or 'clients'
  FileName NVARCHAR(255),
  FileSize BIGINT,
  RecordCount INT,
  SuccessCount INT,
  FailedCount INT,
  SkippedCount INT,
  Errors NVARCHAR(MAX), -- JSON array of errors
  Status NVARCHAR(20) NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  CompletedAt DATETIME2,
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_UserImportExport_OrganizationId ON UserImportExport(OrganizationId);
CREATE INDEX IX_UserImportExport_UserId ON UserImportExport(UserId);
CREATE INDEX IX_UserImportExport_Type ON UserImportExport(ImportExportType);
CREATE INDEX IX_UserImportExport_Status ON UserImportExport(Status);
CREATE INDEX IX_UserImportExport_CreatedAt ON UserImportExport(CreatedAt);

-- Создаем таблицу для синхронизации с Azure AD
CREATE TABLE AzureAdSync (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  SyncType NVARCHAR(50) NOT NULL, -- 'full', 'incremental', 'users', 'groups'
  Status NVARCHAR(20) NOT NULL, -- 'pending', 'running', 'completed', 'failed'
  StartedAt DATETIME2 DEFAULT GETDATE(),
  CompletedAt DATETIME2,
  RecordsProcessed INT DEFAULT 0,
  RecordsCreated INT DEFAULT 0,
  RecordsUpdated INT DEFAULT 0,
  RecordsDeleted INT DEFAULT 0,
  Errors NVARCHAR(MAX), -- JSON array of errors
  Metadata NVARCHAR(MAX), -- JSON metadata about the sync
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_AzureAdSync_OrganizationId ON AzureAdSync(OrganizationId);
CREATE INDEX IX_AzureAdSync_Status ON AzureAdSync(Status);
CREATE INDEX IX_AzureAdSync_StartedAt ON AzureAdSync(StartedAt);

-- Создаем таблицу для уведомлений пользователей
CREATE TABLE UserNotifications (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  NotificationType NVARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
  Title NVARCHAR(200) NOT NULL,
  Message NVARCHAR(1000) NOT NULL,
  IsRead BIT DEFAULT 0,
  ReadAt DATETIME2,
  ActionUrl NVARCHAR(500),
  Metadata NVARCHAR(MAX), -- JSON metadata
  ExpiresAt DATETIME2,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_UserNotifications_OrganizationId ON UserNotifications(OrganizationId);
CREATE INDEX IX_UserNotifications_UserId ON UserNotifications(UserId);
CREATE INDEX IX_UserNotifications_IsRead ON UserNotifications(IsRead);
CREATE INDEX IX_UserNotifications_NotificationType ON UserNotifications(NotificationType);
CREATE INDEX IX_UserNotifications_CreatedAt ON UserNotifications(CreatedAt);

-- Создаем таблицу для настроек пользователей
CREATE TABLE UserSettings (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  SettingKey NVARCHAR(100) NOT NULL,
  SettingValue NVARCHAR(MAX),
  DataType NVARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  IsEncrypted BIT DEFAULT 0,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  UNIQUE(OrganizationId, UserId, SettingKey)
);
CREATE INDEX IX_UserSettings_OrganizationId ON UserSettings(OrganizationId);
CREATE INDEX IX_UserSettings_UserId ON UserSettings(UserId);
CREATE INDEX IX_UserSettings_SettingKey ON UserSettings(SettingKey);

-- Создаем таблицу для групп пользователей
CREATE TABLE UserGroups (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(500),
  GroupType NVARCHAR(50) NOT NULL, -- 'security', 'distribution', 'dynamic'
  Members NVARCHAR(MAX), -- JSON array of user IDs
  Permissions NVARCHAR(MAX), -- JSON array of permissions
  IsActive BIT DEFAULT 1,
  CreatedAt DATETIME2 DEFAULT GETDATE(),
  UpdatedAt DATETIME2 DEFAULT GETDATE(),
  CreatedBy NVARCHAR(255),
  UpdatedBy NVARCHAR(255),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id)
);
CREATE INDEX IX_UserGroups_OrganizationId ON UserGroups(OrganizationId);
CREATE INDEX IX_UserGroups_Name ON UserGroups(Name);
CREATE INDEX IX_UserGroups_GroupType ON UserGroups(GroupType);
CREATE INDEX IX_UserGroups_IsActive ON UserGroups(IsActive);

-- Создаем таблицу для членства в группах
CREATE TABLE UserGroupMembership (
  Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
  OrganizationId UNIQUEIDENTIFIER NOT NULL,
  GroupId UNIQUEIDENTIFIER NOT NULL,
  UserId NVARCHAR(255) NOT NULL,
  UserType NVARCHAR(20) NOT NULL, -- 'employee' or 'client'
  JoinedAt DATETIME2 DEFAULT GETDATE(),
  JoinedBy NVARCHAR(255),
  FOREIGN KEY (OrganizationId) REFERENCES Organizations(Id),
  FOREIGN KEY (GroupId) REFERENCES UserGroups(Id),
  UNIQUE(GroupId, UserId)
);
CREATE INDEX IX_UserGroupMembership_OrganizationId ON UserGroupMembership(OrganizationId);
CREATE INDEX IX_UserGroupMembership_GroupId ON UserGroupMembership(GroupId);
CREATE INDEX IX_UserGroupMembership_UserId ON UserGroupMembership(UserId);
CREATE INDEX IX_UserGroupMembership_UserType ON UserGroupMembership(UserType);

-- Обновляем существующие записи с значениями по умолчанию
UPDATE Employees SET 
  FirstName = 'Unknown',
  LastName = 'User',
  Email = 'unknown@example.com'
WHERE FirstName = '' OR FirstName IS NULL;

UPDATE Clients SET 
  AccessLevel = 'read'
WHERE AccessLevel IS NULL;

UPDATE Departments SET 
  ManagerId = (SELECT TOP 1 Id FROM Employees WHERE OrganizationId = Departments.OrganizationId),
  ManagerName = 'Unknown Manager'
WHERE ManagerId IS NULL;

-- Добавляем внешние ключи для новых связей
ALTER TABLE Employees ADD CONSTRAINT FK_Employees_ManagerId 
  FOREIGN KEY (ManagerId) REFERENCES Employees(Id);

ALTER TABLE Clients ADD CONSTRAINT FK_Clients_AssignedServiceProviderId 
  FOREIGN KEY (AssignedServiceProviderId) REFERENCES Employees(Id);

ALTER TABLE Departments ADD CONSTRAINT FK_Departments_ManagerId 
  FOREIGN KEY (ManagerId) REFERENCES Employees(Id);

ALTER TABLE Departments ADD CONSTRAINT FK_Departments_OfficeId 
  FOREIGN KEY (OfficeId) REFERENCES Offices(Id);

ALTER TABLE Departments ADD CONSTRAINT FK_Departments_ParentDepartmentId 
  FOREIGN KEY (ParentDepartmentId) REFERENCES Departments(Id);

-- Создаем представления для удобства работы
CREATE VIEW v_EmployeeDetails AS
SELECT 
  e.Id,
  e.OrganizationId,
  e.FirstName,
  e.LastName,
  e.Email,
  e.Phone,
  e.Classification,
  e.Role,
  e.ManagerId,
  m.FirstName + ' ' + m.LastName AS ManagerName,
  e.OfficeId,
  o.Name AS OfficeName,
  e.DepartmentId,
  d.Name AS DepartmentName,
  e.IsActive,
  e.Skills,
  e.Certifications,
  e.LastLoginAt,
  e.CreatedAt,
  e.UpdatedAt
FROM Employees e
LEFT JOIN Employees m ON e.ManagerId = m.Id
LEFT JOIN Offices o ON e.OfficeId = o.Id
LEFT JOIN Departments d ON e.DepartmentId = d.Id;

CREATE VIEW v_ClientDetails AS
SELECT 
  c.Id,
  c.OrganizationId,
  c.FirstName,
  c.LastName,
  c.Email,
  c.Phone,
  c.FirmName,
  c.FirmAddress,
  c.BusinessType,
  c.AccessLevel,
  c.AssignedServiceProviderId,
  e.FirstName + ' ' + e.LastName AS AssignedServiceProviderName,
  c.IsActive,
  c.DocumentsAccess,
  c.LastActivityAt,
  c.CreatedAt,
  c.UpdatedAt
FROM Clients c
LEFT JOIN Employees e ON c.AssignedServiceProviderId = e.Id;

CREATE VIEW v_DepartmentDetails AS
SELECT 
  d.Id,
  d.OrganizationId,
  d.Name,
  d.Description,
  d.ManagerId,
  d.ManagerName,
  e.FirstName + ' ' + e.LastName AS ManagerFullName,
  d.OfficeId,
  o.Name AS OfficeName,
  d.ParentDepartmentId,
  pd.Name AS ParentDepartmentName,
  d.HierarchyLevel,
  d.CanCreateUsers,
  d.CanManageDocuments,
  d.CanApproveDocuments,
  d.CanManageWorkflows,
  d.IsActive,
  d.CreatedAt,
  d.UpdatedAt
FROM Departments d
LEFT JOIN Employees e ON d.ManagerId = e.Id
LEFT JOIN Offices o ON d.OfficeId = o.Id
LEFT JOIN Departments pd ON d.ParentDepartmentId = pd.Id;

-- Создаем хранимые процедуры для часто используемых операций
GO

-- Процедура для получения статистики пользователей
CREATE PROCEDURE sp_GetUserStatistics
  @OrganizationId UNIQUEIDENTIFIER
AS
BEGIN
  SELECT 
    (SELECT COUNT(*) FROM Employees WHERE OrganizationId = @OrganizationId AND IsActive = 1) AS ActiveEmployees,
    (SELECT COUNT(*) FROM Employees WHERE OrganizationId = @OrganizationId AND IsActive = 0) AS InactiveEmployees,
    (SELECT COUNT(*) FROM Clients WHERE OrganizationId = @OrganizationId AND IsActive = 1) AS ActiveClients,
    (SELECT COUNT(*) FROM Clients WHERE OrganizationId = @OrganizationId AND IsActive = 0) AS InactiveClients,
    (SELECT COUNT(*) FROM Departments WHERE OrganizationId = @OrganizationId AND IsActive = 1) AS ActiveDepartments,
    (SELECT COUNT(*) FROM UserGroups WHERE OrganizationId = @OrganizationId AND IsActive = 1) AS ActiveGroups;
END

-- Процедура для поиска пользователей
CREATE PROCEDURE sp_SearchUsers
  @OrganizationId UNIQUEIDENTIFIER,
  @SearchQuery NVARCHAR(255),
  @UserType NVARCHAR(20) = NULL
AS
BEGIN
  IF @UserType IS NULL OR @UserType = 'employees'
  BEGIN
    SELECT 
      Id,
      'employee' AS UserType,
      FirstName,
      LastName,
      Email,
      Classification,
      OfficeId,
      DepartmentId,
      IsActive
    FROM Employees 
    WHERE OrganizationId = @OrganizationId
    AND (
      FirstName LIKE '%' + @SearchQuery + '%' OR
      LastName LIKE '%' + @SearchQuery + '%' OR
      Email LIKE '%' + @SearchQuery + '%'
    )
    ORDER BY FirstName, LastName;
  END
  
  IF @UserType IS NULL OR @UserType = 'clients'
  BEGIN
    SELECT 
      Id,
      'client' AS UserType,
      FirstName,
      LastName,
      Email,
      NULL AS Classification,
      NULL AS OfficeId,
      NULL AS DepartmentId,
      IsActive
    FROM Clients 
    WHERE OrganizationId = @OrganizationId
    AND (
      FirstName LIKE '%' + @SearchQuery + '%' OR
      LastName LIKE '%' + @SearchQuery + '%' OR
      Email LIKE '%' + @SearchQuery + '%'
    )
    ORDER BY FirstName, LastName;
  END
END

-- Процедура для получения иерархии отделов
CREATE PROCEDURE sp_GetDepartmentHierarchy
  @OrganizationId UNIQUEIDENTIFIER,
  @DepartmentId UNIQUEIDENTIFIER = NULL
AS
BEGIN
  WITH DepartmentHierarchy AS (
    SELECT 
      Id,
      Name,
      ParentDepartmentId,
      HierarchyLevel,
      0 AS Level
    FROM Departments 
    WHERE OrganizationId = @OrganizationId 
    AND (@DepartmentId IS NULL OR Id = @DepartmentId)
    AND IsActive = 1
    
    UNION ALL
    
    SELECT 
      d.Id,
      d.Name,
      d.ParentDepartmentId,
      d.HierarchyLevel,
      dh.Level + 1
    FROM Departments d
    INNER JOIN DepartmentHierarchy dh ON d.ParentDepartmentId = dh.Id
    WHERE d.OrganizationId = @OrganizationId
    AND d.IsActive = 1
  )
  SELECT * FROM DepartmentHierarchy
  ORDER BY Level, Name;
END

GO

