import { useEffect, useState } from "react";
import { faceISO, convertCroppedImage } from "@privateid/cryptonets-web-sdk";

const usePrividFaceISO = () => {
  const [faceISOData, setFaceISOData] = useState(null);
  const [faceISOHeight, setFaceISOHeight] = useState(null);
  const [faceISOWidth, setFaceISOWidth] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [faceISOImageData, setFaceISOImageData] = useState(null);
  const [inputImage, setInputImage] = useState(null);
  const [faceISOStatus, setFaceISOStatus] = useState(null);

  const faceISOCallback = (response) => {
    console.log("==========> FACE_ISO_RESPONSE", response);
    // {"status":0,"iso_image_width":360,"iso_image_height":480,"iso_image_channels":3,"confidence":0.9739335775375366}
    setFaceISOStatus(response.returnValue.status);
    if (response.returnValue.status === 0) {
      setFaceISOHeight(response.returnValue.iso_image_height);
      setFaceISOWidth(response.returnValue.iso_image_width);
      setInputImage(response.portrait);
      setIsSuccess(true);
    } else {
      setFaceISOHeight(null);
      setFaceISOWidth(null);
      setFaceISOData(null);
      setIsSuccess(false);
      setInputImage(null);
      doFaceISO();
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

  const doFaceISO = async () => {
    const { result, imageOutput } = await faceISO(faceISOCallback, {
      input_image_format: "rgba",
      context_string: "predict",
    });
    console.log("FACE ISO RESULT:", { result, imageOutput });
    setFaceISOData(imageOutput);
  };

  return { doFaceISO,inputImage, faceISOImageData, faceISOStatus };
};

export default usePrividFaceISO;
