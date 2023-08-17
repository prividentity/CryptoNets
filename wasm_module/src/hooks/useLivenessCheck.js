import { livenessCheck } from "@privateid/cryptonets-web-sdk-alpha";
import { useState } from "react";

const useLivenessCheck = () => {
  const [result, setResult] = useState(null);

  const [resultMessage, setResultMessage] = useState("");

  // RESULT_GENERIC_ERROR = -100,
  // RESULT_INVALID_FACE = -4,
  // RESULT_FACE_TOO_CLOSE_TO_EDGE = -3,
  // RESULT_MOBILE_PHONE_DETECTED = -2,
  // RESULT_NO_FACE_DETECTED = -1,
  // RESULT_NO_SPOOF_DETECTED = 0,
  // RESULT_SPOOF_DETECTED = 1

  const livenessCheckCallback = async (res) => {
    console.log("liveness result:", res);
    setResult(res.returnValue.result);

    switch (res.returnValue.result) {
      case -100:
        setResultMessage("GENERIC ERROR");
        setTimeout(()=> {  doLivenessCheck(); }, 200);
        return;
      case -4:
        setResultMessage("INVALID FACE");
        setTimeout(()=> {  doLivenessCheck(); }, 200);
        return;
      case -3:
        setResultMessage("FACE TOO CLOSE TO EDGE");
        setTimeout(()=> {  doLivenessCheck(); }, 200);
        return;
      case -2:
        setResultMessage("MOBILE PHONE DETECTED");
        setTimeout(()=> {  doLivenessCheck(); }, 200);
        return;
      case -1:
        setResultMessage("NO FACE DETECTED");
        setTimeout(()=> {  doLivenessCheck(); }, 200);
        return;
      case 0:
        setResultMessage("REAL");
        setTimeout(()=> {  doLivenessCheck(); }, 200);
        return;
      case 1:
        setResultMessage("SPOOF DETECTED");
        setTimeout(()=> {  doLivenessCheck(); }, 200)
        return;
      default:
        setResultMessage("");
        setTimeout(()=> {  doLivenessCheck(); }, 200)
        return;
    }
  };

  const doLivenessCheck = async () => {
    await livenessCheck(livenessCheckCallback, { input_image_format: "rgba", antispoof_face_margin: "3" });
  };

  return {
    doLivenessCheck,
    result,
    resultMessage,
  }

};

export default useLivenessCheck;
