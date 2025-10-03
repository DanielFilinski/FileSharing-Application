-- =====================================================
-- SIGNATURE SYSTEM DATABASE MIGRATION
-- Version: 003_signature_implementation.sql
-- Description: Tables for Manual Signature and Adobe Sign E-Signature
-- =====================================================

-- 1. Adobe Sign Credentials Table (Encrypted storage)
CREATE TABLE user_adobe_sign_credentials (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id NVARCHAR(128) NOT NULL,
    organization_id NVARCHAR(128) NOT NULL,
    
    -- Encrypted credentials (AES-256)
    client_id NVARCHAR(500) NOT NULL,
    client_secret NVARCHAR(MAX) NOT NULL,
    access_token NVARCHAR(MAX),
    refresh_token NVARCHAR(MAX),
    
    -- Token metadata
    token_expires_at DATETIME2,
    token_scope NVARCHAR(500),
    
    -- Configuration
    environment NVARCHAR(50) DEFAULT 'production', -- 'production' or 'stage'
    api_access_point NVARCHAR(255),
    web_access_point NVARCHAR(255),
    
    -- Status tracking
    is_active BIT DEFAULT 1,
    last_used_at DATETIME2,
    
    -- Audit fields
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Constraints
    CONSTRAINT UQ_AdobeCredentials_UserOrg UNIQUE (user_id, organization_id)
);

-- Indexes for Adobe Sign credentials
CREATE INDEX IX_AdobeCredentials_User ON user_adobe_sign_credentials(user_id);
CREATE INDEX IX_AdobeCredentials_Active ON user_adobe_sign_credentials(is_active, user_id);
CREATE INDEX IX_AdobeCredentials_Expires ON user_adobe_sign_credentials(token_expires_at) WHERE token_expires_at IS NOT NULL;

-- 2. Organization Signature Settings
CREATE TABLE organization_signature_settings (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    organization_id NVARCHAR(128) NOT NULL UNIQUE,
    
    -- Manual Signature Settings
    manual_enabled BIT DEFAULT 1,
    manual_authorized_signers NVARCHAR(MAX), -- JSON array of user IDs
    manual_require_authorization BIT DEFAULT 1,
    manual_notify_owner BIT DEFAULT 1,
    manual_allow_direct_overwrite BIT DEFAULT 0,
    manual_retain_versions BIT DEFAULT 1,
    manual_validation_period_days INT DEFAULT 30,
    manual_max_file_size_mb INT DEFAULT 50,
    manual_allowed_formats NVARCHAR(255) DEFAULT '.pdf,.docx,.xlsx,.txt',
    
    -- E-Signature Settings (Adobe Sign)
    esign_enabled BIT DEFAULT 1,
    esign_authorized_signers NVARCHAR(MAX), -- JSON array of user IDs
    esign_require_two_factor BIT DEFAULT 0,
    esign_allow_biometric BIT DEFAULT 1,
    esign_default_expiration_days INT DEFAULT 30,
    esign_auto_reminder_days INT DEFAULT 3,
    esign_require_all_signers BIT DEFAULT 1,
    
    -- Global Settings
    require_status_awaiting_signing BIT DEFAULT 1, -- CRITICAL: Only "Awaiting Signing" documents can be signed
    allowed_document_types NVARCHAR(MAX), -- JSON array of allowed document types
    
    -- Audit fields
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_by NVARCHAR(128),
    
    -- Constraints
    CONSTRAINT CK_ManualValidationPeriod CHECK (manual_validation_period_days BETWEEN 1 AND 365),
    CONSTRAINT CK_ManualFileSize CHECK (manual_max_file_size_mb BETWEEN 1 AND 100),
    CONSTRAINT CK_ESignExpiration CHECK (esign_default_expiration_days BETWEEN 1 AND 365),
    CONSTRAINT CK_ESignReminder CHECK (esign_auto_reminder_days BETWEEN 1 AND 30)
);

-- Index for organization settings
CREATE INDEX IX_OrgSigSettings_Organization ON organization_signature_settings(organization_id);

