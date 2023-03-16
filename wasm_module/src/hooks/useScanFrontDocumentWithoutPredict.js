import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";

const useScanFrontDocumentWithoutPredict = (setShowSuccess) => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  // Getting mugshot from document scan
  const [predictMugshotRaw, setPredictMugshotRaw ] = useState(null);
  const [predictMugshotWidth, setPredictMugshotWidth] = useState(null);
  const [predictMugshotHeight, setPredictMugshotHeight] = useState(null);
  const [predictMugshotImageData, setPredictMugshotImageData] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
    if (result.returnValue.op_status === 0) {
      setIsFound(true);
      setShowSuccess(true);
      setPredictMugshotHeight(result.returnValue.cropped_face_height);
      setPredictMugshotWidth(result.returnValue.cropped_face_width);
    }
    else {
      setIsFound(false);
      scanFrontDocument();
    }
  };

  const doConvert = async () => {
    const mugshotBase64 =  await convertCroppedImage(predictMugshotRaw, predictMugshotWidth, predictMugshotHeight);
    console.log("Mugshot image:", mugshotBase64);
    return mugshotBase64
  }
  

  useEffect(()=>{
    if( isFound && predictMugshotRaw && predictMugshotWidth && predictMugshotHeight ){
      const image = new ImageData(predictMugshotRaw, predictMugshotWidth, predictMugshotHeight);
      setPredictMugshotImageData(image);
      doConvert();
    }
  },[isFound, predictMugshotRaw, predictMugshotWidth, predictMugshotHeight])

  const scanFrontDocument = async () => {
    const { result: resultData, croppedDocument, croppedMugshot } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback,
      false
    );

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

export default useScanFrontDocumentWithoutPredict;
