import { useState } from "react";

import { loadPrivIdModule } from "@privateid/cryptonets-web-sdk-alpha";
import { getUrlParameter } from "../utils";

const useWasm = () => {
  // Initialize the state
  const [ready, setReady] = useState(false);
  const [deviceSupported, setDeviceSupported] = useState({ isChecking: true });
  const init = async () => {
    console.log(process.env.REACT_APP_API_KEY, process.env.REACT_APP_API_URL);
    const apiKey = getUrlParameter("api_key", null) || process.env.REACT_APP_API_KEY;
    const apiUrl = getUrlParameter("api_url", null);
    const loadSimd = getUrlParameter("loadSimd", null);
    console.log("FORCE LOAD SIMD?", loadSimd);
    const parseBool = loadSimd !== null ? (loadSimd === "false" ? false : loadSimd === "true" ? true : null) : null;
    const isSupported = await loadPrivIdModule(apiUrl, apiKey, null, null, true, 300000, false, parseBool, JSON.stringify({ 
      "named_urls": 
      [ 
        { 
          "url_name": "collection1", 
          "url": process.env.REACT_APP_V3_PREDICT_URL1 || "https://api.develv3.cryptonets.ai/node/FACE1_1/predict" 
        },  
        { 
          "url_name": "collection2", 
          "url": process.env.REACT_APP_V3_PREDICT_URL2 || "https://api.develv3.cryptonets.ai/node/FACE1_2/predict" 
        },  
      ] }));
    if (isSupported.support) {
      setReady(true);
      setDeviceSupported({ supported: true, isChecking: false });
    } else {
      setDeviceSupported({ supported: false, isChecking: false, messege: isSupported.message });
    }
  };

  return { ready, deviceSupported, init };
};

export default useWasm;
