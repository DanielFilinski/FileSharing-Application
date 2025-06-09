import React, { useState } from 'react';
import { Card, Dropdown, Option, Text, Subtitle2, Checkbox, Avatar, Badge } from '@fluentui/react-components';
import { Building20Regular, BuildingRegular, ChevronDownRegular } from '@fluentui/react-icons';
import { useStyles } from '../styles';
import { CardHeader } from './CardHeader';

interface EmployeeSelectionCardProps {
  offices: string[];
  employeesByOffice: Record<string, string[]>;
  selectedOffices: string[];
  employeesBySelectedOffice: Record<string, string[]>;
  onOfficeToggle: (office: string) => void;
  onEmployeeToggle: (office: string, employee: string) => void;
}

export const EmployeeSelectionCard: React.FC<EmployeeSelectionCardProps> = ({
  offices,
  employeesByOffice,
  selectedOffices,
  employeesBySelectedOffice,
  onOfficeToggle,
  onEmployeeToggle,
}) => {
  const styles = useStyles();
  const [expandedOffice, setExpandedOffice] = useState<string | null>(null);

  return (
    <Card className={styles.card}>
      <div className={styles.cardContent}>
        <CardHeader
          icon={<Building20Regular />}
          title="Employee Selection"
          description="Select employees based on offices for approval"
        />
        
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
                onClick={() => onOfficeToggle(office)}
              >
                <div className={styles.optionContent}>
                  <Text>{office}</Text>
                </div>
              </Option>
            ))}
          </Dropdown>
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
                        onClick={() => onEmployeeToggle(office, employee)}
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
  );
}; 