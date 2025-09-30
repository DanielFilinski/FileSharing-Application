

1. Clients Description.
1.1. Clients Section:
1.1.1. Clients Interface look
 
1.1.2. Clients Interface Description
The interface will feature the following elements:
•	End User Selection bar – a bar at the top left side, located above the navigational panel that lets a user from the service providers side to select an end user.
•	Navigational panel:
o	Storage section – storage section consists of two main folders:
	DMS – internal storage only accessible to the employees registered by the service provider
	Portal – shared storage that is accessible to both service provider and end user.
o	Settings section – section that is described in detail in section 2 of Project Description.
•	Button “New” – a button that allows the user to create a new document of the following format: xlsx, docx, pdf.
•	Button “Upload” – a button that allows the user to upload an existing document to the folder that he selects and the end user he selects.
•	Button “Edit in Grid View” – a button that switches between table format of the interface where all documents are shown and grid view.
•	Button “Share” – a button that uploads the selected document to SharePoint.
•	Favorites Section – will only appear if a specific document and/or folder of the end user is selected as a “Favorite”
1.1.3. Documents functionality Description
The following functionality must be present when a user is selecting a document by right clicking it:
Option Naming	Option Description
Open	Launches the document in its associated application, either within Application or in a separate window. For Office documents (Word, Excel, PowerPoint, PDF), this typically opens the document in the online Office application by default, allowing for immediate editing and collaboration with real-time co-authoring capabilities. You can configure your preferences to open documents in desktop applications instead.
Preview	Displays a read-only version of the document directly within Application without fully opening it in an editing application. This option loads faster than full editing mode and is ideal for quickly reviewing content without making changes. Preview supports most common file types including Office documents, PDFs, images, and text files, displaying a visual representation with basic navigation tools.
Share	Creates a shareable link to the document that can be sent to others. When selecting this option, you can set specific permissions (view only, edit, etc.), choose whether to allow access to anyone with the link or only people in your organization, and add an expiration date. You can share via email, Teams chat, or by copying the link directly.
Copy	Creates a duplicate of the document's link to your clipboard, allowing you to paste it in chats, emails, or other applications. Unlike the Share option, this doesn't provide permission control settings at the time of copying - it simply captures the link with whatever permissions are currently applied to the document.
Make this a Tab	Converts the document into a dedicated tab within the current Application folder, making it permanently visible at the top of the folder for easy access. This elevates important documents for the end user by providing one-click access without navigating through folders. Tabs can be renamed and reordered as needed.
Delete	Moves the document to the recycle bin, removing it from active view but allowing for potential recovery. Deleted documents remain in the recycle bin for 93 days by default before being permanently removed. Users with appropriate permissions can restore deleted documents from the recycle bin during this period.
Favorite	Marks the document as a favorite, adding it to your "Favorites" section for quick access across application. Favorited items appear in a dedicated section in your application files view, allowing you to quickly find frequently used documents without navigating through folder structures. This setting is personal and doesn't affect other users.
Add Shortcut	Creates a shortcut to the document in another location within application or OneDrive without duplicating the file itself. This allows the same document to appear in multiple locations while maintaining a single source of truth. Any changes made to the document from any shortcut location will update the original file.
Download	Saves a local copy of the document to your device's download folder or a specified location. Downloaded files become independent from the Teams version, meaning changes made locally won't automatically sync back to the shared document unless manually uploaded. This is useful for offline work or when you need to share the document outside of Microsoft 365 ecosystem.
Rename	Allows changing the document's filename directly within application. The rename operation preserves all document properties, version history, and permissions while updating the name everywhere it appears. Links to the document will continue to work after renaming.
Open in SharePoint	Redirects you to the document in its native SharePoint environment, providing access to additional SharePoint-specific features and management options not available in application. This is useful for advanced document management tasks, accessing metadata, or configuring complex permissions.
Pin to Top	Forces the document to always appear at the top of its containing folder or list view, regardless of sort order. Pinned items remain prominently visible even as new documents are added. This setting affects all users viewing the document library, making it useful for highlighting important team documents. 
Move To	Relocates the document to a different folder or location within application or connected SharePoint libraries. This changes the document's storage location while preserving its version history and sharing permissions. Users with existing links to the document will still be able to access it at the new location.
Copy To	Creates a duplicate of the document in another location while keeping the original intact. This results in two separate files that can be independently modified. Unlike shortcuts, changes made to one copy won't affect the other. This is useful when you need to preserve an original version while making substantial changes to a duplicate.
Edit in App	Opens the document directly in the corresponding desktop application installed on your device (e.g., Word, Excel, PowerPoint). This provides full functionality compared to online editing, including access to advanced features not available in browser versions. Changes made are automatically saved back to the Teams document library if you're connected to the internet.
Open Chat	Opens the chat functionality imbedded between the service provider and the end user

