import React from 'react';
import { 
  Body1, 
  Radio, 
  Subtitle2, 
  makeStyles, 
  tokens,
  shorthands
} from "@fluentui/react-components";

type SelectedSectionProps = {
    title: string;
    value: string;
    description: string;
    isSelected: boolean;
}

export const SelectedSection = ({ title, value, description, isSelected }: SelectedSectionProps) => { 
    const styles = useStyles();
    
    return (
        <div className={`${styles.container} ${isSelected ? styles.selected : ''}`}>            
            <Radio 
              value={value} 
              checked={isSelected}
              className={styles.radio}
            />
            <div className={styles.textContainer}>
                <Subtitle2 className={styles.title}>{title}</Subtitle2>
                <Body1 className={styles.description}>{description}</Body1>
            </div>     
        </div>
    )
}

// @ts-ignore
const useStyles = makeStyles({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    ...shorthands.gap('12px'),
    ...shorthands.padding('16px'),
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: tokens.borderRadiusMedium,
    border: `2px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
    
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      // @ts-ignore
      borderColor: tokens.colorNeutralStroke1Hover
    },
    
    '@media (max-width: 549px)': {
      ...shorthands.padding('12px'),
      ...shorthands.gap('8px')
    }
  },

  selected: {
    // @ts-ignore
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
    
    '&:hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
      // @ts-ignore
      borderColor: tokens.colorBrandStroke1
    }
  },

  radio: {
    marginTop: '2px',
    flexShrink: 0
  },

  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('4px'),
    flex: 1,
    minWidth: 0,
    wordWrap: 'break-word'
  },

  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase300,
    
    '@media (min-resolution: 2dppx)': {
      fontSize: tokens.fontSizeBase300
    }
  },

  description: {
    color: tokens.colorNeutralForeground2,
    lineHeight: tokens.lineHeightBase300,
    
    '@media (max-width: 549px)': {
      fontSize: tokens.fontSizeBase200
    },
    
    '@media (min-resolution: 2dppx)': {
      fontSize: tokens.fontSizeBase300
    }
  }
});

export default SelectedSection;