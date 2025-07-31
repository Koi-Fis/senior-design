// src/loadingButton.tsx
import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // Add this line

/**
 * Props for LoadingButton component
 */
export interface LoadingButtonProps {
  onClick: () => Promise<void>;
  label?: string;
  disabled?: boolean;
}

/**
 * A button that triggers an async action and shows a spinner while loading
 */
const LoadingButton: React.FC<LoadingButtonProps> = ({ onClick, label = 'Refresh latest data', disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    try {
      await onClick();
    } catch (err) {
      console.error('LoadingButton action failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline-primary"
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Loading…
        </>
      ) : (
        label
      )}
    </Button>
  );
};

export default LoadingButton;
