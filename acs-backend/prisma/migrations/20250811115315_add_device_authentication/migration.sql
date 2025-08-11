BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [profilePhotoUrl] NVARCHAR(1000),
    [employeeId] NVARCHAR(1000) NOT NULL,
    [designation] NVARCHAR(1000) NOT NULL,
    [department] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [users_role_df] DEFAULT 'FIELD',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_username_key] UNIQUE NONCLUSTERED ([username]),
    CONSTRAINT [users_employeeId_key] UNIQUE NONCLUSTERED ([employeeId]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[devices] (
    [id] NVARCHAR(1000) NOT NULL,
    [deviceId] NVARCHAR(1000) NOT NULL,
    [platform] NVARCHAR(1000) NOT NULL,
    [model] NVARCHAR(1000) NOT NULL,
    [osVersion] NVARCHAR(1000) NOT NULL,
    [appVersion] NVARCHAR(1000) NOT NULL,
    [pushToken] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [devices_isActive_df] DEFAULT 1,
    [lastActiveAt] DATETIME2 NOT NULL CONSTRAINT [devices_lastActiveAt_df] DEFAULT CURRENT_TIMESTAMP,
    [notificationsEnabled] BIT NOT NULL CONSTRAINT [devices_notificationsEnabled_df] DEFAULT 1,
    [notificationPreferences] NVARCHAR(max),
    [registeredAt] DATETIME2 NOT NULL CONSTRAINT [devices_registeredAt_df] DEFAULT CURRENT_TIMESTAMP,
    [userId] NVARCHAR(1000) NOT NULL,
    [isApproved] BIT NOT NULL CONSTRAINT [devices_isApproved_df] DEFAULT 0,
    [approvedAt] DATETIME2,
    [approvedBy] NVARCHAR(1000),
    [authCode] NVARCHAR(1000),
    [authCodeExpiresAt] DATETIME2,
    [rejectedAt] DATETIME2,
    [rejectedBy] NVARCHAR(1000),
    [rejectionReason] NVARCHAR(1000),
    CONSTRAINT [devices_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [devices_deviceId_key] UNIQUE NONCLUSTERED ([deviceId])
);

-- CreateTable
CREATE TABLE [dbo].[clients] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [clients_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [clients_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [clients_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[products] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [clientId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [products_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [products_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[verification_types] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [productId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [verification_types_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [verification_types_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[cases] (
    [id] NVARCHAR(1000) NOT NULL,
    [title] NVARCHAR(1000) NOT NULL,
    [description] TEXT NOT NULL,
    [customerName] NVARCHAR(1000) NOT NULL,
    [customerPhone] NVARCHAR(1000),
    [customerEmail] NVARCHAR(1000),
    [addressStreet] NVARCHAR(1000) NOT NULL,
    [addressCity] NVARCHAR(1000) NOT NULL,
    [addressState] NVARCHAR(1000) NOT NULL,
    [addressPincode] NVARCHAR(1000) NOT NULL,
    [latitude] FLOAT(53),
    [longitude] FLOAT(53),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [cases_status_df] DEFAULT 'ASSIGNED',
    [verificationType] NVARCHAR(1000),
    [verificationData] NVARCHAR(max),
    [verificationOutcome] NVARCHAR(1000),
    [assignedAt] DATETIME2 NOT NULL CONSTRAINT [cases_assignedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [completedAt] DATETIME2,
    [priority] INT NOT NULL CONSTRAINT [cases_priority_df] DEFAULT 1,
    [notes] TEXT,
    [assignedToId] NVARCHAR(1000) NOT NULL,
    [clientId] NVARCHAR(1000) NOT NULL,
    [verificationTypeId] NVARCHAR(1000),
    CONSTRAINT [cases_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[attachments] (
    [id] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [filename] NVARCHAR(1000) NOT NULL,
    [originalName] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [mimeType] NVARCHAR(1000) NOT NULL,
    [size] INT NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [thumbnailUrl] NVARCHAR(1000),
    [uploadedAt] DATETIME2 NOT NULL CONSTRAINT [attachments_uploadedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [uploadedById] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(1000),
    [geoLocation] NVARCHAR(1000),
    CONSTRAINT [attachments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[locations] (
    [id] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [latitude] FLOAT(53) NOT NULL,
    [longitude] FLOAT(53) NOT NULL,
    [accuracy] FLOAT(53),
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [locations_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [source] NVARCHAR(1000) NOT NULL CONSTRAINT [locations_source_df] DEFAULT 'GPS',
    CONSTRAINT [locations_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[residence_verification_reports] (
    [id] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [applicantName] NVARCHAR(1000) NOT NULL,
    [applicantPhone] NVARCHAR(1000),
    [applicantEmail] NVARCHAR(1000),
    [residenceType] NVARCHAR(1000) NOT NULL,
    [ownershipStatus] NVARCHAR(1000) NOT NULL,
    [monthlyRent] FLOAT(53),
    [landlordName] NVARCHAR(1000),
    [landlordPhone] NVARCHAR(1000),
    [residenceSince] DATETIME2,
    [familyMembers] INT,
    [neighborVerification] BIT NOT NULL CONSTRAINT [residence_verification_reports_neighborVerification_df] DEFAULT 0,
    [neighborName] NVARCHAR(1000),
    [neighborPhone] NVARCHAR(1000),
    [propertyCondition] NVARCHAR(1000),
    [accessibilityNotes] TEXT,
    [verificationNotes] TEXT,
    [recommendationStatus] NVARCHAR(1000) NOT NULL,
    [verifiedAt] DATETIME2 NOT NULL CONSTRAINT [residence_verification_reports_verifiedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [residence_verification_reports_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[office_verification_reports] (
    [id] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [companyName] NVARCHAR(1000) NOT NULL,
    [designation] NVARCHAR(1000) NOT NULL,
    [department] NVARCHAR(1000),
    [employeeId] NVARCHAR(1000),
    [joiningDate] DATETIME2,
    [monthlySalary] FLOAT(53),
    [workingHours] NVARCHAR(1000),
    [hrContactName] NVARCHAR(1000),
    [hrContactPhone] NVARCHAR(1000),
    [officeAddress] NVARCHAR(1000) NOT NULL,
    [officeType] NVARCHAR(1000) NOT NULL,
    [totalEmployees] INT,
    [businessNature] NVARCHAR(1000),
    [verificationMethod] NVARCHAR(1000) NOT NULL,
    [documentsSeen] TEXT,
    [verificationNotes] TEXT,
    [recommendationStatus] NVARCHAR(1000) NOT NULL,
    [verifiedAt] DATETIME2 NOT NULL CONSTRAINT [office_verification_reports_verifiedAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [office_verification_reports_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[auto_saves] (
    [id] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [formType] NVARCHAR(1000) NOT NULL,
    [formData] NVARCHAR(max) NOT NULL,
    [timestamp] DATETIME2 NOT NULL CONSTRAINT [auto_saves_timestamp_df] DEFAULT CURRENT_TIMESTAMP,
    [savedAt] DATETIME2 NOT NULL CONSTRAINT [auto_saves_savedAt_df] DEFAULT CURRENT_TIMESTAMP,
    [version] INT NOT NULL CONSTRAINT [auto_saves_version_df] DEFAULT 1,
    CONSTRAINT [auto_saves_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [auto_saves_caseId_formType_key] UNIQUE NONCLUSTERED ([caseId],[formType])
);

-- CreateTable
CREATE TABLE [dbo].[notification_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [deviceToken] NVARCHAR(1000) NOT NULL,
    [platform] NVARCHAR(1000) NOT NULL,
    [preferences] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [notification_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [notification_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [notification_tokens_deviceToken_key] UNIQUE NONCLUSTERED ([deviceToken])
);

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000),
    [action] NVARCHAR(1000) NOT NULL,
    [entityType] NVARCHAR(1000),
    [entityId] NVARCHAR(1000),
    [details] NVARCHAR(max),
    [ipAddress] NVARCHAR(1000),
    [userAgent] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [audit_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[background_sync_queue] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [caseId] NVARCHAR(1000) NOT NULL,
    [localChanges] NVARCHAR(max) NOT NULL,
    [attachments] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [background_sync_queue_status_df] DEFAULT 'PENDING',
    [attempts] INT NOT NULL CONSTRAINT [background_sync_queue_attempts_df] DEFAULT 0,
    [lastError] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [background_sync_queue_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [background_sync_queue_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[refresh_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [deviceId] NVARCHAR(1000),
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [refresh_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [refresh_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [refresh_tokens_token_key] UNIQUE NONCLUSTERED ([token])
);

-- AddForeignKey
ALTER TABLE [dbo].[devices] ADD CONSTRAINT [devices_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[clients]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[verification_types] ADD CONSTRAINT [verification_types_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[products]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[cases] ADD CONSTRAINT [cases_assignedToId_fkey] FOREIGN KEY ([assignedToId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cases] ADD CONSTRAINT [cases_clientId_fkey] FOREIGN KEY ([clientId]) REFERENCES [dbo].[clients]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[cases] ADD CONSTRAINT [cases_verificationTypeId_fkey] FOREIGN KEY ([verificationTypeId]) REFERENCES [dbo].[verification_types]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[attachments] ADD CONSTRAINT [attachments_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[attachments] ADD CONSTRAINT [attachments_uploadedById_fkey] FOREIGN KEY ([uploadedById]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[locations] ADD CONSTRAINT [locations_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[residence_verification_reports] ADD CONSTRAINT [residence_verification_reports_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[office_verification_reports] ADD CONSTRAINT [office_verification_reports_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[auto_saves] ADD CONSTRAINT [auto_saves_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[notification_tokens] ADD CONSTRAINT [notification_tokens_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[audit_logs] ADD CONSTRAINT [audit_logs_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[background_sync_queue] ADD CONSTRAINT [background_sync_queue_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[background_sync_queue] ADD CONSTRAINT [background_sync_queue_caseId_fkey] FOREIGN KEY ([caseId]) REFERENCES [dbo].[cases]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[refresh_tokens] ADD CONSTRAINT [refresh_tokens_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
