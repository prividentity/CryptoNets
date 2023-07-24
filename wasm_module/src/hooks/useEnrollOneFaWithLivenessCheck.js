import { useState } from "react";
import { enroll1FA } from "@privateid/cryptonets-web-sdk-test";

const useEnrollOneFaWithLiveness = (
  element = "userVideo",
  onSuccess,
  retryTimes = 4,
  deviceId = null,
  setShowSuccess
) => {
  const [enrollOneFaWithLivenessFaceDetected, setEnrollOneFaWithLivenessFaceDetected] = useState(false);
  const [enrollOneFaWithLivenessStatus, setEnrollOneFaWithLivenessStatus] = useState(null);
  const [enrollOneFaWithLivenessProgress, setEnrollOneFaWithLivenessProgress] = useState(0);
  const [enrollOneFaWithLivenessData, setEnrollOneFaWithLivenessData] = useState(null);
  const [enrollPortraitWithLiveness, setEnrollPortraitWithLiveness] = useState(null);

  const [enrollImageDataWithLiveness, setEnrollImageDataWithLiveness] = useState(null);

  const [enrollOneFaWithLivenessCheckStatus, setEnrollOneFaWithLivenessCheckStatus] = useState(null);

  let showError = false;

  const enrollUserOneFaWithLiveness = async () => {
    setEnrollOneFaWithLivenessFaceDetected(false);
    setEnrollOneFaWithLivenessStatus(null);
    setEnrollOneFaWithLivenessProgress(0);
    setEnrollOneFaWithLivenessData(null);
    // eslint-disable-next-line no-unused-vars
    await enroll1FA(
      callback,
      {
        send_original_images: false,
        // face_thresholds_rem_bad_emb: 0.96,
      },
      true
    );
  };

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);
    
    switch (result.status) {
      case "VALID_FACE":
        console.log("VALID FACE: ", result);
        setEnrollOneFaWithLivenessFaceDetected(true);
        setEnrollOneFaWithLivenessStatus("Please Hold Position");
        setEnrollOneFaWithLivenessProgress(result.progress);
        setEnrollOneFaWithLivenessCheckStatus(result?.livenessCheck);
        break;
      case "INVALID_FACE":
        console.log("INVALID FACE: ", result);
        if (!showError) {
          showError = true;
          setEnrollOneFaWithLivenessStatus(result.message);
          setEnrollOneFaWithLivenessFaceDetected(false);
          setEnrollOneFaWithLivenessCheckStatus(result?.livenessCheck);
          setTimeout(() => {
            showError = false;
          }, 500);
        }
        break;
      case "ENROLLING":
        setEnrollOneFaWithLivenessStatus("ENROLLING");
        setEnrollOneFaWithLivenessFaceDetected(true);
        break;
      case "WASM_RESPONSE":
        console.log("WASM RESPONSE");
        if (result.returnValue?.status === 0) {
          setEnrollOneFaWithLivenessStatus("ENROLL SUCCESS");
          setEnrollOneFaWithLivenessData(result.returnValue);
          onSuccess(result.returnValue);
          setEnrollPortraitWithLiveness(result.portrait);
          convertBase64ToImageData(result.portrait, setEnrollImageDataWithLiveness);
          setShowSuccess(true);
          setEnrollOneFaWithLivenessCheckStatus(0);
        }
        if (
          result.returnValue?.status === -1 ||
          result.returnValue?.status === -100 ||
          result.returnValue?.error === -1
        ) {
          setEnrollOneFaWithLivenessStatus("ENROLL FAILED, PLEASE TRY AGAIN");
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

  return {
    enrollOneFaWithLivenessFaceDetected,
    enrollOneFaWithLivenessStatus,
    enrollOneFaWithLivenessData,
    enrollUserOneFaWithLiveness,
    enrollOneFaWithLivenessProgress,
    enrollPortraitWithLiveness,
    enrollImageDataWithLiveness,
    enrollOneFaWithLivenessCheckStatus,
  };
};

export default useEnrollOneFaWithLiveness;
