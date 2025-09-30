import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Text,
  Title3,
  Switch,
  MessageBar,
  MessageBarBody,
  Spinner,
  Card,
  CardHeader,
  Field,
  Dropdown,
  Option,
  Textarea,
  Input,
  Badge,
  Tab,
  TabList,
  TabValue
} from '@fluentui/react-components';
import {
  Shield20Regular,
  Save20Regular,
  Warning20Regular,
  Info20Regular,
  Signature20Regular,
  Certificate20Regular,
  Mail20Regular,
  Phone20Regular
} from '@fluentui/react-icons';

import { signatureApi } from '@/shared/api/signatureApi';
import {
  OrganizationSignatureSettings,
  SignatureMethod,
  AuthenticationMethod,
  SignatureTemplate
} from '@/shared/types/signature';
import {
  PermissionGate,
  Permission
} from '@/shared/lib/rbac';
import {
  ContentContainer,
  RowCardContainer,
  ScreenContainer,
  CardContainer
} from '@/app/styles/layouts';
import { CardHeader as CustomCardHeader } from '@/components/card/card-header';
import { notificationService } from '@/shared/lib/notifications';

/**
 * Signature Settings Page - Configuration for digital signature methods
 * Implements Stage 6.1-6.4 from project documentation
 */
export const SignatureSettings: React.FC = () => {
  const navigate = useNavigate();
  
  // State management
  const [settings, setSettings] = useState<OrganizationSignatureSettings | null>(null);
  const [templates, setTemplates] = useState<SignatureTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabValue>('methods');

  // Load settings on mount
  useEffect(() => {
    loadSignatureSettings();
  }, []);

  const loadSignatureSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [settingsResponse, templatesResponse] = await Promise.all([
        signatureApi.getSignatureSettings(),
        signatureApi.getSignatureTemplates()
      ]);
      
      setSettings(settingsResponse);
      setTemplates(templatesResponse);
    } catch (err: any) {
      console.error('Failed to load signature settings:', err);
      setError(err.message || 'Failed to load signature settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setIsSaving(true);
      setError(null);

      await signatureApi.updateSignatureSettings(settings);
      
      notificationService.success(
        'Settings saved successfully',
        'Signature settings have been updated'
      );
      
    } catch (err: any) {
      console.error('Failed to save signature settings:', err);
      setError(err.message || 'Failed to save signature settings');
      
      notificationService.error(
        'Failed to save settings',
        err.message || 'Please try again'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (updates: Partial<OrganizationSignatureSettings>) => {
    if (settings) {
      setSettings({ ...settings, ...updates });
    }
  };

  const toggleSignatureMethod = (method: SignatureMethod, enabled: boolean) => {
    if (!settings) return;
    
    const updatedMethods = enabled
      ? [...settings.enabledMethods, method]
      : settings.enabledMethods.filter(m => m !== method);
    
    updateSettings({ enabledMethods: updatedMethods });
  };

  const isMethodEnabled = (method: SignatureMethod): boolean => {
    return settings?.enabledMethods.includes(method) || false;
  };

  if (isLoading || !settings) {
    return (
      <ScreenContainer>
        <div className="flex items-center justify-center h-64">
          <Spinner label="Loading signature settings..." />
        </div>
      </ScreenContainer>
    );
  }

  return (
    <PermissionGate
      permissions={[Permission.SIGNATURE_CONFIG]}
      fallback={
        <MessageBar intent="error">
          <MessageBarBody>
            You don't have permission to configure signature settings
          </MessageBarBody>
        </MessageBar>
      }
    >
      <ScreenContainer>
        {/* Page header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Signature20Regular className="text-2xl text-purple-600" />
            <Title3>Digital Signature Settings</Title3>
          </div>
          <Text size={400} className="text-gray-600">
            Configure digital signature methods and authentication for your organization
          </Text>
        </div>

        {/* Error message */}
        {error && (
          <MessageBar intent="error" className="mb-4">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <ContentContainer>
          {/* Tab navigation */}
          <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value)}>
            <Tab id="methods" value="methods">
              Signature Methods
            </Tab>
            <Tab id="authentication" value="authentication">
              Authentication
            </Tab>
            <Tab id="templates" value="templates">
              Templates
            </Tab>
            <Tab id="security" value="security">
              Security
            </Tab>
          </TabList>

          <div className="mt-6">
            {/* Signature Methods Tab */}
            {activeTab === 'methods' && (
              <RowCardContainer>
                <CardContainer>
                  <CustomCardHeader
                    title="Enable Signature Methods"
                    description="Configure which signature methods are available in your organization"
                    icon={<Certificate20Regular />}
                  />
                  
                  <div className="space-y-4">
                    {/* E-Signature */}
                    <Field>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail20Regular className="text-xl text-blue-500" />
                          <div>
                            <Text weight="semibold">E-Signature</Text>
                            <Text size={300} className="block text-gray-600">
                              Email-based digital signatures with verification codes
                            </Text>
                          </div>
                        </div>
                        <Switch
                          checked={isMethodEnabled('e-signature')}
                          onChange={(_, data) => toggleSignatureMethod('e-signature', data.checked)}
                        />
                      </div>
                    </Field>

                    {/* Digital Certificate */}
                    <Field>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Certificate20Regular className="text-xl text-green-500" />
                          <div>
                            <Text weight="semibold">Digital Certificate</Text>
                            <Text size={300} className="block text-gray-600">
                              PKI-based signatures using recognized certificate authorities
                            </Text>
                          </div>
                        </div>
                        <Switch
                          checked={isMethodEnabled('digital-certificate')}
                          onChange={(_, data) => toggleSignatureMethod('digital-certificate', data.checked)}
                        />
                      </div>
                    </Field>

                    {/* DocuSign Integration */}
                    <Field>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Signature20Regular className="text-xl text-orange-500" />
                          <div>
                            <Text weight="semibold">DocuSign</Text>
                            <Text size={300} className="block text-gray-600">
                              Integration with DocuSign platform for enterprise signatures
                            </Text>
                          </div>
                        </div>
                        <Switch
                          checked={isMethodEnabled('docusign')}
                          onChange={(_, data) => toggleSignatureMethod('docusign', data.checked)}
                        />
                      </div>
                    </Field>

                    {/* Adobe Sign Integration */}
                    <Field>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Signature20Regular className="text-xl text-red-500" />
                          <div>
                            <Text weight="semibold">Adobe Sign</Text>
                            <Text size={300} className="block text-gray-600">
                              Integration with Adobe Sign for document workflows
                            </Text>
                          </div>
                        </div>
                        <Switch
                          checked={isMethodEnabled('adobe-sign')}
                          onChange={(_, data) => toggleSignatureMethod('adobe-sign', data.checked)}
                        />
                      </div>
                    </Field>
                  </div>

                  {settings.enabledMethods.length === 0 && (
                    <MessageBar intent="warning" className="mt-4">
                      <MessageBarBody>
                        <div className="flex items-center gap-2">
                          <Warning20Regular />
                          At least one signature method must be enabled for document signing functionality
                        </div>
                      </MessageBarBody>
                    </MessageBar>
                  )}
                </CardContainer>
              </RowCardContainer>
            )}

            {/* Authentication Tab */}
            {activeTab === 'authentication' && (
              <RowCardContainer>
                <CardContainer>
                  <CustomCardHeader
                    title="Authentication Requirements"
                    description="Configure authentication methods required before signing"
                    icon={<Shield20Regular />}
                  />
                  
                  <div className="space-y-4">
                    <Field label="Required Authentication Methods">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Mail20Regular className="text-blue-500" />
                            <Text>Email Verification</Text>
                          </div>
                          <Switch
                            checked={settings.authenticationMethods.includes('email')}
                            onChange={(_, data) => {
                              const methods = data.checked
                                ? [...settings.authenticationMethods, 'email' as AuthenticationMethod]
                                : settings.authenticationMethods.filter(m => m !== 'email');
                              updateSettings({ authenticationMethods: methods });
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Phone20Regular className="text-green-500" />
                            <Text>SMS Verification</Text>
                          </div>
                          <Switch
                            checked={settings.authenticationMethods.includes('sms')}
                            onChange={(_, data) => {
                              const methods = data.checked
                                ? [...settings.authenticationMethods, 'sms' as AuthenticationMethod]
                                : settings.authenticationMethods.filter(m => m !== 'sms');
                              updateSettings({ authenticationMethods: methods });
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-2">
                            <Shield20Regular className="text-purple-500" />
                            <Text>Password Protection</Text>
                          </div>
                          <Switch
                            checked={settings.authenticationMethods.includes('password')}
                            onChange={(_, data) => {
                              const methods = data.checked
                                ? [...settings.authenticationMethods, 'password' as AuthenticationMethod]
                                : settings.authenticationMethods.filter(m => m !== 'password');
                              updateSettings({ authenticationMethods: methods });
                            }}
                          />
                        </div>
                      </div>
                    </Field>

                    <Field label="Session Timeout (minutes)">
                      <Input
                        type="number"
                        value={settings.sessionTimeout?.toString() || '30'}
                        onChange={(_, data) => updateSettings({ sessionTimeout: parseInt(data.value) || 30 })}
                        min={5}
                        max={120}
                      />
                    </Field>

                    <Field label="IP Restrictions">
                      <Textarea
                        placeholder="Enter allowed IP addresses or CIDR blocks, one per line (optional)"
                        value={settings.ipRestrictions?.join('\n') || ''}
                        onChange={(_, data) => {
                          const ips = data.value.split('\n').filter(ip => ip.trim());
                          updateSettings({ ipRestrictions: ips });
                        }}
                        rows={4}
                      />
                      <Text size={300} className="text-gray-600 mt-1">
                        Leave empty to allow signing from any IP address
                      </Text>
                    </Field>
                  </div>
                </CardContainer>
              </RowCardContainer>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <RowCardContainer>
                <CardContainer>
                  <CustomCardHeader
                    title="Signature Templates"
                    description="Manage reusable signature templates for common document types"
                    icon={<Signature20Regular />}
                  />
                  
                  <div className="space-y-4">
                    {templates.length === 0 ? (
                      <MessageBar intent="info">
                        <MessageBarBody>
                          No signature templates configured. Templates help streamline the signing process for frequently used document types.
                        </MessageBarBody>
                      </MessageBar>
                    ) : (
                      <div className="space-y-3">
                        {templates.map((template) => (
                          <div key={template.id} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <Text weight="semibold">{template.name}</Text>
                                <Text size={300} className="block text-gray-600">
                                  Method: {signatureApi.formatSignatureMethod(template.signatureMethod)}
                                </Text>
                              </div>
                              <Badge appearance="outline">
                                {template.signatureMethod}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <Button
                      appearance="secondary"
                      icon={<Signature20Regular />}
                      onClick={() => {
                        // TODO: Implement template creation dialog
                        notificationService.info('Template creation', 'Template creation dialog coming soon');
                      }}
                    >
                      Create New Template
                    </Button>
                  </div>
                </CardContainer>
              </RowCardContainer>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <RowCardContainer>
                <CardContainer>
                  <CustomCardHeader
                    title="Security & Compliance"
                    description="Configure security settings and compliance requirements"
                    icon={<Shield20Regular />}
                  />
                  
                  <div className="space-y-4">
                    <Field label="Signature Validity Period (days)">
                      <Input
                        type="number"
                        value={settings.signatureValidityDays?.toString() || '90'}
                        onChange={(_, data) => updateSettings({ signatureValidityDays: parseInt(data.value) || 90 })}
                        min={1}
                        max={3650}
                      />
                      <Text size={300} className="text-gray-600 mt-1">
                        How long signature requests remain valid before expiring
                      </Text>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold">Require Legal Agreement Acceptance</Text>
                          <Text size={300} className="text-gray-600">
                            Signers must accept terms and conditions before signing
                          </Text>
                        </div>
                        <Switch
                          checked={settings.requireLegalAgreement || false}
                          onChange={(_, data) => updateSettings({ requireLegalAgreement: data.checked })}
                        />
                      </div>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold">Enable Audit Trail</Text>
                          <Text size={300} className="text-gray-600">
                            Track all signature activities for compliance
                          </Text>
                        </div>
                        <Switch
                          checked={settings.enableAuditTrail !== false}
                          onChange={(_, data) => updateSettings({ enableAuditTrail: data.checked })}
                        />
                      </div>
                    </Field>

                    <Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <Text weight="semibold">Require Identity Verification</Text>
                          <Text size={300} className="text-gray-600">
                            Additional identity verification for sensitive documents
                          </Text>
                        </div>
                        <Switch
                          checked={settings.requireIdentityVerification || false}
                          onChange={(_, data) => updateSettings({ requireIdentityVerification: data.checked })}
                        />
                      </div>
                    </Field>

                    <MessageBar intent="info">
                      <MessageBarBody>
                        <div className="flex items-center gap-2">
                          <Info20Regular />
                          Security settings ensure compliance with electronic signature regulations and organizational policies.
                        </div>
                      </MessageBarBody>
                    </MessageBar>
                  </div>
                </CardContainer>
              </RowCardContainer>
            )}
          </div>
        </ContentContainer>

        {/* Save buttons */}
        <div className="flex justify-end gap-3 mt-8 px-6">
          <Button
            appearance="secondary"
            onClick={() => navigate('/settings')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            icon={<Save20Regular />}
            onClick={handleSaveSettings}
            disabled={isSaving || settings.enabledMethods.length === 0}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </ScreenContainer>
    </PermissionGate>
  );
};

export default SignatureSettings;
