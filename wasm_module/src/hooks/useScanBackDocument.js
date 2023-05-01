import { useEffect, useState } from "react";
import { convertCroppedImage, isValidPhotoID } from "@privateid/cryptonets-web-sdk-alpha";
import { CANVAS_SIZE } from "../utils";

let internalCanvasSize;
const useScanBackDocument = (setShowSuccess) => {
  const [scannedCodeData, setScannedCodeData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  // Input image
  const [inputImageData, setInputImageData] = useState(null);
  const [inputImage, setInputImage] = useState(null);

  // Cropped Document
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentWidth, setCropedDocumentWidth] = useState(null);
  const [croppedDocumentHeight, setCroppedDocumentHeight] = useState(null);
  const [croppedDocumentImage, setCroppedDocumentImage] = useState(null);

  // Cropped Barcode
  const [croppedBarcodeImageData, setCroppedBarcodeImageData] = useState(null);
  const [croppedBarcodeWidth, setCroppedBarcodeWidth] = useState(null);
  const [croppedBarcodeHeight, setCroppedBarcodeHeight] = useState(null);
  const [croppedBarcodeImage, setCroppedBarcodeImage] = useState(null);

  const [barcodeStatusCode, setBarcodeStatusCode] = useState(null);

  const documentCallback = (result) => {
    console.log("--------- Back scan callback result:", result);
    console.log("--------- returnedValue:", result.returnValue);
    if (result.status === "WASM_RESPONSE") {
      setBarcodeStatusCode(result.returnValue.op_status);
      if (result.returnValue.op_status === 0) {
        const {
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          streetAddress1,
          streetAddress2,
          state,
          city,
          postCode,
          issuingCountry,
          crop_doc_width,
          crop_doc_height,
          crop_barcode_width,
          crop_barcode_height,
        } = result.returnValue;
        const finalResult = {
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          streetAddress1,
          streetAddress2,
          state,
          city,
          postCode,
          issuingCountry,
        };
        setCropedDocumentWidth(crop_doc_width);
        setCroppedDocumentHeight(crop_doc_height);
        setCroppedBarcodeWidth(crop_barcode_width);
        setCroppedBarcodeHeight(crop_barcode_height);
        setIsFound(true);
        setScannedCodeData(finalResult);
        setShowSuccess(true);
        return finalResult;
      } else if (result.returnValue.op_status === 3) {
        const {
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          streetAddress1,
          streetAddress2,
          state,
          city,
          postCode,
          issuingCountry,
          crop_doc_width,
          crop_doc_height,
          crop_barcode_width,
          crop_barcode_height,
        } = result.returnValue;
        const finalResult = {
          firstName,
          middleName,
          lastName,
          dateOfBirth,
          gender,
          streetAddress1,
          streetAddress2,
          state,
          city,
          postCode,
          issuingCountry,
        };
        setCropedDocumentWidth(crop_doc_width);
        setCroppedDocumentHeight(crop_doc_height);
        setCroppedBarcodeWidth(crop_barcode_width);
        setCroppedBarcodeHeight(crop_barcode_height);
        setIsFound(true);
        setScannedCodeData(finalResult);
        setShowSuccess(true);
        scanBackDocument();
        return finalResult;
      } else {
        setCropedDocumentWidth(null);
        setCroppedDocumentHeight(null);
        setCroppedBarcodeWidth(null);
        setCroppedBarcodeHeight(null);
      }
    }
    setCroppedDocumentImageData(null);
    setCroppedBarcodeImageData(null);
    setInputImageData(null);
    scanBackDocument();
  };

  const convertImageData = async (imageData, width, height, setState, message = "") => {
    if (width * height * 4 === imageData.length) {
      const convertedImage = await convertCroppedImage(imageData, width, height);
      console.log(message, convertedImage);
      setState(convertedImage);
    }
  };

  useEffect(() => {
    if (isFound && croppedDocumentImageData && croppedDocumentWidth && croppedDocumentHeight) {
      convertImageData(croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight, setCroppedDocumentImage);
    }
  }, [isFound, croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight]);

  useEffect(() => {
    if (isFound && croppedBarcodeImageData && croppedBarcodeWidth && croppedBarcodeHeight) {
      convertImageData(
        croppedBarcodeImageData,
        croppedBarcodeWidth,
        croppedBarcodeHeight,
        setCroppedBarcodeImage,
        "Barcode:"
      );
    }
  }, [isFound, croppedBarcodeImageData, croppedBarcodeWidth, croppedBarcodeHeight]);

  useEffect(() => {
    if (isFound && inputImageData) {
      convertImageData(inputImageData.data, inputImageData.width, inputImageData.height, setInputImage);
    }
  }, [isFound, inputImageData]);

  useEffect(() => {
    if (croppedDocumentImage && croppedBarcodeImage && inputImage) {
      console.log("Barcode Images:", { inputImage, croppedBarcodeImage, croppedDocumentImage });
    }
  }, [croppedDocumentImage, croppedBarcodeImage, inputImage]);

  const scanBackDocument = async (canvasSize) => {
    if (canvasSize && canvasSize !== internalCanvasSize) {
      internalCanvasSize = canvasSize;
    }
    const canvasObj = canvasSize ? CANVAS_SIZE[canvasSize] : internalCanvasSize ? CANVAS_SIZE[internalCanvasSize] : {};
    const { result, croppedBarcode, croppedDocument, imageData } = await isValidPhotoID(
      "PHOTO_ID_BACK",
      documentCallback,
      true,
      undefined,
        { document_scan_barcode_only: true},
      canvasObj
    );
    setCroppedDocumentImageData(croppedDocument);
    setCroppedBarcodeImageData(croppedBarcode);
    setInputImageData(imageData);
  };

  return { scanBackDocument, scannedCodeData, isFound, croppedDocumentImage, croppedBarcodeImage, barcodeStatusCode };
};

export default useScanBackDocument;
