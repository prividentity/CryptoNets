import { useState } from "react";
import { isValidPhotoID } from "@privateid/cryptonets-web-sdk";

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
        const { firstName, lastName, dateOfBirth, streetAddress1, state, city, postalCode, country } = resultData.userData;
        setScannedCodeData(JSON.stringify({firstName, lastName, dateOfBirth, streetAddress1, state, city, postalCode, country}));
      }
    }
  };

  return { scanBackDocument, scannedCodeData, scanResult , isFound };
};

export default useScanBackDocument;
