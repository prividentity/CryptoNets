import { useState } from "react";
import { continuousPredictWithoutRestrictions } from "@privateid/cryptonets-web-sdk";
let loop = true;
const useContinuousPredictWithoutRestrictions = (setShowSuccess) => {
  const [continuousPredictWithoutRestrictionsMessage, setContinuousPredictWithoutRestrictionsMessage] = useState("");

  const [
    continuousPredictWithoutRestrictionsValidationStatus,
    setContinuousPredictWithoutRestrictionsValidationStatus,
  ] = useState("");
  const [continuousPredictWithoutRestrictionsGUID, setContinuousPredictWithoutRestrictionsGUID] = useState("");
  const [continuousPredictWithoutRestrictionsPUID, setContinuousPredictWithoutRestrictionsPUID] = useState("");

  const callback = async (result) => {
    console.log("predict callback hook result:", result);
    switch (result.status) {
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          const { message } = result.returnValue;
          setContinuousPredictWithoutRestrictionsMessage(message);
          setShowSuccess(true);
          setContinuousPredictWithoutRestrictionsValidationStatus(result.returnValue.status);
          setContinuousPredictWithoutRestrictionsGUID(result.returnValue.guid);
          setContinuousPredictWithoutRestrictionsPUID(result.returnValue.puid);
        }
        if (result.returnValue?.status !== 0) {
          const { status, message } = result.returnValue;
          setContinuousPredictWithoutRestrictionsMessage(message);
          setShowSuccess(false);
          setContinuousPredictWithoutRestrictionsValidationStatus(result.returnValue.status);
          setContinuousPredictWithoutRestrictionsGUID(result.returnValue.guid);
          setContinuousPredictWithoutRestrictionsPUID(result.returnValue.puid);
        }
        break;
      default:
    }
  };

  const doContinuousPredictWithoutRestrictions = async () => {
    // eslint-disable-next-line no-unused-vars
    await continuousPredictWithoutRestrictions(callback, {
      input_image_format: "rgba",
      skip_antispoof: true,
      FACE_THRESHOLDS_MIN: 0.3,
      FACE_THRESHOLDS_MED: 0.98,
      FACE_THRESHOLDS_MAX: 1.05,
      FACE_THRESHOLDS_REM_BAD_EMB_DEFAULT: 0.5,
    });
  };

  return {
    doContinuousPredictWithoutRestrictions,
    continuousPredictWithoutRestrictionsMessage,
    continuousPredictWithoutRestrictionsValidationStatus,
    continuousPredictWithoutRestrictionsGUID,
    continuousPredictWithoutRestrictionsPUID,
  };
};

export default useContinuousPredictWithoutRestrictions;
