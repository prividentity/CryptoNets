import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk";


const useScanFrontDocumentWithoutPredict = (setShowSuccess) => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [isMugshotFound, setIsMugshotFound] = useState(null);

  // Getting mugshot from document scan
  const [predictMugshotRaw, setPredictMugshotRaw] = useState(null);
  const [predictMugshotWidth, setPredictMugshotWidth] = useState(null);
  const [predictMugshotHeight, setPredictMugshotHeight] = useState(null);
  const [predictMugshotImageData, setPredictMugshotImageData] = useState(null);
  const [predictMugshotImage, setPredictMugshotImage] = useState(null);

  // Cropped Front Document
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentWidth, setCroppedDocumentWidth] = useState(null);
  const [croppedDocumentHeight, setCroppedDocumentHeight] = useState(null);
  const [croppedDocumentImage, setCroppedDocumentImage] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
    if (
      (result.returnValue.op_status === 0 || result.returnValue.op_status === 10) &&
      result.returnValue.cropped_doc_width &&
      result.returnValue.cropped_face_width
    ) {
      setIsFound(true);
      setShowSuccess(true);
      setPredictMugshotHeight(result.returnValue.cropped_face_height);
      setPredictMugshotWidth(result.returnValue.cropped_face_width);
      setCroppedDocumentHeight(result.returnValue.cropped_doc_height)
      setCroppedDocumentWidth(result.returnValue.cropped_doc_width)
    } else {
      setIsFound(false);
      scanFrontDocument();
    }
  };

  const doConvert = async () => {
    const mugshotBase64 = await convertCroppedImage(predictMugshotRaw, predictMugshotWidth, predictMugshotHeight);
    console.log("Mugshot image:", mugshotBase64);
    setPredictMugshotImage(mugshotBase64);
    return mugshotBase64;
  };

  const convertCroppedDocument = async () => {
    const mugshotBase64 = await convertCroppedImage(croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight);
    console.log("Cropped Document:", mugshotBase64);
    setCroppedDocumentImage(mugshotBase64);
    return mugshotBase64;
  }

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
      setIsMugshotFound(true);
      doConvert();
    }
  }, [isFound, predictMugshotRaw, predictMugshotWidth, predictMugshotHeight]);

  const scanFrontDocument = async () => {
    const {
      result: resultData,
      croppedDocument,
      croppedMugshot,
    } = await isValidPhotoID("PHOTO_ID_FRONT", documentCallback, false, undefined, {
    });

    setPredictMugshotRaw(croppedMugshot);
    setCroppedDocumentImageData(croppedDocument);

    console.log(croppedDocument, croppedMugshot);

    console.log("Validate DL", resultData);
  };

  return {
    scanResult,
    scanFrontDocument,
    isFound,
    isMugshotFound,
    scannedIdData,
    predictMugshotImageData,
    predictMugshotImage,
    croppedDocumentImage,
  };
};

export default useScanFrontDocumentWithoutPredict;
