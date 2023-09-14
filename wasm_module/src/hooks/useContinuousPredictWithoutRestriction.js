import { useState } from "react";
import { continuousPredictWithoutRestrictions } from "@privateid/cryptonets-web-sdk-alpha";
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
    await continuousPredictWithoutRestrictions(callback);
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
