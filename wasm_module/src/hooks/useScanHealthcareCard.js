import { convertCroppedImage, scanHealthcareCard } from "@privateid/cryptonets-web-sdk-alpha";
import React, { useEffect, useState } from "react";
let scanOnce = false;
const useScanHealthcareCard = (setShowSuccess = () => {}) => {
  // cropped document base 64
  const [croppedDocumentBase64, setCroppedDocumentBase64] = useState(null);

  const [scanHealthcareCardSuccess, setScanHealthcareCardSuccess] = useState(false);
  // Data
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentHeight, setCroppedDocumentHeight] = useState(null);
  const [croppedDocumentWidth, setCroppedDocumentWidth] = useState(null);

  // input image base 64
  const [inputImageBase64, setTnputImageBase64] = useState(null);

  // Data
  const [inputImageData, setInputImageData] = useState(null);
  const [inputImagetHeight, setInputImagetHeight] = useState(null);
  const [inputImageWidth, setInputImageWidth] = useState(null);

  const doConvert = async (data, width, height, setState = () => {}, messege = "Image:") => {
    try {
      if (width * height * 4 === data.length) {
        const result = await convertCroppedImage(data, width, height);
        console.log(messege, result);
        setState(result);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if ((scanHealthcareCardSuccess, croppedDocumentImageData && croppedDocumentHeight && croppedDocumentWidth)) {
      doConvert(
        croppedDocumentImageData,
        croppedDocumentWidth,
        croppedDocumentHeight,
        setCroppedDocumentBase64,
        "croppedDocument: "
      );
    }
  }, [scanHealthcareCardSuccess, croppedDocumentImageData, croppedDocumentHeight, croppedDocumentWidth]);

  useEffect(() => {
    if ((scanHealthcareCardSuccess, inputImageData && inputImagetHeight && inputImageWidth)) {
      doConvert(inputImageData, inputImageWidth, inputImagetHeight, setInputImageData, "inputImage: ");
    }
  }, [scanHealthcareCardSuccess, inputImageData, inputImagetHeight, inputImageWidth]);

  const callback = (result) => {
    console.log("Healthcare Card Scan Result:", result);

    console.log("======= Healthcare Card Scan Result: ==================");
    console.log("result.returnValue.conf_level : " + result.returnValue.conf_level);
    console.log("result.returnValue.op_status: " + result.returnValue.op_status);
    console.log("======================================================");
    // if (result.returnValue.conf_level < 0.8 && result.returnValue.op_status===0){
    //   console.log('=======PROBLEMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM==================\n');
    //   console.log(result);
    //   console.log('======================================================\n');
    // }

    if (result.returnValue.validation_status === 0 && result.returnValue.cropped_doc_width) {
      setShowSuccess(true);
      setCroppedDocumentHeight(result.returnValue.cropped_doc_height);
      setCroppedDocumentWidth(result.returnValue.cropped_doc_width);
      setScanHealthcareCardSuccess(true);
      setInputImageWidth(result.returnValue.image_width);
      setInputImagetHeight(result.returnValue.image_height);
    } else {
      setCroppedDocumentImageData(null);
      setCroppedDocumentHeight(null);
      setCroppedDocumentWidth(null);
      if (!scanOnce) {
        doScanHealthcareCard();
      }
    }
  };

  const doScanHealthcareCard = async (image = undefined, loop = true) => {
    setCroppedDocumentHeight(null);
    setCroppedDocumentWidth(null);
    if (image) scanOnce = true;
    else if (!loop) scanOnce = true;
    const result = await scanHealthcareCard(
      callback,
      {
        input_image_format: "rgba",
      },
      image
    );
    const { imageData, croppedDocument } = result;
    console.log("Result:", result);
    setCroppedDocumentImageData(croppedDocument);
    setInputImageData(imageData);
  };

  return {
    inputImageBase64,
    croppedDocumentBase64,
    doScanHealthcareCard,
  };
};

export default useScanHealthcareCard;
