import React from 'react';
import { 
  Drawer, 
  DrawerHeader, 
  DrawerHeaderTitle, 
  DrawerBody, 
  Badge, 
  Divider, 
  Title2, 
  Body2, 
  Subtitle2 
} from '@fluentui/react-components';
import { Person20Regular, Mail20Regular } from '@fluentui/react-icons';
import { Document } from '../ui/BaseDocumentsPage';
import { DocumentChat } from './DocumentChat';

// Функция для получения цвета статуса
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'pending validation':
      return 'warning';
    case 'validation in process':
      return 'informative';
    case 'pending review':
      return 'danger';
    case 'Locked':
      return 'subtle';
    case 'Access Closed':
      return 'subtle';
    default:
      return 'brand';
  }
};

interface DocumentDetailsDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDoc: Document | null;
  onClose: () => void;
}

export const DocumentDetailsDrawer: React.FC<DocumentDetailsDrawerProps> = ({
  isOpen,
  onOpenChange,
  selectedDoc,
  onClose
}) => {
  return (
    <Drawer
      open={isOpen}
      position="end"
      size="medium"
      modalType="non-modal"
      onOpenChange={(_, data) => {
        onOpenChange(data.open);
      }}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }} aria-label="Close">✕</button>
          }
        >
         <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Title2>{selectedDoc?.name}</Title2>
            <Badge appearance="filled" color={getStatusColor(selectedDoc?.status || '')}>
              {selectedDoc?.status}
            </Badge>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24 }}>            
          <Divider />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <Subtitle2>Created:</Subtitle2>
              <Body2 style={{ marginLeft: 8 }}>{selectedDoc?.modified}</Body2>
            </div>
            <div>
              <Subtitle2>Created by:</Subtitle2>
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Person20Regular /> <Body2>{selectedDoc?.createdBy}</Body2>
              </span>
            </div>
            <div>
              <Subtitle2>Last edited by:</Subtitle2>
              <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Person20Regular /> <Body2>{selectedDoc?.modifiedBy}</Body2>
              </span>
            </div>
            {selectedDoc?.clientEmail && (
              <div>
                <Subtitle2>Client Email:</Subtitle2>
                <span style={{ marginLeft: 8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Mail20Regular /> <Body2>{selectedDoc.clientEmail}</Body2>
                </span>
              </div>
            )}
            {selectedDoc?.documentType && (
              <div>
                <Subtitle2>Document Type:</Subtitle2>
                <Body2 style={{ marginLeft: 8 }}>{selectedDoc.documentType}</Body2>
              </div>
            )}
            {selectedDoc?.documentSubtype && (
              <div>
                <Subtitle2>Document Subtype:</Subtitle2>
                <Body2 style={{ marginLeft: 8 }}>{selectedDoc.documentSubtype}</Body2>
              </div>
            )}
            {selectedDoc?.period && (
              <div>
                <Subtitle2>Period:</Subtitle2>
                <Body2 style={{ marginLeft: 8 }}>{selectedDoc.period}</Body2>
              </div>
            )}
            {selectedDoc?.startDate && selectedDoc?.endDate && (
              <div>
                <Subtitle2>Date Range:</Subtitle2>
                <Body2 style={{ marginLeft: 8 }}>{selectedDoc.startDate} - {selectedDoc.endDate}</Body2>
              </div>
            )}
            {selectedDoc?.description && (
              <div>
                <Subtitle2>Description:</Subtitle2>
                <Body2 style={{ marginLeft: 8 }}>{selectedDoc.description}</Body2>
              </div>
            )}
            <div>
              <Subtitle2>Approved by:</Subtitle2>
              <span style={{ marginLeft: 8, color: '#888' }}><Body2>—</Body2></span>
            </div>
          </div>
          <Divider />
          <DocumentChat documentName={selectedDoc?.name} />
        </div>
      </DrawerBody>
    </Drawer>
  );
}; 