1.1.4. User Roles Description
Role Name	Role Description	Permissions
Administrator	The primary system administrators with the highest level of access and control. They are responsible for the initial system setup and ongoing management of all system components.	•  Full access to all system settings and configuration options 
•  Ability to create and manage organization information 
•  Control over storage configuration (cloud/physical) 
•  User management (adding, editing, deleting all user types) 
•  Permission to configure validation processes 
•  Authority to establish approval workflows 
•  Access to signature settings 
•  Ability to modify all system settings 
•  Access to technical configurations and integrations
Technical Support	The primary system administrators with the highest level of access and control. They are responsible for the initial system setup and ongoing management of all system components.	•  Full access to all system settings and configuration options 
•  Ability to create and manage organization information 
•  Control over storage configuration (cloud/physical) 
•  User management (adding, editing, deleting all user types) 
•  Permission to configure validation processes 
•  Authority to establish approval workflows 
•  Access to signature settings 
•  Ability to modify all system settings 
•  Access to technical configurations and integrations
Service Provider	Users who provide services through the application and have administrative capabilities within their organizational context. They can configure the system for their specific business needs.	•  Access to settings configuration 
•  Ability to input and edit company information 
•  Storage configuration capabilities 
•  User management within their organization 
•  Access to validation and approval settings 
•  Ability to set up document workflows 
•  Configuration of signature methods for their organization 
•  Permission to create departments and assign responsibilities
Department Team Leads	Managers or heads of specific departments who have oversight responsibilities for their team's documents and workflows.	•  Document approval rights for their department 
•  View access to documents requiring approval 
•  Ability to manage department-specific workflows 
•  Permission to assign tasks to team members 
•  View access to department performance metrics 
•  Authority to validate documents within their area of responsibility 
•  Restricted administrative access limited to their department
Regular Employees	Standard users who interact with documents as part of their daily work but have limited administrative capabilities.	•  Access to assigned documents 
•  Ability to upload and manage documents based on role 
•  Permission to participate in validation processes when assigned 
•  Document viewing capabilities as needed for their role 
•  Ability to receive and complete approval tasks 
•  Access to necessary document signing tools 
•  Limited settings access specific to their own user profile
Clients (End Users)
External users who interact with the system, typically to view or access specific documents shared with them.	•  Limited access to specific documents shared with them 
•  Ability to view and download permitted documents 
• Ability to upload documents
•  Restricted portal access 
•  Document signing capabilities when required 
•  No access to system settings or configurations 
•  Limited communication tools to interact with employees 
•  Permission to upload documents when specifically enabled
Document Validators	Users responsible for validating document content before approval. May overlap with other roles but have specific validation responsibilities.	•  Access to documents requiring validation 
•  Tools to mark validation status (approved/rejected) 
•  Ability to provide validation feedback 
•  Permission to view document history 
•  Access to validation criteria and standards 
•  Limited administrative access to validation settings
Document Approvers	Users with authority to provide final approval on documents. These may be designated by office, department, or document type.	•  Access to all documents requiring their approval 
•  Authority to approve or reject documents 
•  Ability to view document history and validation status 
•  Permission to provide approval feedback 
•  Access to document workflow information 
•  Visibility into approval deadlines and priorities
Organization Owner	The primary account holder or organization representative who has ultimate authority over the organization's instance of the application.	•  Full control over organization settings 
•  Authority to assign administrator roles 
•  Access to all system components 
•  Billing and subscription management 
•  Ability to configure organization-wide policies 
•  Permission to establish role-based access controls 
•  Access to system usage analytics and reports

2. Settings Description.
2.1. Settings Sections:
1.	Organization
a.	Information
b.	Offices
2.	Storage
a.	Storage Type
b.	Storage Configuration
c.	Storage Allocation
d.	Storage Retention
e.	Storage Structure
3.	Users
a.	Employees
i.	Departments
b.	Clients
4.	Validation
5.	Approval
6.	Signature

2.2. Organization
2.2.1. Organization Settings Business Logic
 
2.2.2. Organization Settings Description
Stage number	Stage name	Company Information Input	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
1.1.	Description	Pre-requisites: To access this stage one of the following scenarios needs to happen:
•	User (Service Provider) with the roles (Administrator/Technical Support) successfully authenticated into the application using the following methods:
o	SSO
o	Microsoft Account
•	User (Service Provider) with the roles (Administrator/Technical Support), who has already used the application before accessed “Settings” and then chose a sub-option “Organization”.
Description: Upon accessing this stage, it is defined by the system that the user has opened the application for the first time based on the attribute: “Last Login” = NULL. The user has to fill in the following information in the form:
•	Company Information:
1. Company Name
2. Company Contact
3. Company Email
•	Owner Information:
1. Owner Full Name
2. Owner Contact
3. Owner Email
•	Office Information
Variability: The following options are present in the interface of the form:
•	Next – by selecting this option the processes are routed towards stage 2.1.
	2.1.
	Business Requirements	It is required to create the following interface:
 
	

Stage number	Stage name	Company Information Edit	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
1.2.	Description	Pre-requisites: To access this stage one of the following scenarios needs to happen:
•	User (Service Provider) with the roles (Administrator/Technical Support) successfully authenticated into the application using the following methods:
o	SSO
o	Microsoft Account
•	User (Service Provider) with the roles (Administrator/Technical Support), who has already used the application before accessed “Settings” and then chose a sub-option “Organization”.
Description: Upon accessing this stage, it is defined by the system that the user has opened the application not for the first time based on the attribute: “Last Login” = Date/Time. The user can overview the following information in the form:
•	Company Information:
1. Company Name
2. Company Contact
3. Company Email
•	Owner Information:
1. Owner Full Name
2. Owner Contact
3. Owner Email
Variability: The following options are present in the interface of the form:
•	Edit – by selecting this option the processes are routed towards stage 1.4. in the case of any information being edited, or, towards the end of the process, if no changes are necessary.
	1.4.
	Business Requirements	It is required to create the following interface:
 


Stage number	Stage name	Company Information Edit	Responsible
Department	All other roles except: Administrator/
Technical Support	System	Application	Variability
1.3.	Description	Pre-requisites: To access this stage one of the following scenarios needs to happen:
•	User (Service Provider) with the roles (Any role except: Administrator/Technical Support) successfully authenticated into the application using the following methods:
o	SSO
o	Microsoft Account
•	User (Service Provider) with the roles (Any role except: Administrator/Technical Support), who has already used the application before accessed “Settings” and then chose a sub-option “Organization”.
Description: Upon accessing this stage, it is defined by the system that the user is not an administrator or a part of technical support based on the attribute: “Role”. The user can overview the following information in the form:
•	Company Information:
1. Company Name
2. Company Contact
3. Company Email
•	Owner Information:
1. Owner Full Name
2. Owner Contact
3. Owner Email
Variability: The following options are present in the interface of the form:
•	Back – by selecting this option the processes are routed towards the end of the process due to the fact of not having the permissions to edit the information in this section.
	
	Business Requirements	It is required to create the following form with all fields locked:
 
Additionally, the following form must be created as a section:
 


Stage number	Stage name	Save Changes in Database	Responsible
Department	Automatically completed	System	Application	Variability
1.4.	Description	At this stage the data is overwritten in the database based on the user input.	2.1.
	Business Requirements		

2.2. Storage
2.3.1. Storage Settings Business Logic
 
