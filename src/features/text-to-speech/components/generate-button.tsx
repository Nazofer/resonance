import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { type FC } from 'react';

interface GenerateButtonProps {
  size?: 'default' | 'sm'
  disabled?: boolean
  isSubmitting?: boolean
  onSubmit: () => void
  className?: string
}

const GenerateButton: FC<GenerateButtonProps> = ({ size, disabled, isSubmitting, onSubmit, className }) => {
  return (
    <Button onClick={onSubmit} disabled={disabled} size={size} className={className}>
      {isSubmitting ? (
        <>
          <Spinner className="size-3" />
          Generating...
        </>
      ) : 'Generate speech'}
    </Button>
  );
};

export default GenerateButton;
