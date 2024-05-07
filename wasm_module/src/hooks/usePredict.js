import { useState } from "react";
import { predict } from "@privateid/cryptonets-web-sdk-alpha";
import { getStatusMessage } from "@privateid/cryptonets-web-sdk-alpha/dist/utils";

let loop = true;
let skipAntispoofProcess = false;
let identifierGlobal = undefined;
let collectionNameGlobal = undefined;

const usePredict = (
  {
    onSuccess,
    disableButtons
  }
) => {
  const [predictMessage, setPredictMessage] = useState("");

  const [predictAntispoofPerformed, setPredictAntispoofPerformed] = useState("");
  const [predictAntispoofStatus, setPredictAntispoofStatus] = useState("");
  const [predictValidationStatus, setPredictValidationStatus] = useState("");
  const [predictGUID, setPredictGUID] = useState("");
  const [predictPUID, setPredictPUID] = useState("");

  const callback = async (result) => {
    console.log("predict callback hook result:", result);

    if (result.guid && result.puid && result.api_status === 0) {
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
      predictUserOneFa(skipAntispoofProcess, collectionNameGlobal, identifierGlobal);
    }
  };

  const predictUserOneFa = async (
    skipAntispoof = false,
    collectionName = undefined,
    identifier = undefined
  ) => {
    skipAntispoofProcess = skipAntispoof;
    collectionNameGlobal = collectionName;
    identifierGlobal = identifier;
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
        collection_name: collectionNameGlobal,
        skip_antispoof: skipAntispoofProcess,
        identifier,
      },
    });
  };

  return {
    predictUserOneFa,
    predictMessage,
    predictAntispoofPerformed,
    predictAntispoofStatus,
    predictValidationStatus,
    predictGUID,
    predictPUID,
  };
};

export default usePredict;