2.3.2. Storage Settings Description
Stage number	Stage name	Storage Type Setting input	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
2.1.	Description	Pre-requisites: After finishing filling up organization settings successfully, the user is prompted to fill up the storage settings.

Description: At this stage, the user has to determine the storage type he/she will use. The following storage types are available:
•	Cloud Storage
•	Physical Storage
It’s important to note that upon selecting Cloud Storage and entering the email and password of the SharePoint a Verify button exists. The function of the button is the following:
•	Verify credentials and connect to SharePoint
On the other hand, if physical storage is selected then the user has to define the device that will allocate the space for storage. If there are multiple devices within the network, user can select the device that will do the task of storing data.
	2.3.
2.4.

	Business Requirements	It is required to create the following interface upon selecting Cloud Storage:
 
It is required to create the following interface upon selecting Physical Storage:
 


Stage number	Stage name	Storage Settings Overview	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
2.2.	Description	Pre-requisites: To access this stage one of the following scenarios needs to happen:
•	User (Service Provider) with the roles (Administrator/Technical Support) successfully authenticated into the application using the following methods and filled up Organization Information:
o	SSO
o	Microsoft Account
•	User (Service Provider) with the roles (Administrator/Technical Support), who has already used the application before accessed “Settings” and then chose a sub-option “Storage”.
Description: Upon accessing Storage Settings, it’s important to select the storage type of your preference and define the folder structure. Upon successfully filling up all the information the user can move on to the next stage.

Variability: 
•	Verify – in the cases when the SharePoint credentials need to be checked (validated), the user may use this option. Upon successful login to SharePoint, the user will get a pop up: “Connection Established”. If the credentials are wrong, the following pop up will appear: “Credentials not validated”
•	Edit – in the cases when the information is filled up but needs changing, the users with appropriate roles can change the folder structure according to the available functionality presented in the settings.
•	Back – in the cases when changes are unnecessary, the user can select this option and return to the previous screen (This option is not applicable to the initial Setup Stage.)
•	Next – in the cases of following through the initial Setup phase, this option is used to route the task to the next stage.	2.3. 
2.4.
	Business Requirements	Create the interface shown in stage 2.1.	

Stage number	Stage name	Check Credentials	Responsible
Department	Automatically Completed	System	API Integration with SharePoint	Variability
2.3.	Description	Pre-requisites: Input of an Email and password to the SharePoint by the user on stage 2.1 or 2.2.

Description: This task is completed automatically and based on the results of credentials verification 1 of the 2 pop up messages can appear:
•	Connection Established
•	Credentials not Validated

Note, that this is only applicable to Cloud based storage.	2.5.
	Business Requirements	N/A	

Stage number	Stage name	Select Device	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
2.4.	Description	Pre-requisites: The user at stage 2.1. selected the storage type = “Physical Storage”

Description: The user has to select one of the two options in the Physical Storage section:
•	Use Current Computer
•	Use Network Device
Upon selecting “Use current Computer” the user agrees to use the device he is currently using as document storage. 
Upon selecting “Use Network Device” the user has to select a device within the network of his company as storage for all the end users documents.	2.5.
	Business Requirements	It is required to create the following interface upon selecting Physical Storage:
 


Stage number	Stage name	Storage Amount Input	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
2.5. 	Description	Pew-requisites: At this stage the user has selected the Storage Type and either:
•	SharePoint Account
•	Device within the company network
•	Personal Device
Description: The user has to select an amount of storage in terms of either:
•	Gigabytes
•	Megabytes
This amount will be dedicated to each client that the user will import.	2.6.
2.7.
	Business Requirements	It is required to create the following interface:
 

It is important to note, that there are 2 types of storage:
•	DMS – an internal type of storage only accessible to the employees of the service provider
•	Portal – a shared type of storage that is accessible to both the service provider and an end user
The amount that the user allocated is divided evenly between DMS and Portal sections.	

Stage number	Stage name	Notification: “Not Enough Space”	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
2.6.	Description	Pre-requisite: if at the following stages the user exceeds the limit of storage:
•	2.5. Storage Allocation Input
•	3. Clients import
The user will be met with the following pop up: “Not enough space”.	2.5.
	Business Requirements	It is required to create the interface of the pop-up message that the user will see. The user will have the following variability:
•	Escalate case – the process will be routed towards the IT department/System Administrator for solving the storage issue
•	Dismiss – the pop-up will be dismissed and the upload files process that the user tried to upload will be discarded. 	

Stage number	Stage name	Retention Input	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
2.7.	Description	Description: At this stage the user has to input for how long the data will be stored.	3.2.
	Business Requirements	Create the following interface:
 
The user will either choose from the pre-set retention options or select: “Custom” and fill in the value he/she is comfortable with.
Aside from that the user will have to finalize the settings by mentioning the folder structure he/she would like to see in the application:
 
	
2.4. Users
2.4.1. Users Settings Business Logic

 
2.4.2. Users Settings Description
Stage number	Stage name	User Settings Overview	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
3.1.	Description	Pre-requisites: Upon either of the cases:
•	Successfully finalizing the storage set up
•	Accessing Settings and selecting “Users”
Description: The user is met with the interface of user settings	3.3.
3.4.
3.5.
	Business Requirements	It is required to create the following interface:
 
The interface will consist of 2 sections:
•	Employees
•	Clients
The interface of the employee section looks as follows:
 
The interface of the Clients section is as follows:
 
Where the user with appropriate permissions will be able to:
•	Add Employees/Clients via:
o	Manual Input
o	Import of the Excel File.
•	Edit User List
 
 
•	Delete Users
•	Create Departments
 
•	Edit the fields that can be inserted in the table format.	

Stage number	Stage name	Import Users Manually	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
3.3.	Description	Pre-requisites: Upon accessing the User Settings form the user chose to press “Add Employee” or “Add Client” buttons. 
Description: Upon pressing the button, a pop-up form “Edit Employee” or “Edit Client” will open and the user will need to input the mandatory fields in order to create the user he/she wants.	1.Validation Settings
2.End
	Business Requirements	It is required to create forms with the following attributes.
