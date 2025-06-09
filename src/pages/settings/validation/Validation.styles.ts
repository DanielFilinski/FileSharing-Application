import { styled } from "styled-components";
import { tokens } from "@fluentui/react-components";
import { ScreenContainer, ContentContainer, RowItemContainer, CardContainer } from "@/app/styles/layouts";

export const ValidationContainer = styled(ScreenContainer)``;

export const ValidationContent = styled(ContentContainer)`
  margin-top: ${tokens.spacingVerticalL};
  @media (max-width: 768px) {
    margin-top: ${tokens.spacingVerticalM};
  }
`;

export const Section = styled.div`
  margin-bottom: ${tokens.spacingVerticalL};
  @media (max-width: 768px) {
    margin-bottom: ${tokens.spacingVerticalM};
  }
`;

export const SwitchCard = styled(CardContainer)`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${tokens.spacingHorizontalL};
  @media (max-width: 768px) {
    flex-direction: column;
    gap: ${tokens.spacingVerticalM};
    align-items: stretch;
  }
`;

export const SwitchContent = styled.div`
  flex: 1;
`;

export const SwitchInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${tokens.spacingHorizontalM};
`;

export const IconWrapper = styled.div`
  background-color: ${tokens.colorBrandBackground2};
  color: ${tokens.colorBrandForeground1};
  padding: ${tokens.spacingVerticalXS};
  border-radius: ${tokens.borderRadiusSmall};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2px;
`;

export const TypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${tokens.spacingHorizontalM};
  margin-top: ${tokens.spacingVerticalM};
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const TypeButton = styled.button`
  min-height: 50px;
  justify-content: center;
  padding: ${tokens.spacingVerticalM} ${tokens.spacingHorizontalL};
`;

export const SelectedEmployees = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${tokens.spacingHorizontalS};
  margin-bottom: ${tokens.spacingVerticalM};
`;

export const EmployeeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalS};
  max-height: 300px;
  overflow-y: auto;
  padding: ${tokens.spacingVerticalS};
`;

export const EmployeeItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${tokens.spacingVerticalS} ${tokens.spacingHorizontalM};
  border-radius: ${tokens.borderRadiusMedium};
  cursor: pointer;
  transition: all 0.2s ease;
  background-color: ${props => props.selected ? tokens.colorBrandBackground2 : 'transparent'};

  &:hover {
    background-color: ${props => props.selected ? tokens.colorBrandBackground2Hover : tokens.colorNeutralBackground1Hover};
    transform: translateX(4px);
  }
`;

export const EmployeeInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalM};
  flex: 1;
`;

export const EmployeeDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${tokens.spacingVerticalXXS};
`;

export const OfficeCard = styled(CardContainer)`
  margin-bottom: ${tokens.spacingVerticalM};
  border: 1px solid ${tokens.colorNeutralStroke2};
  border-radius: ${tokens.borderRadiusMedium};
  padding: ${tokens.spacingVerticalM};
`;

export const OfficeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${tokens.spacingVerticalM};
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: ${tokens.spacingVerticalS};
  }
`;

export const OfficeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${tokens.spacingHorizontalS};
`;

export const DialogContent = styled.div`
  width: 100%;
  max-width: 500px;
  border-radius: ${tokens.borderRadiusLarge};
  box-shadow: ${tokens.shadow16};
  @media (max-width: 768px) {
    max-width: 90vw;
    margin: ${tokens.spacingVerticalM};
  }
`;

export const SearchContainer = styled.div`
  width: 100%;
  margin-bottom: ${tokens.spacingVerticalM};
  padding: 0 ${tokens.spacingHorizontalM};
`;

export const PrimaryButton = styled.button`
  background-color: ${tokens.colorBrandBackground};
  border-radius: ${tokens.borderRadiusMedium};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${tokens.colorBrandBackgroundHover};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const MessageBar = styled.div`
  padding: ${tokens.spacingHorizontalL};
  margin-bottom: ${tokens.spacingVerticalM};
`;

export const AddValidatorButton = styled.button`
  justify-content: flex-start;
`;

export const RemoveButton = styled.button`
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  color: white;
  background-color: transparent;
  z-index: 1000;

  &:hover {
    color: white;
    background-color: transparent;
  }
`; 