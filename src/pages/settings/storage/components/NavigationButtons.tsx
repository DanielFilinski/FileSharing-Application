import React from 'react';
import {
  Button,
  tokens,
  makeStyles,
} from '@fluentui/react-components';
import {
  ArrowLeft24Regular,
  ArrowRight24Regular,
  Save24Regular,
  Checkmark24Regular,
} from '@fluentui/react-icons';

interface NavigationButtonsProps {
  currentStep?: number;
  totalSteps?: number;
  isSetupMode?: boolean;
  canGoNext?: boolean;
  canGoBack?: boolean;
  isValid?: boolean;
  isLoading?: boolean;
  onNext?: () => void;
  onBack?: () => void;
  onSave?: () => void;
  onComplete?: () => void;
}

const useStyles = makeStyles({
  navigationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacingVerticalL} 0`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    marginTop: tokens.spacingVerticalXL,
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
  },
  progressBar: {
    width: '200px',
    height: '4px',
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colorBrandBackground,
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
});

export const NavigationButtons: React.FC<NavigationButtonsProps> = ({
  currentStep = 1,
  totalSteps = 1,
  isSetupMode = false,
  canGoNext = true,
  canGoBack = true,
  isValid = true,
  isLoading = false,
  onNext,
  onBack,
  onSave,
  onComplete,
}) => {
  const styles = useStyles();

  const progressPercentage = (currentStep / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className={styles.navigationContainer}>
      {/* Left Section - Back button and progress */}
      <div className={styles.leftSection}>
        {isSetupMode && canGoBack && currentStep > 1 && (
          <Button
            appearance="secondary"
            icon={<ArrowLeft24Regular />}
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
        )}

        {isSetupMode && totalSteps > 1 && (
          <>
            <div className={styles.stepIndicator}>
              Step {currentStep} of {totalSteps}
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Right Section - Primary action buttons */}
      <div className={styles.rightSection}>
        {isSetupMode ? (
          // Setup mode navigation
          isLastStep ? (
            <Button
              appearance="primary"
              icon={<Checkmark24Regular />}
              onClick={onComplete}
              disabled={!isValid || isLoading}
              style={{ backgroundColor: tokens.colorBrandBackground }}
            >
              Complete Setup
            </Button>
          ) : (
            <Button
              appearance="primary"
              icon={<ArrowRight24Regular />}
              onClick={onNext}
              disabled={!canGoNext || !isValid || isLoading}
              style={{ backgroundColor: tokens.colorBrandBackground }}
            >
              Next
            </Button>
          )
        ) : (
          // Regular settings mode
          <Button
            appearance="primary"
            icon={<Save24Regular />}
            onClick={onSave}
            disabled={!isValid || isLoading}
            style={{ backgroundColor: tokens.colorBrandBackground }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </div>
    </div>
  );
};
