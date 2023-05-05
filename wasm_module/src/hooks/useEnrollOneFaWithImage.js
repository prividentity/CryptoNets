/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from "react";
import { enroll1FA } from "@privateid/cryptonets-web-sdk";

const useEnroll1FaWithImage = (onSuccess, setShowSuccess, config, image) => {
  const [enroll1FaWithImageData, setEnroll1FaWithImageData] = useState(null);

  const [enroll1FaWithImageStatus, setEnroll1FaWithImageStatus] = useState(null);

  let showError = false;

  const enrollUserOneFaWithImage = async () => {
    setEnroll1FaWithImageData(null);
    // eslint-disable-next-line no-unused-vars
    await enroll1FA(callback, config, false, image);
  };

  const callback = async (result) => {
    console.log("enroll callback hook result:", result);

    switch (result.status) {
      case "WASM_RESPONSE":
        console.log("WASM RESPONSE");
        if (result.returnValue?.status === 0) {
          setEnroll1FaWithImageStatus("ENROLL SUCCESS");
          setEnroll1FaWithImageData(result.returnValue);
          onSuccess(result.returnValue);
          setShowSuccess(true);
        }
        if (
          result.returnValue?.status === -1 ||
          result.returnValue?.status === -100 ||
          result.returnValue?.error === -1 || 
          result.returnValue?.error === 100 ||
          result.returnValue?.error === -100
        ) {
          setEnroll1FaWithImageStatus("ENROLL FAILED, PLEASE TRY AGAIN");
        }
        break;
      default:
    }
  };

  return {
    enroll1FaWithImageData,
    enrollUserOneFaWithImage,
    enroll1FaWithImageStatus
  };
};

export default useEnroll1FaWithImage;
