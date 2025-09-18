import React from 'react';
import { 
  makeStyles, 
  tokens, 
  Text,
  Card,
  CardHeader,
  CardPreview,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
  Input,
  SearchBox,
  TabList,
  Tab,
  TabValue,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Caption1,
  Subtitle2,
  Title3,
  Divider,
  Body1
} from '@fluentui/react-components';
import { 
  PeopleRegular, 
  AddRegular, 
  FilterRegular, 
  MoreHorizontalRegular,
  MailRegular,
  CallRegular,
  BuildingRegular,
  PersonRegular
} from '@fluentui/react-icons';


// Моковые данные для демонстрации
const mockLeads = [
  {
    id: 1,
    email: 'john.doe@company.com',
    phone: '+1 (555) 123-4567',
    firmName: 'Tech Solutions Inc.',
    status: 'Proposal Sent',
    contactName: 'John Doe'
  },
  {
    id: 2,
    email: 'jane.smith@enterprise.com',
    phone: '+1 (555) 987-6543',
    firmName: 'Enterprise Corp',
    status: 'Proposal Accepted',
    contactName: 'Jane Smith'
  },
  {
    id: 3,
    email: 'mike.johnson@startup.com',
    phone: '+1 (555) 456-7890',
    firmName: 'Startup Ventures',
    status: 'Proposal Denied',
    contactName: 'Mike Johnson'
  },
  {
    id: 4,
    email: 'sarah.wilson@consulting.com',
    phone: '+1 (555) 789-0123',
    firmName: 'Consulting Group',
    status: 'Proposal not Sent',
    contactName: 'Sarah Wilson'
  },
  {
    id: 5,
    email: 'alex.brown@innovate.com',
    phone: '+1 (555) 321-6540',
    firmName: 'Innovate Labs',
    status: 'Proposal Sent',
    contactName: 'Alex Brown'
  }
];

const getStatusAppearance = (status: string): 'filled' | 'outline' | 'ghost' | 'tint' => {
  switch (status) {
    case 'Proposal Sent':
      return 'filled';
    case 'Proposal Accepted':
      return 'filled';
    case 'Proposal Denied':
      return 'filled';
    case 'Proposal not Sent':
      return 'filled';
    default:
      return 'filled';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Proposal Sent':
      return tokens.colorBrandBackground;
    case 'Proposal Accepted':
      return tokens.colorPaletteGreenBackground2;
    case 'Proposal Denied':
      return tokens.colorPaletteRedBackground2;
    case 'Proposal not Sent':
      return tokens.colorPaletteDarkOrangeBackground2;
    default:
      return tokens.colorNeutralBackground3;
  }
};

export const Leads: React.FC = () => {
  const styles = useStyles();
  const [selectedTab, setSelectedTab] = React.useState<TabValue>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const stats = {
    total: mockLeads.length,
    sent: mockLeads.filter(lead => lead.status === 'Proposal Sent').length,
    accepted: mockLeads.filter(lead => lead.status === 'Proposal Accepted').length,
    denied: mockLeads.filter(lead => lead.status === 'Proposal Denied').length
  };

  return (
    <>
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        width: '100%'
      }}>
        <div style={{ maxWidth: '1400px', display: 'flex', flexDirection: 'column'}}>
          <Title3>Leads Management</Title3>
          <Body1>
            Track and manage potential clients throughout the sales pipeline
          </Body1>
        </div>
      </div>
      
      <div className={styles.container}>
        <div className={styles.header}>
        
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Leads</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.sent}</div>
            <div className={styles.statLabel}>Proposals Sent</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.accepted}</div>
            <div className={styles.statLabel}>Accepted</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.denied}</div>
            <div className={styles.statLabel}>Denied</div>
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        <Card className={styles.mainCard}>
          <CardHeader
            image={<PeopleRegular />}
            header={<Subtitle2>Leads Overview</Subtitle2>}
            action={
              <Button appearance="primary" icon={<AddRegular />}>
                Add New Lead
              </Button>
            }
          />
          
          <Divider />
          
          <div className={styles.toolbar}>
            <div className={styles.searchContainer}>
              <SearchBox 
                placeholder="Search leads..." 
                size="medium"
                style={{ minWidth: '300px' }}
              />
              <Menu>
                <MenuTrigger>
                  <Button appearance="outline" size="medium">
                    {statusFilter === 'all' ? 'All Status' : 
                     statusFilter === 'sent' ? 'Proposal Sent' :
                     statusFilter === 'accepted' ? 'Proposal Accepted' :
                     statusFilter === 'denied' ? 'Proposal Denied' :
                     statusFilter === 'not-sent' ? 'Proposal not Sent' : 'All Status'}
                  </Button>
                </MenuTrigger>
                <MenuPopover>
                  <MenuList>
                    <MenuItem onClick={() => setStatusFilter('all')}>All Status</MenuItem>
                    <MenuItem onClick={() => setStatusFilter('sent')}>Proposal Sent</MenuItem>
                    <MenuItem onClick={() => setStatusFilter('accepted')}>Proposal Accepted</MenuItem>
                    <MenuItem onClick={() => setStatusFilter('denied')}>Proposal Denied</MenuItem>
                    <MenuItem onClick={() => setStatusFilter('not-sent')}>Proposal not Sent</MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
            </div>
            
            <div className={styles.actionsContainer}>
              <Button appearance="subtle" icon={<FilterRegular />}>
                Filters
              </Button>
              <Button appearance="subtle" icon={<MoreHorizontalRegular />}>
                More
              </Button>
            </div>
          </div>

          <Table className={styles.table}>
            <TableHeader className={styles.tableHeader}>
              <TableRow>
                <TableHeaderCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PersonRegular />
                    Contact
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MailRegular />
                    Email
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CallRegular />
                    Phone
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BuildingRegular />
                    Firm Name
                  </div>
                </TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div>
                      <div style={{ fontWeight: tokens.fontWeightMedium }}>
                        {lead.contactName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.emailCell}>
                      <MailRegular />
                      {lead.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.phoneCell}>
                      <CallRegular />
                      {lead.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={styles.firmCell}>
                      <BuildingRegular />
                      {lead.firmName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      appearance={getStatusAppearance(lead.status)}
                      style={{ 
                        backgroundColor: getStatusColor(lead.status),
                        color: tokens.colorNeutralForegroundOnBrand
                      }}
                    >
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button appearance="subtle" size="small">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
    </>
  );
}; 

const useStyles = makeStyles({
  container: {
    padding: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: tokens.colorNeutralBackground1
  },
  header: {
    marginBottom: '32px'
  },
  title: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: tokens.fontSizeBase300,
    color: tokens.colorNeutralForeground2,
    marginBottom: '24px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    padding: '20px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`
  },
  statValue: {
    fontSize: tokens.fontSizeBase600,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchContainer: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flex: 1,
    minWidth: '300px'
  },
  actionsContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  mainCard: {
    padding: '24px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke1}`
  },
  table: {
    marginTop: '16px'
  },
  tableHeader: {
    backgroundColor: tokens.colorNeutralBackground3
  },
  statusBadge: {
    borderRadius: tokens.borderRadiusSmall,
    padding: '4px 8px',
    fontSize: tokens.fontSizeBase100,
    fontWeight: tokens.fontWeightMedium
  },
  emailCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  phoneCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  firmCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: tokens.colorNeutralForeground3
  }
});
