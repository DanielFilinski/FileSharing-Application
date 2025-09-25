import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  Title3,
  Button,
  Body1,
  Caption1,
  Badge,
  Spinner,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  HardDrive24Regular,
  Desktop24Regular,
  Cloud24Regular,
  DatabaseSearch24Regular,
  CheckmarkCircle24Filled,
  Warning24Filled,
  Dismiss24Filled,
} from '@fluentui/react-icons';
import { apiClient } from '@/shared/api';
import { notificationService } from '@/shared/lib/notifications';

interface NetworkDevice {
  id: string;
  name: string;
  ipAddress: string;
  type: 'nas' | 'server' | 'shared_drive' | 'cloud_storage';
  availableSpace: number;
  totalSpace: number;
  status: 'online' | 'offline' | 'limited';
  accessType: 'smb' | 'ftp' | 'nfs' | 'http' | 'cloud_api';
  lastSeen: string;
  manufacturer?: string;
  model?: string;
}

interface NetworkDeviceSelectorProps {
  selectedDeviceId?: string;
  onDeviceSelect: (device: NetworkDevice) => void;
  isVisible: boolean;
}

const useStyles = makeStyles({
  scanSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: tokens.spacingVerticalL,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  scanContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  devicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalM,
  },
  deviceCard: {
    padding: tokens.spacingVerticalL,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      border: `1px solid ${tokens.colorBrandStroke1}`,
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  deviceCardSelected: {
    border: `1px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2,
  },
  deviceHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalM,
  },
  deviceInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  storageInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusSmall,
  },
  statusBadge: {
    marginLeft: 'auto',
  },
  emptyState: {
    textAlign: 'center',
    padding: tokens.spacingVerticalXXL,
    color: tokens.colorNeutralForeground2,
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalXXL,
  },
});

export const NetworkDeviceSelector: React.FC<NetworkDeviceSelectorProps> = ({
  selectedDeviceId,
  onDeviceSelect,
  isVisible,
}) => {
  const styles = useStyles();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  // Scan for network devices
  const handleScanDevices = async () => {
    setIsScanning(true);
    try {
      const response = await apiClient.get('/scanNetworkDevices');
      
      if (response.data.success) {
        setDevices(response.data.devices);
        setLastScanTime(response.data.scanTime);
        notificationService.success(
          'Scan Complete', 
          `Found ${response.data.totalFound} network storage devices`
        );
      } else {
        throw new Error('Scan failed');
      }
    } catch (error: any) {
      console.error('Network scan failed:', error);
      notificationService.error(
        'Scan Failed', 
        error.response?.data?.error || 'Unable to scan network devices'
      );
      setDevices([]);
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-scan on component mount
  useEffect(() => {
    if (isVisible && devices.length === 0) {
      handleScanDevices();
    }
  }, [isVisible]);

  // Get device type icon
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'nas':
        return <HardDrive24Regular />;
      case 'server':
        return <Desktop24Regular />;
      case 'cloud_storage':
        return <Cloud24Regular />;
      default:
        return <HardDrive24Regular />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return (
          <Badge 
            appearance="filled" 
            color="success"
            icon={<CheckmarkCircle24Filled />}
          >
            Online
          </Badge>
        );
      case 'limited':
        return (
          <Badge 
            appearance="filled" 
            color="warning"
            icon={<Warning24Filled />}
          >
            Limited
          </Badge>
        );
      case 'offline':
        return (
          <Badge 
            appearance="filled" 
            color="danger"
            icon={<Dismiss24Filled />}
          >
            Offline
          </Badge>
        );
      default:
        return null;
    }
  };

  // Format storage size
  const formatStorageSize = (sizeGB: number) => {
    if (sizeGB >= 1024) {
      return `${(sizeGB / 1024).toFixed(1)} TB`;
    }
    return `${sizeGB} GB`;
  };

  // Calculate usage percentage
  const getUsagePercentage = (available: number, total: number) => {
    return Math.round(((total - available) / total) * 100);
  };

  if (!isVisible) return null;

  return (
    <Card>
      <CardHeader>
        <Title3>Network Device Selection</Title3>
      </CardHeader>

      {/* Scan Section */}
      <div className={styles.scanSection}>
        <div className={styles.scanContent}>
          <DatabaseSearch24Regular style={{ color: tokens.colorBrandForeground1 }} />
          <div>
            <Body1>Network Storage Devices</Body1>
            <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
              {lastScanTime ? 
                `Last scanned: ${new Date(lastScanTime).toLocaleString()}` : 
                'No recent scan performed'
              }
            </Caption1>
          </div>
        </div>
        
        <Button
          appearance="primary"
          icon={isScanning ? <Spinner size="tiny" /> : <DatabaseSearch24Regular />}
          onClick={handleScanDevices}
          disabled={isScanning}
          style={{ backgroundColor: tokens.colorBrandBackground }}
        >
          {isScanning ? 'Scanning...' : 'Scan Network'}
        </Button>
      </div>

      {/* Devices List */}
      {isScanning ? (
        <div className={styles.loadingState}>
          <Spinner size="large" />
          <Body1>Scanning network for storage devices...</Body1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
            This may take a few moments
          </Caption1>
        </div>
      ) : devices.length === 0 ? (
        <div className={styles.emptyState}>
          <Body1>No network storage devices found</Body1>
          <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
            Click "Scan Network" to search for available devices
          </Caption1>
        </div>
      ) : (
        <div className={styles.devicesGrid}>
          {devices.map((device) => (
            <div
              key={device.id}
              className={`${styles.deviceCard} ${
                selectedDeviceId === device.id ? styles.deviceCardSelected : ''
              }`}
              onClick={() => onDeviceSelect(device)}
            >
              <div className={styles.deviceHeader}>
                {getDeviceIcon(device.type)}
                <div style={{ flex: 1 }}>
                  <Body1 style={{ fontWeight: tokens.fontWeightMedium }}>
                    {device.name}
                  </Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    {device.ipAddress}
                  </Caption1>
                </div>
                <div className={styles.statusBadge}>
                  {getStatusBadge(device.status)}
                </div>
              </div>

              <div className={styles.deviceInfo}>
                {device.manufacturer && (
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    {device.manufacturer} {device.model}
                  </Caption1>
                )}
                
                <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                  Access: {device.accessType.toUpperCase()}
                </Caption1>
              </div>

              <div className={styles.storageInfo}>
                <div>
                  <Body1 style={{ 
                    color: tokens.colorPaletteGreenForeground2,
                    fontWeight: tokens.fontWeightMedium 
                  }}>
                    {formatStorageSize(device.availableSpace)} free
                  </Body1>
                  <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                    of {formatStorageSize(device.totalSpace)} total
                  </Caption1>
                </div>
                <Caption1 style={{ color: tokens.colorNeutralForeground2 }}>
                  {getUsagePercentage(device.availableSpace, device.totalSpace)}% used
                </Caption1>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
