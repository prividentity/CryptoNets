import { useEffect, useState } from "react";
import { faceISO, convertCroppedImage } from "@privateid/cryptonets-web-sdk-alpha";

let loop = true;
const usePrividFaceISO = () => {
  const [faceISOData, setFaceISOData] = useState(null);
  const [faceISOHeight, setFaceISOHeight] = useState(null);
  const [faceISOWidth, setFaceISOWidth] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [faceISOImageData, setFaceISOImageData] = useState(null);
  const [inputImage, setInputImage] = useState(null);
  const [faceISOStatus, setFaceISOStatus] = useState(null);

  const [faceISOError, setFaceISOError] = useState(null);

  const faceISOCallback = (response) => {
    console.log("==========> FACE_ISO_RESPONSE", response);
    try {
      setFaceISOStatus(response.returnValue.status);
      setFaceISOError(response.returnValue.error);
    } catch (e) {
      setFaceISOStatus(null);
    }
    if (response.returnValue) {
      if (response.returnValue.status === 0) {
        setFaceISOError(response.returnValue.error);
        setFaceISOHeight(response.returnValue.iso_image_height);
        setFaceISOWidth(response.returnValue.iso_image_width);
        // setInputImage(response.portrait);
        setIsSuccess(true);
      } else {
        setFaceISOHeight(null);
        setFaceISOWidth(null);
        setFaceISOData(null);
        setIsSuccess(false);
        setInputImage(null);
      }
      if (loop) {
        doFaceISO();
      }
    }
  };

  const convertImage = async (imageData, width, height, setState) => {
    if (imageData.length === width * height * 4) {
      const convertedImage = await convertCroppedImage(imageData, width, height);
      setState(convertedImage);
    } else {
      console.log("CANNOT PROCESS DUE TO HEIGHT AND WIDTH ISSUE!!");
    }
  };

  useEffect(() => {
    if (isSuccess && faceISOData && faceISOWidth && faceISOHeight) {
      console.log("before converting cropped face: ", {
        faceISOData,
        faceISOWidth,
        faceISOHeight,
      });
      convertImage(faceISOData, faceISOWidth, faceISOHeight, setFaceISOImageData);
    }
  }, [isSuccess, faceISOData, faceISOWidth, faceISOHeight]);

  useEffect(() => {
    console.log("IMAGE RESULT", { faceISOImageData });
  }, [faceISOImageData]);

  const doFaceISO = async (functionLoop = true) => {
    loop = functionLoop;
    const { imageOutput } = await faceISO({
      callback: faceISOCallback,
      config: {
        input_image_format: "rgba",
        skip_antispoof: true,
      },
    });
    // console.log("FACE ISO RESULT:", { result, imageOutput });
    setFaceISOData(imageOutput);
  };

  return { doFaceISO, inputImage, faceISOImageData, faceISOStatus, faceISOError };
};

export default usePrividFaceISO;
