/**
 * Signature Buttons Component
 * Displays Manual and E-Signature buttons for documents
 * ⚠️ CRITICAL: Only shows for documents with "Awaiting Signing" status
 */

import React, { useState, useEffect } from 'react';
import {
  Button,
  Text,
  MessageBar,
  MessageBarBody,
  Spinner,
  Tooltip
} from '@fluentui/react-components';
import {
  DocumentArrowUpRegular,
  ShieldCheckmarkRegular,
  WarningRegular
} from '@fluentui/react-icons';

import { ManualSignatureUpload } from './ManualSignatureUpload';
import { AdobeSignFlow } from './AdobeSignFlow';
import { signatureApi } from '@/shared/api/signatureApi';
import { DocumentStatusValidator } from '@/features/signatures/utils/documentStatusValidator';
import { SignaturePermissionChecker } from '@/features/signatures/utils/signaturePermissionChecker';
import { 
  DocumentStatus, 
  OrganizationSignatureSettingsExtended,
  DocumentSignatureRecord 
} from '@/shared/types/signature';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

interface SignatureButtonsProps {
  document: {
    id: string;
    name: string;
    status: DocumentStatus;
    signatureRequired: boolean;
    organizationId: string;
    awaitingSignatureSince?: string;
  };
  onSignatureComplete?: (signature: DocumentSignatureRecord) => void;
  className?: string;
}

