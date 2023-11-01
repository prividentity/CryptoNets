import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk";

let loop = true;
const useScanFrontDocumentWithoutPredict = (setShowSuccess) => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [isMugshotFound, setIsMugshotFound] = useState(null);
  const [inputImageData, setInputImageData] = useState(null);
  const [inputImage, setInputImage] = useState(null);
  // Getting mugshot from document scan
  const [predictMugshotRaw, setPredictMugshotRaw] = useState(null);
  const [predictMugshotImageData, setPredictMugshotImageData] = useState(null);
  const [predictMugshotImage, setPredictMugshotImage] = useState(null);

  // Cropped Front Document
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentImage, setCroppedDocumentImage] = useState(null);
  const [returnValue, setResultValue] = useState(null);

  const [frontScanData, setFrontScanData] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
    setFrontScanData(result);
    if (
      result.returnValue.op_status === 0 &&
      result.returnValue.cropped_doc_width &&
      result.returnValue.cropped_face_width
    ) {
      setIsFound(true);
      setShowSuccess(true);
      setResultValue(result.returnValue);
      // setPredictMugshotHeight(result.returnValue.cropped_face_height);
      // setPredictMugshotWidth(result.returnValue.cropped_face_width);
      // setCroppedDocumentHeight(result.returnValue.cropped_doc_height)
      // setCroppedDocumentWidth(result.returnValue.cropped_doc_width)
    } else {
      setIsFound(false);
      if(loop){
        scanFrontDocument();
      }
    }
  };

  const doConvert = async () => {
    const mugshotBase64 = await convertCroppedImage(predictMugshotRaw, returnValue.cropped_face_width, returnValue.cropped_face_height);
    console.log("Mugshot image:", mugshotBase64);
    setPredictMugshotImage(mugshotBase64);
    return mugshotBase64;
  };

  const convertCroppedDocument = async () => {
    const mugshotBase64 = await convertCroppedImage(croppedDocumentImageData, returnValue.cropped_doc_width, returnValue.cropped_doc_height);
    console.log("Cropped Document:", mugshotBase64);
    setCroppedDocumentImage(mugshotBase64);
    return mugshotBase64;
  }

  const convertImageData = async () => {
    const inputImageBase64 = await convertCroppedImage(inputImageData, returnValue.image_width, returnValue.image_height);
    console.log("InputImage:", inputImageBase64);
    setInputImage(inputImageBase64)
    return inputImageBase64;
  }

  // Cropped Document
  useEffect(() => {
    if (isFound && croppedDocumentImageData && returnValue) {
      convertCroppedDocument();
    }
  }, [isFound, croppedDocumentImageData, returnValue]);

  useEffect(() => {
    if (isFound && predictMugshotRaw && returnValue) {
      const image = new ImageData(predictMugshotRaw, returnValue.cropped_face_width, returnValue.cropped_face_height);
      setPredictMugshotImageData(image);
      setIsMugshotFound(true);
      doConvert();
    }
  }, [isFound, predictMugshotRaw, returnValue]);

  // Cropped Document
  useEffect(() => {
    if (isFound && inputImageData) {
      convertImageData();
    }
  }, [isFound, inputImageData]);

  const scanFrontDocument = async (functionLoop= true, uploadData = undefined) => {
    loop = functionLoop;
    const {
      result: resultData,
      croppedDocument,
      croppedMugshot,
      imageData
    } = await isValidPhotoID("PHOTO_ID_FRONT", documentCallback, uploadData, {
      input_image_format:"rgba",
      conf_score_thr_doc: 0.8,
      blur_threshold_doc: 2000
    },
    false
    );

    setPredictMugshotRaw(croppedMugshot);
    setCroppedDocumentImageData(croppedDocument);
    setInputImageData(imageData);
    console.log(croppedDocument, croppedMugshot, imageData);

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
    frontScanData,
  };
};

export default useScanFrontDocumentWithoutPredict;
