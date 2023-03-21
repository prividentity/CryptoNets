import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk";

const useScanFrontDocumentWithoutPredictGetMugShot = (setShowSuccess, onMugshotSuccess) => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  // Getting mugshot from document scan
  const [predictMugshotRaw, setPredictMugshotRaw] = useState(null);
  const [predictMugshotWidth, setPredictMugshotWidth] = useState(null);
  const [predictMugshotHeight, setPredictMugshotHeight] = useState(null);
  const [predictMugshotImageData, setPredictMugshotImageData] = useState(null);

  const documentCallback = (result) => {
    // console.log("Front scan callback result:", result);
    console.log("TIMESTAMP-Callback: ", new Date());
    console.timeEnd("frontDocument");
    if ( result.returnValue.op_status === 0 && result.returnValue.cropped_face_height) {
      setIsFound(true);
      setShowSuccess(true);
      setPredictMugshotHeight(result.returnValue.cropped_face_height);
      setPredictMugshotWidth(result.returnValue.cropped_face_width);
    } else {
      setIsFound(false);
      setPredictMugshotHeight(null);
      setPredictMugshotWidth(null);
      scanFrontDocument();
    }
    // scanFrontDocument();
  };

  const doConvert = async () => {
    const mugshotBase64 = await convertCroppedImage(predictMugshotRaw, predictMugshotWidth, predictMugshotHeight);
    console.log("Mugshot image:", mugshotBase64);
    return mugshotBase64;
  };

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
    } = await isValidPhotoID("PHOTO_ID_FRONT", documentCallback, false);

    setPredictMugshotRaw(croppedMugshot);

    console.log(croppedDocument, croppedMugshot);

    console.log("Validate DL", resultData);
  };

  return {
    scanResult,
    scanFrontDocument,
    isFound,
    scannedIdData,
    predictMugshotImageData,
  };
};

export default useScanFrontDocumentWithoutPredictGetMugShot;
