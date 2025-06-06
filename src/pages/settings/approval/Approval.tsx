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
  Tooltip,
  Title2,
  Title3,
  Subtitle1,
  Body1,
  Caption1,
  Subtitle2,
  Avatar,
  Caption1Strong
} from '@fluentui/react-components';
import { 
  BuildingRegular,
  PeopleRegular,
  ChevronDownRegular,
  ArrowRightRegular,
  CheckmarkCircle20Regular,
  People20Regular,
  ArrowRight20Regular,
  Building20Regular
} from '@fluentui/react-icons';
import { ContentContainer, HeaderContainer, IconTitleContainer, IconTitleHeaderContainer, RadioTitleContainer, RowItemContainer, RowSpaceBetween, ScreenContainer, TextRowsContainer } from '@/app/styles/layouts';
import AccentIcon from '@/components/accent-icon';
import { Zap, ZapIcon, ZapOff } from 'lucide-react';
import { SelectedSection } from './components/selected-section';
import { TextAccent } from '@/components/text-accent';
import { COLORS } from '@/app/theme/color-pallete';
import { TextRoundAccent } from '@/components/text-round-accent';

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
  const [isOfficesDropdownOpen, setIsOfficesDropdownOpen] = useState(false);
  const [employeesBySelectedOffice, setEmployeesBySelectedOffice] = useState<Record<string, string[]>>({});
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
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

  console.log("departments",departments);
  return (
    <ScreenContainer>

      <HeaderContainer>     
        <IconTitleHeaderContainer>
          <CheckmarkCircle20Regular style={{ color: tokens.colorBrandForeground2 }} />
          <Title3>Approval Settings</Title3>
        </IconTitleHeaderContainer>        
      </HeaderContainer>

      <Divider/>

      <ContentContainer> 

        <RowItemContainer>
          <Card style={{ width: '100%'}}>   
            <RowSpaceBetween>
              
              <IconTitleContainer>
                <AccentIcon icon={<CheckmarkCircle20Regular />}/>
                <TextRowsContainer>
                  <Subtitle1>Manual Approval Needed</Subtitle1>
                  <Body1>Enable this to require manual approval for documents</Body1>
                </TextRowsContainer>
              </IconTitleContainer>
          
              <Switch checked={manualApprovalNeeded} onChange={toggleManualApproval} />            
            </RowSpaceBetween>          
          </Card>

          {manualApprovalNeeded && (
            <>
              <Card style={{ width: '100%'}}>
                <IconTitleContainer>
                  <AccentIcon icon={<People20Regular />}/>
                  <TextRowsContainer>
                    <Subtitle1>Manual Approval Needed</Subtitle1>
                    <Body1>Enable this to require manual approval for documents</Body1>
                  </TextRowsContainer>
                </IconTitleContainer>
                
                <Dropdown
                  className={styles.dropdown}
                  placeholder="Select departments"
                  multiselect
                  value={selectedDepartments.join(', ')}
                  onOpenChange={(_, data) => setIsDepartmentDropdownOpen(data.open)}
                >
                  {departments.map((dept) => {
                    console.log("dept",dept);
                    return (
                    <Option
                      key={dept}
                      text={dept}
                      children={<Text>{dept}</Text>}
                      onClick={() => toggleDepartment(dept)}
                    />
                  )})}
                </Dropdown>

              </Card>
                
              
              
              {selectedDepartments.length > 1 && (
                <Card style={{ width: '100%'}}>
                  
                  <IconTitleContainer>
                    <AccentIcon icon={<Zap/>}/>
                    <TextRowsContainer>
                      <Subtitle1>Approval Flow</Subtitle1>
                      <Body1>Choose how approvals flow between departments</Body1>
                    </TextRowsContainer>
                  </IconTitleContainer>
                  
                  <RadioGroup
                    value={approvalFlow}
                    onChange={(_, data) => setApprovalFlow(data.value)}
                    style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px'}}
                  >     

                  <SelectedSection 
                    isSelected={approvalFlow === 'consecutive'} 
                    title="Consecutive" 
                    value="consecutive" 
                    description="One department approves after another" 
                  />
                  <SelectedSection 
                    isSelected={approvalFlow === 'parallel'} 
                    title="Parallel" 
                    value="parallel" 
                    description="All departments approve at once" 
                  />
                  </RadioGroup>
                  
                  {approvalFlow === 'consecutive' && (
                    <div className={styles.section}>
                      <TextAccent>
                        <Text size={300} weight="semibold" color="brand">
                        Sequential approval order:
                      </Text>

                      </TextAccent>
                      
                      <ol style={{display: 'flex', flexDirection: 'column', gap: '7px'}}>
                        {selectedDepartments.map((dept, index) => (
                          <li key={index}>
                            <div className={styles.sequentialApprovalItem}>
                              <Text size={200} style={{padding: '4px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: COLORS.purple3, color: tokens.colorBrandForeground1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{index + 1}</Text>
                              <Text size={200}>{dept}</Text>
                            </div>
                            
                          </li>
                        ))}
                      </ol>
                      <Caption1>
                        💡 Drag departments to reorder
                      </Caption1>
                    </div>
                  )}                  
                </Card>

              )}


              
              <Card style={{ width: '100%'}}>
                

                <IconTitleContainer>
                    <AccentIcon icon={<Building20Regular />}/>
                    <TextRowsContainer>
                      <Subtitle1>Employee Selection</Subtitle1>
                      <Body1>Select employees based on offices for approval</Body1>
                    </TextRowsContainer>
                  </IconTitleContainer>
                
                <Dropdown
                  className={styles.dropdown}
                  placeholder="Select offices"
                  multiselect
                  value={selectedOffices.join(', ')}
                  onOpenChange={(_, data) => setIsOfficesDropdownOpen(data.open)}
                >
                  {offices.map((office) => (
                    <Option
                      key={office}
                      text={office}
                      children={<Text>{office}</Text>}
                      onClick={() => toggleOffice(office)}
                    />
                  ))}
                </Dropdown>
                
                {selectedOffices.length > 0 && (
                  <div>
                    {selectedOffices.map((office) => (
                      <div key={office} className={styles.employeeCard}>
                        <div 
                          className={styles.employeeHeader}
                          onClick={() => setExpandedOffice(expandedOffice === office ? null : office)}
                        >
                          <div className={styles.toggleContent}>
                            <BuildingRegular />
                            <Subtitle2>{office}</Subtitle2>
                            {(employeesBySelectedOffice[office]?.length || 0) > 0 && (
                              <TextRoundAccent>
                                <Caption1Strong>
                                  {employeesBySelectedOffice[office]?.length || 0} selected
                                </Caption1Strong>
                              </TextRoundAccent>
                            )}
                          </div>
                          <ChevronDownRegular 
                            style={{ 
                              transform: expandedOffice === office ? 'rotate(180deg)' : 'none',
                              transition: 'transform 0.2s'
                            }} 
                          />
                        </div>
                        
                        {expandedOffice === office && (
                          <div className={styles.employeeContent}>
                            {employeesByOffice[office].map((employee, index) => (
                              <div 
                                key={index} 
                                className={styles.employeeItem}
                                onClick={() => toggleEmployee(office, employee)}
                              >
                                <Checkbox 
                                  checked={employeesBySelectedOffice[office]?.includes(employee)}
                                />
                                <div className={styles.avatar}>
                                  <Avatar initials={employee.split(' ').map(n => n[0]).join('')} />
                                </div>
                                <Text size={200}>{employee}</Text>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          <Divider/>
          
          <div className={styles.actions}>
            <Button appearance="secondary">Cancel</Button>
            <Button appearance="primary">
              Save Settings
            </Button>
          </div>

          
        </RowItemContainer> 
     </ContentContainer>
      
    </ScreenContainer>
    
  );
}

export default ApprovalSettingsForm;

const useStyles = makeStyles({
  container: {
    padding: '24px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  toggleHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  toggleContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  dropdown: {
    width: '100%',
    marginBottom: '16px'
  },
  employeeCard: {
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: '16px',
    marginBottom: '12px'
  },
  employeeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  },
  employeeContent: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`
  },
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0'
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600'
  },
  actions: {
    display: 'flex',
    alignSelf: 'flex-end',
    gap: '12px',
  },
  sequentialApprovalItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }
});