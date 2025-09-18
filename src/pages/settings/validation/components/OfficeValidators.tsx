import { Subtitle1, Caption1, Badge, Button } from '@fluentui/react-components';
import { BuildingIcon, AddIcon, DismissIcon } from '../icons';
import { tokens } from '@fluentui/react-components';
import { Office, OfficeValidators as OfficeValidatorsType } from '../types';
import styled from 'styled-components';
import { CardContainer, RowSpaceBetween, RowCardItemContainer } from '@/app/styles/layouts';
import { CardHeader } from '@/components/card/card-header';

interface OfficeValidatorsProps {
  offices: Office[];
  officeValidators: OfficeValidatorsType;
  onAddClick: (officeId: string) => void;
  onRemoveEmployee: (empId: string, officeId: string) => void;
}



export const OfficeValidators = ({
  offices,
  officeValidators,
  onAddClick,
  onRemoveEmployee,
}: OfficeValidatorsProps) => {
  return (
    <CardContainer>
      <CardHeader 
        text="Office-Specific Validators"
        subtitle="Assign validators to specific office locations"
        icon={<BuildingIcon />}
      />
      
      
      <RowCardItemContainer>
        {offices.map(office => (
          <OfficeCard key={office.id}>
            <RowSpaceBetween>
              <OfficeTitle>
                <BuildingIcon/>
                <Subtitle1>{office.name}</Subtitle1>
              </OfficeTitle>
              <Button
                appearance="subtle"
                icon={<AddIcon />}
                onClick={() => onAddClick(office.id)}
              >
                Add
              </Button>
            </RowSpaceBetween>

            <SelectedEmployees>
              {officeValidators[office.id]?.length > 0 ? (
                officeValidators[office.id].map(validator => (
                  <Badge 
                    key={validator.id} 
                    color="brand"
                    onClick={() => onAddClick(office.id)}
                  >
                    {validator.avatar} {validator.name}
                    <RemoveButton                                
                      size="small"
                      icon={<DismissIcon />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onRemoveEmployee(validator.id, office.id);
                      }}
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </Badge>
                ))
              ) : (
                <Caption1>No validators assigned</Caption1>
              )}
            </SelectedEmployees>
          </OfficeCard>
        ))}
      </RowCardItemContainer>
    </CardContainer>
  );
}; 


const OfficeCard = styled.div`
  border: 1px solid ${tokens.colorNeutralStroke2};
  border-radius: ${tokens.borderRadiusMedium};
  padding: ${tokens.spacingVerticalM};
`;

const OfficeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalS};
`;

const SelectedEmployees = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingHorizontalS};
`;

const RemoveButton = styled(Button)`
  padding: 0px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  background-color: transparent;
  z-index: 1000;
  &:hover {
    color: white;
    background-color: transparent !important;
  }
`;