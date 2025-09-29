/**
 * AuditPage - страница для просмотра журнала аудита
 */

import React from 'react';
import { AuditEventsViewer } from '../../components/AuditTrail';

export const AuditPage: React.FC = () => {
  return (
    <div style={{ height: '100vh', padding: '24px' }}>
      <AuditEventsViewer />
    </div>
  );
};

export default AuditPage;
