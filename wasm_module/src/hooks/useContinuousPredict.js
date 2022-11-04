import { useState } from "react";
import { continuousEnrollPredict } from "@privateid/cryptonets-web-sdk-alpha";

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
    await continuousEnrollPredict(
      false,
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
    switch (result.status) {
      case "VALID_FACE":
        setFaceDetected(true);
        break;
      case "INVALID_FACE":
        setFaceDetected(false);
        if (failureTries === retryTimes) {
          onNotFound();
        } else {
          failureTries += 1;
        }
        break;
      case "WASM_RESPONSE":
      case -1:
        if (result.returnValue.status === 0) {
          // stopTracks();
          if (successCallback) {
            successCallback(
              result.returnValue.PI.uuid,
              result.returnValue.PI.guid
            );
          } else {
            onSuccess(result.returnValue.PI.uuid,result.returnValue.PI.guid);
          }
          successCallback = null;
        }
        if (result.returnValue.status === -1) {
          if (tries === retryTimes) {
            // stopTracks();
            onFailure();
          } else {
            tries += 1;
            // await predictUser();
          }
        }
        break;
      default:
        break;
    }
  };

  return { faceDetected, predictUser };
};

export default useContinuousPredict;