Mandatory fields include (for employee):
•	First Name
•	Last Name
•	Classification
•	Affiliated Office
Non-Mandatory roles include:
•	Role
•	Department

Mandatory fields include (for client):
•	First Name
•	Last Name
•	Phone Number
•	Email
Non-Mandatory fields include:
•	Firm Name
•	Firm Address	

Stage number	Stage name	Input Users via File	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
3.4.	Description	Pre-requisites: Upon accessing the User Settings form the user chose to press “Import” button. 
Description: Upon pressing the button, a pop-up form will appear with the following options:
•	Import
•	Cancel

Note: the file for import needs to have an approved structure.	1.Validation Settings
2.End
	Business Requirements	It is required to create an upload pop-up form.
 


Stage number	Stage name	Add Department	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
3.5. 	Description	Pre-requisites: Upon accessing user settings either way:
•	Via initial Set Up
•	Via Settings
The user may select an option to add departments.	3.3.
3.4.
	Business Requirements	It is required to create the following form:
 

By pressing on the “Add Department” button, the following form should open:
 


2.5. Validation
2.5.1. Validation Settings Business Logic
 
2.5.2. Validation Settings Description
Stage number	Stage name	Dialogue Choice/Validation Settings Overview	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
4.1.	Description	Pre-requisites: The user accessed the validation setting using one of the following ways:
•	Accessed the “Settings” section and selected “Validation”
•	Initial Setup
Description: At this stage the user needs to determine whether manual or automatic. Automatic validation being the case of validation process being skipped.  
Variability: The task is considered done when the following button is pressed “Save Settings”. The process is routed to the following stages:
•	Stage 4.2. – Manual Validation Needed = Yes, Validation Assignment = By Office/By Document
•	Stage 4.3. – Ma Manual Validation Needed = Yes, Validation Assignment = By Department/Employees
•	Stage 4.4. – Ma Manual Validation Needed = No	4.2.
4.3.
4.4.
	Business Requirements	It is required to create the following interface:
 
	

Stage number	Stage name	Select Responsible Users	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
4.2. 	Description	Pre-Requisites: Stage 4.2. – Manual Validation Needed = Yes, Validation Assignment = By Office/By Document
Description: At this stage the user with appropriate permissions needs to select employees responsible for document validation. The user can either select employees responsible for validation for each of the registered offices, or, based by the document affiliation.
	
	Business Requirements	It is required to create the following sections within the form:
•	In the case of Validation Assignment = By Office being selected:
 
•	In the case of Validation Assignment = By Document being selected:
 


Stage number	Stage name	Select 
Responsible Departments/
Employees	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
4.3.	Description	Pre-Requisites: Stage 4.3. – Ma Manual Validation Needed = Yes, Validation Assignment = By Department/Employees

Description: At this stage the user with appropriate permissions needs to select employees responsible for document validation. The user can either select employees responsible for validation either by selecting the responsible department or selecting employees manually. 
Variability: The task is considered complete when “Save Settings” option is selected.	
	Business Requirements	It is required to create the following sections within the form:
In the case of Validation Assignment = By Employee being selected:
 
That being said, by selecting “Add” the following pop-up form should be created:
 
In the case of Validation Assignment = By Department being selected:
 


	

2.6. Approval
2.6.1. Approval Settings Business Logic
 
2.6.2. Approval Settings Description
Stage number	Stage name	Dialogue Choice/ Approval Settings Overview	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
5.1.	Description	Pre-Requisites: The user accessed the Approval setting using one of the following ways:
•	Accessed the “Settings” section and selected “Approval”
•	Initial Setup
Description: At this stage the user with appropriate permissions needs to determine whether after validation there needs to be an approval process for documents.	
	Business Requirements	It is required to create the following interface:
In the case when approval is not needed:
 
In the case when approval is needed:
 


Stage number	Stage name	Approval Unnecessary	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
5.2.	Description	Pre-Requisites: On stage 5.1. the attribute “Manual Approval Needed” = No. 
Description: This stage is completed automatically automatic. If approval process is not needed to the service provider, it is skipped entirely until the settings are changed.	
	Business Requirements	No action required.	

Stage number	Stage name	Select Employees by Office	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
5.3.	Description	Pre-Requisites: On stage 5.1. the attribute “Manual Approval Needed” = Yes or during the initial setup the user reached this section.
Description: At this stage the user with appropriate permissions selects offices in which documents need to undergo approval process by employees.	
	Business Requirements	It is required to create the following section in the approval form:
 
In the following section, the user may select all created offices in his/her organization. Based on the selected offices, the following sections are created for each selected office:
 
In each office section, employees are displayed and can be selected as the responsible role for approving documents.
	

Stage number	Stage name	Select Employee by Document Affiliation	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
5.4.	Description	Pre-Requisites: On stage 5.1. the attribute “Manual Approval Needed” = Yes or during the initial setup the user reached this section.
Description: At this stage the user with appropriate permissions selects document affiliations by which documents need to undergo approval process by employees.	
	Business Requirements	It is required to create the following section in the approval form:
 
After the selection of Document Affiliation, the section “Approval Employees” will appear where the user needs to select the employees that will be responsible for approval:
 



Stage number	Stage name	Select Employee by Departments	Responsible
Department	Administrator/
Technical Support	System	Application	Variability
5.5.	Description	Pre-Requisites: On stage 5.1. the attribute “Manual Approval Needed” = Yes or during the initial setup the user reached this section.
Description: At this stage the user with appropriate permissions selects departments by which documents need to undergo approval process by employees.

Note: Important, when Departments are selected, only the team leads of the departments will have the right to approve documents.	
	Business Requirements	It is required to create the following section in the approval form:
 



Stage number	Stage name	Consecutive Approval Flow Setting saved	Responsible
Department	Automatically Completed	System	Application	Variability
5.6.	Description	Pre-Requisites: Selection of more than 1 department for approval 
Description: This stage is done automatically, based on the saved settings all the selected department team leads will receive a task to approve the document consecutively. Only if all 3 approve will the document be considered – approved.	
	Business Requirements	It is required to create the following section in the approval form:
 



