import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk-test";
let loop = true;
let currentUrl = "";
const usePredictOneFa = (
  element = "userVideo",
  onSuccess,
  retryTimes = 4,
  deviceId = null,
  setShowSuccess,
  disableButtons
) => {
  const [predictMessage, setPredictMessage] = useState("");

  const [predictAntispoofPerformed, setPredictAntispoofPerformed] = useState("");
  const [predictAntispoofStatus, setPredictAntispoofStatus] = useState("");
  const [predictValidationStatus, setPredictValidationStatus] = useState("");
  const [predictGUID, setPredictGUID] = useState("");
  const [predictPUID, setPredictPUID] = useState("");

  let skipAntispoofProcess = false;

  const callback = async (result) => {
    console.log("predict callback hook result:", result);

    if (result.guid && result.puid && result.api_status === 0) {
      setPredictGUID(result.guid);
      setPredictPUID(result.puid);
      setPredictAntispoofStatus(result.antispoof_status);
      setPredictValidationStatus(result.face_validation_status);
      disableButtons(false);
    } else {
      setPredictAntispoofStatus(result.antispoof_status);
      setPredictValidationStatus(result.face_validation_status);
      predictUserOneFa(skipAntispoofProcess, true, currentUrl);
    }
  };

  const predictUserOneFa = async (skipAntispoof = true, isRunning = false, url = null) => {
    skipAntispoofProcess = skipAntispoof;
    // eslint-disable-next-line no-unused-vars
    if (!isRunning) {
      setPredictAntispoofPerformed("");
      setPredictAntispoofStatus("");
      setPredictValidationStatus("");
      setPredictGUID("");
      setPredictPUID("");
      disableButtons(true);
    }

    if (url) {
      currentUrl = url;
    }
    await predict1FA({
      callback,
      config: {
        skip_antispoof: skipAntispoof,
        // predict_collection: url,
        // identifier: "test",
      },
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
