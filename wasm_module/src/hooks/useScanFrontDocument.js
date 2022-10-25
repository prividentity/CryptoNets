import { useState } from "react";
import { isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";

const useScanFrontDocument = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [resultStatus, setResultStatus] = useState(null)

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result)
    // if (result.result === 0) {
    //   setIsFound(true);
    //   setScannedIdData(result.returnValue);
    // } 
  };

  const scanFrontDocument = async () => {
    const { result: resultData } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback
    );
    console.log("resultDATA?",resultData)
    if (resultData === "error") {
      setScanResult({ error: "Something went wrong." });
    } else {
      if(resultData.result===0){
        const { result, confScore, href, userData } = resultData;
        console.log("data?", result, userData, confScore ,href)
        setResultStatus(result)
        setScanResult(userData);
        setIsFound(true);
      }
    }
  };

  return { scanResult, scanFrontDocument, isFound, scannedIdData, resultStatus };
};

export default useScanFrontDocument;
