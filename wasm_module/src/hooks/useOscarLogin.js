import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk-alpha";
const useOscarLogin = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess, disableButtons) => {
  const [oscarLoginMessage, setFaceLoginMessage] = useState("");

  const [oscarLoginAntispoofPerformed, setFaceLoginAntispoofPerformed] = useState("");
  const [oscarLoginAntispoofStatus, setFaceLoginAntispoofStatus] = useState("");
  const [oscarLoginValidationStatus, setFaceLoginValidationStatus] = useState("");
  const [oscarLoginGUID, setFaceLoginGUID] = useState("");
  const [oscarLoginPUID, setFaceLoginPUID] = useState("");
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
          doOscarLogin(skipAntispoofProcess, true);
        }
        break;
      default:
    }
  };

  const doOscarLogin = async (skipAntispoof=true, isRunning = false) => {
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
      context_string: "oscar_login",
    });
  };

  return {
    doOscarLogin,
    oscarLoginAntispoofPerformed,
    oscarLoginAntispoofStatus,
    oscarLoginValidationStatus,
    oscarLoginGUID,
    oscarLoginPUID,
    oscarLoginMessage,
  };
};

export default useOscarLogin;
