import { useState, useEffect } from 'react';
import { loadPrivIdModule } from '@privateid/cryptonets-web-sdk';

const useWasm = () => {
  // Initialize the state
  const [ready, setReady] = useState(false);

  const init = async () => {
    await loadPrivIdModule();
    setReady(true);
  };

  useEffect(() => {
    init();
  }, []);

  return { ready };
};

export default useWasm;
