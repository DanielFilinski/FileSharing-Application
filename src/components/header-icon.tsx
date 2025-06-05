import { COLORS } from '@/app/theme/color-pallete';
import { tokens } from '@fluentui/react-components';
import styled from 'styled-components';

type HeaderIconProps = {
  icon: React.ReactNode;
  colorIcon?: string;
  colorBackground?: string;
  style?: React.CSSProperties;
}

const HeaderIcon = ({ icon, colorIcon, colorBackground, style }: HeaderIconProps) => {
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

export default HeaderIcon;

interface IconWrapperProps {
  color?: string;
  background?: string;
}

const IconWrapper = styled.span<IconWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.color ||  tokens.colorBrandForeground2};
`;