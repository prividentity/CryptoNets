/* eslint-disable */
import { useEffect, useMemo, useState } from "react";
import {
  isValid,
  switchCamera,
  setStopLoopContinuousAuthentication,
  closeCamera,
} from "@privateid/cryptonets-web-sdk-alpha";

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
  isAndroid,
  isBackCamera,
  isIOS,
  isMobile,
  mapDevices,
  osVersion, setMax2KForMobile,
  WIDTH_TO_STANDARDS,
} from '../utils';

import "./styles.css";
import usePredictAge from "../hooks/usePredictAge";
import useScanFrontDocumentWithoutPredict from "../hooks/useScanFrontDocumentWithoutPredict";
import usePrividFaceISO from "../hooks/usePrividFaceISO";

const Ready = () => {
  const { ready: wasmReady } = useWasm();
  const { ready, init, device, devices, settings, capabilities } = useCamera("userVideo");
  // Scan Document Front

  const handleFrontSuccess = (result) => {
    console.log("FRONT SCAN DATA: ", result);
  };
  const { scanFrontDocument, isFound, resultStatus, documentUUID, documentGUID, setShouldTriggerCallback } =
    useScanFrontDocument(handleFrontSuccess);
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
  const { faceDetected: continuousFaceDetected, predictUser: continuousPredictUser, continuousPredictMessage } = useContinuousPredict(
    "userVideo",
    continuousPredictSuccess,
    continuousOnNotFoundAndFailure,
    continuousOnNotFoundAndFailure,
    predictRetryTimes
  );

  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    if (!wasmReady) return;
    if (!ready) init();
    if (isIOS && osVersion < 15) {
      console.log("Does not support old version of iOS os version 15 below.");
    } else if (isAndroid && osVersion < 11) {
      console.log("Does not support old version of Android os version 11 below.");
    }
    console.log("--- wasm status ", wasmReady, ready);
  }, [wasmReady, ready]);

  const { faceDetected: isValidFaceDetected, isValidCall, hasFinished, setHasFinished } = useIsValid("userVideo");
  // isValid
  const handleIsValid = async () => {
    setCurrentAction("isValid");
    await isValidCall();
  };

  // to start and stop isValid call when on loop
  useEffect(() => {
    const doIsValid = async () => {
      await isValidCall();
    };

    if (currentAction === "isValid" && hasFinished) {
      setHasFinished(false);
    }
    if (currentAction === "isValid" && !hasFinished) {
      doIsValid();
    }
    if (currentAction !== "isValid" && hasFinished) {
      setHasFinished(false);
    }
  }, [currentAction, hasFinished]);

  // Enroll ONEFA
  const useEnrollSuccess = () => console.log("=======ENROLL SUCCESS=======");
  const {
    faceDetected: enrollOneFaFaceDetected,
    enrollStatus: enrollOneFaStatus,
    enrollData: enrollOneFaData,
    enrollUserOneFa,
    progress: enrollOneFaProgress,
  } = useEnrollOneFa("userVideo", useEnrollSuccess, null, deviceId);
  const handleEnrollOneFa = async () => {
    setCurrentAction("useEnrollOneFa");
    enrollUserOneFa();
  };

  const handlePreidctSuccess = (result) => {
    console.log("======PREDICT SUCCESS========");
  };
  const { predictOneFaData, predictOneFaaceDetected, predictMessage, predictUserOneFa } =
    usePredictOneFa("userVideo", handlePreidctSuccess);
  const handlePredictOneFa = async () => {
    setCurrentAction("usePredictOneFa");
    predictUserOneFa();
  };

  const handleContinuousPredict = async () => {
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
  const { loading, onDeleteUser } = useDelete(useDeleteCallback, ready);

  const handleDelete = async () => {
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

  const handleScanDLFront = async () => {
    setCurrentAction("useScanDocumentFront");
    // hack to initialize canvas with large memory, so it doesn't cause an issue.
    if (canvasSize) {
      await scanFrontDocument(canvasSize);
    } else {
      if (!isMobile) {
        await scanFrontDocument(canvasSizeOptions[3].value, () => {});
      }
      await scanFrontDocument(initialCanvasSize);
    }
  };

  // Scan Document Back
  const handleBackSuccess = (result) => {
    console.log("BACK SCAN DATA: ", result);
  };
  const { scanBackDocument, scannedCodeData, barcodeStatusCode } = useScanBackDocument(handleBackSuccess);
  const handleScanDocumentBack = async () => {
    setCurrentAction("useScanDocumentBack");
    await scanBackDocument();
  };

  const isDocumentOrBackCamera =
    ["useScanDocumentBack", "useScanDocumentFront", "useScanDocumentFrontValidity"].includes(currentAction) || isBack;

  // Predict Age
  const { doPredictAge, age, predictAgeHasFinished, setPredictAgeHasFinished } = usePredictAge();

  const handlePredictAge = async () => {
    setCurrentAction("usePredictAge");
    await doPredictAge();
  };

  // to start and stop predictAge call when on loop
  useEffect(() => {
    const doUsePredictAge = async () => {
      await doPredictAge();
    };
    if (currentAction === "usePredictAge" && predictAgeHasFinished) {
      setPredictAgeHasFinished(false);
    }
    if (currentAction === "usePredictAge" && !predictAgeHasFinished) {
      doUsePredictAge();
    }
    if (currentAction !== "usePredictAge" && predictAgeHasFinished) {
      setPredictAgeHasFinished(false);
    }
  }, [currentAction, predictAgeHasFinished]);

  // Scan Front DL without predict

  const {
    isFound: isfoundValidity,
    scanFrontDocument: scanFrontValidity,
    confidenceValue,
  } = useScanFrontDocumentWithoutPredict();

  const handleFrontDLValidity = async () => {
    setCurrentAction("useScanDocumentFrontValidity");
    await scanFrontValidity();
  };

  const handleCanvasSize = async (e, skipSwitchCamera = false) => {
    if (currentAction === "useScanDocumentFront" || currentAction === "useScanDocumentBack") {
      setShouldTriggerCallback(false);
      setCanvasSize(e.target.value);
      const canvasSize = CANVAS_SIZE[e.target.value];
      if (!skipSwitchCamera) {
        const { capabilities = {} } = await switchCamera(null, deviceId || device, canvasSize);
        setDeviceCapabilities(capabilities);
        // setDevicesList(devices.map(mapDevices));
      }
      setShouldTriggerCallback(true);

      if (currentAction === "useScanDocumentFront") {
        setTimeout(async () => {
          await scanFrontDocument(e.target.value);
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
    doFaceISO();
  };

  const handleReopenCamera = async () => {
    await init();
  };

  const handleCloseCamera = async () => {
    await closeCamera();
  };

  return (
    <div id="canvasInput" className="container">
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
        <div className="cameraContainer">
          <video
            id="userVideo"
            className={`cameraDisplay ${isDocumentOrBackCamera ? "" : "mirrored"}`}
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

          {currentAction === "isValid" && (
            <div>
              <div>{`Face Valid: ${isValidFaceDetected}`}</div>
            </div>
          )}

          {currentAction === "useContinuousPredict" && (
            <div>
              <div>{`Face Valid: ${continuousFaceDetected ? "Face Detected" : "Face not detected"}`}</div>
              <div>{`Messege: ${continuousPredictMessage}`}</div>
              <div>{`Predicted GUID: ${continuousPredictGUID ? continuousPredictGUID : ""}`}</div>
              <div>{`Predicted UUID: ${continuousPredictUUID ? continuousPredictUUID : ""}`}</div>
            </div>
          )}

          {currentAction === "usePredictOneFa" && (
            <div>
              <div>{`Face Valid: ${predictOneFaaceDetected ? "Face Detected" : "Face not detected"}`}</div>
              <div>{`Messege: ${predictMessage}`}</div>
              <div>{`Predicted GUID: ${predictOneFaData ? predictOneFaData.PI.guid : ""}`}</div>
              <div>{`Predicted UUID: ${predictOneFaData ? predictOneFaData.PI.uuid : ""}`}</div>
            </div>
          )}

          {currentAction === "useDelete" && (
            <div>
              <div>{`Deletion Status: ${deletionStatus}`}</div>
              <div>{`User UUID: ${predictOneFaData ? predictOneFaData.PI.uuid : ""}`}</div>
            </div>
          )}

          {currentAction === "useScanDocumentFront" && (
            <div>
              <div>{`Scan Document Result: ${resultStatus === 0 ? "success" : "not found"}`}</div>
              <div>{`Has found valid document: ${isFound}`}</div>
              <div>{`Document GUID: ${documentGUID}`} </div>
              <div>{`Document UUID: ${documentUUID}`} </div>
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
            </div>
          )}

          {currentAction === "useScanDocumentFrontValidity" && (
            <div>
              <div>{`Scan Document Result: ${isfoundValidity ? "Valid Front Document found" : "not found"}`}</div>
            </div>
          )}

          {currentAction === "privid_face_iso" && (
            <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", flexDirection: "column" }}>
              <div> FACE ISO STATUS: {faceISOStatus} </div>
              <div>
                <h2>Input Image:</h2>
                {inputImage && <img style={{ maxWidth: "400px" }} src={inputImage} />}
              </div>
              <div>
                <h2>Output Image:</h2>
                {faceISOImageData && <img style={{ maxWidth: "400px" }} src={faceISOImageData} />}
              </div>
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
          <button className="button" onClick={handleEnrollOneFa}>
            Enroll
          </button>
          <button className="button" onClick={handlePredictOneFa}>
            Predict
          </button>
          <button className="button" onClick={handleContinuousPredict}>
            Continuous Authentication
          </button>
          <button className="button" onClick={handleDelete}>
            Delete
          </button>
          <button className="button" onClick={handleScanDLFront}>
            Scan Front Document
          </button>
          <button className="button" onClick={handleFrontDLValidity}>
            Scan Front Document Validity (No identity)
          </button>
          <button className="button" onClick={handleScanDocumentBack}>
            Scan Back Document
          </button>
          <button className="button" onClick={handlePrividFaceISO}>
            Face ISO
          </button>
        </div>
      </div>
    </div>
  );
};

export default Ready;
