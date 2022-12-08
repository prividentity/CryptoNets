import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";
import { CANVAS_SIZE } from "../utils";

let internalCanvasSize;
let triggerValue;
const useScanFrontDocument = (onSuccess) => {
  const [isFound, setIsFound] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  const [documentUUID, setDocumentUUID] = useState(null);
  const [documentGUID, setDocumentGUID] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [shouldTriggerCallback, setShouldTriggerCallback] = useState(true);
  triggerValue = shouldTriggerCallback;

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
    if (result.returnValue.predict_status === 0) {
      setIsFound(true);
      setResultStatus(result.returnValue.predict_status);
      setDocumentUUID(result.returnValue.uuid);
      setDocumentGUID(result.returnValue.guid);
      return result.returnValue;
    } else if (triggerValue) {
      setImageData(null);
      scanFrontDocument();
    }
  };

  useEffect(() => {
    const convertImage = async () => {
      const convertedImage = await convertCroppedImage(imageData.data, imageData.width, imageData.height);
      console.log("converted Image:", convertedImage);
      setBase64Image(convertedImage);
    };

    if(isFound) {
      convertImage();
    }
  }, [isFound, imageData]);

  const scanFrontDocument = async (canvasSize, initializeCanvas) => {
    if (canvasSize && canvasSize !== internalCanvasSize) {
      internalCanvasSize = canvasSize;
    }
    const canvasObj = canvasSize
      ? CANVAS_SIZE[canvasSize]
      : internalCanvasSize
      ? CANVAS_SIZE[internalCanvasSize]
      : {};
    const result = await isValidPhotoID(
        "PHOTO_ID_FRONT",
        initializeCanvas || documentCallback,
        true,
        undefined,
        undefined,
        canvasObj
    );
    const imageData = result.imageData;
    setImageData(imageData);
    onSuccess(result);
  };

  return { scanFrontDocument, isFound, resultStatus, documentUUID, documentGUID, base64Image, setShouldTriggerCallback, };
};

export default useScanFrontDocument;
