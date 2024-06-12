import { convertCroppedImage, enroll } from "@privateid/cryptonets-web-sdk-alpha";
import { useState } from "react";

let skipAntispoofProcess = false;
let identifierGlobal = undefined;
let collectionNameGlobal = undefined;

const useEnroll = ({ disableButtons, skipAntispoof = false }) => {
  const [enrollAntispoofPerformed, setEnrollAntispoofPerformed] = useState(false);
  const [enrollAntispoofStatus, setEnrollAntispoofStatus] = useState("");

  const [enrollValidationStatus, setEnrollValidationStatus] = useState("");

  const [enrollGUID, setEnrollGUID] = useState("");
  const [enrollPUID, setEnrollPUID] = useState("");
  const [enrollToken, setEnrollToken] = useState("");

  const [enrollImageData, setEnrollImageData] = useState("");

  let enrollCount = 0;
  let enrollTokenCurrent;

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    console.log("skipping antispoof?", skipAntispoofProcess);

    if (result.enroll_performed) {
      setEnrollGUID(result.guid);
      setEnrollPUID(result.puid);
      disableButtons(false);
    } else {
      setEnrollValidationStatus(result.face_validation_status);
      setEnrollAntispoofStatus(result.antispoof_status);
      enrollUserOneFa(result.mf_token, skipAntispoofProcess, collectionNameGlobal, identifierGlobal);
    }
  };

  const enrollUserOneFa = async (
    token = "",
    skipAntispoof = false,
    collectionName = undefined,
    identifier = undefined
  ) => {
    enrollTokenCurrent = token;
    skipAntispoofProcess = skipAntispoof;
    collectionNameGlobal = collectionName;
    identifierGlobal = identifier;
    disableButtons(true);

    // eslint-disable-next-line no-unused-vars
    const bestImage = await enroll({
      callback: callback,
      config: {
        input_image_format: "rgba",
        mf_token: token,
        collection_name: collectionNameGlobal,
        skip_antispoof: skipAntispoof,
        identifier: identifierGlobal,
        send_original_images: true,
        anti_spoofing_threshold: 0.75,
      },
    });

    if (bestImage) {
      setEnrollImageData(new ImageData(bestImage.imageData, bestImage.width, bestImage.height));
      const bestImagePortrait = await convertCroppedImage(bestImage.imageData, bestImage.width, bestImage.height);
      console.log("enroll image:", bestImagePortrait);
    }
  };
  
  return {
    enrollGUID,
    enrollPUID,
    enrollAntispoofPerformed,
    enrollAntispoofStatus,
    enrollValidationStatus,
    enrollToken,
    enrollUserOneFa,
    enrollImageData,
  };
};

export default useEnroll;
