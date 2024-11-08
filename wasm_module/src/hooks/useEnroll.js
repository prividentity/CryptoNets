import { convertCroppedImage, enroll } from "@privateid/cryptonets-web-sdk-alpha";
import { useState } from "react";

let skipAntispoofProcess = false;
let identifierGlobal = undefined;
let collectionNameGlobal = undefined;

let threshold_user_too_close = 0.8;
let threshold_user_too_far = 0.2;
let threshold_profile_enroll = 0.6;
let threshold_high_vertical_enroll = -0.1;
let threshold_down_vertical_enroll = 0.1;

let stop = false;

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

      if(!stop){
        enrollUserOneFa(result.mf_token, skipAntispoofProcess, collectionNameGlobal, identifierGlobal);
      }
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

    console.log("enroll call config:",{
      input_image_format: "rgba",
      mf_token: token,
      collection_name: collectionNameGlobal,
      skip_antispoof: skipAntispoof,
      identifier: identifierGlobal,
      anti_spoofing_threshold:0.75,
      threshold_user_too_close,
      threshold_user_too_far,
      threshold_profile_enroll,
      threshold_high_vertical_enroll,
      threshold_down_vertical_enroll,
    },)

    stop = false;
    const bestImage = await enroll({
      callback: callback,
      config: {
        input_image_format: "rgba",
        mf_token: token,
      },
    });

    if (bestImage) {
      setEnrollImageData(new ImageData(bestImage.imageData, bestImage.width, bestImage.height));
      const bestImagePortrait = await convertCroppedImage(bestImage.imageData, bestImage.width, bestImage.height);
      console.log("enroll image:", bestImagePortrait);
    }
  };

  const changeThresholdEnroll = ({ name, newValue }) => {
      
    // stop = true;
    console.log("Changing Config:", {name, newValue})
    switch (name) {
      case "threshold_user_too_close":
        console.log("threshold_user_too_close:", newValue);
        threshold_user_too_close = newValue;
        break;
      case "threshold_user_too_far":
        console.log("threshold_user_too_far:", newValue);
        threshold_user_too_far = newValue;
        break;
      case "threshold_profile_enroll":
        console.log("threshold_profile_enroll:", newValue);
        threshold_profile_enroll = newValue;
        break;

      case "threshold_high_vertical_enroll":
        console.log("threshold_high_vertical_enroll:", newValue);
        threshold_high_vertical_enroll = newValue;
        break;

      case "threshold_down_vertical_enroll":
        console.log("threshold_down_vertical_enroll:", newValue);
        threshold_down_vertical_enroll = newValue;
        break;
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
    changeThresholdEnroll,
  };
};

export default useEnroll;