-- 3. Document Signature History
CREATE TABLE document_signature_history (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    document_id NVARCHAR(128) NOT NULL,
    signer_user_id NVARCHAR(128) NOT NULL,
    
    -- Signature details
    signature_type NVARCHAR(20) NOT NULL, -- 'manual' or 'adobe-sign'
    signature_method NVARCHAR(50), -- 'upload', 'esign', 'biometric', 'two-factor'
    
    -- Version tracking
    previous_version_id NVARCHAR(128),
    new_version_id NVARCHAR(128) NOT NULL,
    version_number INT NOT NULL,
    
    -- Adobe Sign specific fields
    adobe_agreement_id NVARCHAR(255),
    adobe_participant_id NVARCHAR(255),
    adobe_signing_url NVARCHAR(MAX),
    adobe_envelope_status NVARCHAR(50),
    
    -- Signature metadata
    signature_timestamp DATETIME2 DEFAULT GETUTCDATE(),
    signer_ip_address NVARCHAR(50),
    signer_user_agent NVARCHAR(500),
    signer_location_lat DECIMAL(10, 8),
    signer_location_lon DECIMAL(11, 8),
    
    -- Document snapshot at signing time
    document_name NVARCHAR(500),
    document_size_bytes BIGINT,
    document_hash NVARCHAR(255), -- SHA-256 hash
    
    -- Status tracking
    status NVARCHAR(20) DEFAULT 'success', -- 'success', 'pending', 'failed', 'cancelled'
    status_message NVARCHAR(MAX),
    
    -- Validation
    is_valid BIT DEFAULT 1,
    validation_expires_at DATETIME2,
    validated_by NVARCHAR(128),
    validated_at DATETIME2,
    
    -- Audit
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Constraints
    CONSTRAINT CK_SignatureType CHECK (signature_type IN ('manual', 'adobe-sign')),
    CONSTRAINT CK_SignatureStatus CHECK (status IN ('success', 'pending', 'failed', 'cancelled')),
    CONSTRAINT CK_VersionNumber CHECK (version_number > 0)
);

-- Indexes for signature history
CREATE INDEX IX_SigHistory_Document ON document_signature_history(document_id, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_Signer ON document_signature_history(signer_user_id, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_AdobeAgreement ON document_signature_history(adobe_agreement_id) WHERE adobe_agreement_id IS NOT NULL;
CREATE INDEX IX_SigHistory_Status ON document_signature_history(status, signature_timestamp DESC);
CREATE INDEX IX_SigHistory_ValidationExpires ON document_signature_history(validation_expires_at) WHERE validation_expires_at IS NOT NULL;

-- 4. Rate Limiting Table
CREATE TABLE signature_rate_limits (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id NVARCHAR(128) NOT NULL,
    action_type NVARCHAR(50) NOT NULL, -- 'manual_upload', 'adobe_sign', 'oauth'
    attempt_count INT DEFAULT 1,
    window_start DATETIME2 DEFAULT GETUTCDATE(),
    last_attempt DATETIME2 DEFAULT GETUTCDATE(),
    
    -- Constraints
    CONSTRAINT CK_RateLimitAction CHECK (action_type IN ('manual_upload', 'adobe_sign', 'oauth')),
    CONSTRAINT CK_AttemptCount CHECK (attempt_count > 0)
);

-- Index for rate limiting
CREATE INDEX IX_RateLimit_UserAction ON signature_rate_limits(user_id, action_type, window_start);

-- 5. Update documents table to support signature workflow
-- Add columns if they don't exist
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'status')
BEGIN
    ALTER TABLE documents ADD status NVARCHAR(50) DEFAULT 'draft';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'awaiting_signature_since')
BEGIN
    ALTER TABLE documents ADD awaiting_signature_since DATETIME2;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'signature_required')
BEGIN
    ALTER TABLE documents ADD signature_required BIT DEFAULT 0;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'signed_at')
