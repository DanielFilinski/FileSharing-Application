import { COLORS } from "@/app/theme/color-pallete";
import { Plus } from "lucide-react";
import { styled } from "styled-components";

type ButtonAccentProps = {
    text: string;
    onClick?: () => void;
    icon?: React.ReactNode;
    color?: string;
    background?: string;
    style?: React.CSSProperties;
}

export const ButtonAccent = ({ 
    text, 
    icon = <></>, 
    color = 'white', 
    background = COLORS.purple2, 
    style, 
    onClick 
}: ButtonAccentProps) => {

    return (
        <Button 
         onClick={onClick}
         color={color} 
         background={background} 
         style={style}
        >
          {icon}
          {text}
        </Button>
    ) 
}


const Button = styled.button<{ background?: string; color?: string }>`
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background-color: ${props => props.background || 'white'};
  color: ${props => props.color || '#9333ea'};
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
     background-color: #f3e8ff;
    transform: translateY(-1px);
  }
`;