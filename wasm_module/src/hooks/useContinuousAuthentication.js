import { useState } from "react";
import { continuousAuthentication } from "@privateid/cryptonets-web-sdk";

const useContinuousPredict = (
  element,
  onSuccess,
  onFailure,
  onNotFound,
  retryTimes = 1
) => {
  const [faceDetected, setFaceDetected] = useState(false);
  let successCallback = null;
  let tries = 0;
  let failureTries = 0;

  const predictUser = async (onSuccessCallback) => {
    if (onSuccessCallback) {
      successCallback = onSuccessCallback;
    }
    await continuousAuthentication(
      callback,
      {
        input_image_format: "rgba",
      },
      element
    );
  };

  // const stopTracks = () => {
  //   const { srcObject } = document.getElementById(element || 'userVideo');
  //   srcObject.getTracks().forEach((track) => track.stop());
  // };

  const callback = async (result) => {
    console.log("CONTINUOUS AUTH CALLBACK", result);
    switch (result.status) {
      case "WASM_RESPONSE":
      case -1:
      case -100:
        if (result.returnValue.status === 0) {
          // stopTracks();
          setFaceDetected(true);
          if (successCallback) {
            successCallback(
              result.returnValue.PI.uuid,
              result.returnValue.PI.guid
            );
            
          } else {
            onSuccess(result.returnValue.PI.uuid,result.returnValue.PI.guid);
            setFaceDetected(true);
          }
          successCallback = null;
        }
        if (result.returnValue.status !== 0) {
          if (tries === retryTimes) {
            // stopTracks();
            onFailure();
          } else {
            tries += 1;
            // await predictUser();
          }
          const {validation_status, message}  = result.returnValue;
          let hasValidFace =false;
          for (let i = 0; validation_status.length > i; i++){
            if(validation_status[i].status ===0){
              hasValidFace = true
              i = validation_status.length;
            }
          }
          setFaceDetected(hasValidFace);
        }
        break;
      default:
        break;
    }
  };

  return { faceDetected, predictUser };
};

export default useContinuousPredict;
