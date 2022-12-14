import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";
import { CANVAS_SIZE } from "../utils";

let internalCanvasSize;
let triggerValue;
const useScanFrontDocument = (onSuccess) => {
  const [isFound, setIsFound] = useState(false);
  const [resultStatus, setResultStatus] = useState(null);
  const [documentUUID, setDocumentUUID] = useState(null);
  const [documentGUID, setDocumentGUID] = useState(null);
  const [shouldTriggerCallback, setShouldTriggerCallback] = useState(true);
  triggerValue = shouldTriggerCallback;

  // Input Image
  const [inputImageData, setInputImageData] = useState(null);
  const [inputImage, setInputImage] = useState(null);

  // Cropped Front Document
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentWidth, setCroppedDocumentWidth] = useState(null);
  const [croppedDocumentHeight, setCroppedDocumentHeight] = useState(null);
  const [croppedDocumentImage, setCroppedDocumentImage] = useState(null);

  // Cropped Mugshot
  const [croppedMugshotImageData, setCroppedMugshotImageData] = useState(null);
  const [croppedMugshotWidth, setCroppedMugshotWidth] = useState(null);
  const [croppedMugshotHeight, setCroppedMugshotHeight] = useState(null);
  const [croppedMugshotImage, setCroppedMugshotImage] = useState(null);

  const documentCallback = (result) => {
    console.log("Front scan callback result:", result);
    if (result.returnValue.predict_status === 0) {
      const { predict_status, uuid, guid, cropped_face_height, cropped_face_width, int_doc_width, int_doc_height } =
        result.returnValue;

      setIsFound(true);
      setResultStatus(predict_status);
      setDocumentUUID(uuid);
      setDocumentGUID(guid);

      setCroppedMugshotWidth(cropped_face_width);
      setCroppedMugshotHeight(cropped_face_height);

      setCroppedDocumentHeight(int_doc_height);
      setCroppedDocumentWidth(int_doc_width);
    } else if (triggerValue) {
      setInputImageData(null);
      setCroppedDocumentImageData(null);
      setCroppedMugshotImageData(null);
      scanFrontDocument();
    }
  };

  const convertImage = async (imageData, width, height, setState) => {
    if (imageData.length === width * height * 4) {
      const convertedImage = await convertCroppedImage(imageData, width, height);
      setState(convertedImage);
    }
  };

  // InputImage
  useEffect(() => {
    if (isFound && inputImageData) {
      convertImage(inputImageData.data, inputImageData.width, inputImageData.height, setInputImage);
    }
  }, [isFound, inputImageData]);

  // Cropped Document
  useEffect(() => {
    if (isFound && croppedDocumentImageData && croppedDocumentWidth && croppedDocumentHeight) {
      console.log("before converting cropped face: ", {
        croppedDocumentImageData,
        croppedDocumentWidth,
        croppedDocumentHeight,
      });
      convertImage(croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight, setCroppedDocumentImage);
    }
  }, [isFound, croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight]);

  // Cropped Mugshot
  useEffect(() => {
    if (isFound && croppedMugshotImageData && croppedMugshotWidth && croppedMugshotHeight) {
      console.log("before converting cropped face: ", {
        croppedMugshotImageData,
        croppedMugshotWidth,
        croppedMugshotHeight,
      });
      convertImage(croppedMugshotImageData, croppedMugshotWidth, croppedMugshotHeight, setCroppedMugshotImage);
    }
  }, [isFound, croppedMugshotImageData, croppedMugshotWidth, croppedMugshotHeight]);

  // Printing images
  useEffect(() => {
    if (croppedDocumentImage && croppedMugshotImage && inputImage) {
      console.log("FRONT DL SCAN IMAGES:", { croppedDocumentImage, croppedMugshotImage, inputImage });
    }
  }, [croppedDocumentImage, croppedMugshotImage, inputImage]);

  const scanFrontDocument = async (canvasSize, initializeCanvas) => {
    if (canvasSize && canvasSize !== internalCanvasSize) {
      internalCanvasSize = canvasSize;
    }
    const canvasObj = canvasSize ? CANVAS_SIZE[canvasSize] : internalCanvasSize ? CANVAS_SIZE[internalCanvasSize] : {};
    const { result, imageData, croppedDocument, croppedMugshot } = await isValidPhotoID(
      "PHOTO_ID_FRONT",
      documentCallback,
      true,
      undefined,
      undefined,
      canvasObj
    );
    setInputImageData(imageData);
    setCroppedDocumentImageData(croppedDocument);
    setCroppedMugshotImageData(croppedMugshot);

    onSuccess({ result, imageData, croppedDocument, croppedMugshot });
  };

  return {
    scanFrontDocument,
    isFound,
    setIsFound,
    resultStatus,
    documentUUID,
    documentGUID,
    setShouldTriggerCallback,
    inputImage,
    croppedDocumentImage,
    croppedMugshotImage,
  };
};

export default useScanFrontDocument;