Stage number	Stage name	Parallel Approval Flow Setting saved	Responsible
Department	Automatically Completed	System	Application	Variability
5.7.	Description	Pre-Requisites: Selection of more than 1 department for approval
Description: This stage is done automatically, based on the saved settings all the selected department team leads will receive a task to approve the document simultaneously. Only if all 3 approve will the document be considered – approved.	
	Business Requirements	Not Needed	

2.7. Signature
2.7.1. Signature Settings Business Logic
 
2.7.2. Signature Settings Description
Stage number	Stage name		Responsible
Department	Administrator/
Technical Support	System	Application	Variability
6.1.	Description	Pre-Requisites: 
•  User must have administrator or technical support role 
•  User must have successfully accessed the Settings section and selected "Signature"
Description: At this stage, administrators define the primary signature methods available in the system. The interface presents options for configuring the following signature types:
1.	E-Signature - Digital signatures using email verification
2.	Digital Certificate - Signatures using recognized certificate authorities
	
	Business Requirements	It is Required to create the following interfaces:
 
For e-signature the following section should be formed:
 

•  The interface must allow administrators to enable/disable each signature method 
•  Each signature method must include configurable verification settings 
•  The system must maintain audit logs for signature method changes 
•  Signature methods must comply with relevant electronic signature regulations	


Stage number	Stage name		Responsible
Department	Administrator/
Technical Support	System	Application	Variability
6.2.	Description	Pre-Requisites: 
•  Completion of Stage 6.1 
•  At least one signature method enabled
Description: This stage allows configuration of how signatures appear on documents. Administrators can define:
1.	Signature appearance templates
2.	Required information to display (name, date, company)
3.	Positioning options (automatic vs. manual placement)
4.	Customization options (including logo/branding)	
	Business Requirements	•  The system must provide preview capabilities for signature appearances 
•  Templates must be customizable per office/department 
•  Settings must ensure signatures remain visible and legible on final documents 
•  Signature appearance settings must be saved per user/role	

Stage number	Stage name		Responsible
Department	Administrator/
Technical Support	System	Application	Variability
6.3.	Description	Pre-Requisites: 
* Completion of Stage 6.2
Description: This stage focuses on security configurations for signature authentication:
1.	Authentication methods required before signing (email, SMS, password)
2.	Multi-factor authentication options
3.	Session timeout settings for signing processes
4.	IP restrictions for signature access	
	Business Requirements	•  The system must support multiple authentication methods 
•  Authentication settings must align with organizational security policies 
•  Settings must be configurable by document type/importance 
•  The system must log all authentication attempts	

Stage number	Stage name		Responsible
Department	Administrator/
Technical Support	System	Application	Variability
6.4.	Description	Pre-Requisites: 
•  Completion of Stages 6.1-6.3 
•  Approval settings must be configured
Description: This final stage configures how the signature process integrates with document workflows:
1.	Signature order settings (sequential vs. parallel)
2.	Automatic notification configurations
3.	Deadline/reminder settings for pending signatures
4.	Fallback procedures for signature rejection/expiration	
	Business Requirements	•  The system must support both sequential and parallel signature processes 
•  Integration must align with previously configured approval workflows 
•  The workflow must include notification options for all participants 
•  Settings must allow for delegation of signing authority when needed	

3. Process Description.
3.1. Process Sections:
1.	Document Upload/Download Process
2.	Document validation Process
3.	Document Approval Process
4.	Document Signing Process

