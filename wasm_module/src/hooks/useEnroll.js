import { convertCroppedImage, enroll } from "@privateid/cryptonets-web-sdk-alpha";
import { useState } from "react";

let skipAntispoofProcess = false;
const useEnroll = (
  element = "userVideo",
  onSuccess,
  retryTimes = 4,
  deviceId = null,
  setShowSuccess,
  disableButtons
) => {
  const [enrollAntispoofPerformed, setEnrollAntispoofPerformed] = useState(false);
  const [enrollAntispoofStatus, setEnrollAntispoofStatus] = useState("");

  const [enrollValidationStatus, setEnrollValidationStatus] = useState("");

  const [enrollGUID, setEnrollGUID] = useState("");
  const [enrollPUID, setEnrollPUID] = useState("");
  const [enrollToken, setEnrollToken] = useState("");

  const [enrollImageData, setEnrollImageData] = useState("");

  let enrollCount = 0;
  let enrollTokenCurrent;
  let currentUrl = null;
  

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
      enrollUserOneFa(result.mf_token, skipAntispoofProcess, currentUrl);
    }
  };

  const enrollUserOneFa = async (token = "", skipAntispoof = false, url = null) => {
    enrollTokenCurrent = token;
    skipAntispoofProcess = skipAntispoof;
    disableButtons(true);

    if (url) {
      currentUrl = url;
    } 
    // eslint-disable-next-line no-unused-vars
    const bestImage = await enroll({
      callback: callback,
      config: {
        input_image_format: "rgba",
        mf_token: token,
        skip_antispoof: true,
        anti_spoofing_detect_document: false,
      },
    });

    if (bestImage) {
      setEnrollImageData(new ImageData(bestImage.imageData, bestImage.width, bestImage.height));
      const bestImagePortrait =  await convertCroppedImage(bestImage.imageData, bestImage.width, bestImage.height);
      console.log("enroll image:", bestImagePortrait)
    }
  };
  function convertBase64ToImageData(imageSrc, setImageData) {
    const newImg = new Image();
    newImg.src = imageSrc;
    newImg.onload = async () => {
      const imgSize = {
        w: newImg.width,
        h: newImg.height,
      };
      // alert(imgSize.w + " " + imgSize.h);
      const canvas = document.createElement("canvas");
      canvas.width = imgSize.w;
      canvas.height = imgSize.h;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(newImg, 0, 0);
      const imageData = ctx?.getImageData(0, 0, imgSize.w, imgSize.h);
      setImageData(imageData);
    };
  }

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
