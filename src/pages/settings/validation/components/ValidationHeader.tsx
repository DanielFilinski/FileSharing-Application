
import { SettingsHeader } from '../../../../components/SettingsHeader';
import { SaveIcon, ShieldIcon } from '../icons';

interface ValidationHeaderProps {
  onSave: () => void;
}

export const ValidationHeader = ({ onSave }: ValidationHeaderProps) => {
  return (
    <SettingsHeader
      title="Validation Settings"
      icon={<ShieldIcon />}
      buttonText="Save changes"
      buttonIcon={<SaveIcon />}
      onButtonClick={onSave}
    />
  );
}; 