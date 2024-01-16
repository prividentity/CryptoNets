import { useState } from "react";
import { twoStepFaceLogin } from "@privateid/cryptonets-web-sdk";


const useTwoStepFaceLogin = (setShowSuccess = ()=>{}) => {
  const [faceLoginMessage, setFaceLoginMessage] = useState("");

  const [faceLoginAntispoofPerformed, setFaceLoginAntispoofPerformed] = useState("");
  const [faceLoginAntispoofStatus, setFaceLoginAntispoofStatus] = useState("");
  const [faceLoginValidationStatus, setFaceLoginValidationStatus] = useState("");
  const [faceLoginGUID, setFaceLoginGUID] = useState("");
  const [faceLoginPUID, setFaceLoginPUID] = useState("");
  let skipAntispoofProcess = false;

  const callback = async (result) => {
    console.log("twoStepFaceLogin callback hook result:", result);

    if(result?.processing){
        setFaceLoginMessage("PROCESSING ! ! !");
    }
    else{
        switch (result.status) {
            case "WASM_RESPONSE":
              if (result.returnValue?.status === 0) {
                const { message } = result.returnValue;
                setFaceLoginMessage(message);
                setShowSuccess(true);
                setFaceLoginAntispoofPerformed(result.returnValue.anti_spoof_performed || "");
                setFaceLoginAntispoofStatus(result.returnValue.anti_spoof_status || "");
                setFaceLoginValidationStatus(result.returnValue.status);
                setFaceLoginGUID(result.returnValue.guid);
                setFaceLoginPUID(result.returnValue.puid);
              }
              if (result.returnValue?.status !== 0) {
                const { status, message } = result.returnValue;
                setFaceLoginMessage(message);
                setFaceLoginAntispoofPerformed(result.returnValue.anti_spoof_performed);
                setFaceLoginAntispoofStatus(result.returnValue.anti_spoof_status);
                setFaceLoginValidationStatus(result.returnValue.status);
                setFaceLoginGUID(result.returnValue.guid);
                setFaceLoginPUID(result.returnValue.puid);
                doTwoStepFaceLogin(skipAntispoofProcess, true);
              }
              break;
            default:
          }
    }

  };

  const doTwoStepFaceLogin = async (skipAntispoof=true, isRunning = false) => {
    // eslint-disable-next-line no-unused-vars
    skipAntispoofProcess = skipAntispoof;
    if(!isRunning){
      setFaceLoginAntispoofPerformed("");
      setFaceLoginAntispoofStatus("");
      setFaceLoginValidationStatus("");
      setFaceLoginGUID("");
      setFaceLoginPUID("");
    }
   
    await twoStepFaceLogin(callback);
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

export default useTwoStepFaceLogin;
