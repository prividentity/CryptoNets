import { useState } from "react";
import { convertCroppedImage, enroll1FA } from "@privateid/cryptonets-web-sdk-alpha";

const useEnrollOneFa = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [enrollData, setEnrollData] = useState(null);
  const [enrollPortrait, setEnrollPortrait] = useState(null);

  const [enrollImageData, setEnrollImageData] = useState(null);

  let showError = false;

  const enrollUserOneFa = async (config) => {
    setFaceDetected(false);
    setEnrollStatus(null);
    setProgress(0);
    setEnrollData(null);
    // eslint-disable-next-line no-unused-vars
   const {imageData, height, width} = await enroll1FA(callback, config || {
      send_original_images: false,
      threshold_high_vertical_enroll: -0.1,
      threshold_down_vertical_enroll: 0.1,
    });
   if(imageData) {
     setEnrollImageData(new ImageData(imageData, width, height));
   }
  };

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    switch (result.status) {
      case "VALID_FACE":
        setFaceDetected(true);
        setEnrollStatus("Please Hold Position");
        setProgress(result.progress);
        break;
      case "INVALID_FACE":
        console.log("INVALID FACE: ", result);
        if (!showError) {
          showError = true;
          setEnrollStatus(result.message);
          setFaceDetected(false);
          setTimeout(() => {
            showError = false;
          }, 500);
        }
        break;
      case "ENROLLING":
        setEnrollStatus("ENROLLING");
        setFaceDetected(true);
        break;
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          setEnrollStatus("ENROLL SUCCESS");
          setEnrollData(result.returnValue);
          onSuccess(result.returnValue);
          // setEnrollPortrait(result.portrait);
          // convertBase64ToImageData(result.portrait, setEnrollImageData);
          setShowSuccess(true);
        }
        if (
          result.returnValue?.status === -1 ||
          result.returnValue?.status === -100 ||
          result.returnValue?.error === -1
        ) {
          setEnrollStatus("ENROLL FAILED, PLEASE TRY AGAIN");
        }
        break;
      default:
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

  return { faceDetected, enrollStatus, enrollData, enrollUserOneFa, progress, enrollPortrait, enrollImageData };
};

export default useEnrollOneFa;
