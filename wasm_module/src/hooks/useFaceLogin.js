import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk-alpha";
const useFaceLogin = (
  element = "userVideo",
  onSuccess,
  retryTimes = 4,
  deviceId = null,
  setShowSuccess,
  disableButtons
) => {
  const [faceLoginMessage, setFaceLoginMessage] = useState("");

  const [faceLoginAntispoofPerformed, setFaceLoginAntispoofPerformed] = useState("");
  const [faceLoginAntispoofStatus, setFaceLoginAntispoofStatus] = useState("");
  const [faceLoginValidationStatus, setFaceLoginValidationStatus] = useState("");
  const [faceLoginGUID, setFaceLoginGUID] = useState("");
  const [faceLoginPUID, setFaceLoginPUID] = useState("");
  let skipAntispoofProcess = false;

  const callback = async (result) => {
    console.log("faceLogin callback hook result:", result);

    if (result.guid && result.puid) {
      setFaceLoginGUID(result.guid);
      setFaceLoginPUID(result.puid);
      setFaceLoginAntispoofStatus(result.antispoof_status);
      setFaceLoginValidationStatus(result.face_validation_status);
      setShowSuccess(true);
      disableButtons(false);
      onSuccess();
    } else {
      setFaceLoginAntispoofStatus(result.antispoof_status);
      setFaceLoginValidationStatus(result.face_validation_status);
      doFaceLogin(skipAntispoofProcess, true);
    }
  };

  const doFaceLogin = async (skipAntispoof = true, isRunning = false) => {
    // eslint-disable-next-line no-unused-vars
    skipAntispoofProcess = skipAntispoof;
    if (!isRunning) {
      setFaceLoginAntispoofPerformed("");
      setFaceLoginAntispoofStatus("");
      setFaceLoginValidationStatus("");
      setFaceLoginGUID("");
      setFaceLoginPUID("");
      disableButtons(true);
    }

    await faceLogin({
      callback: callback,
      config: {
        skipAntispoof: skipAntispoof,
        conf_score_thr_barcode: 85,
        anti_spoofing_threshold: 0.75,
        send_original_images: true,
      },
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
