/* eslint-disable */
import { useContext, useEffect, useMemo, useState } from "react";
import {
  switchCamera,
  setStopLoopContinuousAuthentication,
  closeCamera,
  faceCompareLocal,
} from "@privateid/cryptonets-web-sdk-test";

import {
  useCamera,
  useWasm,
  useDelete,
  useIsValid,
  useEnrollOneFa,
  usePredictOneFa,
  useContinuousPredict,
  useScanFrontDocument,
  useScanBackDocument,
} from "../hooks";
import {
  CANVAS_SIZE,
  canvasSizeOptions,
  isBackCamera,
  isMobile,
  setMax2KForMobile,
  WIDTH_TO_STANDARDS,
} from "../utils";

import "./styles.css";
import usePredictAge from "../hooks/usePredictAge";
import useScanFrontDocumentWithoutPredict from "../hooks/useScanFrontDocumentWithoutPredict";
import usePrividFaceISO from "../hooks/usePrividFaceISO";
import { useNavigate } from "react-router-dom";
import usePredictAgeWithLivenessCheck from "../hooks/usePredictAgeWithLivenessCheck";
import usePredictOneFaWithLivenessCheck from "../hooks/usePredictOneFaWithLivenessCheck";
import useEnrollOneFaWithLiveness from "../hooks/useEnrollOneFaWithLivenessCheck";
import useFaceLogin from "../hooks/useFaceLogin";
import useFaceLoginWithLivenessCheck from "../hooks/useFaceLoginWithLiveness";
import useScanHealthcareCard from "../hooks/useScanHealthcareCard";
import { antispoofCheck, getFrontDocumentStatusMessage } from "@privateid/cryptonets-web-sdk-test/dist/utils";
import { DebugContext } from "../context/DebugContext";
import { async } from "q";

