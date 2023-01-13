import { useState, useEffect } from 'react';

import { loadPrivIdModule } from '@privateid/cryptonets-web-sdk';
import {getUrlParameter} from '../utils';

const useWasm = () => {
  // Initialize the state
  const [ready, setReady] = useState(false);

  const init = async () => {
    const apiKey = getUrlParameter("api_key", null);
    const apiUrl = getUrlParameter("api_url", null);
    await loadPrivIdModule(apiUrl, apiKey);
    setReady(true);
  };

  useEffect(() => {
    init();
  }, []);

  return { ready };
};

export default useWasm;
