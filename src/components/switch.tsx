import styled from 'styled-components';

type SwitchProps = {
    checked: boolean;
    onChange: () => void;
}

const Switch = ({ checked, onChange }: SwitchProps) => {  
    return (
      <ToggleSwitch>
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={onChange} 
          />
          <ToggleSlider />
      </ToggleSwitch>
    )
}

export default Switch;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  input:checked + span {
    background-color: #9333EA;
  }

  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const ToggleSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: .4s;
  border-radius: 24px;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;