import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk";
const useFaceLogin = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess, disableButtons) => {
  const [faceLoginMessage, setFaceLoginMessage] = useState("");

  const [faceLoginAntispoofPerformed, setFaceLoginAntispoofPerformed] = useState("");
  const [faceLoginAntispoofStatus, setFaceLoginAntispoofStatus] = useState("");
  const [faceLoginValidationStatus, setFaceLoginValidationStatus] = useState("");
  const [faceLoginGUID, setFaceLoginGUID] = useState("");
  const [faceLoginPUID, setFaceLoginPUID] = useState("");
  let skipAntispoofProcess = false;

  const callback = async (result) => {
    console.log("faceLogin callback hook result:", result);

    switch (result.status) {
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          const { message } = result.returnValue;
          setFaceLoginMessage(message);
          onSuccess(result.returnValue);
          setShowSuccess(true);
          setFaceLoginAntispoofPerformed(result.returnValue.anti_spoof_performed || "");
          setFaceLoginAntispoofStatus(result.returnValue.anti_spoof_status || "");
          setFaceLoginValidationStatus(result.returnValue.status);
          setFaceLoginGUID(result.returnValue.guid);
          setFaceLoginPUID(result.returnValue.puid);
          disableButtons(false);
        }
        if (result.returnValue?.status !== 0) {
          const { status, message } = result.returnValue;
          setFaceLoginMessage(message);
          setFaceLoginAntispoofPerformed(result.returnValue.anti_spoof_performed);
          setFaceLoginAntispoofStatus(result.returnValue.anti_spoof_status);
          setFaceLoginValidationStatus(result.returnValue.status);
          setFaceLoginGUID(result.returnValue.guid);
          setFaceLoginPUID(result.returnValue.puid);
          doFaceLogin(skipAntispoofProcess, true);
        }
        break;
      default:
    }
  };

  const doFaceLogin = async (skipAntispoof=true, isRunning = false) => {
    // eslint-disable-next-line no-unused-vars
    skipAntispoofProcess = skipAntispoof;
    if(!isRunning){
      setFaceLoginAntispoofPerformed("");
      setFaceLoginAntispoofStatus("");
      setFaceLoginValidationStatus("");
      setFaceLoginGUID("");
      setFaceLoginPUID("");
      disableButtons(true);
    }
   
    await faceLogin(callback, {
      skipAntispoof: skipAntispoof,
      conf_score_thr_barcode: 85,
    });
  };

  return {
    doFaceLogin,
    faceLoginMessage,
    faceLoginAntispoofPerformed,
    faceLoginAntispoofStatus,
    faceLoginValidationStatus,
    faceLoginGUID,
    faceLoginPUID,
  };
};

export default useFaceLogin;
