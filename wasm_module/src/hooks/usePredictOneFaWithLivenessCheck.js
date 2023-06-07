import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk";

const usePredictOneFaWithLivenessCheck = (setShowSuccess) => {
  const [predictOneFaaceDetected, setFaceDetected] = useState(false);
  const [predictOneFaStatus, setPredictStatus] = useState(null);
  const [predictOneFaData, setPredictData] = useState(null);
  const [predictMessage, setPredictMessage] = useState("");
  const [predictLivenessCheck, setPredictLivenvessCheck] = useState(null);

  const predictUserOneFa = async () => {
    setFaceDetected(false);
    setPredictData(null);
    // eslint-disable-next-line no-unused-vars
    await predict1FA(
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
            predictUserOneFa();
          }
          break;
        default:
      }
    } else {
      setFaceDetected(null);
      setPredictStatus(null);
      predictUserOneFa();
      setPredictData(null);
      setPredictMessage(livenessCheck === 1 ? "Detected as Spoof" : "No Face Found");
    }
  };

  return {
    predictOneFaaceDetected,
    predictOneFaStatus,
    predictOneFaData,
    predictUserOneFa,
    predictMessage,
    predictLivenessCheck,
  };
};

export default usePredictOneFaWithLivenessCheck;
