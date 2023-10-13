import { useState } from "react";
import { convertCroppedImage, enroll1FA } from "@privateid/cryptonets-web-sdk-alpha";

let skipAntispoofProcess = false;
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

  let enrollCount = 0;
  let enrollTokenCurrent;
  const enrollUserOneFa = async (token = "", skipAntispoof = false) => {
    enrollTokenCurrent = token;
    skipAntispoofProcess = skipAntispoof;
    disableButtons(true);
    // eslint-disable-next-line no-unused-vars
    const bestImage = await enroll1FA(callback, {
      input_image_format: "rgba",
      mf_token: token,
      skip_antispoof: skipAntispoof,
      angle_rotation_left_threshold: 20.0,
      angle_rotation_right_threshold: 20.0,
      preprocessing_margin_factor: 4,
      antispoof_face_margin: 1.0,
      gray_scale_threshold: 25.0,
      gray_scale_variance_threshold: 100.0,
      anti_spoofing_threshold: 0.6,
      enroll_embeddings_compare: 1.9,
      threshold_user_too_far: 0.15,
      threshold_user_right: 0.2,
      threshold_user_left: 0.8,
      threshold_high_vertical_enroll: -0.2,
      threshold_down_vertical_enroll: 0.2,
    });

    if (bestImage) {
      setEnrollImageData(new ImageData(bestImage.imageData, bestImage.width, bestImage.height));
    }
  };

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    console.log("skipping antispoof?", skipAntispoofProcess);
    if (result.returnValue.status === 0) {
      if (result.returnValue.guid && result.returnValue.puid) {
        setEnrollGUID(result.returnValue.guid);
        setEnrollPUID(result.returnValue.puid);
        setEnrollAntispoofPerformed();
        setEnrollAntispoofStatus("");
        setEnrollValidationStatus("");
        setShowSuccess(true);
        disableButtons(false);
        enrollCount++;
        console.log("Enroll Count:", enrollCount);
      } else {
        if (result.returnValue.validation_status.length > 0) {
          setEnrollToken(result.returnValue.validation_status[0].enroll_token);
          setEnrollAntispoofPerformed(result.returnValue.validation_status[0].anti_spoof_performed);
          setEnrollAntispoofStatus(result.returnValue.validation_status[0].anti_spoof_status);
          setEnrollValidationStatus(result.returnValue.validation_status[0].status);

          if (skipAntispoofProcess) {
            if (result.returnValue.validation_status[0].status === 0) {
              enrollUserOneFa(result.returnValue.validation_status[0].enroll_token, skipAntispoofProcess);
            } else {
              enrollUserOneFa("", skipAntispoofProcess);
            }
          } else {
            if (
              result.returnValue.validation_status[0].anti_spoof_performed &&
              result.returnValue.validation_status[0].anti_spoof_status === 0 &&
              result.returnValue.validation_status[0].status === 0
            ) {
              if (result.returnValue.validation_status[0].enroll_token === enrollTokenCurrent && enrollTokenCurrent) {
                enrollCount++;
              } else {
                enrollCount = 1;
              }
              enrollUserOneFa(result.returnValue.validation_status[0].enroll_token, skipAntispoofProcess);
            } else {
              enrollUserOneFa("", skipAntispoofProcess);
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
        enrollUserOneFa(result.returnValue.validation_status[0].enroll_token, skipAntispoofProcess);
      } else {
        setEnrollToken("");
        setEnrollAntispoofPerformed("");
        setEnrollAntispoofStatus("");
        setEnrollValidationStatus("");
        enrollUserOneFa("", skipAntispoofProcess);
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
