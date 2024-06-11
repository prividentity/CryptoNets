import { useState } from "react";
import { multiframeTwoStepFaceLogin } from "@privateid/cryptonets-web-sdk-alpha";
import { getStatusMessage } from "@privateid/cryptonets-web-sdk-alpha/dist/utils";

const useMultiframeTwoStepFaceLogin = (setShowSuccess = () => {}) => {
  const [faceLoginMessage, setFaceLoginMessage] = useState("");

  const [faceLoginAntispoofPerformed, setFaceLoginAntispoofPerformed] = useState("");
  const [faceLoginAntispoofStatus, setFaceLoginAntispoofStatus] = useState("");
  const [faceLoginValidationStatus, setFaceLoginValidationStatus] = useState("");
  const [faceLoginGUID, setFaceLoginGUID] = useState("");
  const [faceLoginPUID, setFaceLoginPUID] = useState("");
  let skipAntispoofProcess = false;

  const callback = async (result) => {
    console.log("twoStepFaceLogin callback hook result:", result);

    if (result?.processing) {
      setFaceLoginMessage("PROCESSING ! ! !");
    } else if (result?.guid && result?.puid) {
      setFaceLoginMessage("Valid Face");
      setShowSuccess(true);
      setFaceLoginAntispoofStatus(result?.antispoof_status);
      setFaceLoginValidationStatus(result?.face_validation_status);
      setFaceLoginGUID(result.guid);
      setFaceLoginPUID(result.puid);
    } else {
      if (result?.noFaceFound) {
        setFaceLoginMessage(getStatusMessage(-1));
        setFaceLoginAntispoofStatus(result?.antispoof_status);
        setFaceLoginValidationStatus(result?.face_validation_status);
        setFaceLoginGUID(result.guid);
        setFaceLoginPUID(result.puid);
        doTwoStepFaceLogin(skipAntispoofProcess, true);
      } else if (result.valid_frame) {
        setFaceLoginMessage("Please hold still");
        // setShowSuccess(true);
        setFaceLoginAntispoofStatus(result?.antispoof_status);
        setFaceLoginValidationStatus(result?.face_validation_status);
        setFaceLoginGUID(result.guid);
        setFaceLoginPUID(result.puid);
        doTwoStepFaceLogin(skipAntispoofProcess, true);
      } else {
        setFaceLoginMessage(getStatusMessage(result?.face_validation_status));
        setFaceLoginAntispoofStatus(result?.antispoof_status);
        setFaceLoginValidationStatus(result?.face_validation_status);
        setFaceLoginGUID(result.guid);
        setFaceLoginPUID(result.puid);
        doTwoStepFaceLogin(skipAntispoofProcess, true);
      }
    }
  };

  const doTwoStepFaceLogin = async (skipAntispoof = true, isRunning = false) => {
    // eslint-disable-next-line no-unused-vars
    skipAntispoofProcess = skipAntispoof;
    if (!isRunning) {
      setFaceLoginAntispoofPerformed("");
      setFaceLoginAntispoofStatus("");
      setFaceLoginValidationStatus("");
      setFaceLoginGUID("");
      setFaceLoginPUID("");
    }

    await multiframeTwoStepFaceLogin({ callback, config: {
      send_original_images: true,
    } });
  };

  return {
    doTwoStepFaceLogin,
    faceLoginMessage,
    faceLoginAntispoofPerformed,
    faceLoginAntispoofStatus,
    faceLoginValidationStatus,
    faceLoginGUID,
    faceLoginPUID,
  };
};

export default useMultiframeTwoStepFaceLogin;

