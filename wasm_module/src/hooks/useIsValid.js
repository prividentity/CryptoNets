import { useState } from 'react';
import { isValid } from '@privateid/cryptonets-web-sdk-alpha';

const useIsValid = (element = 'userVideo', deviceId = null) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const isValidCall = async () => {
      // eslint-disable-next-line no-unused-vars
      await isValid(false, callback);
  };

  const callback = async (result) => {
    console.log("callback hook result isValid:", result)
    switch (result.status) {
      case 'WASM_RESPONSE':
        if (result.result === 0) {
          setFaceDetected(true);
        }
        if (result.result === -1) {
          setFaceDetected(false)
        }
        setHasFinished(true);
        break;
      default:
    }
  };

  return { faceDetected, isValidCall, hasFinished, setHasFinished };
};

export default useIsValid;