export const SignatureButtons: React.FC<SignatureButtonsProps> = ({
  document,
  onSignatureComplete,
  className = ''
}) => {
  const { user } = useCurrentUser();
  const [settings, setSettings] = useState<OrganizationSignatureSettingsExtended | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdobeCredentials, setHasAdobeCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSignatureSettings();
    checkAdobeCredentials();
  }, [document.organizationId]);

  const loadSignatureSettings = async () => {
    try {
      setIsLoading(true);
      const orgSettings = await signatureApi.getOrganizationSignatureSettings();
      setSettings(orgSettings);
    } catch (err: any) {
      console.error('Failed to load signature settings:', err);
      setError('Failed to load signature settings');
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdobeCredentials = async () => {
    try {
      const status = await signatureApi.getAdobeSignCredentialsStatus();
      setHasAdobeCredentials(status.configured && status.hasValidToken);
    } catch (err) {
      console.error('Failed to check Adobe credentials:', err);
      setHasAdobeCredentials(false);
    }
  };

  // ⚠️ CRITICAL CHECK: Document status validation
  const canDocumentBeSigned = DocumentStatusValidator.canDocumentBeSigned(document.status);
  const statusInfo = DocumentStatusValidator.getStatusInfo(document.status);

  if (!document.signatureRequired) {
    return null; // Don't show buttons if signature not required
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Spinner size="tiny" />
        <Text size={300}>Loading signature options...</Text>
      </div>
    );
  }

  if (error || !settings || !user) {
    return (
      <MessageBar intent="error" className={className}>
        <MessageBarBody>
          {error || 'Unable to load signature settings'}
        </MessageBarBody>
      </MessageBar>
    );
  }

  // Get available signature methods for current user
  const availableMethods = SignaturePermissionChecker.getAvailableSignatureMethods(
    user.id,
    settings,
    hasAdobeCredentials
  );

  const manualMethod = availableMethods.find(m => m.type === 'manual');
  const adobeMethod = availableMethods.find(m => m.type === 'adobe-sign');

  // If document cannot be signed, show disabled buttons with tooltip
  if (!canDocumentBeSigned) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        <MessageBar intent="warning">
          <MessageBarBody>
            <div className="flex items-center gap-2">
              <WarningRegular />
              <div>
                <Text weight="semibold" className="block">
                  Document cannot be signed
                </Text>
                <Text size={300}>
                  Status: "{document.status}" • Required: "Awaiting Signing"
                </Text>
              </div>
            </div>
          </MessageBarBody>
        </MessageBar>

        <div className="flex gap-2">
          {manualMethod && (
            <Tooltip
              content={`Cannot sign: ${statusInfo.description}`}
              relationship="label"
            >
              <Button
                appearance="primary"
                icon={<DocumentArrowUpRegular />}
                disabled={true}
              >
                Manual Signature
              </Button>
            </Tooltip>
          )}

          {adobeMethod && (
            <Tooltip
              content={`Cannot sign: ${statusInfo.description}`}
              relationship="label"
            >
              <Button
                appearance="primary"
                icon={<ShieldCheckmarkRegular />}
                disabled={true}
              >
                E-Signature
              </Button>
            </Tooltip>
          )}
        </div>

        {statusInfo.nextActions.length > 0 && (
          <div className="mt-2">
            <Text size={200} weight="semibold" className="block mb-1">
              Next actions:
            </Text>
            <ul className="ml-4 space-y-1">
              {statusInfo.nextActions.map((action, index) => (
                <li key={index} className="text-sm text-gray-600">
                  • {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Document can be signed - show available methods
  const hasAnyAvailableMethod = availableMethods.some(m => m.available);

  if (!hasAnyAvailableMethod) {
    return (
      <MessageBar intent="info" className={className}>
        <MessageBarBody>
          <Text weight="semibold" className="block mb-1">
            No signature methods available
          </Text>
          <Text size={300}>
            You are not authorized to sign this document. Contact your administrator to be added as an authorized signer.
          </Text>
        </MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status confirmation */}
      <MessageBar intent="success">
        <MessageBarBody>
          <Text weight="semibold" className="block">
            Ready for signature
          </Text>
          <Text size={300}>
            Document status: "{document.status}" • Choose your signing method below
          </Text>
        </MessageBarBody>
      </MessageBar>

      {/* Signature method buttons */}
      <div className="flex gap-2 flex-wrap">
        {/* Manual Signature */}
        {manualMethod?.available && (
          <ManualSignatureUpload
            documentId={document.id}
            documentName={document.name}
            documentStatus={document.status}
            onSuccess={onSignatureComplete}
          />
        )}

        {/* Manual Signature - Disabled with reason */}
        {manualMethod && !manualMethod.available && (
          <Tooltip
            content={manualMethod.reason || 'Manual signature not available'}
            relationship="label"
          >
            <Button
              appearance="primary"
              icon={<DocumentArrowUpRegular />}
              disabled={true}
            >
              Manual Signature
            </Button>
          </Tooltip>
        )}

        {/* Adobe Sign E-Signature */}
        {adobeMethod?.available && (
          <AdobeSignFlow
            documentId={document.id}
            documentName={document.name}
            documentStatus={document.status}
            onSuccess={onSignatureComplete}
          />
        )}

        {/* Adobe Sign - Disabled with reason */}
        {adobeMethod && !adobeMethod.available && (
          <Tooltip
            content={adobeMethod.reason || 'E-signature not available'}
            relationship="label"
          >
            <Button
              appearance="primary"
              icon={<ShieldCheckmarkRegular />}
              disabled={true}
            >
              E-Signature
            </Button>
          </Tooltip>
        )}
      </div>

      {/* Method availability info */}
      <div className="space-y-2">
        {availableMethods.map(method => (
          !method.available && (
            <div key={method.type} className="flex items-center gap-2 text-sm text-gray-600">
              <WarningRegular fontSize={14} />
              <Text size={200}>
                {method.type === 'manual' ? 'Manual Signature' : 'E-Signature'}: {method.reason}
              </Text>
            </div>
          )
        ))}
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-gray-50 rounded border">
        <Text size={200} weight="semibold" className="block mb-2">
          Signing Methods:
        </Text>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>
            <strong>Manual Signature:</strong> Upload a pre-signed document from your computer
          </li>
          <li>
            <strong>E-Signature:</strong> Sign electronically using Adobe Sign (requires setup)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SignatureButtons;

