The project will be written in ReactJS. For implementing company document workflow between employees and clients.

All interface elements must be implemented in accordance with Microsoft Teams. All elements should be implemented based on Fluent UI.

The basic functionality includes the following:
1. Formed database structure
2. Formed interface where you can do the following:
2.1. Upload file
2.2. Delete file
2.3. Move file (from one folder to another)
2.4. File preview
3. File validation capability (When receiving a file on the portal, it will go to a specific employee who can view it and either: validate it for correctness/reject it)
4. File approval capability (After validation, managers designated in settings should review the file and approve it/or reject it)
5. File signing capability (This implies uploading a signed version of the file over the original, that's all)
6. Chat viewing capability (Chat exists only in document details and it will be between the responsible employee and the client who uploaded the file) - chat can be omitted



Process description.
3.1. Process sections:
1. Document upload/download process
2. Document validation process
3. Document approval process
4. Document signing process

3.2. Document upload/download
Stage 1.1. Upload initiation
Description: Users with appropriate permissions can initiate document uploads through the application interface. Before accepting the upload, the system checks available storage space based on configured storage allocation. If there's enough space, the upload continues; if not, the system displays a "Not enough space" notification with the option to escalate the matter to IT department/system administrator or cancel the upload.
Business requirements: Storage check must be implemented before document uploads to prevent storage overflow. The system should support predefined storage limits as configured in storage settings. Upload interfaces should be accessible from appropriate application locations and support multiple file types as defined in system configurations.
Variability:
• Case escalation - when storage is insufficient, direct to IT department to resolve the issue.
• Dismiss - cancel the upload process if storage is unavailable

Stage 1.2. Storage assignment
Description: After successful upload verification, the system automatically directs the document to the configured storage type (cloud storage or physical storage). For cloud storage, files are stored in SharePoint using authenticated credentials established during setup. For physical storage, files are stored on designated network devices or local computers selected during configuration. All storage assignments comply with allocation quotas set in Settings → Storage.
Business requirements: The system should support separate storage paths for each configured storage type. Cloud storage should be integrated with Microsoft SharePoint using secure authentication. Physical storage should support both network and local devices with appropriate access control.

Stage 1.3. Folder organization
Description: After storage assignment, documents are organized according to predefined folder structure set during system configuration. The system automatically separates content between DMS (internal) and Portal (shared) sections as defined in storage settings. This organization ensures proper access control based on user roles and permissions.
Business requirements: Folder structure should comply with hierarchy defined in storage settings. The system should properly distribute content by categories between internal and external storage. Access permissions should be automatically applied based on document location and user roles.

Stage 1.4. Download process
Description: Authorized users can download documents according to their assigned permissions. The system maintains complete download logs for audit purposes, recording user, timestamp, and document details. Downloaded documents retain their metadata and system associations for tracking purposes.
Business requirements: Download functionality should respect user permissions and prevent unauthorized access. Audit logging is required for all download actions. The system should preserve document integrity and associations during download process.

3.3. Document validation
Stage 2.1. Validation requirements determination
Description: When a document is uploaded or updated, the system checks validation settings to determine if manual validation is required. If validation is set to automatic ("Manual Validation Needed = No"), this process is completely bypassed and the document moves to the next stage. If manual validation is required, the system initiates the validator assignment process.
Business requirements: The system should accurately interpret validation settings and route documents accordingly. Skip logic should function properly to bypass validation if configured as automatic.
Variability:
• Validation Required = No - bypass validation process
• Validation Required = Yes - proceed to validator assignment

Stage 2.2. Validator assignment
Description: Based on validation configuration, the system assigns validation tasks according to one of the following methods:
• Office validators: Documents are routed to specific employees responsible for validating documents from each office
• Document type validators: Assignment of employees with appropriate expertise based on document categories
• Department validators: Team leaders or designated department employees
Business requirements: The assignment system should accurately match documents with appropriate validators based on configured rules. The application should support all three assignment methods and provide appropriate management interfaces.
Variability:
• By office - validator selection based on office affiliation
• By document - validator selection based on document type
• By departments - validator selection based on department responsibility

Stage 2.3. Validation task distribution
Description: After validator assignment, they receive notifications about upcoming validation tasks. The interface presents the document with appropriate tools for content review, as well as any specific validation requirements or criteria. Validators can access the document with appropriate permissions for thorough review.
Business requirements: The notification system should reliably alert validators about new tasks. The validation interface should display relevant document information and provide appropriate tools for content review.

Stage 2.4. Validation actions
Description: Validators review document content for accuracy and compliance with organizational standards. They record their validation decision (approved or rejected with comments) through the interface. The system updates document status accordingly. Rejected documents are returned to the author with feedback, while approved documents proceed to approval stage if necessary.
Business requirements: The validation interface should provide clear options for approving or rejecting documents. Feedback mechanisms should allow detailed comments for rejected documents. The system should accurately track and update document status based on validation results.

3.4. Document approval
Stage 3.1. Approval requirements check
Description: After successful validation (or if validation is bypassed), the system checks if approval is required based on configured settings. If "Manual Approval Needed = No", the approval process is completely skipped. If approval is required, the system proceeds to approver assignment according to configured settings.
Business requirements: The system should accurately interpret approval settings and route documents accordingly. Skip logic should function properly to bypass approval if not required.
Variability:
• Approval Not Required - bypass approval process
• Approval Required - proceed to approver assignment

Stage 3.2. Approver assignment
Description: Based on approval configuration, the system assigns approval tasks according to one of the following methods:
• Office approval: Documents are routed to designated approvers by office
• Document ownership approval: Approvers are assigned based on document type or category
• Department approval: Team leaders receive approval assignments by department
The system should comply with hierarchical approval structure defined in settings.
Business requirements: The approver assignment system should accurately match documents with appropriate approvers based on configured rules. The application should support all assignment methods and provide appropriate management interfaces.

Stage 3.3. Approval workflow execution
Description: The system initiates approval workflow based on configured flow type:
• Sequential flow: documents are passed sequentially from one approver to another in predetermined order
• Parallel flow: all approvers simultaneously receive the document for approval
Approvers receive notifications about upcoming approval tasks with context and deadlines. The system manages workflow progress according to configured rules.
Business requirements: The system should support both sequential and parallel approval workflows. The notification system should reliably alert approvers about new tasks. Deadline management and reminder features for pending approvals should be implemented.

Stage 3.4. Approval decision
Description: Approvers review documents and supporting information to make informed decisions. Their approval or rejection (with comments) is recorded in the system. In sequential workflows, rejection at any stage stops the process and returns the document to the originator. In parallel workflows, all approvers must approve for the document to be considered approved. Document status is updated upon completion of the approval process, and approved documents proceed to signing if necessary.
Business requirements: The approval interface should provide clear options for approving or rejecting documents. Feedback mechanisms should allow detailed comments for rejected documents. The system should accurately track and update document status based on approval results and properly manage workflow depending on approval type.

3.5. Document signing
Stage 4.1. Signature requirements determination
Description: After approval (or if approval is bypassed), the system determines if signatures are required for the document based on document type and system settings. If signatures are required, the system determines the appropriate signing method based on configuration in Signature Settings.
Business requirements: The system should accurately interpret signature requirements based on document type. Various signing methods should be supported according to signature settings configuration.

Stage 4.2. Signer assignment
Description: The system determines required document signers based on document type and organizational settings. Signers receive notifications about pending signature requests through the application and/or email. Signing order is determined based on configuration (sequential or simultaneous signing).
Business requirements: The signer assignment system should accurately identify required signers. The notification system should reliably alert signers about pending tasks. The system should correctly implement configured signing order.

Stage 4.3. Authentication and signing
Description: Before signing, users must authenticate according to configured security requirements. The interface presents the appropriate signing method based on settings:
• Electronic signature: Digital signatures based on email verification
• Digital certificate: Signatures using recognized certificate authorities
• Drawn signature: Touch/mouse-drawn signatures with timestamp verification
• One-time password: SMS or email verification code for signature approval
Business requirements: Authentication methods should be secure and reliable. The system should present appropriate signing interfaces based on configured method. All signing actions should be recorded with authentication evidence.

Stage 4.4. Signature completion and verification
Description: The system records signatures with timestamp and authentication data to ensure authenticity. The document is marked with signature status and stored with tamper protection. All parties are notified of signing process completion, and signed documents are archived according to retention policy.
Business requirements: The system should reliably record and store signature data with appropriate metadata. Tamper protection should be implemented for signed documents. The notification system should inform all relevant parties of signing completion. Retention policies should be properly applied to signed documents.
