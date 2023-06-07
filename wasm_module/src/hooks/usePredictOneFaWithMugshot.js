import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk";

const usePredictOneFaWithMugshot = (setShowSuccess, config, image) => {
  const [predictOneFaaceDetected, setFaceDetected] = useState(false);
  const [predictOneFaStatus, setPredictStatus] = useState(null);
  const [predictOneFaData, setPredictData] = useState(null);
  const [predictMessage, setPredictMessage] = useState("");
  let retry = 0; 
  const predictUserOneFa = async () => {
    setFaceDetected(false);
    setPredictData(null);
    // eslint-disable-next-line no-unused-vars
    await predict1FA(
      callback,
      config
        ? config
        : {
            input_image_format: "rgba",
          },
      undefined,
      false,
      image
    );
  };

  const callback = async (result) => {
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
            if(retry <3){
                predictUserOneFa();
                retry++;
            }
          }
          break;
        default:
      }
  };

  return {
    predictOneFaaceDetected,
    predictOneFaStatus,
    predictOneFaData,
    predictUserOneFa,
    predictMessage,
  };
};

export default usePredictOneFaWithMugshot;
