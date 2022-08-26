import { useState } from "react";
import { isValidPhotoID } from "@privateid/privid-fhe-modules";

const useScanBackDocument = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedCodeData, setScannedCodeData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  const documentCallback = (result) => {
    console.log("Back scan callback result:", result)
    if (result.result === 0) {
      setIsFound(true);
      setScannedCodeData(result.userData);
    }
  };

  const scanBackDocument = async () => {
    const { result: resultData } = await isValidPhotoID(
      "PHOTO_ID_BACK",
      documentCallback
    );
    if (resultData === "error") {
      setScanResult({ error: "Something went wrong." });
    } else {
      if(!scannedCodeData && resultData.result === 0){
        setScannedCodeData(JSON.stringify(resultData.userData));
      }
    }
  };

  return { scanBackDocument, scannedCodeData, scanResult , isFound };
};

export default useScanBackDocument;
