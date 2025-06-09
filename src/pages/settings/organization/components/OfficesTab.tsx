import React, { useState } from 'react';
import styled from 'styled-components';
import {
  Button,
  Text,
  Card,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  useId,
  tokens
} from '@fluentui/react-components';
import {
  Building24Regular,
  Add24Regular,
} from '@fluentui/react-icons';
import OfficeItem from './OfficeItem';
import EmptyOfficesState from './EmptyOfficesState';
import AddOfficeForm from './AddOfficeForm';
import { CardContainer, RowCardItemContainer } from '@/app/styles/layouts';
import { CardHeader } from '@/components/card/card-header';

interface Office {
  name: string;
  address: string;
}



const OfficesTab: React.FC = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [showAddOffice, setShowAddOffice] = useState(false);
  
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const handleAddOffice = (name: string, address: string) => {
    setOffices([...offices, { name, address }]);
    setShowAddOffice(false);
    
    dispatchToast(
      <Toast>
        <ToastTitle>Office Added</ToastTitle>
        <ToastBody>Office "{name}" has been successfully added.</ToastBody>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleRemoveOffice = (index: number) => {
    const officeName = offices[index].name;
    const updatedOffices = [...offices];
    updatedOffices.splice(index, 1);
    setOffices(updatedOffices);
    
    dispatchToast(
      <Toast>
        <ToastTitle>Office Removed</ToastTitle>
        <ToastBody>Office "{officeName}" has been removed.</ToastBody>
      </Toast>,
      { intent: "warning" }
    );
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      
      <CardContainer>   
        <RowCardItemContainer >
          <OfficesHeader>
            <CardHeader
              text="Offices"
              icon={<Building24Regular />}
            />

            <Button
              appearance="outline"
              icon={<Add24Regular />}
              onClick={() => setShowAddOffice(true)}
            >
              Add Office
            </Button>
          </OfficesHeader>

          <OfficesList>
            {offices.length > 0 ? (
              offices.map((office, index) => (
                <OfficeItem
                  key={index}
                  name={office.name}
                  address={office.address}
                  onRemove={() => handleRemoveOffice(index)}
                />
              ))
            ) : (
              <EmptyOfficesState />
            )}
          </OfficesList>

          {showAddOffice && (
            <AddOfficeForm
              onAdd={handleAddOffice}
              onCancel={() => setShowAddOffice(false)}
            />
          )}         
        </RowCardItemContainer>
    </CardContainer>
    </>
  );
};

export default OfficesTab; 


const OfficesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
`;

const OfficesList = styled.div`
  display: flex;
  flex-direction: column;  
`;