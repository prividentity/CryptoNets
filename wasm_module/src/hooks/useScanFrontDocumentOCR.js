import {  useState } from "react";
import {  scanFrontDocument as scanFrontDocumentModule } from "@privateid/cryptonets-web-sdk-alpha";

const useScanFrontDocumentOCR = (setShowSuccess) => {
  const [isFound, setIsFound] = useState(false);
  const [ageOCR, setAgeOCR] = useState(false);

  const [frontScanData, setFrontScanData] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
    setFrontScanData(result);
      if (result.doc_validation_status === 0 && result.age_from_ocr_text) {
        setAgeOCR(result.age_from_ocr_text)
        setIsFound(true);
    } else {
      scanFrontDocument();
    }
  };

  const scanFrontDocument = async (uploadData = undefined) => {
    await scanFrontDocumentModule({
      callback: documentCallback,
      image: uploadData,
      config: {
        calculate_age_from_ocr_text: true
      }
    });
  };

  return {
    scanFrontDocument,
    isFound,
      frontScanData,
      ageOCR
  };
};

export default useScanFrontDocumentOCR;
