import { COLORS } from '@/app/theme/color-pallete';
import styled from 'styled-components';

type AccentIconProps = {
  icon: React.ReactNode;
  colorIcon?: string;
  colorBackground?: string;
  style?: React.CSSProperties;
}

const AccentIcon = ({ icon, colorIcon, colorBackground, style }: AccentIconProps) => {
  return (
    <IconWrapper 
      color={colorIcon} 
      background={colorBackground} 
      style={style}
    >
      {icon}
    </IconWrapper>
  )
}

export default AccentIcon;

interface IconWrapperProps {
  color?: string;
  background?: string;
}

const IconWrapper = styled.span<IconWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3rem;
  background: ${props => props.background || COLORS.purple3};
  border-radius: 8px;
  color: ${props => props.color || COLORS.purple2};
`;