import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
  container: {
    width: '100%',
    margin: '0 auto',
    '@media (max-width: 767px)': {
      padding: tokens.spacingVerticalM,
    }
  },
  
  headerDivider: {
    marginBottom: tokens.spacingVerticalL,
    '@media (max-width: 767px)': {
      marginBottom: tokens.spacingVerticalM
    }
  },
  
  content: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '1000px',
    margin: '0 auto',
    gap: tokens.spacingVerticalM,
    '@media (max-width: 767px)': {
      gap: tokens.spacingVerticalS
    }
  },
  
  card: {
    width: '100%',
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow4,
    '@media (max-width: 767px)': {
      borderRadius: tokens.borderRadiusSmall
    }
  },
  
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalL,
    '@media (max-width: 767px)': {
      padding: tokens.spacingVerticalM
    }
  },
  
  iconTextContainer: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM,
    '@media (max-width: 767px)': {
      gap: tokens.spacingHorizontalS
    }
  },
  
  iconContainer: {
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '16px'
  },
  
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    flex: 1,
    minWidth: 0
  },
  
  dropdownContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  
  dropdown: {
    width: '100%',
    minWidth: '200px'
  },
  
  optionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    width: '100%'
  },
  
  selectedItems: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS
  },
  
  badge: {
    fontSize: tokens.fontSizeBase200
  },
  
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    width: '100%'
  },
  
  radioOption: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `2px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      border: `2px solid ${tokens.colorNeutralStroke1Hover}`
    },
    
    '@media (max-width: 767px)': {
      padding: tokens.spacingVerticalS
    }
  },
  
  radioOptionSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    border: `2px solid ${tokens.colorBrandStroke1}`,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2,
      border: `2px solid ${tokens.colorBrandStroke1}`
    }
  },
  
  sequentialSection: {
    marginTop: tokens.spacingVerticalM,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  
  sequentialTitle: {
    color: tokens.colorBrandForeground1,
    marginBottom: tokens.spacingVerticalM
  },
  
  sequentialList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalS
  },
  
  sequentialItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  
  sequentialNumber: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: tokens.colorBrandBackground,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    flexShrink: 0
  },
  
  hint: {
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  },
  
  employeeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginTop: tokens.spacingVerticalXXS
  },
  
  employeeCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2
  },
  
  employeeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    cursor: 'pointer',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover
    },
    
    '@media (max-width: 767px)': {
      padding: tokens.spacingVerticalS
    }
  },
  
  employeeHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM
  },
  
  employeeIcon: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground2
  },
  
  chevron: {
    fontSize: '16px',
    color: tokens.colorNeutralForeground3,
    transition: 'transform 0.2s ease'
  },
  
  chevronExpanded: {
    transform: 'rotate(180deg)'
  },
  
  employeeList: {
    padding: `0 ${tokens.spacingHorizontalM} ${tokens.spacingVerticalM}`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingHorizontalS,
    
    '@media (max-width: 767px)': {
      padding: `0 ${tokens.spacingHorizontalS} ${tokens.spacingVerticalS}`
    }
  },
  
  employeeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: `${tokens.spacingVerticalS} 0`,
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusSmall,
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground3
    },
    
    '@media (max-width: 767px)': {
      gap: tokens.spacingHorizontalS,
      padding: `${tokens.spacingVerticalXXS} 0`
    }
  },
  
  employeeAvatar: {
    flexShrink: 0
  }
}); 