BEGIN
    ALTER TABLE documents ADD signed_at DATETIME2;
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'signed_by')
BEGIN
    ALTER TABLE documents ADD signed_by NVARCHAR(128);
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('documents') AND name = 'adobe_agreement_id')
BEGIN
    ALTER TABLE documents ADD adobe_agreement_id NVARCHAR(255);
END

-- Add constraint for document status
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_DocumentStatus')
BEGIN
    ALTER TABLE documents ADD CONSTRAINT CK_DocumentStatus 
    CHECK (status IN ('draft', 'in_review', 'approved', 'Awaiting Signing', 'signed', 'completed', 'rejected', 'archived', 'in_signature_process', 'signature_declined', 'signature_expired', 'pending_validation'));
END

-- Create index for document status queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Documents_Status')
BEGIN
    CREATE INDEX IX_Documents_Status ON documents(status, awaiting_signature_since);
END

-- 6. Insert default signature settings for existing organizations
INSERT INTO organization_signature_settings (
    organization_id,
    manual_enabled,
    manual_authorized_signers,
    esign_enabled,
    esign_authorized_signers,
    require_status_awaiting_signing,
    created_at,
    updated_at
)
SELECT DISTINCT 
    organization_id,
    1, -- manual_enabled
    '[]', -- empty authorized signers initially
    1, -- esign_enabled  
    '[]', -- empty authorized signers initially
    1, -- require_status_awaiting_signing - CRITICAL
    GETUTCDATE(),
    GETUTCDATE()
FROM documents 
WHERE organization_id IS NOT NULL
AND organization_id NOT IN (SELECT organization_id FROM organization_signature_settings);

-- 7. Create stored procedures for common operations

-- Procedure to check if user can sign document
CREATE OR ALTER PROCEDURE sp_CheckSignaturePermissions
    @UserId NVARCHAR(128),
    @DocumentId NVARCHAR(128),
    @SignatureType NVARCHAR(20),
    @CanSign BIT OUTPUT,
    @Reason NVARCHAR(MAX) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @DocumentStatus NVARCHAR(50);
    DECLARE @SignatureRequired BIT;
    DECLARE @OrganizationId NVARCHAR(128);
    DECLARE @AuthorizedSigners NVARCHAR(MAX);
    DECLARE @IsEnabled BIT;
    
    -- Get document info
    SELECT 
        @DocumentStatus = status,
        @SignatureRequired = signature_required,
        @OrganizationId = organization_id
    FROM documents 
    WHERE id = @DocumentId;
    
    -- Check if document exists
    IF @DocumentStatus IS NULL
    BEGIN
        SET @CanSign = 0;
        SET @Reason = 'Document not found';
        RETURN;
    END
    
    -- Check if signature is required
    IF @SignatureRequired = 0
    BEGIN
        SET @CanSign = 0;
        SET @Reason = 'Document does not require signature';
        RETURN;
    END
    
    -- CRITICAL CHECK: Document status must be "Awaiting Signing"
    IF @DocumentStatus != 'Awaiting Signing'
    BEGIN
        SET @CanSign = 0;
        SET @Reason = 'Document status must be "Awaiting Signing", current status: ' + @DocumentStatus;
        RETURN;
    END
    
    -- Get organization settings
    IF @SignatureType = 'manual'
    BEGIN
        SELECT 
            @IsEnabled = manual_enabled,
            @AuthorizedSigners = manual_authorized_signers
        FROM organization_signature_settings 
        WHERE organization_id = @OrganizationId;
    END
    ELSE IF @SignatureType = 'adobe-sign'
    BEGIN
        SELECT 
            @IsEnabled = esign_enabled,
            @AuthorizedSigners = esign_authorized_signers
        FROM organization_signature_settings 
        WHERE organization_id = @OrganizationId;
    END
    
    -- Check if signature type is enabled
    IF @IsEnabled = 0
    BEGIN
        SET @CanSign = 0;
        SET @Reason = @SignatureType + ' is disabled for this organization';
        RETURN;
    END
    
    -- Check if user is authorized signer
    IF @AuthorizedSigners IS NULL OR @AuthorizedSigners NOT LIKE '%"' + @UserId + '"%'
    BEGIN
        SET @CanSign = 0;
        SET @Reason = 'User is not in authorized signers list for ' + @SignatureType;
        RETURN;
    END
    
    -- All checks passed
    SET @CanSign = 1;
    SET @Reason = 'User authorized to sign document';
