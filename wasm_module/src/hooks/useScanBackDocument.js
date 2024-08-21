import { useEffect, useState } from "react";
import { convertCroppedImage, backScanDocument } from "@privateid/cryptonets-web-sdk-alpha";
import { CANVAS_SIZE } from "../utils";

let internalCanvasSize;
let loop = true;
const useScanBackDocument = (setShowSuccess) => {
  const [scannedCodeData, setScannedCodeData] = useState(null);
  const [isFound, setIsFound] = useState(false);

  // Input image
  const [inputImageData, setInputImageData] = useState(null);
  const [inputImage, setInputImage] = useState(null);

  // Cropped Document
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentImage, setCroppedDocumentImage] = useState(null);

  // Cropped Barcode
  const [croppedBarcodeImageData, setCroppedBarcodeImageData] = useState(null);
  const [croppedBarcodeImage, setCroppedBarcodeImage] = useState(null);

  const [barcodeStatusCode, setBarcodeStatusCode] = useState(null);
  const [returnValue, setResultValue] = useState(null);

  const documentCallback = (result) => {
    console.log("--------- Back scan callback result:", result);

    if(result.barcode_scan){
      if (result.barcode_detection_status === 0) {
        setBarcodeStatusCode(0);
        setIsFound(true);
        setResultValue(result);
        setScannedCodeData(result);
      } else {
        setBarcodeStatusCode(result.document_validation_status || result.barcode_detection_status);
        doScanBackDocument();
      }
    }
    else{
      if(result.doc_validation_status === 0){
        setBarcodeStatusCode(0);
        setIsFound(true);
        setResultValue(result);
        setScannedCodeData(result);
      } 
      else{
        setBarcodeStatusCode(result.doc_validation_status);
        doScanBackDocument();
      }
    }

  
  };

  const doConvert = async (message, imageData) => {
    try {
      if (imageData.data.length === imageData.width * imageData.height * 4) {
        const b64Converted = await convertCroppedImage(imageData.data, imageData.width, imageData.height);
        console.log(`${message}`, b64Converted);
        return b64Converted;
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (isFound && croppedDocumentImageData && returnValue) {
      console.log("cropped document start: ", { isFound, croppedDocumentImageData, returnValue });
      if (croppedDocumentImageData?.length && returnValue?.cropped_document?.width) {
        if (
          croppedDocumentImageData.length ===
          returnValue.cropped_document.width * returnValue.cropped_document.height * 4
        ) {
          const image = new ImageData(
            croppedDocumentImageData,
            returnValue.cropped_document.width,
            returnValue.cropped_document.height
          );
          console.log("cropped document image:", image);
          setCroppedDocumentImageData(image);
          if (image?.data?.length) {
            const b64 = doConvert("cropped document image:", image);
            setCroppedDocumentImage(b64);
          }
        }
      }
    }
  }, [isFound, croppedDocumentImageData, returnValue]);

  useEffect(() => {
    if (isFound && croppedBarcodeImageData && returnValue) {
      console.log("cropped barcode start: ", { isFound, croppedBarcodeImageData, returnValue });
      console.log("data length:", croppedBarcodeImageData?.length);
      if (croppedBarcodeImageData?.length && returnValue?.cropped_barcode?.width) {
        console.log("converting?");
        if (
          croppedBarcodeImageData.length ===
          returnValue.cropped_barcode.width * returnValue.cropped_barcode.height * 4
        ) {
          const image = new ImageData(
            croppedBarcodeImageData,
            returnValue.cropped_barcode.width,
            returnValue.cropped_barcode.height
          );
          console.log("cropped barcode image:", image);
          setCroppedDocumentImageData(image);
          if (image?.data?.length) {
            const b64 = doConvert("cropped barcode image:", image);
            setCroppedDocumentImage(b64);
          }
        }
      }
    }
  }, [isFound, croppedBarcodeImageData, returnValue]);

  useEffect(() => {
    if (isFound && inputImageData) {
      if (isFound && inputImageData?.data?.length) {
        const b64 = doConvert("input image:", inputImageData);
        setCroppedDocumentImage(b64);
      }
    }
  }, [isFound, inputImageData]);

  const doScanBackDocument = async (canvasSize, functionLoop = false, uploadData = undefined) => {
    // const canvasObj = canvasSize ? CANVAS_SIZE[canvasSize] : internalCanvasSize ? CANVAS_SIZE[internalCanvasSize] : {};
    const { result, croppedBarcode, croppedDocument, imageData } = await backScanDocument({
      callback: documentCallback,
      // image: uploadData,
      config: {
        document_scan_barcode_only: true,
        blur_threshold_barcode: 1000,
        blur_threshold_doc: 1000,
        conf_score_thr_doc: 0.3,
        threshold_doc_too_close: 99,
        threshold_doc_too_far: 0,
        fingers_over_document_threshold: 0.3,
        barcode_margin: 0.1,
      },
    });
    console.log({ croppedBarcode, croppedDocument, imageData });
    setCroppedBarcodeImageData(croppedBarcode);
    setCroppedDocumentImageData(croppedDocument);
    setInputImageData(imageData);
  };

  const clearStatusBackScan = () => {
    setIsFound(false);
    setScannedCodeData(null);
    setInputImageData(null);
    setInputImage(null);
    setCroppedDocumentImageData(null);
    setCroppedDocumentImage(null);
    setCroppedBarcodeImageData(null);
    setCroppedBarcodeImage(null);
    setBarcodeStatusCode(null);
    setResultValue(null);
  };

  return {
    scanBackDocument: doScanBackDocument,
    scannedCodeData,
    isFound,
    croppedDocumentImage,
    croppedBarcodeImage,
    barcodeStatusCode,
    clearStatusBackScan,
  };
};

export default useScanBackDocument;