3.2. Document Upload/Download
Stage 1.1. Upload Initiation
Description: Users with appropriate permissions can initiate document uploads through the application interface. Before accepting the upload, the system verifies available storage space based on the configured storage allocation. If sufficient space is available, the upload proceeds; if not, the system displays a "Not enough space" notification with options to either escalate the case to the IT department/System Administrator or dismiss the upload.
Business Requirements: It is required to implement storage verification prior to document upload to prevent storage overflow. The system must maintain predefined storage limits as configured in the Storage Settings. Upload interfaces must be accessible from appropriate locations in the application and support multiple file types as defined in system configurations.
Variability:
•	Escalate case -- when storage is insufficient, route to IT for resolution
•	Dismiss -- cancel upload process when storage is unavailable
Stage 1.2. Storage Assignment
Description: Upon successful upload verification, the system automatically routes the document to the configured storage type (Cloud Storage or Physical Storage). For Cloud Storage, files are stored in SharePoint using authenticated credentials established during setup. For Physical Storage, files are stored on the designated network devices or local computers selected during configuration. All storage assignments follow the allocation quotas established in Settings → Storage.
Business Requirements: The system must maintain separate storage paths for each configured storage type. Cloud storage must integrate with Microsoft SharePoint using secure authentication. Physical storage must support both network and local device options with appropriate access controls.
Stage 1.3. Folder Organization
Description: Following storage assignment, documents are organized according to the predefined folder structure established during system configuration. The system automatically segregates content between DMS (internal) and Portal (shared) sections as defined in the storage settings. This organization ensures appropriate access control based on user roles and permissions.
Business Requirements: The folder structure must follow the hierarchy defined in Storage Settings. The system must properly categorize content between internal and external-facing repositories. Access permissions must be automatically applied based on document location and user roles.
Stage 1.4. Download Process
Description: Authorized users can download documents based on their assigned permissions. The system maintains comprehensive download logs for audit purposes, recording the user, timestamp, and document details. Downloaded documents retain their metadata and system associations for tracking purposes.
Business Requirements: The download functionality must respect user permissions and prevent unauthorized access. Audit logging is required for all download activities. The system must preserve document integrity and associations during the download process.
3.3. Document Validation
Stage 2.1. Validation Requirement Determination
Description: When a document is uploaded or updated, the system checks the validation settings to determine if manual validation is required. If validation is set to automatic ("Manual Validation Needed = No"), this process is bypassed entirely, and the document proceeds to the next stage. If manual validation is required, the system initiates the validator assignment process.
Business Requirements: The system must accurately interpret validation settings and route documents accordingly. Skip logic must function properly to bypass validation when configured as automatic.
Variability:
•	Validation Needed = No -- bypass validation process
•	Validation Needed = Yes -- continue to validator assignment
Stage 2.2. Validator Assignment
Description: Based on the validation configuration, the system assigns validation tasks according to one of the following methods:
•	Office-based validators: Documents routed to specific employees responsible for validating documents from each office
•	Document-type validators: Assignments based on document categories to employees with relevant expertise
•	Department-based validators: Team leads or designated employees within departments
Business Requirements: The assignment system must accurately map documents to appropriate validators based on configured rules. The application must support all three assignment methods and provide appropriate interfaces for management.
Variability:
•	By Office -- validator selection based on office affiliation
•	By Document -- validator selection based on document type
•	By Department -- validator selection based on departmental responsibility
Stage 2.3. Validation Task Distribution
Description: Once validators are assigned, they receive notifications of pending validation tasks. The interface presents the document with appropriate tools for content verification, along with any specific validation requirements or criteria. Validators can access the document with appropriate permissions for thorough review.
Business Requirements: The notification system must reliably alert validators to new tasks. The validation interface must display relevant document information and provide appropriate tools for content verification.
Stage 2.4. Validation Action
Description: Validators review document content for accuracy and compliance according to organizational standards. They record their validation decision (approved or rejected with comments) through the interface. The system updates the document status accordingly. Rejected documents return to the originator with feedback, while approved documents proceed to the approval stage if required.
Business Requirements: The validation interface must provide clear options for document approval or rejection. Feedback mechanisms must allow detailed comments for rejected documents. The system must accurately track and update document status based on validation outcomes.
3.4. Document Approval
Stage 3.1. Approval Requirement Check
Description: After successful validation (or if validation is bypassed), the system verifies whether approval is required based on configured settings. If "Manual Approval Needed = No," the approval process is skipped entirely. If approval is required, the system proceeds to approver assignment according to the configured parameters.
Business Requirements: The system must accurately interpret approval settings and route documents accordingly. Skip logic must function properly to bypass approval when configured as unnecessary.
Variability:
•	Approval Unnecessary -- bypass approval process
•	Approval Required -- continue to approver assignment
Stage 3.2. Approver Assignment
Description: Based on the approval configuration, the system assigns approval tasks according to one of the following methods:
•	Office-based approval: Documents routed to designated approvers by office
•	Document-affiliation approval: Approvers assigned based on document type or category
•	Department-based approval: Team leads receive approval tasks by department
The system must respect the hierarchical approval structure defined in the settings.
Business Requirements: The approver assignment system must accurately map documents to appropriate approvers based on configured rules. The application must support all assignment methods and provide appropriate interfaces for management.
Stage 3.3. Approval Workflow Execution
Description: The system initiates the approval workflow based on the configured flow type:
•	Consecutive Flow: Documents route sequentially from one approver to the next in predefined order
•	Parallel Flow: All approvers simultaneously receive the document for approval
Approvers receive notifications of pending approval tasks with relevant context and deadlines. The system manages workflow progression according to the configured rules.
Business Requirements: The system must support both sequential and parallel approval workflows. The notification system must reliably alert approvers to new tasks. Deadline management and reminder functionality must be implemented for pending approvals.
Stage 3.4. Approval Decision
Description: Approvers review documents and supporting information to make informed decisions. Their approval or rejection (with comments) is recorded in the system. In consecutive workflows, rejection at any stage halts the process and returns the document to the originator. In parallel workflows, all approvers must approve for the document to be considered approved. The document status is updated upon completion of the approval process, and approved documents proceed to signing if required.
Business Requirements: The approval interface must provide clear options for document approval or rejection. Feedback mechanisms must allow detailed comments for rejected documents. The system must accurately track and update document status based on approval outcomes and properly manage workflow based on approval type.
3.5. Document Signing
Stage 4.1. Signature Requirement Determination
Description: Following approval (or if approval is bypassed), the system determines whether the document requires signatures based on document type and system settings. If signatures are required, the system identifies the appropriate signature method based on the configuration in Signature Settings.
Business Requirements: The system must accurately interpret signature requirements by document type. Different signature methods must be supported according to the Signature Settings configuration.
Stage 4.2. Signer Assignment
Description: The system identifies required signatories based on document type and organizational settings. Signers are notified of pending signature requests through the application and/or email. The signing order is determined based on configuration (sequential or simultaneous signing).
Business Requirements: The signer assignment system must accurately identify required signatories. The notification system must reliably alert signers to pending tasks. The system must correctly implement the configured signing order.
Stage 4.3. Authentication and Signing
Description: Before signing, users must authenticate according to the configured security requirements. The interface presents the appropriate signature method based on settings:
•	E-Signature: Email verification-based digital signatures
•	Digital Certificate: Signatures using recognized certificate authorities
•	Drawn Signature: Touch/mouse-drawn signatures with timestamp verification
•	One-Time Password: SMS or email verification code for signature approval
Business Requirements: Authentication methods must be secure and reliable. The system must present appropriate signature interfaces based on the configured method. All signature actions must be recorded with authentication evidence.
Stage 4.4. Signature Completion and Verification
Description: The system captures signatures with timestamp and authentication details to ensure validity. The document is marked with signature status and stored with tamper-evident protection. All parties are notified of the completed signature process, and signed documents are archived according to retention policies.
Business Requirements: The system must securely capture and store signature data with appropriate metadata. Tamper-evident protection must be implemented for signed documents. The notification system must inform all relevant parties of signature completion. Retention policies must be correctly applied to signed documents.
4. Dashboard Description.
4.1.1. Dashboard Interface look
 