END;

-- 8. Create function to get signature statistics
CREATE OR ALTER FUNCTION fn_GetSignatureStats(@OrganizationId NVARCHAR(128), @StartDate DATETIME2, @EndDate DATETIME2)
RETURNS TABLE
AS
RETURN
(
    SELECT 
        COUNT(*) as total_signatures,
        SUM(CASE WHEN signature_type = 'manual' THEN 1 ELSE 0 END) as manual_signatures,
        SUM(CASE WHEN signature_type = 'adobe-sign' THEN 1 ELSE 0 END) as adobe_sign_signatures,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_signatures,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_signatures,
        AVG(CAST(document_size_bytes AS FLOAT)) as avg_document_size
    FROM document_signature_history dsh
    INNER JOIN documents d ON dsh.document_id = d.id
    WHERE d.organization_id = @OrganizationId
    AND dsh.signature_timestamp BETWEEN @StartDate AND @EndDate
);

-- 9. Create triggers for audit logging

-- Trigger to update signature settings timestamp
CREATE OR ALTER TRIGGER tr_OrgSignatureSettings_Update
ON organization_signature_settings
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE organization_signature_settings
    SET updated_at = GETUTCDATE()
    FROM organization_signature_settings oss
    INNER JOIN inserted i ON oss.id = i.id;
END;

-- Trigger to log document status changes
CREATE OR ALTER TRIGGER tr_Documents_StatusChange
ON documents
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Log when document status changes to/from signature-related statuses
    IF UPDATE(status)
    BEGIN
        INSERT INTO audit_log (
            table_name,
            record_id,
            action_type,
            old_values,
            new_values,
            changed_by,
            changed_at
        )
        SELECT 
            'documents',
            i.id,
            'status_change',
            JSON_OBJECT('status', d.status),
            JSON_OBJECT('status', i.status),
            SYSTEM_USER,
            GETUTCDATE()
        FROM inserted i
        INNER JOIN deleted d ON i.id = d.id
        WHERE i.status != d.status
        AND (i.status IN ('Awaiting Signing', 'signed', 'signature_declined', 'signature_expired') 
             OR d.status IN ('Awaiting Signing', 'signed', 'signature_declined', 'signature_expired'));
    END
END;

-- 10. Create cleanup job for expired tokens and rate limits
-- This would typically be run as a scheduled job
CREATE OR ALTER PROCEDURE sp_CleanupSignatureData
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CleanupDate DATETIME2 = DATEADD(day, -30, GETUTCDATE());
    
    -- Deactivate expired Adobe Sign tokens
    UPDATE user_adobe_sign_credentials 
    SET is_active = 0, updated_at = GETUTCDATE()
    WHERE token_expires_at < GETUTCDATE() 
    AND is_active = 1;
    
    -- Clean up old rate limit records (older than 24 hours)
    DELETE FROM signature_rate_limits 
    WHERE window_start < DATEADD(hour, -24, GETUTCDATE());
    
    -- Mark expired signature validations
    UPDATE document_signature_history
    SET is_valid = 0
    WHERE validation_expires_at < GETUTCDATE()
    AND is_valid = 1;
    
    PRINT 'Signature data cleanup completed at ' + CAST(GETUTCDATE() AS NVARCHAR(30));
END;

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

PRINT 'Signature system migration completed successfully!';
PRINT 'Tables created: user_adobe_sign_credentials, organization_signature_settings, document_signature_history, signature_rate_limits';
PRINT 'Documents table updated with signature-related columns';
PRINT 'Stored procedures and triggers created for signature workflow';
PRINT 'Ready for signature system implementation!';

