import { useEffect, useState } from "react";
import { enroll, predictImageAge } from "@privateid/cryptonets-web-sdk-alpha";

let skipAntispoofProcess = false;
const useEnrollWithAge = (
  element = "userVideo",
  onSuccess,
  retryTimes = 4,
  deviceId = null,
  setShowSuccess,
  disableButtons
) => {
  const [ewaAntispoofPerformed, setEwaAntispoofPerformed] = useState(false);
  const [ewaAntispoofStatus, setEwaAntispoofStatus] = useState("");

  const [ewaValidationStatus, setEwaValidationStatus] = useState("");

  const [ewaGUID, setEwaGUID] = useState("");
  const [ewaPUID, setEwaPUID] = useState("");
  const [ewaToken, setEwaToken] = useState("");

  const [ewaImageData, setEwaImageData] = useState("");
  const [ewaAge, setEwaAge] = useState(null);

  const [doAge, setDoAge] = useState(false);

  let enrollTokenCurrent;
  const enrollWithAge = async (token = "") => {
    enrollTokenCurrent = token;
    disableButtons(true);
    // eslint-disable-next-line no-unused-vars
    const bestImage = await enroll(callback, {
      input_image_format: "rgba",
      mf_token: token,
    });

    if (bestImage) {
      setEwaImageData(new ImageData(bestImage.imageData, bestImage.width, bestImage.height));
    }
  };

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    console.log("skipping antispoof?", skipAntispoofProcess);
    if (result.returnValue.status === 0) {
      if (result.returnValue.guid && result.returnValue.puid) {
        setEwaGUID(result.returnValue.guid);
        setEwaPUID(result.returnValue.puid);
        setEwaAntispoofPerformed();
        setEwaAntispoofStatus("");
        setEwaValidationStatus("");
        setDoAge(true);
      } else {
        if (result.returnValue.validation_status.length > 0) {
          setEwaToken(result.returnValue.validation_status[0].enroll_token);
          setEwaAntispoofPerformed(result.returnValue.validation_status[0].anti_spoof_performed);
          setEwaAntispoofStatus(result.returnValue.validation_status[0].anti_spoof_status);
          setEwaValidationStatus(result.returnValue.validation_status[0].status);

          if (
            result.returnValue.validation_status[0].anti_spoof_performed &&
            result.returnValue.validation_status[0].anti_spoof_status === 0 &&
            result.returnValue.validation_status[0].status === 0
          ) {
            enrollWithAge(result.returnValue.validation_status[0].enroll_token, skipAntispoofProcess);
          } else {
            enrollWithAge("", skipAntispoofProcess);
          }
        } else {
          setEwaToken("");
          setEwaAntispoofPerformed("");
          setEwaAntispoofStatus("");
          setEwaValidationStatus("");
        }
      }
    } else {
      if (result.returnValue.validation_status.length > 0) {
        setEwaToken(result.returnValue.validation_status[0].enroll_token);
        setEwaAntispoofPerformed(result.returnValue.validation_status[0].anti_spoof_performed);
        setEwaAntispoofStatus(result.returnValue.validation_status[0].anti_spoof_status);
        setEwaValidationStatus(result.returnValue.validation_status[0].status);
        enrollWithAge(result.returnValue.validation_status[0].enroll_token, skipAntispoofProcess);
      } else {
        setEwaToken("");
        setEwaAntispoofPerformed("");
        setEwaAntispoofStatus("");
        setEwaValidationStatus("");
        enrollWithAge("", skipAntispoofProcess);
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
      setEwaImageData(imageData);
    };
  }

  const handleAgeCallback = (response) => {
    console.log("EWA Age:", response);
    if (
      (!response?.returnValue?.faces[0].anti_spoof_performed && response?.returnValue?.faces[0].status === 0) ||
      response?.returnValue?.faces[0].status === 20 ||
      response?.returnValue?.faces[0].status === 21
    ) {
      if (response?.returnValue?.faces[0].age > 0) {
        setEwaAge(response?.returnValue?.faces[0].age);
        setShowSuccess(true);
      }
    }

    disableButtons(false);
  };

  useEffect(() => {
    if (doAge && ewaImageData?.data && ewaImageData?.height) {
      predictImageAge(ewaImageData, handleAgeCallback);
    }
  }, [ewaImageData,doAge]);

  return {
    ewaGUID,
    ewaPUID,
    ewaAntispoofPerformed,
    ewaAntispoofStatus,
    ewaValidationStatus,
    ewaToken,
    enrollWithAge,
    ewaAge,
  };
};

export default useEnrollWithAge;
