import { useState } from 'react';
import { enrollPredict } from '@privateid/cryptonets-web-sdk';

const usePredict = (element, onSuccess, onFailure, onNotFound, retryTimes = 1) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [predictResultData, setPredictResultData] = useState(null);
  let successCallback = null;
  let tries = 0;
  let failureTries = 0;

  const predictUser = async (onSuccessCallback) => {
      if (onSuccessCallback) {
        successCallback = onSuccessCallback;
      }
      await enrollPredict(false, callback, {}, element);
  };

  // const stopTracks = () => {
  //   const { srcObject } = document.getElementById(element || 'userVideo');
  //   srcObject.getTracks().forEach((track) => track.stop());
  // };

  const callback = async (result) => {
    switch (result.status) {
      case 'VALID_FACE':
        setFaceDetected(true);
        break;
      case 'INVALID_FACE':
        if (failureTries === retryTimes) {
          onNotFound();
        } else {
          failureTries += 1;
        }
        break;
      case 'WASM_RESPONSE':
      case -1:
        if (result.returnValue.status === 0) {
          // stopTracks();
          setPredictResultData(result.returnValue.PI.guid, result.returnValue.PI.uuid)
          if (successCallback) {
            successCallback(result.returnValue.PI.guid, result.returnValue.PI.uuid);
          } else {
            onSuccess(result.returnValue.PI.guid, result.returnValue.PI.uuid);
          }
          successCallback = null;
        }
        if (result.returnValue.status === -1) {
          if (tries === retryTimes) {
            // stopTracks();
            onFailure();
          } else {
            tries += 1;
            await predictUser();
          }
        }
        break;
      default:
        break;
    }
  };

  return { faceDetected, predictUser, predictResultData};
};

export default usePredict;
