// loading spinner design for the refresh sensor data button

import { useState } from 'react';
import Button from 'react-bootstrap/Button';

type LoadingButtonProps = {
  onClick: () => Promise<void>; 
};

function LoadingButton({ onClick }: LoadingButtonProps) {
  const [isLoading, setLoading] = useState(false);

  const handleClick = async () => {
    // return if the button is already in the process of loading
    if (isLoading) {
        return;
    }
    setLoading(true);
    try {
        //this will wait for fetchData to retrieve the latest json (home.tsx)
        await onClick();
    } finally {
        setLoading(false);
    }
  };

  return (
    <Button variant="outline-primary" disabled={isLoading} onClick={handleClick}>
      {isLoading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
          Loading…
        </>
      ) : (
        'Refresh latest data'
      )}
    </Button>
  );
}

export default LoadingButton;
