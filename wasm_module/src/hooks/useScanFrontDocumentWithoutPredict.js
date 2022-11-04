// NOT DONE
// STILL IN DEVELOPMENT

import { useState } from "react";
import { isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";

const useScanFrontDocumentWithoutPredict = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
  };

  const scanFrontDocument = async () => {
    const { result: resultData } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback,
      null,
      false
    );
    console.log("Validate DL", resultData);
    if (resultData.result === 0) {
        setIsFound(true);
    }
  };

  return {
    scanResult,
    scanFrontDocument,
    isFound,
    scannedIdData,
  };
};

export default useScanFrontDocumentWithoutPredict;
