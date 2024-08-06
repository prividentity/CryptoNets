import { useState } from "react";
import { predict } from "@privateid/cryptonets-web-sdk-alpha";
import { getStatusMessage } from "@privateid/cryptonets-web-sdk-alpha/dist/utils";

let loop = true;
let skipAntispoofProcess = false;
let identifierGlobal = undefined;
let collectionNameGlobal = undefined;

const useMultiframePredict = (
  {
    onSuccess,
    disableButtons
  }
) => {
  const [multiframePredictMessage, setPredictMessage] = useState("");

  const [multiframePredictAntispoofPerformed, setPredictAntispoofPerformed] = useState("");
  const [multiframePredictAntispoofStatus, setPredictAntispoofStatus] = useState("");
  const [multiframePredictValidationStatus, setPredictValidationStatus] = useState("");
  const [multiframePredictGUID, setPredictGUID] = useState("");
  const [multiframePredictPUID, setPredictPUID] = useState("");
  const [multiframePredictMfToken, setMultiframePredictMfToken] = useState("");

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
      setPredictAntispoofStatus(result.antispoof_status);
      setPredictValidationStatus(result.face_validation_status);
      setPredictMessage(getStatusMessage(result.face_validation_status));
      if(loop){
        multiframePredictUserOneFa({mf_token:result?.mf_token});
      }
    }
  };

  const multiframePredictUserOneFa = async ({
    mf_token,
  }
  
  ) => {
    // skipAntispoofProcess = skipAntispoof;
    // collectionNameGlobal = collectionName;
    // identifierGlobal = identifier;
    // eslint-disable-next-line no-unused-vars
    setPredictAntispoofPerformed("");
    setPredictAntispoofStatus("");
    setPredictValidationStatus("");
    setPredictGUID("");
    setPredictPUID("");
    disableButtons(true);

    // if(image){
    //   loop = false;
    // }

    await predict({
      callback,
      config: {
       // collection_name: collectionNameGlobal,
       // skip_antispoof: skipAntispoofProcess,
       // identifier,
        disable_predict_mf:false,
        mf_token: mf_token || "",
      },
      //image: image,
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
