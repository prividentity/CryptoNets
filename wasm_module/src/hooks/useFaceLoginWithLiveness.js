import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk";

const useFaceLoginWithLivenessCheck = (setShowSuccess) => {
  const [faceLoginWithLivenessFaceDetected, setFaceDetected] = useState(false);
  const [faceLoginWithLivenessStatus, setPredictStatus] = useState(null);
  const [faceLoginWithLivenessData, setPredictData] = useState(null);
  const [faceLoginWithLivenessMessage, setPredictMessage] = useState("");
  const [faceLoginLivenessCheck, setPredictLivenvessCheck] = useState(null);

  const faceLoginWithLiveness = async () => {
    // setFaceDetected(false);
    // setPredictData(null);
    // eslint-disable-next-line no-unused-vars
    await faceLogin(
      callback,
      {
        input_image_format: "rgba",
      },
      undefined,
      true
    );
  };

  const callback = async (result) => {
    const { livenessCheck } = result;
    setPredictLivenvessCheck(livenessCheck);

    if (livenessCheck === 0) {
      switch (result.status) {
        case "WASM_RESPONSE":
          if (result?.returnValue?.error) {
            setFaceDetected(false);
            setPredictMessage("Invalid Image");
            return;
          }
          if (result.returnValue?.status === 0) {
            const { message } = result.returnValue;
            setPredictMessage(message);
            setPredictData(result.returnValue);
            setFaceDetected(true);
            setShowSuccess(true);
          }
          if (result.returnValue?.status !== 0) {
            const { validation_status, message } = result.returnValue;
            setPredictMessage(message);
            let hasValidFace = false;
            for (let i = 0; validation_status.length > i; i++) {
              if (validation_status[i].status === 0) {
                hasValidFace = true;
                i = validation_status.length;
              }
            }
            setFaceDetected(hasValidFace);
            setPredictStatus(null);
            setPredictData(null);
          }
          break;
        default:
      }
    } else {
      setFaceDetected(null);
      setPredictStatus(null);
      setPredictData(null);
      setPredictMessage(livenessCheck === 1 ? "Detected as Spoof" : "No Face Found");
      
    }
    faceLoginWithLiveness();
  };

  return {
    faceLoginWithLivenessFaceDetected,
    faceLoginWithLivenessStatus,
    faceLoginWithLivenessData,
    faceLoginWithLiveness,
    faceLoginWithLivenessMessage,
    faceLoginLivenessCheck,
  };
};

export default useFaceLoginWithLivenessCheck;
