import { useState } from "react";

import { loadPrivIdModule } from "@privateid/ultra-web-sdk-alpha";
import { getUrlParameter } from "../utils";

const useWasm = () => {
  // Initialize the state
  const [ready, setReady] = useState(false);
  const [deviceSupported, setDeviceSupported] = useState({ isChecking: true });
  const init = async () => {
    console.log(process.env.REACT_APP_API_KEY, process.env.REACT_APP_API_URL);
    const apiKey = process.env.REACT_APP_API_KEY;
    const apiUrl = getUrlParameter("api_url", null) || process.env.REACT_APP_API_URL;
    const loadSimd = getUrlParameter("loadSimd", null);
    console.log("FORCE LOAD SIMD?", loadSimd);
    const parseBool = loadSimd !== null ? (loadSimd === "false" ? false : loadSimd === "true" ? true : null) : null;

    const apiRes = await (
      await fetch("https://api-orchestration-privateid.uberverify.com/v2/verification-session", {
        method: "POST",
        headers: {
          authorization: "skip-auth",
          "x-api-key": "123",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "VERIFY",
          deviceInfo: {},
          callback: {
            url: "123",
            headers: {},
          },
          redirectURL: "www.google.com",
          uuid: "123asd"
        }),
      })
    ).json();

    const publicKey = await (await fetch("https://api-orchestration-privateid.uberverify.com/public-key")).json();

    console.log("response:", { apiRes: apiRes.sessionId, publicKey: publicKey.publicKey });

    let session = apiRes.sessionId;
    let pkey = publicKey.publicKey;

    const isSupported = await loadPrivIdModule({
      api_url: {
        collections: {
          default: {
            named_urls: {
              base_url: "https://api-orchestration-privateid.uberverify.com/v2/verification-session",
            },
          },
        },
        //   collections: {
        //     default: {
        //       named_urls: {
        //         base_url: "https://api.prodv3.cryptonets.ai/node",
        //         enroll: "https://api.prodv3.cryptonets.ai/node/FACE4_2/enroll",
        //         predict: "https://api.prodv3.cryptonets.ai/node/FACE4_2/predict",
        //         deleteUser: "https://api.prodv3.cryptonets.ai/node/FACE4_2/deleteUser",
        //         syncUUID: "https://api.prodv3.cryptonets.ai/node/FACE4_2/syncUUID",
        //       },
        //     },
        //     collection_d: {
        //       named_urls: {
        //         predict: "https://api.develv3.cryptonets.ai/node/FACE3_1/predict",
        //         enroll: "https://api.develv3.cryptonets.ai/node/FACE3_1/enroll",
        //         deleteUser: "https://api.develv3.cryptonets.ai/node/FACE3_1/deleteUser",
        //         syncUUID: "https://api.develv3.cryptonets.ai/node/FACE3_1/syncUUID",
        //       },
        //     },
        //   },
        // },
        // api_key: "00000000000000001962",
      },
      sessionToken: session,
      publicKey: pkey,
    });
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
