import { useState } from "react";
import { isValidPhotoID } from "@privateid/cryptonets-web-sdk";

const useScanFrontDocument = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [resultStatus, setResultStatus] = useState(null)

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result)
    if (result.result === 0) {
      setIsFound(true);
      setScannedIdData(result.returnValue);
    } 
  };

  const scanFrontDocument = async () => {
    const { result: resultData } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback
    );
    if (resultData === "error") {
      setScanResult({ error: "Something went wrong." });
    } else {
      const { result, confScore, href, userData } = resultData;
      console.log(result, userData, confScore ,href)
      setResultStatus(result)
      setScanResult(userData);
    }
  };

  return { scanResult, scanFrontDocument, isFound, scannedIdData, resultStatus };
};

export default useScanFrontDocument;