4.1.1. Dashboard Interface Description
Main Components & Their Functionality
1. Navigation & Header System
Top Navigation Bar:
•	Search Functionality: Global search allows users to find documents, clients, and tasks across the entire system
•	Notification Center: Alerts users to time-sensitive actions, status changes, and new document uploads
•	Settings Access: Provides access to user preferences, account settings, and system configuration
•	Help & Support: Quick access to documentation and support resources
•	User Profile: Shows current user and provides access to account-specific functions
2. Client Management Interface (Left Sidebar)
Client Directory:
•	Client Listing: Displays all clients with whom the service provider has an active relationship
•	Visual Status Indicators: Red notification badges immediately show which clients have pending items requiring attention
•	Search Functionality: Allows quick filtering of clients by name or other attributes
•	Client Selection: Clicking a client loads their specific dashboard and document environment
•	Add New Client Button: Creates new client profiles and sets up their portal structure
3. Main Dashboard Content
Project Status Summary:
•	Completion Tracking: Visual progress indicator showing overall project completion percentage
•	Document Status Breakdown: 
o	Pending Validation (documents awaiting review)
o	Pending Signing (documents requiring signatures)
o	Pending Approval (documents needing formal approval)
•	Recent Activity Metrics: Quantifies document updates within defined timeframes
Action Required Documents:
•	Priority-Based Display: Documents requiring immediate attention appear at the top
•	Status Context: Each document shows its current status and required actions
•	Due Date Tracking: Clearly displays deadlines for time-sensitive documents
•	Action Links: Direct access to review, sign, or complete document-specific tasks
Recent Activity Feed:
•	Chronological Timeline: Shows all document-related activities in sequence
•	User Attribution: Identifies which team member or client performed each action
•	Document Context: Links activities directly to specific documents
•	Timestamp Tracking: Records when each action occurred for audit purposes
Upcoming Deadlines:
•	Calendar Integration: Displays document due dates and processing deadlines
•	Priority Indicators: Color-coded to indicate urgency (red for most urgent)
•	Time Remaining: Shows days remaining before due date
•	Document Type Context: Identifies the nature of each deadline (signature, approval, etc.)
4. Document Details Panel (Right Sidebar)
Document Information:
•	Document Affiliation: Categorizes documents by domain (Law/Tax/Government/Others)
•	Document Category: Provides further classification (Business Documents, IRS Tax Forms, etc.)
•	Creation Date: Records when the document was first uploaded
•	Status Indicator: Visual representation of current document state
Assigned Team Management:
•	Team Member Identification: Shows full names of all team members involved
•	Position Display: Indicates professional role (Lead Attorney, Associate, etc.)
•	Responsibility Designation: Defines document-specific roles (Validator, Approver, Signatory)
•	Visual Role Indicators: Color-coded for quick identification of responsibilities
Document Workflow Checklist:
•	Standard Process Steps: Shows required steps for document processing: 
o	Initial Draft Review
o	Draft Validation
o	Conditional steps (if applicable): 
	Draft Approval (when approval is required)
	Draft Signing (when signatures are necessary)
•	Status Tracking: Visually indicates completed steps with checkmarks
•	Progress Monitoring: Shows current active step in the workflow
•	Conditional Steps Management: Clearly identifies which steps are required for specific document types
Security Information:
•	Validation Status: Indicates whether document has passed security verification
•	Retention Period: Shows how long the document will be retained (e.g., 90 days)
•	Access Controls: Displays which parties have viewing/editing permissions
•	Modification Restrictions: Explains constraints on document changes

5. Chat Functionality Description.
5.1.1. Chat interface look
 
