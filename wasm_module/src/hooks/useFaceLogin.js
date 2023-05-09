import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk-test";

const useFaceLogin = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess) => {
  const [faceLoginFaceDetected, setFaceDetected] = useState(false);
  const [faceLoginStatus, setPredictStatus] = useState(null);
  const [faceLoginData, setPredictData] = useState(null);
  const [faceLoginMessage, setPredictMessage] = useState("");

  const doFaceLogin = async () => {
    // setFaceDetected(false);
    // setPredictData(null);
    // eslint-disable-next-line no-unused-vars
    await faceLogin(callback, {
      input_image_format: "rgba",
    });
  };

  const callback = async (result) => {
    console.log("facelogin callback hook result:", result);
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
          onSuccess(result.returnValue);
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
          setFaceDetected(false);
          setPredictData(null);
        }
        break;
      default:
    }
    doFaceLogin();
  };

  return {
    faceLoginFaceDetected,
    faceLoginStatus,
    faceLoginData,
    doFaceLogin,
    faceLoginMessage,
  };
};

export default useFaceLogin;
