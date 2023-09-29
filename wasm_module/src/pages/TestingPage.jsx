/* eslint-disable */
import { useContext, useEffect, useMemo, useState } from "react";
import {
  switchCamera,
  setStopLoopContinuousAuthentication,
  closeCamera,
  faceCompareLocal,
  documentMugshoFaceCompare,
} from "@privateid/cryptonets-web-sdk-alpha";

import {
  useCamera,
  useWasm,
  useDelete,
  useIsValid,
  useEnrollOneFa,
  usePredictOneFa,
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
import useScanFrontDocumentWithoutPredict from "../hooks/useScanFrontDocument";
import usePrividFaceISO from "../hooks/usePrividFaceISO";
import useFaceLogin from "../hooks/useFaceLogin";
import useScanHealthcareCard from "../hooks/useScanHealthcareCard";
import {
  getEnrollFaceMessage,
  getFaceValidationMessage,
  getFrontDocumentStatusMessage,
  getRawFaceValidationStatus,
} from "@privateid/cryptonets-web-sdk-alpha/dist/utils";
import { DebugContext } from "../context/DebugContext";
import useContinuousPredictWithoutRestrictions from "../hooks/useContinuousPredictWithoutRestriction";
import useMultiFramePredictAge from "../hooks/useMultiFramePredictAge";
import useOscarLogin from "../hooks/useOscarLogin";

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

  const [disableButtons, setDisableButtons] = useState(false);

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

  const [currentAction, setCurrentAction] = useState(null);
  const [skipAntiSpoof, setSkipAntispoof] = useState(false);

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
    isValidCall,
    antispoofPerformed: isValidAntispoofPerformed,
    antispoofStatus: isValidAntispoofStatus,
    isValidStatus: isValidStatus,
  } = useIsValid("userVideo");
  // isValid
  const handleIsValid = async () => {
    setShowSuccess(false);
    setCurrentAction("isValid");
    await isValidCall(skipAntiSpoof);
  };

  // Enroll ONEFA
  const useEnrollSuccess = () => {
    console.log("=======ENROLL SUCCESS=======");
    setShowSuccess(true);
  };
  const {
    enrollGUID,
    enrollPUID,
    enrollAntispoofPerformed,
    enrollAntispoofStatus,
    enrollValidationStatus,
    enrollToken,
    enrollUserOneFa,
  } = useEnrollOneFa("userVideo", useEnrollSuccess, null, deviceId, setShowSuccess, setDisableButtons);
  const handleEnrollOneFa = async () => {
    setShowSuccess(false);
    setCurrentAction("useEnrollOneFa");
    enrollUserOneFa("", skipAntiSpoof);
  };

  const handlePreidctSuccess = (result) => {
    console.log("======PREDICT SUCCESS========");
  };
  const {
    predictAntispoofPerformed,
    predictAntispoofStatus,
    predictGUID,
    predictPUID,
    predictValidationStatus,
    predictMessage,
    predictUserOneFa,
  } = usePredictOneFa("userVideo", handlePreidctSuccess, 4, null, setShowSuccess, setDisableButtons);
  const handlePredictOneFa = async () => {
    console.log("PREDICTING");
    setShowSuccess(false);
    setCurrentAction("usePredictOneFa");
    predictUserOneFa(skipAntiSpoof);
  };

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
      if (predictPUID) {
        onDeleteUser(predictPUID);
      }
    }
  }, [currentAction, predictPUID]);

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
  // const {
  //   doPredictAge,
  //   age,
  //   predictAgeHasFinished,
  //   setPredictAgeHasFinished,
  //   antispoofPerformed: predictAgeAntispoofPerformed,
  //   antispoofStatus: predictAgeAntispoofStatus,
  //   validationStatus: predictAgeValidationStatus,
  // } = usePredictAge();

  const {
    doPredictAge,
    age,
    predictAgeHasFinished,
    setPredictAgeHasFinished,
    antispoofPerformed: predictAgeAntispoofPerformed,
    antispoofStatus: predictAgeAntispoofStatus,
    validationStatus: predictAgeValidationStatus,
  } = useMultiFramePredictAge();

  const handlePredictAge = async () => {
    setShowSuccess(false);
    setCurrentAction("usePredictAge");
    await doPredictAge(skipAntiSpoof);
  };

  // to start and stop predictAge call when on loop
  useEffect(() => {
    // const doUsePredictAge = async () => {
    //   await doPredictAge(skipAntiSpoof);
    // };
    // if (debugContext.functionLoop) {
    //   if (currentAction === "usePredictAge" && predictAgeHasFinished) {
    //     setPredictAgeHasFinished(false);
    //   }
    //   if (currentAction === "usePredictAge" && !predictAgeHasFinished) {
    //     doUsePredictAge();
    //   }
    //   if (currentAction !== "usePredictAge" && predictAgeHasFinished) {
    //     setPredictAgeHasFinished(false);
    //   }
    // } else {
    //   setPredictAgeHasFinished(false);
    // }
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

  // Face Login
  const {
    doFaceLogin,
    faceLoginAntispoofPerformed,
    faceLoginAntispoofStatus,
    faceLoginGUID,
    faceLoginMessage,
    faceLoginPUID,
    faceLoginValidationStatus,
  } = useFaceLogin("userVideo", () => {}, null, deviceId, setShowSuccess, setDisableButtons);

  const handleFaceLogin = async () => {
    setShowSuccess(false);
    setCurrentAction("useFaceLogin");
    doFaceLogin(skipAntiSpoof);
  };

  // Face Login
  const {
    doOscarLogin,
    oscarLoginAntispoofPerformed,
    oscarLoginAntispoofStatus,
    oscarLoginGUID,
    oscarLoginMessage,
    oscarLoginPUID,
    oscarLoginValidationStatus,
  } = useOscarLogin("userVideo", () => {}, null, deviceId, setShowSuccess, setDisableButtons);

  const handleOscarLogin = async () => {
    setShowSuccess(false);
    setCurrentAction("useOscarLogin");
    doOscarLogin(skipAntiSpoof);
  };

  // Scan Healthcare Card
  const { croppedDocumentBase64, doScanHealthcareCard } = useScanHealthcareCard(setShowSuccess);

  const handleUseScanHealhcareCard = async () => {
    setShowSuccess(false);
    setCurrentAction("useScanHealthcareCard");
    doScanHealthcareCard(undefined, debugContext.functionLoop);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleLivenessCheck = async () => {
    setCurrentAction("livenessCheck");
    resetAllLivenessValues();
    await doLivenessCheck();
  };

  const {
    continuousPredictWithoutRestrictionsGUID,
    continuousPredictWithoutRestrictionsMessage,
    continuousPredictWithoutRestrictionsPUID,
    continuousPredictWithoutRestrictionsValidationStatus,
    doContinuousPredictWithoutRestrictions,
  } = useContinuousPredictWithoutRestrictions(setShowSuccess);

  const handleBurningMan = () => {
    setCurrentAction("useContinuousPredictWithoutRestrictions");
    doContinuousPredictWithoutRestrictions();
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
              {currentAction === "useEnrollOneFa" && (
                <div className="enrollDisplay">
                  <span> {getRawFaceValidationStatus(enrollValidationStatus)} </span>
                </div>
              )}
              {currentAction === "useFaceLogin" && (
                <div className="enrollDisplay">
                  <span> {getRawFaceValidationStatus(faceLoginValidationStatus)} </span>
                </div>
              )}
               {currentAction === "useOscarLogin" && (
                <div className="enrollDisplay">
                  <span> {getRawFaceValidationStatus(oscarLoginValidationStatus)} </span>
                </div>
              )}
              {currentAction === "usePredictOneFa" && (
                <div className="enrollDisplay">
                  <span> {getRawFaceValidationStatus(predictValidationStatus)} </span>
                </div>
              )}
              {currentAction === "useContinuousPredictWithoutRestrictions" && (
                <div className="enrollDisplay">
                  <span> {getRawFaceValidationStatus(continuousPredictWithoutRestrictionsValidationStatus)} </span>
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
            </div>

            <div>
              <span
                style={{
                  display: currentAction === "useContinuousPredictWithoutRestrictions" ? "none" : "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                Skip antispoof?:
                <label class="switch">
                  <input
                    type="checkbox"
                    value={skipAntiSpoof}
                    defaultValue={true}
                    onChange={() => {
                      setSkipAntispoof(!skipAntiSpoof);
                      console.log("skip", !skipAntiSpoof);
                    }}
                  />
                  <span class="slider round"></span>
                </label>
              </span>
            </div>

            <div>
              {currentAction === "useEnrollOneFa" && (
                <div>
                  <div> Enroll Token: {enrollToken} </div>
                  <div>
                    Antispoof Performed:
                    {JSON.stringify(enrollAntispoofPerformed)}
                  </div>
                  <div> Antispoof Status: {enrollAntispoofStatus} </div>
                  <div> Validation Status: {enrollValidationStatus} </div>
                  <div>
                    Enroll GUID:&nbsp;
                    {`${enrollGUID}`}
                  </div>
                  <div>
                    Enroll PUID:&nbsp;
                    {`${enrollPUID}`}
                  </div>
                </div>
              )}

              {currentAction === "isValid" && (
                <div>
                  <div>{`Antispoof Performed: ${isValidAntispoofPerformed}`}</div>
                  <div>{`Antispoof Status: ${isValidAntispoofStatus}`}</div>
                  <div> {`Is Valid Status Code: ${isValidStatus}`} </div>
                </div>
              )}

              {currentAction === "usePredictAge" && (
                <div>
                  <div>{`Antispoof Performed: ${predictAgeAntispoofPerformed}`}</div>
                  <div>{`Antispoof Status: ${predictAgeAntispoofStatus}`}</div>
                  <div>{`Validataion Status: ${predictAgeValidationStatus}`}</div>
                </div>
              )}

              {currentAction === "usePredictOneFa" && (
                <div>
                  <div>{`Status: ${predictValidationStatus}`} </div>
                  <div>{`Message: ${predictMessage || ""}`}</div>
                  <div>{`Antispoof Performed: ${predictAntispoofPerformed}`}</div>
                  <div>{`Antispoof Status: ${predictAntispoofStatus}`}</div>
                  <div>{`Predicted GUID: ${predictGUID}`}</div>
                  <div>{`Predicted PUID: ${predictPUID}`}</div>
                </div>
              )}

              {currentAction === "useContinuousPredictWithoutRestrictions" && (
                <div>
                  <div>{`Status: ${continuousPredictWithoutRestrictionsValidationStatus}`} </div>
                  <div>{`Message: ${continuousPredictWithoutRestrictionsMessage || ""}`}</div>
                  <div>{`Predicted GUID: ${continuousPredictWithoutRestrictionsGUID}`}</div>
                  <div>{`Predicted PUID: ${continuousPredictWithoutRestrictionsPUID}`}</div>
                </div>
              )}

              {/* {currentAction === "useContinuousPredict" && (
                <div>
                  <div>{`Face Valid: ${continuousFaceDetected ? "Face Detected" : "Face not detected"}`}</div>
                  <div>{`Message: ${continuousPredictMessage || ""}`}</div>
                  <div>{`Predicted GUID: ${continuousPredictGUID ? continuousPredictGUID : ""}`}</div>
                  <div>{`Predicted PUID: ${continuousPredictUUID ? continuousPredictUUID : ""}`}</div>
                </div>
              )} */}

              {currentAction === "useFaceLogin" && (
                <div>
                  <div>{`Face Login Status: ${faceLoginValidationStatus}`} </div>
                  <div>{`Message: ${faceLoginMessage || ""}`}</div>
                  <div>{`Antispoof Performed: ${faceLoginAntispoofPerformed}`} </div>
                  <div>{`Antispoof Status: ${faceLoginAntispoofStatus}`} </div>
                  <div>{`Face Login GUID: ${faceLoginGUID}`}</div>
                  <div>{`Face Login PUID: ${faceLoginPUID}`}</div>
                </div>
              )}

              {currentAction === "useOscarLogin" && (
                <div>
                  <div>{`Face Login Status: ${oscarLoginValidationStatus}`} </div>
                  <div>{`Message: ${oscarLoginMessage || ""}`}</div>
                  <div>{`Antispoof Performed: ${oscarLoginAntispoofPerformed}`} </div>
                  <div>{`Antispoof Status: ${oscarLoginAntispoofStatus}`} </div>
                  <div>{`Face Login GUID: ${oscarLoginGUID}`}</div>
                  <div>{`Face Login PUID: ${oscarLoginPUID}`}</div>
                </div>
              )}

              {currentAction === "useDelete" && (
                <div>
                  <div>{`Deletion Status: ${deletionStatus}`}</div>
                  <div>{`User PUID: ${predictPUID}`}</div>
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

              {currentAction === "livenessCheck" && (
                <div>
                  <div>{`Progress: ${livenessProgress}`}</div>
                  <div>{`Final Result: ${finalResult}`}</div>
                  <div>{`Status Code: ${result}`}</div>
                  <div>{`Status Message: ${resultMessage}`}</div>
                </div>
              )}
            </div>

            <div id="module_functions" className="buttonContainer">
              <button
                className="button"
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                onClick={handleIsValid}
                disabled={disableButtons}
              >
                Is Valid
              </button>
              <button
                className="button"
                onClick={handlePredictAge}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Predict Age
              </button>
              <button
                className="button"
                onClick={handleEnrollOneFa}
                style={
                  disableButtons && currentAction !== "useEnrollOneFa"
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Enroll
              </button>
              <button
                className="button"
                onClick={handlePredictOneFa}
                style={
                  disableButtons && currentAction !== "usePredictOneFa"
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Predict
              </button>
              <button
                className="button"
                onClick={handleFaceLogin}
                style={
                  disableButtons && currentAction !== "useFaceLogin"
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Face Login
              </button>
              <button
                className="button"
                onClick={handleOscarLogin}
                style={
                  disableButtons && currentAction !== "useOscarLogin"
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Oscar Login
              </button>
              {/* <button className="button" onClick={handleContinuousPredict}>
                Continuous Authentication
              </button> */}

              <button
                className="button"
                onClick={handleBurningMan}
                style={
                  disableButtons && currentAction !== "useContinuousPredictWithoutRestrictions"
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Continuous Authentication (No Restrictions)
              </button>

              <button
                className="button"
                onClick={handleDelete}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Delete
              </button>
              <button
                className="button"
                onClick={handleFrontDLValidity}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Scan Front Document
              </button>
              <button
                className="button"
                onClick={handleScanDocumentBack}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Scan Back Document
              </button>
              {/* <button
                className="button"
                onClick={handlePrividFaceISO}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Face ISO
              </button> */}
              <button
                className="button"
                onClick={handleUseScanHealhcareCard}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Healthcare Card Scan
              </button>
              {/* <button
                className="button"
                onClick={handleLivenessCheck}
                style={
                  disableButtons
                    ? {
                        backgroundColor: "gray",
                      }
                    : {}
                }
                disabled={disableButtons}
              >
                Liveness Check
              </button> */}
            </div>

            <div>
              <p> Upload 2 images to use document and face compare: </p>
              <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadImage1}
                  style={{ display: "none" }}
                />
                <span className="button">Cropped Document Image</span>
              </label>
              <label>
                <input
                  type="file"
                  name="upload"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleUploadImage2}
                  style={{ display: "none" }}
                />
                <span className="button">Face Image</span>
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