3. Chat Functional Requirements
3.1. Core Chat Functions
Requirement ID	Description	Priority
CHAT-01	Document-specific chat threads that persist throughout the document lifecycle	High
CHAT-02	User identification with clear visual distinction between SP and EU messages	High
CHAT-03	Capability to reference and highlight specific document sections in discussions	High
CHAT-04	Integration with document workflow stages (validation, approval, signing)	High
CHAT-05	Notification system for new messages, mentions, and document status changes	Medium
CHAT-06	File and screenshot sharing capabilities within chat	Medium
CHAT-07	Message formatting options (text formatting, bullet points, numbering)	Low
CHAT-08	Message search and filtering functionality	Low
3.2. Security & Compliance Requirements
Requirement ID	Description	Priority
CHATS-01	End-to-end encryption for all chat communications	High
CHATS-02	Comprehensive audit logging of all message activities	High
CHATS-03	Access controls aligned with document permissions	High
CHATS-04	Data retention controls in compliance with organizational policies	Medium
CHATS-05	Ability to export chat logs for compliance purposes	Medium
4. User Interaction Model
4.1. User Stories
Service Provider Perspective:
1.	Document Review Communication 
o	As a tax accountant
o	I want to highlight specific sections of a tax return and discuss them in real-time with my client
o	So that I can quickly obtain clarification and supporting documentation for questionable items
2.	Internal Team Collaboration 
o	As a project manager
o	I want to communicate with my team about a document while maintaining client visibility
o	So that everyone remains informed while we resolve internal questions
3.	Status Update Notification 
o	As a senior attorney
o	I want to notify clients automatically when document status changes
o	So that clients stay informed without requiring manual updates
End User Perspective:
1.	Document Clarification 
o	As a client
o	I want to ask questions about specific sections of my documents
o	So that I can provide accurate information without delay
2.	Progress Tracking 
o	As a client administrator
o	I want to see a history of all communications about a document
o	So that I can track progress and understand outstanding requirements
3.	Team Coordination 
o	As a client finance director
o	I want to include multiple team members in document discussions
o	So that we can coordinate our responses to service provider inquiries
4.2. User Flows
Primary Flow: Document Query and Resolution
1.	Service Provider opens document in review mode
2.	SP highlights a section requiring clarification
3.	SP sends a message referencing the highlighted section
4.	System notifies End User of new message
5.	EU receives notification and opens document with chat
6.	EU views highlighted section and message
7.	EU responds with clarification or uploads supporting documentation
8.	SP receives notification of response
9.	SP reviews response and either: 
o	Marks issue as resolved
o	Requests additional information
o	Proceeds with document workflow (validation/approval)
Secondary Flow: Status Update and Follow-up
1.	Document status changes (system-triggered or user action)
2.	System posts automated status update in chat
3.	Relevant parties receive notification
4.	Users can discuss implications or next steps in chat
5.	Action items are identified and assigned
6.	Progress toward resolution is tracked in subsequent messages
5. Data Requirements
5.1. Message Data Model
Each message in the chat system should contain:
•	Unique message identifier
•	Document reference ID
•	Sender information (user ID, name, role)
•	Timestamp (creation and read receipts)
•	Message content (text, formatting, references)
•	Message type (user message, system notification, action item)
•	Document section references (if applicable)
•	Attachment references (if applicable)
•	Status (sent, delivered, read)
5.2. Document Reference Model
When referencing document sections:
•	Document identifier
•	Section coordinates or identifier
•	Version reference (to maintain accuracy across revisions)
•	Reference type (highlight, comment, question)
•	Status (active, resolved)
5.3. Data Relationships
•	Each document has one chat thread
•	Each chat thread contains multiple messages
•	Messages can reference specific document sections
•	Messages can reference specific workflow stages
•	Messages can contain file attachments
•	Users can participate in multiple chat threads
6. Integration Points
6.1. Microsoft Teams Integration
The chat functionality must integrate seamlessly with Microsoft Teams as specified in the requirements document section 2.3.2: "The system shall integrate with Teams chat for document-related communications."
Integration points include:
•	Teams authentication and user management
•	Teams notification system
•	Teams UI components and styling
•	Teams message storage and compliance features
•	Teams file sharing capabilities
6.2. Document Management System Integration
•	DMS events trigger system messages (status changes, version updates)
•	Chat messages can reference document versions and sections
•	Document permissions control chat access
•	Document retention policies apply to associated chat content
6.3. Workflow Process Integration
•	Chat contains visibility into current document status
•	Validation and approval actions can be triggered from chat
•	Chat history is accessible throughout document lifecycle stages
•	Chat provides context for workflow decisions
7. Business Rules
Rule ID	Description	Enforcement
BR-01	Chat access is limited to users with document access permissions	System
BR-02	All communications related to document processing must be conducted within the document chat	Policy
BR-03	System notifications must be generated for all significant document status changes	System
BR-04	Chat logs must be preserved according to document retention policies	System
BR-05	Service Providers must respond to client inquiries within one business day	Policy
BR-06	Sensitive information exchanges must be flagged and tracked for compliance	System
8. Success Metrics
8.1. Key Performance Indicators
Metric	Current Baseline	Target	Measurement Method
Document processing time	Average 5 days	Reduce to 3.5 days	Workflow analytics
Email volume	15 emails per document	Reduce by 50%	Email analytics
Client satisfaction	7.5/10	Improve to 8.5/10	Client surveys
Response time	8 hours average	Reduce to 4 hours	Message timestamp analysis
Resolution accuracy	85% first-time resolution	Improve to 95%	Rework tracking
8.2. Business Value Metrics
•	Reduced operational costs due to more efficient communication
•	Improved regulatory compliance through comprehensive documentation
•	Increased client retention through enhanced service experience
•	Higher employee satisfaction through streamlined workflows
9. Implementation Approach
9.1. Phased Implementation Strategy
Phase 1: Core Functionality (8 Weeks)
•	Document-specific chat threads
•	Basic message functionality
•	User identification and notifications
•	System messages for status changes
Phase 2: Enhanced Features (6 Weeks)
•	Document section referencing
•	File attachment capabilities
•	Advanced formatting options
•	Integration with workflow actions
Phase 3: Advanced Capabilities (4 Weeks)
•	Search and filtering
•	Analytics and reporting
•	Advanced compliance features
•	Performance optimization
9.2. Change Management Considerations
For Service Provider Users:
•	Training on chat-based workflow processes
•	Documentation of best practices and communication standards
•	Development of templates for common inquiries and responses
•	Metrics and incentives for responsive communication
For End Users:
•	Onboarding materials explaining chat functionality
•	Quick reference guides for common actions
•	Support channels for questions and assistance
•	Collection of feedback for continuous improvement
9.3. Organizational Readiness
To ensure successful adoption, the organization should:
•	Establish clear communication policies utilizing the new system
•	Update process documentation to incorporate chat-based workflows
•	Provide adequate training resources for both internal and client users
•	Designate chat champions to demonstrate and encourage proper usage
•	Implement monitoring during initial rollout to identify and address issues
10. Testing Approach
10.1. User Acceptance Testing
UAT should involve both service providers and sample client users, focusing on:
•	Ease of finding and using chat functionality
•	Clarity of message attribution and threading
•	Effectiveness of notifications and alerts
•	Performance under typical usage scenarios
•	Accessibility across different devices and platforms
10.2. Business Scenario Testing
Test cases should cover key business scenarios:
•	Document review and comment resolution
•	Complex multi-party discussions
•	Integration with document workflow stages
•	Compliance with retention and security requirements
•	Performance under high-volume conditions
10.3. Success Criteria
UAT will be considered successful when:
•	90% of test cases pass without critical issues
•	85% of users rate the functionality as "easy to use"
•	All regulatory compliance requirements are met
•	Performance metrics meet or exceed specified targets
•	Integration with existing systems functions as expected
11. Risks and Mitigation Strategies
Risk	Impact	Probability	Mitigation Strategy
User adoption resistance	High	Medium	Phased rollout, targeted training, demonstrated benefits
Performance issues with large documents	Medium	Medium	Performance testing, optimization, pagination of chat history
Compliance gaps in communication logging	High	Low	Pre-implementation compliance review, audit logging, regular compliance checks
Integration challenges with Teams	High	Medium	Early prototyping, Microsoft consultation, fallback options
Data migration complexities	Medium	Medium	Clear migration strategy, selective history import, archiving plan
12. Assumptions and Dependencies
12.1. Assumptions
•	All users have access to Microsoft Teams or compatible web browsers
•	Document structures support section-level referencing
•	Service provider organization has established communication policies
•	Adequate network connectivity is available for all users
12.2. Dependencies
•	Microsoft Teams licensing for all users
•	SharePoint storage availability for chat history
•	Completion of user authentication system
•	Document management system implementation
•	Role-based access control framework
13. Glossary
Term	Definition
SP	Service Provider - Law firm or accounting firm using the system
EU	End User - Client organization or individual using the system
DMS	Document Management System - Internal component for SP team members
Portal	External-facing component for collaboration between SPs and EUs
Thread	A sequence of messages related to a specific document
Section Reference	A link between a chat message and a specific part of a document






