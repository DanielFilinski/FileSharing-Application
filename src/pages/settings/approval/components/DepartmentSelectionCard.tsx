import React from 'react';
import { Card, Dropdown, Option, Text } from '@fluentui/react-components';
import { People20Regular } from '@fluentui/react-icons';
import { useStyles } from '../styles';
import { CardHeader } from './CardHeader';

interface DepartmentSelectionCardProps {
  departments: string[];
  selectedDepartments: string[];
  onDepartmentToggle: (dept: string) => void;
}

export const DepartmentSelectionCard: React.FC<DepartmentSelectionCardProps> = ({
  departments,
  selectedDepartments,
  onDepartmentToggle,
}) => {
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <div className={styles.cardContent}>
        <CardHeader
          icon={<People20Regular />}
          title="Department Selection"
          description="Choose which departments need to approve documents"
        />
        
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
                onClick={() => onDepartmentToggle(dept)}
              >
                <div className={styles.optionContent}>
                  <Text>{dept}</Text>
                </div>
              </Option>
            ))}
          </Dropdown>
        </div>
      </div>
    </Card>
  );
}; 