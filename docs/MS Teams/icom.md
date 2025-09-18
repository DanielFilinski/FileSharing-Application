// Размеры иконок
const iconSizes = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48
};

// Использование
<AddIcon size={iconSizes.medium} />

// Цвета иконок
const iconColors = {
  primary: '#464775',
  secondary: '#6264A7',
  success: '#107C10',
  warning: '#FFB900',
  error: '#A4262C',
  info: '#0078D4'
};

// Использование
<AddIcon color={iconColors.primary} />

// Анимация иконок
const iconAnimation = {
  spin: 'spin 1s linear infinite',
  pulse: 'pulse 1s ease-in-out infinite',
  bounce: 'bounce 1s ease-in-out infinite'
};

// Использование
<AddIcon style={{ animation: iconAnimation.spin }} />

// Кастомизация иконок
const CustomIcon = styled(AddIcon)`
  &:hover {
    color: ${iconColors.primary};
    transform: scale(1.1);
    transition: all 0.2s ease-in-out;
  }
`;

// Использование
<CustomIcon />