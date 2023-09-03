import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk-alpha";
const useFaceLogin = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess, disableButtons) => {
  const [faceLoginMessage, setFaceLoginMessage] = useState("");

  const [faceLoginAntispoofPerformed, setFaceLoginAntispoofPerformed] = useState(null);
  const [faceLoginAntispoofStatus, setFaceLoginAntispoofStatus] = useState(null);
  const [faceLoginValidationStatus, setFaceLoginValidationStatus] = useState(null);
  const [faceLoginGUID, setFaceLoginGUID] = useState("");
  const [faceLoginPUID, setFaceLoginPUID] = useState("");

  const callback = async (result) => {
    console.log("faceLogin callback hook result:", result);

    switch (result.status) {
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          const { message } = result.returnValue;
          setFaceLoginMessage(message);
          onSuccess(result.returnValue);
          setShowSuccess(true);
          setFaceLoginAntispoofPerformed(result.returnValue.anti_spoof_performed);
          setFaceLoginAntispoofStatus(result.returnValue.anti_spoof_status);
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
          doFaceLogin();
        }
        break;
      default:
    }
  };

  const doFaceLogin = async () => {
    // eslint-disable-next-line no-unused-vars
    setFaceLoginAntispoofPerformed(null);
    setFaceLoginAntispoofStatus(null);
    setFaceLoginValidationStatus(null);
    setFaceLoginGUID("");
    setFaceLoginPUID("");
    disableButtons(true);
    await faceLogin(callback, {
      input_image_format: "rgba",
      eyes_blinking_threshold: 0.4,
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
