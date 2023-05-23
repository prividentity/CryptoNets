import { convertCroppedImage, scanHealthcareCard } from "@privateid/cryptonets-web-sdk-alpha";
import React, { useEffect, useState } from "react";

const useScanHealthcareCard = (setShowSuccess = () => {}) => {
  // cropped document base 64
  const [croppedDocumentBase64, setCroppedDocumentBase64] = useState(null);

  // Data
  const [croppedDocumentImageData, setCroppedDocumentImageData] = useState(null);
  const [croppedDocumentHeight, setCroppedDocumentHeight] = useState(null);
  const [croppedDocumentWidth, setCroppedDocumentWidth] = useState(null);

  const doConvert = async (data, width, height) => {
    try {
      const result = await convertCroppedImage(data, width, height);
      console.log("Cropped Healthcare Card:", result);
      setCroppedDocumentBase64(result);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (croppedDocumentImageData && croppedDocumentHeight && croppedDocumentWidth) {
      doConvert(croppedDocumentImageData, croppedDocumentWidth, croppedDocumentHeight);
    }
  }, [croppedDocumentImageData, croppedDocumentHeight, croppedDocumentWidth]);

  const callback = (result) => {
    console.log("Healthcare Card Scan Result:", result);

    if (
      result.returnValue.op_status === 0 &&
      //result.returnValue.conf_level > 0.95 &&
      result.returnValue.cropped_doc_width
    ) {
      setShowSuccess(true);
      setCroppedDocumentHeight(result.returnValue.cropped_doc_height);
      setCroppedDocumentWidth(result.returnValue.cropped_doc_width);
    } else {
      setCroppedDocumentImageData(null);
      setCroppedDocumentHeight(null);
      setCroppedDocumentWidth(null);
      doScanHealthcareCard();
    }
  };

  const doScanHealthcareCard = async () => {
    setCroppedDocumentHeight(null);
    setCroppedDocumentWidth(null);
    const { croppedDocument } = await scanHealthcareCard(callback, { input_image_format: "rgba",
    thresholdConfScoreDoc: 0.8,
});
    setCroppedDocumentImageData(croppedDocument);
  };

  return {
    croppedDocumentBase64,
    doScanHealthcareCard,
  };
};

export default useScanHealthcareCard;
