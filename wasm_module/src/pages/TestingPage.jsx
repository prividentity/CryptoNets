/* eslint-disable */
import { useEffect, useState } from "react";
import { isValid, switchCamera, setStopLoopContinuousEnrollPredict } from "@privateid/cryptonets-web-sdk-alpha";

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
import { canvasSizeOptions, isAndroid, isBackCamera, isIOS, osVersion } from "../utils";

import "./styles.css";
import usePredictAge from "../hooks/usePredictAge";
import useScanFrontDocumentWithoutPredict from "../hooks/useScanFrontDocumentWithoutPredict";

const Ready = () => {
  const { ready: wasmReady } = useWasm();
  const { ready, init, device, devices, faceMode, setDevice } = useCamera("userVideo");
  const isBack = isBackCamera(devices, device);
  const [deviceId, setDeviceId] = useState(device);
  const [canvasSize, setCanvasSize] = useState(canvasSizeOptions[0].value);

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
  const { faceDetected: continuousFaceDetected, predictUser: continuousPredictUser } = useContinuousPredict(
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
  const { predictOneFaData, predictOneFaStatus, predictOneFaaceDetected, predictOneFaprogress, predictUserOneFa } =
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
      setStopLoopContinuousEnrollPredict(true);
    } else {
      setStopLoopContinuousEnrollPredict(false);
    }
  }, [currentAction]);

  const handleSwitchCamera = (e) => {
    setDeviceId(e.target.value);
    switchCamera(null, e.target.value);
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

  // Scan Document Front
  const handleFrontSuccess = (result) => {
    console.log("FRONT SUCCSES: ", result);
  };
  const { scanResult, scanFrontDocument, isFound, scannedIdData, resultStatus, documentUUID, documentGUID } =
    useScanFrontDocument(handleFrontSuccess);
  const handleScanDLFront = async () => {
    setCurrentAction("useScanDocumentFront");
    await scanFrontDocument();
  };

  // Scan Document Back
  const handleBackSuccess = (result) => {
    console.log("BACK SUCCESS: ", result);
  };
  const { scanBackDocument, scannedCodeData } = useScanBackDocument(handleBackSuccess);
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

  const { isFound: isfoundValidity, scanFrontDocument: scanFrontValidity } = useScanFrontDocumentWithoutPredict();

  const handleFrontDLValidity = async () => {
    setCurrentAction("useScanDocumentFrontValidity");
    await scanFrontValidity();
  };

  // useEffect To scan front of the DL every 0.3 sec
  // useEffect(() => {
  //   const doScan = async () => {
  //     console.log("scanning front:");
  //     await scanFrontValidity();
  //   };
  //   let interval;
  //   if (currentAction === "useScanDocumentFrontValidity") {
  //     if (!isfoundValidity) {
  //       doScan();
  //       interval = setInterval(doScan, 300);
  //     }
  //   }
  //   return () => clearInterval(interval);
  // }, [currentAction, isfoundValidity]);

  const handleCanvasSize = async (e) => {
    setCanvasSize(e.target.value);
    await scanFrontDocument(e.target.value);
  };

  console.log("API KEY: ", process.env.REACT_APP_API_KEY);
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
            <label> Select Camera: </label>
            <select value={deviceId || device} onChange={(e) => handleSwitchCamera(e)}>
              {devices.map((e, index) => {
                return (
                  <option id={e.value} value={e.value} key={index}>
                    {e.label}
                  </option>
                );
              })}
            </select>
          </div>
          {currentAction === "useScanDocumentFront" && (
            <div>
              <label> Canvas Size: </label>
              <select value={canvasSize} onChange={(e) => handleCanvasSize(e)}>
                {canvasSizeOptions.map(({ label, value }) => (
                  <option id={value} value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
              <div>{`Predicted GUID: ${continuousPredictGUID ? continuousPredictGUID : ""}`}</div>
              <div>{`Predicted UUID: ${continuousPredictUUID ? continuousPredictUUID : ""}`}</div>
            </div>
          )}

          {currentAction === "usePredictOneFa" && (
            <div>
              <div>{`Face Valid: ${predictOneFaaceDetected ? "Face Detected" : "Face not detected"}`}</div>
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
              <div style={{ backgroundColor: "black" }}>
                {`Scanned code data: ${scannedCodeData ? JSON.stringify(scannedCodeData) : ""}`}
              </div>
            </div>
          )}

          {currentAction === "useScanDocumentFrontValidity" && (
            <div>
              <div>{`Scan Document Result: ${isfoundValidity ? "Valid Front Document found" : "not found"}`}</div>
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
            Continuous Predict
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
        </div>
      </div>
    </div>
  );
};

export default Ready;
