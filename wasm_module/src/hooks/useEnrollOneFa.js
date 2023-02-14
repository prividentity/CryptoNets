import { useState } from "react";
import { enroll1FA } from "@privateid/cryptonets-web-sdk-alpha";

const useEnrollOneFa = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [enrollData, setEnrollData] = useState(null);

  let tries = 0;

  const enrollUserOneFa = async () => {
    setFaceDetected(false);
    setEnrollStatus(null);
    setProgress(0);
    setEnrollData(null);
    // eslint-disable-next-line no-unused-vars
    await enroll1FA(callback, {
      send_original_images: false,
    });
  };


  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    switch (result.status) {
      case "VALID_FACE":
        setFaceDetected(true);
        setEnrollStatus("Please Hold Position");
        setProgress(result.progress);
        break;
      case "INVALID_FACE":
        console.log("INVALID FACE: ", result);
        setEnrollStatus(result.message);
        setFaceDetected(false);
        break;
      case "ENROLLING":
        setEnrollStatus("ENROLLING");
        setFaceDetected(true);
        break;
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          setEnrollStatus("ENROLL SUCCESS");
          setEnrollData(result.returnValue);
          onSuccess(result.returnValue);
        }
        if (result.returnValue?.status === -1 || result.returnValue?.status === -100) {
          setEnrollStatus("ENROLL FAILED, PLEASE TRY AGAIN");
        }
        break;
      default:
    }
  };

  return { faceDetected, enrollStatus, enrollData, enrollUserOneFa, progress };
};

export default useEnrollOneFa;
