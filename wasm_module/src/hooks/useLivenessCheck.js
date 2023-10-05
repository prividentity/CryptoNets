import { livenessCheck } from "@privateid/cryptonets-web-sdk-alpha";
import { useState } from "react";

let possitiveCount = 0;
let reset = false;
const useLivenessCheck = () => {
  const [result, setResult] = useState(null);
  const [resultMessage, setResultMessage] = useState("");
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [finalResult, setFinalResult] = useState("");

  // RESULT_GENERIC_ERROR = -100,
  // RESULT_INVALID_FACE = -4,
  // RESULT_FACE_TOO_CLOSE_TO_EDGE = -3,
  // RESULT_MOBILE_PHONE_DETECTED = -2,
  // RESULT_NO_FACE_DETECTED = -1,
  // RESULT_NO_SPOOF_DETECTED = 0,
  // RESULT_SPOOF_DETECTED = 1

  const livenessCheckCallback = async (res) => {
    console.log("liveness result:", res);
    reset = false;
    while (possitiveCount <= 40 && !reset) {
      setResult(res.returnValue.result);
      switch (res.returnValue.result) {
        case -100:
          setResultMessage("GENERIC ERROR");
          setFinalResult("FAILED");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200);
          return;
        case -4:
          setResultMessage("INVALID FACE");
          setFinalResult("FAILED");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200);
          return;
        case -3:
          setResultMessage("FACE TOO CLOSE TO EDGE");
          setFinalResult("FAILED");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200);
          return;
        case -2:
          setResultMessage("MOBILE PHONE DETECTED");
          setFinalResult("FAILED");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200);
          return;
        case -1:
          setResultMessage("NO FACE DETECTED");
          setFinalResult("FAILED");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200);
          return;
        case 0:
          possitiveCount++;
          setResultMessage("REAL");
          const progress = Math.round(Math.min((possitiveCount * 100) / 40, 100));
          setLivenessProgress(progress);
          doLivenessCheck();
          return;
        case 1:
          setResultMessage("SPOOF DETECTED");
          setFinalResult("FAILED");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200)
          return;
        default:
          setResultMessage("");
          setFinalResult("Something went wrong");
          possitiveCount = 0;
          reset = true;
          // setTimeout(()=> {  doLivenessCheck(); }, 200)
          return;
      }
    }

    if (possitiveCount >= 40) {
      setFinalResult("Real");
    }

    if (reset) {
      possitiveCount = 0;
    }
  };

  const doLivenessCheck = async () => {
    await livenessCheck(livenessCheckCallback, { input_image_format: "rgba", antispoof_face_margin: "2" });
  };

  const resetAllLivenessValues = async () => {
    possitiveCount = 0;
    reset = false;
    setResult(null);
    setResultMessage("");
    setLivenessProgress(0);
    setFinalResult("");
  };

  return {
    doLivenessCheck,
    result,
    resultMessage,
    livenessProgress,
    finalResult,
    resetAllLivenessValues,
  };
};

export default useLivenessCheck;
