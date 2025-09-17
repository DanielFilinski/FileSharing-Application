import React, { useState } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Text,
  Badge,
  Divider,
} from '@fluentui/react-components';
import {
  AddRegular,
  SearchRegular,
} from '@fluentui/react-icons';
import { Client } from '../ui/FirmSide2Page';

const useStyles = makeStyles({
  leftSidebar: {
    width: '300px',
    background: tokens.colorNeutralBackground1,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: tokens.colorNeutralForeground1,
  },
  addClientBtn: {
    width: '100%',
    backgroundColor: tokens.colorBrandForeground1,
    color: tokens.colorBrandBackground,
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: tokens.colorBrandForeground2,
    },
  },
  clientSearch: {
    padding: '16px 20px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: '6px',
    backgroundColor: tokens.colorNeutralBackground3,
  },
  clientList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  clientItem: {
    padding: '12px 20px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeft: `3px solid transparent`,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  clientItemActive: {
    backgroundColor: tokens.colorBrandBackground2,
    borderLeftColor: tokens.colorBrandForeground1,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '2px',
    color: tokens.colorNeutralForeground1,
  },
  clientType: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
  },
  clientStatus: {
    marginLeft: '8px',
    backgroundColor: tokens.colorPaletteRedBackground3,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '600',
  },
});

interface ClientSidebarProps {
  clients: Client[];
  selectedClient: Client;
  onClientSelect: (client: Client) => void;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  clients,
  selectedClient,
  onClientSelect,
}) => {
  const styles = useStyles();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddClient = () => {
    const clientName = prompt('Enter client name:');
    if (clientName) {
      const clientType = prompt('Enter client type:');
      // Здесь можно добавить логику для создания нового клиента
      console.log('Adding new client:', clientName, clientType);
    }
  };

  return (
    <aside className={styles.leftSidebar}>
      <div className={styles.sidebarHeader}>
        <Text className={styles.sidebarTitle}>Client Directory</Text>
        <button 
          className={styles.addClientBtn}
          onClick={handleAddClient}
        >
          + Add New Client
        </button>
      </div>
      <div className={styles.clientSearch}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search clients..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      <div className={styles.clientList}>
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className={`${styles.clientItem} ${
              selectedClient.id === client.id ? styles.clientItemActive : ''
            }`}
            onClick={() => onClientSelect(client)}
          >
            <div className={styles.clientInfo}>
              <Text className={styles.clientName}>{client.name}</Text>
              <Text className={styles.clientType}>{client.type}</Text>
            </div>
            {client.notifications && (
              <div className={styles.clientStatus}>
                {client.notifications}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}; 