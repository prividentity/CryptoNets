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

  const doConvert = async (data, width, height) => {
    try {
      if (width * height * 4 === data.length) {
        const result = await convertCroppedImage(data, width, height);
        console.log("Cropped Healthcare Card:", result);
        setCroppedDocumentBase64(result);
      }
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if ((scanHealthcareCardSuccess, croppedDocumentImageData && croppedDocumentHeight && croppedDocumentWidth)) {
      doConvert(croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight);
    }
  }, [scanHealthcareCardSuccess, croppedDocumentImageData, croppedDocumentHeight, croppedDocumentWidth]);

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

    if (result.returnValue.op_status === 0 && result.returnValue.cropped_doc_width) {
      setShowSuccess(true);
      setCroppedDocumentHeight(result.returnValue.cropped_doc_height);
      setCroppedDocumentWidth(result.returnValue.cropped_doc_width);
      setScanHealthcareCardSuccess(true);
    } else {
      setCroppedDocumentImageData(null);
      setCroppedDocumentHeight(null);
      setCroppedDocumentWidth(null);
      if (!scanOnce) {
        doScanHealthcareCard();
      }
    }
  };

  const doScanHealthcareCard = async (image = undefined) => {
    setCroppedDocumentHeight(null);
    setCroppedDocumentWidth(null);
    if (image) scanOnce = true;
    const { croppedDocument } = await scanHealthcareCard(
      callback,
      { input_image_format: "rgba", conf_score_thr_doc: 0.9 },
      image
    );
    setCroppedDocumentImageData(croppedDocument);
  };

  return {
    croppedDocumentBase64,
    doScanHealthcareCard,
  };
};

export default useScanHealthcareCard;
