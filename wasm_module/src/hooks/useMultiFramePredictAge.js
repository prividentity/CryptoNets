import { useState } from "react";
import { predictAge } from "@privateid/cryptonets-web-sdk-alpha";

let skipAntispoofGlobal = false;
let multiFrameToken = "";
const useMultiFramePredictAge = () => {
  const [age, setAge] = useState(null);
  const [antispoofPerformed, setAntispoofPerformed] = useState(false);
  const [antispoofStatus, setAntispoofStatus] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

  const mfCallback = (result) => {
    console.log(result);

    if(result.age && result.age > 0){
      setAntispoofStatus(result.antispoof_status);
      setValidationStatus(result.face_validation_status);
      setAge(result.age);
    }
    else{
      setAntispoofStatus(result.antispoof_status);
      setValidationStatus(result.face_validation_status);
      doPredictAge(skipAntispoofGlobal, result.mf_token);
    }
  };

  const doPredictAge = async (skipAntispoof = false, mfToken = "") => {
    skipAntispoofGlobal = skipAntispoof;
    await predictAge({
      callback: mfCallback,
      config: {
        // skip_antispoof: true,
        mf_token: mfToken,
      },
    });
  };

  return { doPredictAge, age, antispoofPerformed, antispoofStatus, validationStatus };
};

export default useMultiFramePredictAge;
