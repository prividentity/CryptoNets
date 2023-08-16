import { useState } from "react";
import { faceLogin } from "@privateid/cryptonets-web-sdk-alpha";

let loop = true;
const useFaceLogin = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess) => {
  const [faceLoginFaceDetected, setFaceDetected] = useState(false);
  const [faceLoginStatus, setPredictStatus] = useState(null);
  const [faceLoginData, setPredictData] = useState(null);
  const [faceLoginMessage, setPredictMessage] = useState("");

  const [statusCode, setStatusCode] = useState(null);

  const doFaceLogin = async (functionLoop = true) => {
    loop = functionLoop;

    // CONFIG THRESHOLD
    // "threshold_high_vertical_enroll"=-0.32f
    // "threshold_high_vertical_predict"=-0.32f
    // "threshold_down_vertical_enroll"=0.32f
    // "threshold_down_vertical_predict"=0.32f
    // "threshold_user_right"= 0.01f
    // "threshold_user_left"= 0.99f
    // "threshold_user_too_far"= 0.2f
    // "threshold_user_too_close"=0.8f

    // DEFAULT VALUES
    // WEB_THRESHOLD_PROFILE_ENROLL	0.6f
    // WEB_THRESHOLD_PROFILE_PREDICT	0.85f
    // WEB_THRESHOLD_VERTICAL_ENROLL_HIGH	0.2f
    // WEB_THRESHOLD_VERTICAL_ENROLL_DOWN	0.2f
    // WEB_THRESHOLD_USER_RIGHT	0.10f
    // WEB_THRESHOLD_USER_LEFT	0.90f
    // WEB_THRESHOLD_USER_DOWN	0.90f
    // WEB_THRESHOLD_USER_UP	0.10f

    await faceLogin(callback, {
      input_image_format: "rgba",
      // context_string:"enroll",
      // threshold_profile_enroll: 0.6,
      // threshold_high_vertical_enroll: -0.2,
      // threshold_down_vertical_enroll: 0.2,
      // threshold_user_right: 0.01,
      // threshold_user_left: 0.99,
      // threshold_user_too_far: 0.4,
      // threshold_user_too_close: 0.8,

      threshold_high_vertical_predict: -0.1,
      threshold_down_vertical_predict: 0.1,
      threshold_user_right: 0.01,
      threshold_user_left: 0.99,
      threshold_profile_predict: 0.6,
      threshold_user_too_close: 0.7,
      threshold_user_too_far: 0.10,
      auto_zoom_disabled: true,
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
          setStatusCode(validation_status ? validation_status[0]?.status : null);
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
    if (loop) {
      doFaceLogin();
    }
  };

  return {
    faceLoginFaceDetected,
    faceLoginStatus,
    faceLoginData,
    doFaceLogin,
    faceLoginMessage,
    statusCode,
  };
};

export default useFaceLogin;
