import { useEffect, useState, useRef } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk";
import { getScaledBoundingBox } from "../utils";

const useScanFrontDocumentWithoutPredictGetMugShot = (setShowSuccess, onMugshotSuccess, config) => {
  const scaledBoundingBoxRef = useRef(null);
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  // Getting mugshot from document scan
  const [predictMugshotRaw, setPredictMugshotRaw] = useState(null);
  const [predictMugshotWidth, setPredictMugshotWidth] = useState(null);
  const [predictMugshotHeight, setPredictMugshotHeight] = useState(null);
  const [predictMugshotImageData, setPredictMugshotImageData] = useState(null);

  // Cropped Front Document
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentWidth, setCroppedDocumentWidth] = useState(null);
  const [croppedDocumentHeight, setCroppedDocumentHeight] = useState(null);
  const [croppedDocumentImage, setCroppedDocumentImage] = useState(null);

  let running = false;

  const documentCallback = (result) => {
    console.log("Status code:", result.returnValue.op_status);
    console.log("Result:", result);
    if (result.status === "WASM_RESPONSE") {
      if (result.returnValue.op_status === 0 && result.returnValue.cropped_face_height) {
        setIsFound(true);
        setShowSuccess(true);
        setPredictMugshotHeight(result.returnValue.cropped_face_height);
        setPredictMugshotWidth(result.returnValue.cropped_face_width);
        setCroppedDocumentHeight(result.returnValue.cropped_doc_height);
        setCroppedDocumentWidth(result.returnValue.cropped_doc_width);
      } else {
        setIsFound(false);
        setPredictMugshotHeight(null);
        setPredictMugshotWidth(null);
        setCroppedDocumentHeight(null);
        setCroppedDocumentWidth(null);
        scanFrontDocument();
      }
    }
  };

  const doConvert = async () => {
    const mugshotBase64 = await convertCroppedImage(predictMugshotRaw, predictMugshotWidth, predictMugshotHeight);
    console.log("Mugshot image:", mugshotBase64);
    return mugshotBase64;
  };

  const convertCroppedDocument = async () => {
    const mugshotBase64 = await convertCroppedImage(
      croppedDocumentImageData,
      croppedDocumentWidth,
      croppedDocumentHeight
    );
    console.log("Cropped Document:", mugshotBase64);
    setCroppedDocumentImage(mugshotBase64);
    return mugshotBase64;
  };

  // Cropped Document
  useEffect(() => {
    if (isFound && croppedDocumentImageData && croppedDocumentWidth && croppedDocumentHeight) {
      console.log("before converting cropped face: ", {
        croppedDocumentImageData,
        croppedDocumentWidth,
        croppedDocumentHeight,
      });
      convertCroppedDocument();
    }
  }, [isFound, croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight]);

  useEffect(() => {
    if (isFound && predictMugshotRaw && predictMugshotWidth && predictMugshotHeight) {
      const image = new ImageData(predictMugshotRaw, predictMugshotWidth, predictMugshotHeight);
      setPredictMugshotImageData(image);
      doConvert();
      onMugshotSuccess();
    }
  }, [isFound, predictMugshotRaw, predictMugshotWidth, predictMugshotHeight]);

  const scanFrontDocument = async () => {
    console.log("TIMESTAMP: ", new Date());
    console.time("frontDocument");
    const {
      result: resultData,
      croppedDocument,
      croppedMugshot,
    } = await isValidPhotoID("PHOTO_ID_FRONT", documentCallback, false, undefined, config || undefined);

    setPredictMugshotRaw(croppedMugshot);
    setCroppedDocumentImageData(croppedDocument);
    console.log(croppedDocument, croppedMugshot);

    console.log("Validate DL", resultData);
  };

  return {
    scanResult,
    scanFrontDocument,
    isFound,
    scannedIdData,
    predictMugshotImageData,
    croppedDocumentImage,
    scaledBoundingBoxRef,
  };
};

export default useScanFrontDocumentWithoutPredictGetMugShot;
