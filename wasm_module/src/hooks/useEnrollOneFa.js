import { useState } from "react";
import { convertCroppedImage, enroll1FA } from "@privateid/cryptonets-web-sdk-alpha";

const useEnrollOneFa = (
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

  let skipAntispoofProcess = false;

  const enrollUserOneFa = async (token = "", skipAntispoof = false) => {
    skipAntispoofProcess = skipAntispoof;
    disableButtons(true);
    // eslint-disable-next-line no-unused-vars
    const bestImage = await enroll1FA(callback, {
      input_image_format: "rgba",
      enroll_token: token,
      skip_antispoof: skipAntispoof,
    });

    if (bestImage) {
      setEnrollImageData(new ImageData(bestImage.imageData, bestImage.width, bestImage.height));
    }
  };

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    if (result.returnValue.status === 0) {
      if (result.returnValue.guid && result.returnValue.puid) {
        setEnrollGUID(result.returnValue.guid);
        setEnrollPUID(result.returnValue.puid);
        setEnrollAntispoofPerformed();  
        setEnrollAntispoofStatus("");
        setEnrollValidationStatus("");
        setShowSuccess(true);
        disableButtons(false);
      } else {
        if (result.returnValue.validation_status.length > 0) {
          setEnrollToken(result.returnValue.validation_status[0].enroll_token);
          setEnrollAntispoofPerformed(result.returnValue.validation_status[0].anti_spoof_performed);
          setEnrollAntispoofStatus(result.returnValue.validation_status[0].anti_spoof_status);
          setEnrollValidationStatus(result.returnValue.validation_status[0].status);

          if (skipAntispoofProcess) {
            if (result.returnValue.validation_status[0].status === 0) {
              enrollUserOneFa(result.returnValue.validation_status[0].enroll_token);
            } else {
              enrollUserOneFa("",skipAntispoofProcess);
            }
          } else {
            if (
              result.returnValue.validation_status[0].anti_spoof_performed &&
              result.returnValue.validation_status[0].anti_spoof_status === 0 &&
              result.returnValue.validation_status[0].status === 0
            ) {
              enrollUserOneFa(result.returnValue.validation_status[0].enroll_token,skipAntispoofProcess);
            } else {
              enrollUserOneFa("",skipAntispoofProcess);
            }
          }
        } else {
          setEnrollToken("");
          setEnrollAntispoofPerformed("");
          setEnrollAntispoofStatus("");
          setEnrollValidationStatus("");
        }
      }
    } else {
      if (result.returnValue.validation_status.length > 0) {
        setEnrollToken(result.returnValue.validation_status[0].enroll_token);
        setEnrollAntispoofPerformed(result.returnValue.validation_status[0].anti_spoof_performed);
        setEnrollAntispoofStatus(result.returnValue.validation_status[0].anti_spoof_status);
        setEnrollValidationStatus(result.returnValue.validation_status[0].status);
        enrollUserOneFa(result.returnValue.validation_status[0].enroll_token);
      } else {
        setEnrollToken("");
        setEnrollAntispoofPerformed("");
        setEnrollAntispoofStatus("");
        setEnrollValidationStatus("");
        enrollUserOneFa("");
      }
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
  };
};

export default useEnrollOneFa;
