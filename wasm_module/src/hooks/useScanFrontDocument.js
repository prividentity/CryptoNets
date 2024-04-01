import { useEffect, useState } from "react";
import { convertCroppedImage, scanFrontDocument as scanFrontDocumentModule } from "@privateid/cryptonets-web-sdk-alpha";

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
    if (result.doc_validation_status === 0) {
      setIsFound(true);
      setResultValue(result);
    } else {
      scanFrontDocument();
    }
  };

  const doConvert = async (message, imageData) => {
    try {
      if (imageData.data.length === imageData.width * imageData.height * 4) {
        const b64Converted = await convertCroppedImage(imageData.data, imageData.width, imageData.height);
        console.log(`${message}`, b64Converted);
        return b64Converted;
      }
    } catch (e) {
      console.log(e);
    }
  };

  // Cropped Document
  useEffect(() => {
    if (isFound && croppedDocumentImageData && returnValue) {
      if (croppedDocumentImageData?.length &&  returnValue?.cropped_document?.width) {
        const image = new ImageData(
          croppedDocumentImageData,
          returnValue.cropped_document.width,
          returnValue.cropped_document.height
        );
        console.log("cropped document image:", image);
        setCroppedDocumentImageData(image);
        if (image?.data?.length) {
          const b64 = doConvert("cropped document image:", image);
          setCroppedDocumentImage(b64)
        }
      }
    }
  }, [isFound, croppedDocumentImageData, returnValue]);

  useEffect(() => {
    if (isFound && predictMugshotRaw && returnValue) {
      console.log("before converting:", { isFound, predictMugshotRaw, returnValue });
      console.log("w x h", { w: returnValue?.cropped_mugshot?.width, h: returnValue.cropped_mugshot.height });

      const image = new ImageData(
        predictMugshotRaw,
        returnValue.cropped_mugshot.width,
        returnValue.cropped_mugshot.height
      );
      console.log("MugshotImageData", image);
      setPredictMugshotImageData(image);
      setIsMugshotFound(true);
      if (image?.data?.length) {
        const b64 = doConvert("cropped mugshot image:", image);
        setPredictMugshotImage(b64)
      }
    }
  }, [isFound, predictMugshotRaw, returnValue]);

  // Cropped Document
  useEffect(() => {
    if (isFound && inputImageData) {
      if (inputImage?.data?.lengh) {
        doConvert(inputImageData);
      }
    }
  }, [isFound, inputImageData]);

  const scanFrontDocument = async (functionLoop = true, uploadData = undefined) => {
    loop = functionLoop;
    const {
      result: resultData,
      croppedDocument,
      croppedMugshot,
      imageData,
    } = await scanFrontDocumentModule({
      callback: documentCallback,
      image: uploadData,
    });

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
