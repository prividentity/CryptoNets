import { useState } from "react";
import { predictAge } from "@privateid/cryptonets-web-sdk-test";

let skipAntispoofGlobal = false;
let multiFrameToken = "";
const useMultiFramePredictAge = () => {
  const [age, setAge] = useState(null);
  const [antispoofPerformed, setAntispoofPerformed] = useState(false);
  const [antispoofStatus, setAntispoofStatus] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [ageMultiframeToken, setAgeMultiframeToken] = useState("");

  const mfCallback = (response) => {
    console.log(response);
    if (response?.returnValue?.faces.length > 0) {
      setAntispoofPerformed(response?.returnValue?.faces[0].anti_spoof_performed);
      setAntispoofStatus(response?.returnValue?.faces[0].anti_spoof_status);
      setValidationStatus(response?.returnValue?.faces[0].status);
      if (
        response?.returnValue?.faces[0].anti_spoof_performed &&
        response?.returnValue?.faces[0].anti_spoof_status === 0 &&
        response?.returnValue?.faces[0].status === 0
      ) {
        if (response?.returnValue?.faces[0].age > 0) {
          setAge(response?.returnValue?.faces[0].age);
        } else {
          setAgeMultiframeToken(response.returnValue.mf_token);
          doPredictAge(skipAntispoofGlobal, response.returnValue.mf_token);
          setAge("");
        }
      } else {
        setAge("");
        setAgeMultiframeToken("");
        doPredictAge(skipAntispoofGlobal, "");
      }
    } else {
      setAge("");
      setAntispoofPerformed("");
      setAntispoofStatus("");
      setValidationStatus("");
      setAgeMultiframeToken("");
      doPredictAge(skipAntispoofGlobal, "");
    }
  };

  const doPredictAge = async (skipAntispoof = false, mfToken = "") => {
    skipAntispoofGlobal = skipAntispoof;
    await predictAge(mfCallback, {
      skip_antispoof: skipAntispoofGlobal,
      mf_token: mfToken,
    });
  };

  return { doPredictAge, age, antispoofPerformed, antispoofStatus, validationStatus,ageMultiframeToken };
};

export default useMultiFramePredictAge;
