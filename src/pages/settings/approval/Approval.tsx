import React, { useState } from 'react';
import { 
  Card,
  CardHeader,
  Switch,
  Button,
  Text,
  Dropdown,
  Option,
  Checkbox,
  RadioGroup,
  Radio,
  makeStyles,
  tokens,
  Divider,
  Title2,
  Title3,
  Subtitle1,
  Body1,
  Caption1,
  Subtitle2,
  Avatar,
  Caption1Strong,
  Badge
} from '@fluentui/react-components';
import { 
  BuildingRegular,
  PeopleRegular,
  ChevronDownRegular,
  CheckmarkCircle20Regular,
  People20Regular,
  Building20Regular,
  FlashRegular
} from '@fluentui/react-icons';
import { SettingsHeader } from '@/components/SettingsHeader';

interface Employee {
  name: string;
  office: string;
  department: string;
}

function ApprovalSettingsForm() {
  const [manualApprovalNeeded, setManualApprovalNeeded] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [approvalFlow, setApprovalFlow] = useState('parallel');
  const [selectedOffices, setSelectedOffices] = useState<string[]>([]);
  const [employeesBySelectedOffice, setEmployeesBySelectedOffice] = useState<Record<string, string[]>>({});
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  const departments = ["Legal", "Finance", "HR", "IT", "Marketing", "Operations"];
  const offices = ["New York", "London", "Tokyo", "Berlin", "Sydney"];
  const employeesByOffice: Record<string, string[]> = {
    "New York": ["Alex Johnson", "Maria Garcia", "Sam Wilson"],
    "London": ["James Smith", "Emma Brown", "Olivia Davis"],
    "Tokyo": ["Takashi Yamamoto", "Yuki Tanaka", "Haruto Sato"],
    "Berlin": ["Leon Müller", "Sophie Weber", "Felix Fischer"],
    "Sydney": ["Charlotte Wilson", "Oliver Taylor", "Sophia Martin"]
  };

  const styles = useStyles();

  const toggleManualApproval = () => {
    setManualApprovalNeeded(!manualApprovalNeeded);
  };

  const toggleDepartment = (dept: string) => {
    if (selectedDepartments.includes(dept)) {
      setSelectedDepartments(selectedDepartments.filter(item => item !== dept));
    } else {
      setSelectedDepartments([...selectedDepartments, dept]);
    }
  };

  const toggleOffice = (office: string) => {
    let updatedOffices: string[];
    if (selectedOffices.includes(office)) {
      updatedOffices = selectedOffices.filter(item => item !== office);
      const updatedEmployees = {...employeesBySelectedOffice};
      delete updatedEmployees[office];
      setEmployeesBySelectedOffice(updatedEmployees);
    } else {
      updatedOffices = [...selectedOffices, office];
      setEmployeesBySelectedOffice(prev => ({
        ...prev,
        [office]: []
      }));
    }
    setSelectedOffices(updatedOffices);
  };

  const toggleEmployee = (office: string, employee: string) => {
    const currentOfficeEmployees = employeesBySelectedOffice[office] || [];
    let updatedEmployees: string[];
    
    if (currentOfficeEmployees.includes(employee)) {
      updatedEmployees = currentOfficeEmployees.filter(emp => emp !== employee);
    } else {
      updatedEmployees = [...currentOfficeEmployees, employee];
    }
    
    setEmployeesBySelectedOffice({
      ...employeesBySelectedOffice,
      [office]: updatedEmployees
    });
  };

  const handleSave = () => {
    console.log('Save clicked');
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <SettingsHeader
        title="Approval Settings"
        icon={<CheckmarkCircle20Regular />}
        buttonText="Save changes"
        onButtonClick={handleSave}
      />

      <Divider className={styles.headerDivider} />

      {/* Main Content */}
      <div className={styles.content}>
        
        {/* Manual Approval Toggle */}
        <Card className={styles.card}>
          <div className={styles.cardContent} style={{flexDirection: 'row', justifyContent: 'space-between'}}>
            <div className={styles.iconTextContainer}>
              <div className={styles.iconContainer}>
                <CheckmarkCircle20Regular />
              </div>
              <div className={styles.textContainer}>
                <Subtitle1>Manual Approval Needed</Subtitle1>
                <Body1>Enable this to require manual approval for documents</Body1>
              </div>
            </div>
            <Switch 
              checked={manualApprovalNeeded} 
              onChange={toggleManualApproval}
              aria-label="Toggle manual approval"
            />
          </div>
        </Card>

        {manualApprovalNeeded && (
          <>
            {/* Department Selection */}
            <Card className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.iconTextContainer}>
                  <div className={styles.iconContainer}>
                    <People20Regular />
                  </div>
                  <div className={styles.textContainer}>
                    <Subtitle1>Department Selection</Subtitle1>
                    <Body1>Choose which departments need to approve documents</Body1>
                  </div>
                </div>
                
                <div className={styles.dropdownContainer}>
                  <Dropdown
                    className={styles.dropdown}
                    placeholder="Select departments"
                    multiselect
                    value={selectedDepartments.join(', ')}
                    aria-label="Select departments for approval"
                  >
                    {departments.map((dept) => (
                      <Option
                        key={dept}
                        text={dept}
                        onClick={() => toggleDepartment(dept)}
                      >
                        <div className={styles.optionContent}>
                          {/* <Checkbox 
                            checked={selectedDepartments.includes(dept)}
                            readOnly
                          /> */}
                          <Text>{dept}</Text>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                  
                  {/* {selectedDepartments.length > 0 && (
                    <div className={styles.selectedItems}>
                      {selectedDepartments.map((dept) => (
                        <Badge 
                          key={dept}
                          appearance="filled"
                          className={styles.badge}
                        >
                          {dept}
                        </Badge>
                      ))}
                    </div>
                  )} */}
                </div>
              </div>
            </Card>

            {/* Approval Flow - only show if multiple departments */}
            {selectedDepartments.length > 1 && (
              <Card className={styles.card}>
                <div className={styles.cardContent}>
                  <div className={styles.iconTextContainer}>
                    <div className={styles.iconContainer}>
                      <FlashRegular />
                    </div>
                    <div className={styles.textContainer}>
                      <Subtitle1>Approval Flow</Subtitle1>
                      <Body1>Choose how approvals flow between departments</Body1>
                    </div>
                  </div>
                  
                  <RadioGroup
                    value={approvalFlow}
                    onChange={(_, data) => setApprovalFlow(data.value)}
                    className={styles.radioGroup}
                    aria-label="Select approval flow type"
                  >
                    <div 
                      className={`${styles.radioOption} ${approvalFlow === 'parallel' ? styles.radioOptionSelected : ''}`}
                      onClick={() => setApprovalFlow('parallel')}
                    >
                      <Radio value="parallel" />
                      <div className={styles.textContainer}>
                        <Subtitle2>Parallel</Subtitle2>
                        <Body1>All departments approve at once</Body1>
                      </div>
                    </div>
                    
                    <div 
                      className={`${styles.radioOption} ${approvalFlow === 'consecutive' ? styles.radioOptionSelected : ''}`}
                      onClick={() => setApprovalFlow('consecutive')}
                    >
                      <Radio value="consecutive" />
                      <div className={styles.textContainer}>
                        <Subtitle2>Consecutive</Subtitle2>
                        <Body1>One department approves after another</Body1>
                      </div>
                    </div>
                  </RadioGroup>
                  
                  {approvalFlow === 'consecutive' && (
                    <div className={styles.sequentialSection}>
                      <Text weight="semibold" className={styles.sequentialTitle}>
                        Sequential approval order:
                      </Text>
                      
                      <div className={styles.sequentialList}>
                        {selectedDepartments.map((dept, index) => (
                          <div key={index} className={styles.sequentialItem}>
                            <div className={styles.sequentialNumber}>
                              {index + 1}
                            </div>
                            <Text>{dept}</Text>
                          </div>
                        ))}
                      </div>
                      
                      <Caption1 className={styles.hint}>
                        💡 Drag departments to reorder
                      </Caption1>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Employee Selection */}
            <Card className={styles.card}>
              <div className={styles.cardContent}>
                <div className={styles.iconTextContainer}>
                  <div className={styles.iconContainer}>
                    <Building20Regular />
                  </div>
                  <div className={styles.textContainer}>
                    <Subtitle1>Employee Selection</Subtitle1>
                    <Body1>Select employees based on offices for approval</Body1>
                  </div>
                </div>
                
                <div className={styles.dropdownContainer}>
                  <Dropdown
                    className={styles.dropdown}
                    placeholder="Select offices"
                    multiselect
                    value={selectedOffices.join(', ')}
                    aria-label="Select offices for employee selection"
                  >
                    {offices.map((office) => (
                      <Option
                        key={office}
                        text={office}
                        onClick={() => toggleOffice(office)}
                      >
                        <div className={styles.optionContent}>
                          {/* <Checkbox 
                            checked={selectedOffices.includes(office)}
                            readOnly
                          /> */}
                          <Text>{office}</Text>
                        </div>
                      </Option>
                    ))}
                  </Dropdown>
                  
                  {/* {selectedOffices.length > 0 && (
                    <div className={styles.selectedItems}>
                      {selectedOffices.map((office) => (
                        <Badge 
                          key={office}
                          appearance="filled"
                          className={styles.badge}
                        >
                          {office}
                        </Badge>
                      ))}
                    </div>
                  )} */}
                </div>
                
                {selectedOffices.length > 0 && (
                  <div className={styles.employeeSection}>
                    {selectedOffices.map((office) => (
                      <div key={office} className={styles.employeeCard}>
                        <div 
                          className={styles.employeeHeader}
                          onClick={() => setExpandedOffice(expandedOffice === office ? null : office)}
                        >
                          <div className={styles.employeeHeaderContent}>
                            <BuildingRegular className={styles.employeeIcon} />
                            <Subtitle2>{office}</Subtitle2>
                            {(employeesBySelectedOffice[office]?.length || 0) > 0 && (
                              <Badge appearance="filled" size="small">
                                {employeesBySelectedOffice[office]?.length || 0} selected
                              </Badge>
                            )}
                          </div>
                          <ChevronDownRegular 
                            className={`${styles.chevron} ${expandedOffice === office ? styles.chevronExpanded : ''}`}
                          />
                        </div>
                        
                        {expandedOffice === office && (
                          <div className={styles.employeeList}>
                            {employeesByOffice[office].map((employee, index) => (
                              <div 
                                key={index} 
                                className={styles.employeeItem}
                                onClick={() => toggleEmployee(office, employee)}
                              >
                                <Checkbox 
                                  checked={employeesBySelectedOffice[office]?.includes(employee) || false}
                                  aria-label={`Select ${employee}`}
                                />
                                <Avatar 
                                  name={employee}
                                  size={32}
                                  className={styles.employeeAvatar}
                                />
                                <Text>{employee}</Text>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* <Divider className={styles.actionsDivider} /> */}
        
        {/* Action Buttons */}
        {/* <div className={styles.actions}>
          <Button appearance="secondary" size="medium">
            Cancel
          </Button>
          <Button appearance="primary" size="medium">
            Save Settings
          </Button>
        </div> */}
      </div>
    </div>
  );
}

const useStyles = makeStyles({
  container: {
    width: '100%',
    // maxWidth: '800px',
    margin: '0 auto',
    // padding: '24px',
    
    // Mobile responsiveness - Teams mobile requirement: 320px minimum
    '@media (max-width: 767px)': {
      padding: '16px',
      maxWidth: '100%'
    }
  },
  
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px', // Teams 4px grid system: 12px = 3 * 4px
    marginBottom: '24px', // 6 * 4px
    
    '@media (max-width: 767px)': {
      marginBottom: '16px' // 4 * 4px
    }
  },
  
  headerIcon: {
    color: tokens.colorBrandForeground1,
    fontSize: '20px'
  },
  
  headerDivider: {
    marginBottom: '24px',
    
    '@media (max-width: 767px)': {
      marginBottom: '16px'
    }
  },
  
  content: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1000px',
    margin: '0 auto',
    gap: '20px', // 5 * 4px
    
    '@media (max-width: 767px)': {
      gap: '16px' // 4 * 4px
    }
  },
  
  card: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium, // Teams standard 4px radius
    boxShadow: tokens.shadow4,
    
    '@media (max-width: 767px)': {
      borderRadius: tokens.borderRadiusSmall
    }
  },
  
  cardContent: {
    padding: tokens.spacingVerticalL, // 5 * 4px
    display: 'flex',
    flexDirection: 'column',
    gap: '16px', // 4 * 4px
    
    '@media (max-width: 767px)': {
      padding: tokens.spacingVerticalL
    }
  },
  
  iconTextContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px', // 3 * 4px
    
    '@media (max-width: 767px)': {
      gap: '8px' // 2 * 4px
    }
  },
  
  iconContainer: {
    width: '32px', // 8 * 4px
    height: '32px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '16px'
  },
  
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px', // 1 * 4px
    flex: 1,
    minWidth: 0 // Prevents text overflow
  },
  
  dropdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  dropdown: {
    width: '100%',
    minWidth: '200px'
  },
  
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%'
  },
  
  selectedItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  
  badge: {
    fontSize: tokens.fontSizeBase200
  },
  
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%'
  },
  
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '12px',
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      // @ts-ignore
      borderColor: tokens.colorNeutralStroke1Hover
    },
    
    '@media (max-width: 767px)': {
      padding: '12px'
    }
  },
  
  radioOptionSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    // @ts-ignore
    borderColor: tokens.colorBrandStroke1,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2,
      // @ts-ignore
      borderColor: tokens.colorBrandStroke1
    }
  },
  
  sequentialSection: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  
  sequentialTitle: {
    color: tokens.colorBrandForeground1,
    marginBottom: '12px'
  },
  
  sequentialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
    marginTop: '10px'
  },
  
  sequentialItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  sequentialNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0
  },
  
  hint: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  
  employeeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '4px'
  },
  
  employeeCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  
  employeeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    cursor: 'pointer',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover
    },
    
    '@media (max-width: 767px)': {
      padding: '12px'
    }
  },
  
  employeeHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  employeeIcon: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground2
  },
  
  chevron: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground3,
    transition: 'transform 0.2s ease'
  },
  
  chevronExpanded: {
    transform: 'rotate(180deg)'
  },
  
  employeeList: {
    padding: '0 16px 16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    
    '@media (max-width: 767px)': {
      padding: '0 12px 12px'
    }
  },
  
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusSmall,
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3
    },
    
    '@media (max-width: 767px)': {
      gap: '8px',
      padding: '6px 0'
    }
  },
  
  employeeAvatar: {
    flexShrink: 0
  },
  
  actionsDivider: {
    margin: '8px 0'
  },
  
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    
    '@media (max-width: 767px)': {
      flexDirection: 'column-reverse',
      gap: '8px'
    }
  }
});

export default ApprovalSettingsForm;