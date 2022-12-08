import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk";
import { CANVAS_SIZE } from "../utils";

let internalCanvasSize;
const useScanBackDocument = (onSuccess) => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedCodeData, setScannedCodeData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  const [imageData, setImageData] = useState(null);
  const [cropImageWidth, setCropImageWidth] = useState(null);
  const [cropImageHeight, setCropImageHeight] = useState(null);

  const [image, setImage] = useState(null);

  const documentCallback = (result) => {
    console.log("--------- Back scan callback result:", result);
    console.log("--------- returnedValue:", result.returnValue);
    if (result.status === "WASM_RESPONSE") {
      if (result.returnValue.op_status === 0) {
        const {
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          streetAddress1,
          streetAddress2,
          state,
          city,
          postCode,
          issuingCountry,
          crop_doc_width,
          crop_doc_height,
        } = result.returnValue;
        const finalResult = {
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          streetAddress1,
          streetAddress2,
          state,
          city,
          postCode,
          issuingCountry,
        };
        setCropImageWidth(crop_doc_width);
        setCropImageHeight(crop_doc_height);
        setIsFound(true);
        setScannedCodeData(finalResult);
        return finalResult;
      } else {
        setCropImageWidth(null);
        setCropImageHeight(null);
      }
    }
    setImageData(null);
    scanBackDocument();
  };

  useEffect(() => {
    const convertImageData = async () => {
      const convertedImage = await convertCroppedImage(imageData, cropImageWidth, cropImageHeight);
      console.log("converted Image to base64", convertedImage);
      setImage(convertedImage);
    };
    if (isFound && cropImageHeight && cropImageWidth && imageData) {
      convertImageData();
    }
  }, [isFound, cropImageWidth, cropImageHeight, imageData]);

  const scanBackDocument = async (canvasSize) => {
    if (canvasSize && canvasSize !== internalCanvasSize) {
      internalCanvasSize = canvasSize;
    }
    const canvasObj = canvasSize
      ? CANVAS_SIZE[canvasSize]
      : internalCanvasSize
      ? CANVAS_SIZE[internalCanvasSize]
      : { width: 10240, height: 4320 };
    console.log({ canvasObj });
    const data = await isValidPhotoID("PHOTO_ID_BACK", documentCallback, true, undefined, undefined, canvasObj);
    if (data.result === 0) {
      setImageData(data.croppedBarcode);
    } else {
      setImageData(null);
    }
    onSuccess(data);
  };

  return { scanBackDocument, scannedCodeData, scanResult, isFound, image };
};

export default useScanBackDocument;
