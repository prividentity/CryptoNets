import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk-alpha";
let loop = true;
const usePredictOneFa = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess, disableButtons) => {
  const [predictMessage, setPredictMessage] = useState("");

  const [predictAntispoofPerformed, setPredictAntispoofPerformed] = useState(null);
  const [predictAntispoofStatus, setPredictAntispoofStatus] = useState(null);
  const [predictValidationStatus, setPredictValidationStatus] = useState(null);
  const [predictGUID, setPredictGUID] = useState("");
  const [predictPUID, setPredictPUID] = useState("");

  const callback = async (result) => {
    console.log("predict callback hook result:", result);

    switch (result.status) {
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          const { message } = result.returnValue;
          setPredictMessage(message);
          onSuccess(result.returnValue);
          setShowSuccess(true);
          setPredictAntispoofPerformed(result.returnValue.anti_spoof_performed);
          setPredictAntispoofStatus(result.returnValue.anti_spoof_status);
          setPredictValidationStatus(result.returnValue.status);
          setPredictGUID(result.returnValue.guid);
          setPredictPUID(result.returnValue.puid);
          disableButtons(false);
        }
        if (result.returnValue?.status !== 0) {
          const { status, message } = result.returnValue;
          setPredictMessage(message);
          setPredictAntispoofPerformed(result.returnValue.anti_spoof_performed);
          setPredictAntispoofStatus(result.returnValue.anti_spoof_status);
          setPredictValidationStatus(result.returnValue.status);
          setPredictGUID(result.returnValue.guid);
          setPredictPUID(result.returnValue.puid);
          predictUserOneFa();
        }
        break;
      default:
    }
  };

  const predictUserOneFa = async () => {
    // eslint-disable-next-line no-unused-vars
    setPredictAntispoofPerformed(null);
    setPredictAntispoofStatus(null);
    setPredictValidationStatus(null);
    setPredictGUID("");
    setPredictPUID("");
    disableButtons(true);
    await predict1FA(callback, {
      input_image_format: "rgba",
      eyes_blinking_threshold: 0.4,
    });
  };

  return {
    predictUserOneFa,
    predictMessage,
    predictAntispoofPerformed,
    predictAntispoofStatus,
    predictValidationStatus,
    predictGUID,
    predictPUID,
  };
};

export default usePredictOneFa;
