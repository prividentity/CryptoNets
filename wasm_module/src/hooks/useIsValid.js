import { useState } from "react";
import { isValid } from "@privateid/cryptonets-web-sdk-alpha";

const useIsValid = (element = "userVideo", deviceId = null) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [exposureValue, setExposureValue] = useState(0);
  const [confidenceScore, setConfidenceScore] = useState(0);
  const isValidCall = async () => {
    // eslint-disable-next-line no-unused-vars
    await isValid(callback, null, {
      threshold_image_too_bright: 0.95,
      threshold_image_too_dark: 0.05,
      input_image_format: "rgba",
    });
  };

  const callback = async (result) => {
    console.log("callback hook result isValid:", result);
    switch (result.status) {
      case "WASM_RESPONSE":
        if (result.returnValue.faces.length === 0) {
          setFaceDetected(false);
        } else {
          if (
            result.returnValue.faces[0].status === 0 ||
            result.returnValue.faces[0].status === 11 ||
            result.returnValue.faces[0].status === 10
          ) {
            setFaceDetected(true);
            setConfidenceScore(result.returnValue.faces[0].conf_score);
          }
          if (result.returnValue.faces[0].status === -1) {
            setFaceDetected(false);
          }
        }
        setExposureValue(result?.returnValue?.exposure);
        setHasFinished(true);
        break;
      default:
    }
  };

  return { faceDetected, isValidCall, hasFinished, setHasFinished, exposureValue, confidenceScore };
};

export default useIsValid;
