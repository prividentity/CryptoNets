import { useState } from "react";
import { predict } from "@privateid/ultra-web-sdk-alpha";
import { getStatusMessage } from "@privateid/cryptonets-web-sdk-alpha/dist/utils";

const useMultiframePredict = ({ onSuccess, disableButtons }) => {
  const [multiframePredictMessage, setPredictMessage] = useState("");

  const [multiframePredictAntispoofPerformed, setPredictAntispoofPerformed] = useState("");
  const [multiframePredictAntispoofStatus, setPredictAntispoofStatus] = useState("");
  const [multiframePredictValidationStatus, setPredictValidationStatus] = useState("");
  const [multiframePredictGUID, setPredictGUID] = useState("");
  const [multiframePredictPUID, setPredictPUID] = useState("");

  const callback = async (result) => {
    console.log("predict callback hook result:", result);

    if (result.guid && result.puid) {
      setPredictGUID(result.guid);
      setPredictPUID(result.puid);
      setPredictAntispoofStatus(result.antispoof_status);
      setPredictValidationStatus(result.face_validation_status);
      setPredictMessage(getStatusMessage(result.face_validation_status));
      disableButtons(false);
      onSuccess();
    } else {
      // if face_validation_status and antispoof_status !===0 display message
      setPredictAntispoofStatus(result.antispoof_status);
      setPredictValidationStatus(result.face_validation_status);
      multiframePredictUserOneFa({ mf_token: result?.mf_token });
    }
  };

  const multiframePredictUserOneFa = async ({ mf_token }) => {
    // eslint-disable-next-line no-unused-vars
    setPredictAntispoofPerformed("");
    setPredictAntispoofStatus("");
    setPredictValidationStatus("");
    setPredictGUID("");
    setPredictPUID("");
    disableButtons(true);

    await predict({
      callback,
      config: {
        disable_predict_mf: false,
        mf_token: mf_token || "",
        collection_name: "collection_d",
      },
    });
  };

  return {
    multiframePredictUserOneFa,
    multiframePredictMessage,
    multiframePredictAntispoofPerformed,
    multiframePredictAntispoofStatus,
    multiframePredictValidationStatus,
    multiframePredictGUID,
    multiframePredictPUID,
  };
};

export default useMultiframePredict;
