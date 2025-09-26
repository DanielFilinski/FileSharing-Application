import React from 'react';
import {
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Button
} from '@fluentui/react-components';
import {
  PlayCircle20Regular,
  Dismiss20Regular
} from '@fluentui/react-icons';
import { useDemoMode } from '../lib/demo/DemoModeProvider';

/**
 * Баннер демо-режима - показывается когда включен демо-режим
 * TODO: УДАЛИТЬ ЭТОТ ФАЙЛ ПЕРЕД ПРОДАКШНОМ!
 */
export const DemoModeBanner: React.FC = () => {
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  if (!isDemoMode) {
    return null;
  }

  return (
    <MessageBar 
      intent="info"
      style={{
        backgroundColor: 'rgba(0, 120, 212, 0.1)',
        borderBottom: '2px solid #0078d4',
        marginBottom: '8px'
      }}
    >
      <MessageBarBody>
        <MessageBarTitle>
          <PlayCircle20Regular style={{ marginRight: '8px' }} />
          🎭 Demo Mode Active
        </MessageBarTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px' }}>
            All features are accessible for demonstration purposes. RBAC restrictions are temporarily disabled.
          </span>
          <Button
            appearance="subtle"
            size="small"
            icon={<Dismiss20Regular />}
            onClick={toggleDemoMode}
            style={{ marginLeft: 'auto' }}
          >
            Disable Demo Mode
          </Button>
        </div>
      </MessageBarBody>
    </MessageBar>
  );
};