let callingWasm = false;
const Ready = () => {
  const debugContext = useContext(DebugContext);
  const { ready: wasmReady, deviceSupported, init: initWasm } = useWasm();
  const {
    ready: cameraReady,
    init: initCamera,
    device,
    devices,
    settings,
    capabilities,
    setReady,
  } = useCamera("userVideo");

  function getUrlParameter(sParam, defaultValue = undefined) {
    const sPageURL = window.location.search.substring(1);
    const sURLVariables = sPageURL.split("&");
    let sParameterName;
    let i;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split("=");

      if (sParameterName[0] === sParam) {
        return typeof sParameterName[1] === undefined ? defaultValue : decodeURIComponent(sParameterName[1]);
      }
    }
    return defaultValue;
  }
  useEffect(() => {
    const debug_type = getUrlParameter("debug_type", null);
    if (debug_type) {
      debugContext.setShowDebugOptions(true);
    }
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);

  const {
    scanFrontDocument,
    isFound,
    resultStatus,
    documentUUID,
    documentGUID,
    setShouldTriggerCallback,
    scanDocumentFrontMessage,
    resultResponse,
  } = useScanFrontDocument(setShowSuccess, debugContext);

  const [deviceCapabilities, setDeviceCapabilities] = useState(capabilities);
  const canvasSizeList = useMemo(() => {
    let canvasList = [...canvasSizeOptions];
    const maxHeight = deviceCapabilities?.height?.max || capabilities?.height?.max;
    let label = WIDTH_TO_STANDARDS[setMax2KForMobile(deviceCapabilities?.width?.max || capabilities?.width?.max)];
    const sliceIndex = canvasList.findIndex((option) => option.value === label);
    const slicedArr = canvasList.slice(sliceIndex);
    if (label === "FHD" && maxHeight === 1440) {
      return [{ label: "iPhoneCC", value: "iPhoneCC" }, ...slicedArr];
    }
    return slicedArr;
  }, [capabilities, deviceCapabilities]);
  const initialCanvasSize = WIDTH_TO_STANDARDS[settings?.width];
  const isBack = isBackCamera(devices, device);
  const [deviceId, setDeviceId] = useState(device);
  const [devicesList] = useState(devices);

  const [canvasSize, setCanvasSize] = useState();

  // Use Continuous Predict
  const predictRetryTimes = 1;
  const [continuousPredictUUID, setContinuousPredictUUID] = useState(null);
  const [continuousPredictGUID, setContinuousPredictGUID] = useState(null);
  const continuousPredictSuccess = (UUID, GUID) => {
    setContinuousPredictUUID(UUID);
    setContinuousPredictGUID(GUID);
  };
  const continuousOnNotFoundAndFailure = () => {
    setContinuousPredictUUID(null);
    setContinuousPredictGUID(null);
  };
  const {
    faceDetected: continuousFaceDetected,
    predictUser: continuousPredictUser,
    continuousPredictMessage,
  } = useContinuousPredict(
    "userVideo",
    continuousPredictSuccess,
    continuousOnNotFoundAndFailure,
    continuousOnNotFoundAndFailure,
    predictRetryTimes
  );

  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    console.log("useEffect starting wasm and camera");
    console.log("--- wasm status ", wasmReady, cameraReady);
    if (wasmReady && cameraReady) {
      return;
    }
    if (!wasmReady) {
      if (!callingWasm) {
        // NOTE: MAKE SURE THAT WASM IS ONLY LOADED ONCE
        initWasm();
        callingWasm = true;
      }
      return;
    }
    if (!cameraReady) {
      initCamera();
    }
  }, [wasmReady, cameraReady]);

  const {
    faceDetected: isValidFaceDetected,
    isValidCall,
    hasFinished,
    setHasFinished,
    exposureValue,
    isValidStatusCode,
  } = useIsValid("userVideo");
  // isValid
  const handleIsValid = async () => {
    setShowSuccess(false);
    setCurrentAction("isValid");
    await isValidCall();
  };

  // to start and stop isValid call when on loop
  useEffect(() => {
    const doIsValid = async () => {
      await isValidCall();
    };

    if (debugContext.functionLoop) {
      if (currentAction === "isValid" && hasFinished) {
        setHasFinished(false);
      }
      if (currentAction === "isValid" && !hasFinished) {
        doIsValid();
      }
      if (currentAction !== "isValid" && hasFinished) {
        setHasFinished(false);
      }
    } else {
      setHasFinished(false);
    }
  }, [currentAction, hasFinished, debugContext.functionLoop]);

  // Enroll ONEFA
  const useEnrollSuccess = () => {
    console.log("=======ENROLL SUCCESS=======");
    setShowSuccess(true);
  };
  const {
    faceDetected: enrollOneFaFaceDetected,
    enrollStatus: enrollOneFaStatus,
    enrollData: enrollOneFaData,
    enrollUserOneFa,
    progress: enrollOneFaProgress,
  } = useEnrollOneFa("userVideo", useEnrollSuccess, null, deviceId, setShowSuccess);
  const handleEnrollOneFa = async () => {
    setShowSuccess(false);
    setCurrentAction("useEnrollOneFa");
    enrollUserOneFa();
  };

  const handlePreidctSuccess = (result) => {
    console.log("======PREDICT SUCCESS========");
  };
  const { predictOneFaData, predictOneFaaceDetected, predictMessage, predictUserOneFa } = usePredictOneFa(
    "userVideo",
    handlePreidctSuccess,
    4,
    null,
    setShowSuccess
  );
  const handlePredictOneFa = async () => {
    setShowSuccess(false);
    setCurrentAction("usePredictOneFa");
    predictUserOneFa();
  };

  const handleContinuousPredict = async () => {
    setShowSuccess(false);
    setCurrentAction("useContinuousPredict");
    continuousPredictUser();
  };

  // stop Continuous predict
  useEffect(() => {
    if (currentAction !== "useContinuousPredict") {
      setStopLoopContinuousAuthentication(true);
    } else {
      setStopLoopContinuousAuthentication(false);
    }
  }, [currentAction]);

  const handleSwitchCamera = async (e) => {
    setDeviceId(e.target.value);
    const { capabilities = {}, settings = {}, devices } = await switchCamera(null, e.target.value);
    setDeviceCapabilities(capabilities);
    // setDevicesList(devices.map(mapDevices));
    if (currentAction === "useScanDocumentFront") {
      let width = WIDTH_TO_STANDARDS[settings?.width];
      if (width === "FHD" && settings?.height === 1440) {
        width = "iPhoneCC";
      }
      await handleCanvasSize({ target: { value: width } }, true);
    }
  };

  // Use Delete
  // for useDelete, first we need to get the UUID of the user by doing a predict
  const [deletionStatus, setDeletionStatus] = useState(null);
  const useDeleteCallback = (deleteStatus) => {
    setDeletionStatus(deleteStatus);
  };
  const { loading, onDeleteUser } = useDelete(useDeleteCallback, wasmReady);

  const handleDelete = async () => {
    setShowSuccess(false);
    setDeletionStatus(null);
    setCurrentAction("useDelete");
    predictUserOneFa();
  };

  // deleting
  useEffect(() => {
    if (currentAction === "useDelete") {
      if (predictOneFaData) {
        onDeleteUser(predictOneFaData.PI.uuid);
      }
    }
  }, [currentAction, predictOneFaData]);

  // // handleDLfront
  // const handleScanDLFront = async () => {
  //   setCurrentAction("useScanDocumentFront");
  //   // hack to initialize canvas with large memory, so it doesn't cause an issue.
  //   if (canvasSize) {
  //     await scanFrontDocument(canvasSize);
  //   } else {
  //     setShowSuccess(false);
  //     if (!isMobile) {
  //       await scanFrontDocument(canvasSizeOptions[3].value, () => {});
  //     }
  //     await scanFrontDocument(initialCanvasSize);
  //   }
  // };

  // Scan Document Back
  const {
    scanBackDocument,
    scannedCodeData,
    barcodeStatusCode,
    croppedBarcodeImage: croppedBarcodeBase64,
    croppedDocumentImage: croppedBackDocumentBase64,
  } = useScanBackDocument(setShowSuccess);
  const handleScanDocumentBack = async () => {
    setShowSuccess(false);
    setCurrentAction("useScanDocumentBack");
    await scanBackDocument(undefined, debugContext.functionLoop);
  };

  const isDocumentOrBackCamera =
    ["useScanDocumentBack", "useScanDocumentFront", "useScanDocumentFrontValidity"].includes(currentAction) || isBack;

  // Predict Age
  const { doPredictAge, age, predictAgeHasFinished, setPredictAgeHasFinished } = usePredictAge();

  const handlePredictAge = async () => {
    setShowSuccess(false);
    setCurrentAction("usePredictAge");
    await doPredictAge();
  };

  // to start and stop predictAge call when on loop
  useEffect(() => {
    const doUsePredictAge = async () => {
      await doPredictAge();
    };
    if (debugContext.functionLoop) {
      if (currentAction === "usePredictAge" && predictAgeHasFinished) {
        setPredictAgeHasFinished(false);
      }
      if (currentAction === "usePredictAge" && !predictAgeHasFinished) {
        doUsePredictAge();
      }
      if (currentAction !== "usePredictAge" && predictAgeHasFinished) {
        setPredictAgeHasFinished(false);
      }
    } else {
      setPredictAgeHasFinished(false);
    }
  }, [currentAction, predictAgeHasFinished, debugContext.functionLoop]);

  // Scan Front DL without predict

  const {
    isFound: isfoundValidity,
    scanFrontDocument: scanFrontValidity,
    confidenceValue,
    predictMugshotImageData,
    isMugshotFound,
    croppedDocumentImage,
    predictMugshotImage,
    frontScanData,
  } = useScanFrontDocumentWithoutPredict(setShowSuccess);

  const handleFrontDLValidity = async () => {
    setCurrentAction("useScanDocumentFrontValidity");
    await scanFrontValidity(debugContext.functionLoop);
  };

  const handleCanvasSize = async (e, skipSwitchCamera = false) => {
    if (currentAction === "useScanFrontValidity" || currentAction === "useScanDocumentBack") {
      setShouldTriggerCallback(false);
      setCanvasSize(e.target.value);
      const canvasSize = CANVAS_SIZE[e.target.value];
      if (!skipSwitchCamera) {
        const { capabilities = {} } = await switchCamera(null, deviceId || device, canvasSize);
        setDeviceCapabilities(capabilities);
      }
      setShouldTriggerCallback(true);

      if (currentAction === "useScanFrontValidity") {
        setTimeout(async () => {
          await useScanFrontDocumentWithoutPredict(e.target.value);
        }, 1000);
      } else {
        setTimeout(async () => {
          await scanBackDocument(e.target.value);
        }, 1000);
      }
    }
  };

  const { doFaceISO, inputImage, faceISOImageData, faceISOStatus, faceISOError } = usePrividFaceISO();

  const handlePrividFaceISO = () => {
    setCurrentAction("privid_face_iso");
    doFaceISO(debugContext.functionLoop);
  };

  const handleReopenCamera = async () => {
    setReady(false);
    await closeCamera();
    await init();
  };

  const handleCloseCamera = async () => {
    await closeCamera();
  };

  const navigate = useNavigate();
  const handleCompareImages = async () => {
    navigate("/compare");
  };

  const [uploadImage1, setUploadImage1] = useState(null);
  const [uploadImage2, setUploadImage2] = useState(null);

  const handleUploadImage1 = async (e) => {
    console.log(e.target.files);
    const imageRegex = /image[/]jpg|image[/]png|image[/]jpeg/;
    if (e.target.files.length > 0) {
      if (imageRegex.test(e.target.files[0].type)) {
        const imageUrl = URL.createObjectURL(e.target.files[0]);
        console.log(e.target.files[0]);

        const getBase64 = (file) => {
          return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function () {
              resolve(reader.result);
            };
            reader.onerror = function (error) {
              reject(error);
            };
          });
        };

        const base64 = await getBase64(e.target.files[0]); // prints the base64 string
        var newImg = new Image();
        newImg.src = base64;
        newImg.onload = async () => {
          var imgSize = {
            w: newImg.width,
            h: newImg.height,
          };
          alert(imgSize.w + " " + imgSize.h);
          const canvas = document.createElement("canvas");
          canvas.setAttribute("height", `${imgSize.h}`);
          canvas.setAttribute("width", `${imgSize.w}`);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(newImg, 0, 0);

          const imageData = ctx.getImageData(0, 0, imgSize.w, imgSize.h);
          console.log("imageData", imageData);
          setUploadImage1(imageData);
        };
      } else {
        console.log("INVALID IMAGE TYPE");
      }
    }
  };
  const handleUploadImage2 = async (e) => {
    console.log(e.target.files);
    const imageRegex = /image[/]jpg|image[/]png|image[/]jpeg/;
    if (e.target.files.length > 0) {
      if (imageRegex.test(e.target.files[0].type)) {
        const imageUrl = URL.createObjectURL(e.target.files[0]);

        console.log(e.target.files[0]);

        const getBase64 = (file) => {
          return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function () {
              resolve(reader.result);
            };
            reader.onerror = function (error) {
              reject(error);
            };
          });
        };

        const base64 = await getBase64(e.target.files[0]); // prints the base64 string
        var newImg = new Image();
        newImg.src = base64;
        newImg.onload = async () => {
          var imgSize = {
            w: newImg.width,
            h: newImg.height,
          };
          alert(imgSize.w + " " + imgSize.h);
          const canvas = document.createElement("canvas");
          canvas.setAttribute("height", `${imgSize.h}`);
          canvas.setAttribute("width", `${imgSize.w}`);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(newImg, 0, 0);

          const imageData = ctx.getImageData(0, 0, imgSize.w, imgSize.h);
          console.log("imageData", imageData);
          setUploadImage2(imageData);
        };
      } else {
        console.log("INVALID IMAGE TYPE");
      }
    }
  };

  const handleDoCompare = async () => {
    const callback = (result) => {
      console.log("COMPARE RESULT", result);
    };

    await documentMugshoFaceCompare(callback, uploadImage1, uploadImage2);
  };

  const handleBoundingBox = async () => {
    navigate("/bounding_box");
  };

  // usePredictAge with Liveness
  const {
    age: ageWithLiveness,
    doPredictAge: doPredictAgeWithLiveness,
    setPredictAgeHasFinished: setPredictAgeHasFinishedWithLiveness,
    predictAgeLivenessResult,
    predictAgeHasFinished: predictAgeHasFinishedWithLiveness,
  } = usePredictAgeWithLivenessCheck();

  const handleDoPredictAgeWithLiveness = async () => {
    setShowSuccess(false);
    setCurrentAction("usePredictAgeWithLiveness");
    await doPredictAgeWithLiveness();
  };

  // to start and stop predictAge call when on loop
  useEffect(() => {
    const doUsePredictAge = async () => {
      await doPredictAgeWithLiveness();
    };
    if (debugContext.functionLoop) {
      if (currentAction === "usePredictAgeWithLiveness" && predictAgeHasFinishedWithLiveness) {
        setPredictAgeHasFinishedWithLiveness(false);
      }
      if (currentAction === "usePredictAgeWithLiveness" && !predictAgeHasFinishedWithLiveness) {
        doUsePredictAge();
      }
      if (currentAction !== "usePredictAgeWithLiveness" && predictAgeHasFinishedWithLiveness) {
        setPredictAgeHasFinishedWithLiveness(false);
      }
    }
  }, [currentAction, predictAgeHasFinishedWithLiveness]);

  // predict1Fa with liveness
  const {
    predictMessage: predictMessageWithLiveness,
    predictOneFaData: predictOneFaDataWithLiveness,
    predictOneFaaceDetected: predictOneFaaceDetectedWithLiveness,
    predictUserOneFa: predictUserOneFaWithLiveness,
    predictLivenessCheck,
  } = usePredictOneFaWithLivenessCheck(setShowSuccess);

  const handlePredict1FaWithLiveness = async () => {
    setShowSuccess(false);
    setCurrentAction("usePredictOneFaWithLiveness");
    predictUserOneFaWithLiveness();
  };

  const {
    enrollOneFaWithLivenessFaceDetected,
    enrollOneFaWithLivenessStatus,
    enrollOneFaWithLivenessData,
    enrollUserOneFaWithLiveness,
    enrollOneFaWithLivenessProgress,
    enrollOneFaWithLivenessCheckStatus,
  } = useEnrollOneFaWithLiveness("userVideo", () => {}, null, deviceId, setShowSuccess);

  const handleEnrollOneFaWithLiveness = async () => {
    setShowSuccess(false);
    setCurrentAction("useEnrollOneFaWithLiveness");
    enrollUserOneFaWithLiveness();
  };

  // Face Login
  const {
    doFaceLogin,
    faceLoginData,
    faceLoginFaceDetected,
    faceLoginMessage,
    faceLoginStatus,
    statusCode: faceLoginStatusCode,
  } = useFaceLogin("userVideo", () => {}, null, deviceId, setShowSuccess);

  const handleFaceLogin = async () => {
    setShowSuccess(false);
    setCurrentAction("useFaceLogin");
    doFaceLogin(debugContext.functionLoop);
  };

  // Face Login With Liveness
  const {
    faceLoginLivenessCheck,
    faceLoginWithLiveness,
    faceLoginWithLivenessData,
    faceLoginWithLivenessFaceDetected,
    faceLoginWithLivenessMessage,
    faceLoginWithLivenessStatus,
  } = useFaceLoginWithLivenessCheck(setShowSuccess);

  const handleFaceLoginWithLiveness = async () => {
    setShowSuccess(false);
    setCurrentAction("useFaceLoginWithLiveness");
    faceLoginWithLiveness();
  };

  // Scan Healthcare Card
  const { croppedDocumentBase64, doScanHealthcareCard } = useScanHealthcareCard(setShowSuccess);

  const handleUseScanHealhcareCard = async () => {
    setShowSuccess(false);
    setCurrentAction("useScanHealthcareCard");
    doScanHealthcareCard(undefined, debugContext.functionLoop);
  };

  //
  const handleUploadImageHealthcare = async (e) => {
    console.log(e.target.files);
    const imageRegex = /image[/]jpg|image[/]png|image[/]jpeg/;
    if (e.target.files.length > 0) {
      if (imageRegex.test(e.target.files[0].type)) {
        const imageUrl = URL.createObjectURL(e.target.files[0]);

        console.log(e.target.files[0]);

        const getBase64 = (file) => {
          return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function () {
              resolve(reader.result);
            };
            reader.onerror = function (error) {
              reject(error);
            };
          });
        };

        const base64 = await getBase64(e.target.files[0]); // prints the base64 string
        var newImg = new Image();
        newImg.src = base64;
        newImg.onload = async () => {
          var imgSize = {
            w: newImg.width,
            h: newImg.height,
          };
          alert(imgSize.w + " " + imgSize.h);
          const canvas = document.createElement("canvas");
          canvas.setAttribute("height", `${imgSize.h}`);
          canvas.setAttribute("width", `${imgSize.w}`);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(newImg, 0, 0);

          const imageData = ctx.getImageData(0, 0, imgSize.w, imgSize.h);
          console.log("imageData", imageData);
          doScanHealthcareCard(imageData);
        };
      } else {
        console.log("INVALID IMAGE TYPE");
      }
    }
  };

  const handleUploadDoAntispoofCheck = async (e) => {
    console.log(e.target.files);
    const imageRegex = /image[/]jpg|image[/]png|image[/]jpeg/;
    if (e.target.files.length > 0) {
      if (imageRegex.test(e.target.files[0].type)) {
        const imageUrl = URL.createObjectURL(e.target.files[0]);

        console.log(e.target.files[0]);

        const getBase64 = (file) => {
          return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function () {
              resolve(reader.result);
            };
            reader.onerror = function (error) {
              reject(error);
            };
          });
        };

        const base64 = await getBase64(e.target.files[0]); // prints the base64 string
        var newImg = new Image();
        newImg.src = base64;
        newImg.onload = async () => {
          var imgSize = {
            w: newImg.width,
            h: newImg.height,
          };
          alert(imgSize.w + " " + imgSize.h);
          const canvas = document.createElement("canvas");
          canvas.setAttribute("height", `${imgSize.h}`);
          canvas.setAttribute("width", `${imgSize.w}`);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(newImg, 0, 0);

          const imageData = ctx.getImageData(0, 0, imgSize.w, imgSize.h);
          console.log("imageData", imageData);
          const livenssResult = await antispoofCheck(imageData.data, imageData.width, imageData.height);
          console.log("LIVENESS: ", livenssResult);
        };
      } else {
        console.log("INVALID IMAGE TYPE");
      }
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const [uploadedImageForScanning, setUploadedImageForScanning] = useState(null);

  const handleUploadImageForScanning = async (e) => {
    console.log(e.target.files);
    const imageRegex = /image[/]jpg|image[/]png|image[/]jpeg/;
    if (e.target.files.length > 0) {
      if (imageRegex.test(e.target.files[0].type)) {
        const imageUrl = URL.createObjectURL(e.target.files[0]);

        console.log(e.target.files[0]);

        const getBase64 = (file) => {
          return new Promise((resolve, reject) => {
            var reader = new FileReader();
            reader.readAsDataURL(file);

            reader.onload = function () {
              resolve(reader.result);
            };
            reader.onerror = function (error) {
              reject(error);
            };
          });
        };

        const base64 = await getBase64(e.target.files[0]); // prints the base64 string
        var newImg = new Image();
        newImg.src = base64;
        newImg.onload = async () => {
          var imgSize = {
            w: newImg.width,
            h: newImg.height,
          };
          alert(imgSize.w + " " + imgSize.h);
          const canvas = document.createElement("canvas");
          canvas.setAttribute("height", `${imgSize.h}`);
          canvas.setAttribute("width", `${imgSize.w}`);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(newImg, 0, 0);

          const imageData = ctx.getImageData(0, 0, imgSize.w, imgSize.h);
          console.log("imageData", imageData);
          setUploadedImageForScanning(imageData);
        };
      } else {
        console.log("INVALID IMAGE TYPE");
      }
    }
  };

  const frontScanUploadedImageScanning = async () => {
    if (uploadedImageForScanning) {
      scanFrontValidity(false, uploadedImageForScanning);
    }
  };

  const healthcareScanUploadedImageScanning = async () => {
    if (uploadedImageForScanning) {
      doScanHealthcareCard(uploadedImageForScanning, false);
    }
  };

  const backScanUploadedImageScanning = async () => {
    if (uploadedImageForScanning) {
      scanBackDocument(undefined, false, uploadedImageForScanning);
    }
  };

  return (
    <>
      {deviceSupported.isChecking ? (
        <div>
          <h1> Loading . . . </h1>
        </div>
      ) : !deviceSupported.isChecking && deviceSupported.supported ? (
        <div id="canvasInput" className="container">
          <span
            style={{
              display: debugContext.showDebugOptions ? "flex" : "none",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Do Loop?
            <label class="switch">
              <input
                type="checkbox"
                value={debugContext.functionLoop}
                onChange={() => {
                  debugContext.setFuctionLoop(!debugContext.functionLoop);
                }}
              />
              <span class="slider round"></span>
            </label>
          </span>

          <div
            style={{
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: currentAction === "useScanDocumentFront" ? "space-between" : "center",
                width: "47%",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                    padding: "10px",
                  }}
                >
                  <button onClick={handleReopenCamera}> Open Camera</button>
                  <button onClick={handleCloseCamera}> Close Camera</button>
                </div>
                <label> Select Camera: </label>
                <select value={deviceId || device} onChange={(e) => handleSwitchCamera(e)}>
                  {(devicesList?.length ? devicesList : devices).map((e, index) => {
                    return (
                      <option id={e.value} value={e.value} key={index}>
                        {e.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              {currentAction === "useScanDocumentFront" || currentAction === "useScanDocumentBack" ? (
                <div>
                  <label> Canvas Size: </label>
                  <select defaultValue={initialCanvasSize} value={canvasSize} onChange={(e) => handleCanvasSize(e)}>
                    {canvasSizeList.map(({ label, value }) => (
                      <option id={value} value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <></>
              )}
            </div>
            <div className={"cameraContainer"}>
              {currentAction === "useEnrollOneFa" && !enrollOneFaFaceDetected && (
                <div className="enrollDisplay">
                  <span> {enrollOneFaStatus} </span>
                </div>
              )}
              <video
                id="userVideo"
                className={
                  (currentAction === "useScanDocumentFront" ||
                  currentAction === "useScanDocumentBack" ||
                  currentAction === "useScanDocumentFrontValidity" ||
                  currentAction === "useScanHealthcareCard"
                    ? `cameraDisplay`
                    : `cameraDisplay mirrored`) +
                  " " +
                  (showSuccess ? "cameraDisplaySuccess" : "")
                }
                muted
                autoPlay
                playsInline
              />
              {currentAction === "usePredictAge" && age > 0 && (
                <div className="age-box">
                  <div>{Math.round(age)}</div>
                </div>
              )}
              {currentAction === "usePredictAgeWithLiveness" && ageWithLiveness > 0 && (
                <div className="age-box">
                  <div>{Math.round(ageWithLiveness)}</div>
                </div>
              )}
            </div>

            <div>
              {currentAction === "useEnrollOneFa" && (
                <div>
                  <div>
                    Enroll Face Detected:
                    {enrollOneFaFaceDetected ? "Face Detected" : "No Face Detected"}
                  </div>
                  <div> Enroll Status: {enrollOneFaStatus} </div>
                  <div> Progress: {`${enrollOneFaProgress} %`}</div>
                  <div>
                    Enroll GUID:&nbsp;
                    {`${enrollOneFaData ? enrollOneFaData.PI.guid : ""}`}
                  </div>
                  <div>
                    Enroll UUID:&nbsp;
                    {`${enrollOneFaData ? enrollOneFaData.PI.uuid : ""}`}
                  </div>
                </div>
              )}

              {currentAction === "useEnrollOneFaWithLiveness" && (
                <div>
                  {console.log("HERE", {
                    enrollOneFaWithLivenessFaceDetected,
                    enrollOneFaWithLivenessStatus,
                    enrollOneFaWithLivenessProgress,
                    enrollOneFaWithLivenessData,
                  })}
                  <div>
                    Enroll Face Detected:
                    {enrollOneFaWithLivenessFaceDetected ? "Face Detected" : "No Face Detected"}
                  </div>
                  <div> Enroll Status: {enrollOneFaWithLivenessStatus} </div>
                  <div> Progress: {`${enrollOneFaWithLivenessProgress} %`}</div>
                  <div>
                    Enroll GUID:&nbsp;
                    {`${enrollOneFaWithLivenessData ? enrollOneFaWithLivenessData.PI.guid : ""}`}
                  </div>
                  <div>
                    Enroll UUID:&nbsp;
                    {`${enrollOneFaWithLivenessData ? enrollOneFaWithLivenessData.PI.uuid : ""}`}
                  </div>
                  <div>
                    Liveness Check:{" "}
                    {`${
                      enrollOneFaWithLivenessCheckStatus === 0
                        ? "Real"
                        : enrollOneFaWithLivenessCheckStatus === 1
                        ? "Spoof"
                        : "Face not found"
                    }`}
                  </div>
                </div>
              )}

              {currentAction === "isValid" && (
                <div>
                  <div>{`Face Valid: ${isValidFaceDetected}`}</div>
                  <div>{`Exposure: ${exposureValue}`}</div>
                  <div> {`Status: ${isValidStatusCode}`} </div>
                </div>
              )}

              {currentAction === "useContinuousPredict" && (
                <div>
                  <div>{`Face Valid: ${continuousFaceDetected ? "Face Detected" : "Face not detected"}`}</div>
                  <div>{`Message: ${continuousPredictMessage || ""}`}</div>
                  <div>{`Predicted GUID: ${continuousPredictGUID ? continuousPredictGUID : ""}`}</div>
                  <div>{`Predicted UUID: ${continuousPredictUUID ? continuousPredictUUID : ""}`}</div>
                </div>
              )}

              {currentAction === "usePredictOneFa" && (
                <div>
                  <div>{`Face Valid: ${predictOneFaaceDetected ? "Face Detected" : "Face not detected"}`}</div>
                  <div>{`Message: ${predictMessage || ""}`}</div>
                  <div>{`Predicted GUID: ${predictOneFaData ? predictOneFaData.PI.guid : ""}`}</div>
                  <div>{`Predicted UUID: ${predictOneFaData ? predictOneFaData.PI.uuid : ""}`}</div>
                </div>
              )}

              {currentAction === "usePredictOneFaWithLiveness" && (
                <div>
                  <div>{`Face Valid: ${
                    predictOneFaaceDetectedWithLiveness ? "Face Detected" : "Face not detected"
                  }`}</div>
                  <div>{`Message: ${predictMessageWithLiveness || ""}`}</div>
                  <div>{`Predicted GUID: ${
                    predictOneFaDataWithLiveness ? predictOneFaDataWithLiveness.PI.guid : ""
                  }`}</div>
                  <div>{`Predicted UUID: ${
                    predictOneFaDataWithLiveness ? predictOneFaDataWithLiveness.PI.uuid : ""
                  }`}</div>
                  <div>{`Liveness Check: ${
                    predictLivenessCheck === -1
                      ? "No Face Detected"
                      : predictLivenessCheck === 0
                      ? "Real"
                      : predictLivenessCheck === 1
                      ? "Spoof"
                      : ""
                  }`}</div>
                </div>
              )}

              {currentAction === "useFaceLogin" && (
                <div>
                  <div>{`Face Valid: ${faceLoginFaceDetected ? "Face Detected" : "Face not detected"}`}</div>
                  <div>{`Face Login Status: ${faceLoginStatusCode}`} </div>
                  <div>{`Message: ${faceLoginMessage || ""}`}</div>
                  <div>{`Face Login GUID: ${faceLoginData ? faceLoginData.PI.guid : ""}`}</div>
                  <div>{`Face Login UUID: ${faceLoginData ? faceLoginData.PI.uuid : ""}`}</div>
                </div>
              )}

              {currentAction === "useFaceLoginWithLiveness" && (
                <div>
                  <div>{`Face Valid: ${
                    faceLoginWithLivenessFaceDetected ? "Face Detected" : "Face not detected"
                  }`}</div>
                  <div>{`Message: ${faceLoginWithLivenessMessage || ""}`}</div>
                  <div>{`Face Login GUID: ${faceLoginWithLivenessData ? faceLoginWithLivenessData.PI.guid : ""}`}</div>
                  <div>{`Face Login UUID: ${faceLoginWithLivenessData ? faceLoginWithLivenessData.PI.uuid : ""}`}</div>
                  <div>{`Liveness Check: ${
                    faceLoginLivenessCheck === -1
                      ? "No Face Detected"
                      : faceLoginLivenessCheck === 0
                      ? "Real"
                      : faceLoginLivenessCheck === 1
                      ? "Spoof"
                      : ""
                  }`}</div>
                </div>
              )}

              {currentAction === "useDelete" && (
                <div>
                  <div>{`Deletion Status: ${deletionStatus}`}</div>
                  <div>{`User UUID: ${predictOneFaData ? predictOneFaData.PI.uuid : ""}`}</div>
                </div>
              )}

              {currentAction === "useScanDocumentBack" && (
                <div>
                  <h2> {`Barcode Status Code: ${barcodeStatusCode}`}</h2>
                  <div>{`Scanned code data: ${scannedCodeData ? "success" : "not found"}`}</div>
                  <div>{`First Name: ${scannedCodeData ? scannedCodeData.firstName : ""}`}</div>
                  <div>{`Middle Name: ${scannedCodeData ? scannedCodeData.middleName : ""}`}</div>
                  <div>{`Last Name: ${scannedCodeData ? scannedCodeData.lastName : ""}`}</div>
                  <div>{`Date of Birth: ${scannedCodeData ? scannedCodeData.dateOfBirth : ""}`}</div>
                  <div>{`Gender: ${scannedCodeData ? scannedCodeData.gender : ""}`}</div>
                  <div>{`Street Address1: ${scannedCodeData ? scannedCodeData.streetAddress1 : ""}`}</div>
                  <div>{`Street Address2: ${scannedCodeData ? scannedCodeData.streetAddress2 : ""}`}</div>
                  <div>{`City: ${scannedCodeData ? scannedCodeData.city : ""}`}</div>
                  <div>{`Postal Code: ${scannedCodeData ? scannedCodeData.postCode : ""}`}</div>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {croppedBarcodeBase64 && (
                      <button
                        className="button"
                        onClick={() => {
                          handleCopyToClipboard(croppedBarcodeBase64);
                        }}
                      >
                        Copy Cropped Barcode Base64
                      </button>
                    )}
                    {croppedBackDocumentBase64 && (
                      <button
                        className="button"
                        onClick={() => {
                          handleCopyToClipboard(croppedBackDocumentBase64);
                        }}
                      >
                        Copy Cropped Document Base64
                      </button>
                    )}
                  </div>
                </div>
              )}

              {currentAction === "useScanDocumentFrontValidity" && (
                <div>
                  <div>{`Status Code: ${frontScanData ? frontScanData.returnValue.op_status : ""}`}</div>
                  <div>
                    {`Status Message: ${
                      frontScanData ? getFrontDocumentStatusMessage(frontScanData.returnValue.op_status) : ""
                    }`}{" "}
                  </div>
                  <div>{`Document 4 corners found: ${
                    isfoundValidity ? "Document 4 corners available" : "not found"
                  }`}</div>
                  <div>{`Mugshot found: ${isMugshotFound ? "Mugshot Available" : "not found"}`}</div>
                  {predictMugshotImage && croppedDocumentImage && (
                    <div style={{ display: "flex", gap: "10px", padding: "10px" }}>
                      <button
                        className="button"
                        onClick={() => {
                          navigator.clipboard.writeText(predictMugshotImage);
                        }}
                      >
                        Copy Mugshot Image String
                      </button>
                      <button
                        className="button"
                        onClick={() => {
                          navigator.clipboard.writeText(croppedDocumentImage);
                        }}
                      >
                        Copy Document Image String
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentAction === "privid_face_iso" && (
                <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", flexDirection: "column" }}>
                  <div>
                    <h2>Output Image:</h2>
                    {faceISOImageData && <img style={{ maxWidth: "400px" }} src={faceISOImageData} />}
                  </div>
                </div>
              )}

              {currentAction === "usePredictAgeWithLiveness" && (
                <div>
                  <div>{`Estimated Age: ${
                    predictAgeLivenessResult === -1 || predictAgeLivenessResult === 1
                      ? ""
                      : ageWithLiveness > 0
                      ? Math.round(ageWithLiveness)
                      : ""
                  }`}</div>
                  <div>{`Liveness Check: ${
                    predictAgeLivenessResult === -1
                      ? "No Face Detected"
                      : predictAgeLivenessResult === 0
                      ? "Real"
                      : predictAgeLivenessResult === 1
                      ? "Spoof"
                      : ""
                  }`}</div>
                </div>
              )}
            </div>

            <div id="module_functions" className="buttonContainer">
              <button className="button" onClick={handleIsValid}>
                Is Valid
              </button>
              <button className="button" onClick={handlePredictAge}>
                Predict Age
              </button>
              <button className="button" onClick={handleDoPredictAgeWithLiveness}>
                Predict Age with Liveness
              </button>
              <button className="button" onClick={handleEnrollOneFa}>
                Enroll
              </button>
              <button className="button" onClick={handleEnrollOneFaWithLiveness}>
                Enroll with Liveness
              </button>

              <button className="button" onClick={handlePredictOneFa}>
                Predict
              </button>
              <button className="button" onClick={handlePredict1FaWithLiveness}>
                Predict with Liveness
              </button>
              <button className="button" onClick={handleFaceLogin}>
                Face Login
              </button>
              <button className="button" onClick={handleFaceLoginWithLiveness}>
                Face Login with Liveness
              </button>
              <button className="button" onClick={handleContinuousPredict}>
                Continuous Authentication
              </button>
              <button className="button" onClick={handleDelete}>
                Delete
              </button>
              <button className="button" onClick={handleFrontDLValidity}>
                Scan Front Document Validity
              </button>
              <button className="button" onClick={handleScanDocumentBack}>
                Scan Back Document
              </button>
              <button className="button" onClick={handlePrividFaceISO}>
                Face ISO
              </button>
              <button className="button" onClick={handleCompareImages}>
                Compare Flow
              </button>
              <button className="button" onClick={handleUseScanHealhcareCard}>
                Healthcare Card Scan
              </button>

              {/* <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadImageHealthcare}
                  style={{ display: "none" }}
                />
                <span className="button">Upload Image Use Healthcare Scan</span>
              </label> */}

              <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadDoAntispoofCheck}
                  style={{ display: "none" }}
                />
                <span className="button">Upload Image Use Antispoof Check</span>
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection:'column', flexWrap:'wrap' }}>
              <p> Testing Buttons: </p>
              <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadImageForScanning}
                  style={{ display: "none" }}
                />
                <span className="button">Upload Image For Scanning</span>
              </label>
              <br />
              <div style={{ display: "flex", gap: "2px" }}>
                <button className="button" onClick={frontScanUploadedImageScanning}>
                  Front Document Scan Uploaded Image
                </button>
                <button className="button" onClick={healthcareScanUploadedImageScanning}>
                  Healthcare Card Scan Uploaded Image
                </button>
                <button className="button" onClick={backScanUploadedImageScanning}>
                  Back Document Scan Uploaded Image
                </button>
              </div>
            </div>
            {/* <div>
              <p> Other Utilities: </p>
              <button
                className="button"
                onClick={() => {
                  navigate("/enroll_with_mugshot");
                }}
              >
                Enroll with Mugshot
              </button>
              <button
                className="button"
                onClick={() => {
                  navigate("/predict_with_mugshot");
                }}
              >
                Predict with Mugshot
              </button>
              <button
                className="button"
                onClick={() => {
                  navigate("/enroll_with_label");
                }}
              >
                Enroll with Label
              </button>
            </div> */}
            <div>
              <p> Upload 2 images to use compare: </p>
              <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadImage1}
                  style={{ display: "none" }}
                />
                <span className="button">Upload Image 1</span>
              </label>
              <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadImage2}
                  style={{ display: "none" }}
                />
                <span className="button">Upload Image 2</span>
              </label>

              <button className="button" onClick={handleDoCompare}>
                Do Compare
              </button>
            </div>
          </div>
        </div>
      ) : !deviceSupported.isChecking && !deviceSupported.supported ? (
        <div>
          <h1> Not Supported. </h1>
          <h4> Please use a different device or updated device. </h4>
          <p>{deviceSupported.message}</p>
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default Ready;
