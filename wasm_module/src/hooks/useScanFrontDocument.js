import { useState } from "react";
import { isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";

const useScanFrontDocument = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  const [documentUUID, setDocumentUUID] = useState(null);
  const [documentGUID, setDocumentGUID] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result)
    if (result.returnValue.status === 0) {
      setIsFound(true);
      setResultStatus(result.returnValue.status);
      setDocumentUUID(result.returnValue.PI.uuid);
      setDocumentGUID(result.returnValue.PI.guid);
    } 
  };

  const scanFrontDocument = async () => {
    const { result: resultData } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback
    );
  };

  return { scanResult, scanFrontDocument, isFound, scannedIdData, resultStatus, documentUUID, documentGUID };
};

export default useScanFrontDocument;
