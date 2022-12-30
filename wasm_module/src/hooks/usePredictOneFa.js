import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk-alpha";

const usePredictOneFa = (
  element = "userVideo",
  onSuccess,
  retryTimes = 4,
  deviceId = null
) => {
  const [predictOneFaaceDetected, setFaceDetected] = useState(false);
  const [predictOneFaStatus, setPredictStatus] = useState(null);
  const [predictOneFaprogress, setProgress] = useState(0);
  const [predictOneFaData, setPredictData] = useState(null);

  let tries = 0;

  const predictUserOneFa = async () => {
    setFaceDetected(false);
    setPredictData(null);
    // eslint-disable-next-line no-unused-vars
    await predict1FA(
      callback,
      {
        input_image_format: "rgba",
        send_original_images: true,
        original_image_width: 500,
        original_image_height: 500,
      },
      element,
      deviceId
    );
  };

  function wait(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  const getDisplayedMessage = (result) => {
    switch (result) {
      case -1:
        return "Please look at the camera";
      case 0:
        return "Face detected";
      case 1:
        return "Image Spoof";
      case 2:
        return "Video Spoof";
      case 3:
        return "Video Spoof";
      case 4:
        return "Too far away";
      case 5:
        return "Too far to right";
      case 6:
        return "Too far to left";
      case 7:
        return "Too far up";
      case 8:
        return "Too far down";
      case 9:
        return "Too blurry";
      case 10:
        return "PLEASE REMOVE EYEGLASSES";
      case 11:
        return "PLEASE REMOVE FACEMASK";
      default:
        return "";
    }
  };

  const callback = async (result) => {
    console.log("predict callback hook result:", result);
    switch (result.status) {
      case "VALID_FACE":
        setFaceDetected(true);
        setPredictStatus(null);
        setProgress(result.progress);
        break;
      case "INVALID_FACE":
        if (predictOneFaStatus && predictOneFaStatus?.length > 0) {
          wait(1500);
          setPredictStatus(getDisplayedMessage(result.result));
        } else {
          setPredictStatus(getDisplayedMessage(result.result));
        }

        setFaceDetected(false);
        break;
      case "ENROLLING":
        setPredictStatus("ENROLLING");
        setFaceDetected(true);
        break;
      case "WASM_RESPONSE":
        if (result.returnValue?.status === 0) {
          setPredictStatus("ENROLL SUCCESS");
          setPredictData(result.returnValue);
          onSuccess(result.returnValue);
        }
        if (result.returnValue?.status === -1) {
          if (tries === retryTimes) {
            // onFailure();
          } else {
            tries += 1;
            // enrollUserOneFa();
          }
        }
        break;
      default:
    }
  };

  return {
    predictOneFaaceDetected,
    predictOneFaStatus,
    predictOneFaData,
    predictUserOneFa,
    predictOneFaprogress,
  };
};

export default usePredictOneFa;
