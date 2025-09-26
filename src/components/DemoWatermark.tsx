import React from 'react';
import { useDemoMode } from '@/shared/lib/demo';

/**
 * Водяной знак для Demo режима
 * Отображается в правом нижнем углу когда активен demo режим
 */
export const DemoWatermark: React.FC = () => {
  const { isDemoMode } = useDemoMode();

  if (!isDemoMode) return null;

  return (
    <div className="demo-watermark">
      🎭 DEMO MODE
    </div>
  );
};
