import { useState } from "react";
import { isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";
import { CANVAS_SIZE } from "../utils";

let internalCanvasSize;
const useScanFrontDocument = () => {
  const [scanResult, setScanResult] = useState(null);
  const [scannedIdData, setScannedIdData] = useState(null);
  const [isFound, setIsFound] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  const [documentUUID, setDocumentUUID] = useState(null);
  const [documentGUID, setDocumentGUID] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result)
    if (result.returnValue.predict_status === 0) {
      setIsFound(true);
      setResultStatus(result.returnValue.predict_status);
      setDocumentUUID(result.returnValue.uuid);
      setDocumentGUID(result.returnValue.guid);
    }
    else{
      scanFrontDocument();
    }
  };

  const scanFrontDocument = async (canvasSize) => {
    if (canvasSize && canvasSize !== internalCanvasSize) {
      internalCanvasSize = canvasSize;
    }
    const canvasObj = canvasSize
      ? CANVAS_SIZE[canvasSize]
      : internalCanvasSize
      ? CANVAS_SIZE[internalCanvasSize]
      : { width: 10240, height: 4320 };
    console.log({canvasObj})
    const { result: resultData } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback,
      true,
      undefined,
      undefined,
      canvasObj
    );
  };

  return { scanResult, scanFrontDocument, isFound, scannedIdData, resultStatus, documentUUID, documentGUID };
};

export default useScanFrontDocument;
