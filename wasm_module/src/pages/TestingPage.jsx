/* eslint-disable */
import { useCallback, useEffect, useState } from 'react';
import { isValid, switchCamera } from '@privateid/privid-fhe-modules';

import useCamera from '../hooks/useCamera';
import useWasm from '../hooks/useWasm';
import { isAndroid, isIOS, osVersion } from '../utils';
import useEnroll from '../hooks/useEnroll';
import useContinuousPredict from '../hooks/useContinuousPredict';
import useDelete from '../hooks/useDelete';

const Ready = () => {
  const { ready: wasmReady } = useWasm();
  const { ready, init, device, devices, faceMode, setDevice } = useCamera('userVideo');
  const [deviceId, setDeviceId] = useState("");

  const [isValidCallData, setIsValidCallData] = useState(null);

  // Use Continuous Predict
  const predictRetryTimes = 1;
  const [continuousPredictUUID, setContinuousPredictUUID] = useState(null);
  const [continuousPredictGUID, setContinuousPredictGUID] = useState(null);
  const continuousPredictSuccess = (UUID, GUID) => {
    setContinuousPredictUUID(UUID);
    setContinuousPredictGUID(GUID);
  }
  const continuousOnNotFoundAndFailure = () => {
    setContinuousPredictUUID(null);
    setContinuousPredictGUID(null);
  }
  const { faceDetected: continuousFaceDetected, predictUser: continuousPredictUser } = useContinuousPredict('userVideo', continuousPredictSuccess, continuousOnNotFoundAndFailure, continuousOnNotFoundAndFailure, predictRetryTimes)

  // Use Enroll
  const useEnrollSuccess = () => console.log("=======ENROLL SUCCESS=======");
  const { faceDetected: enrollFaceDetected, enrollStatus, enrollData, enrollUser, progress } = useEnroll('userVideo', useEnrollSuccess, null, deviceId);

  // Use Delete
  const [deletionStatus, setDeletionStatus] = useState(null);
  const useDeleteCallback = (deleteStatus) => { setDeletionStatus(deleteStatus) }
  const { loading, onDeleteUser, userUUID: useDeleteUUID } = useDelete(useDeleteCallback, ready)

  const [currentAction, setCurrentAction] = useState(null)

  useEffect(() => {
    if (!wasmReady) return;
    if (!ready) init();
    if (isIOS && osVersion < 15) {
      console.log("Does not support old version of iOS os version 15 below.");
    } else if (isAndroid && osVersion < 11) {
      console.log("Does not support old version of Android os version 11 below.");
    }
    console.log("--- wasm status ", wasmReady, ready)
  }, [wasmReady, ready]);

  const handleIsValid = async () => {
    setCurrentAction("isValid")
    const {
      imageData,
      resultData,
    } = await isValid('userVideo');
    console.log("Is Valid Result Data:", imageData, resultData)
    setIsValidCallData(resultData.result === 0 ? "Valid Face Detected" : "Invalid Face");
    // handleIsValid();
  };

  const printEnrollData = useCallback(() => {
    console.log("enroll data:", enrollData)
  }, [enrollData])

  const handleEnroll = async () => {
    setCurrentAction("useEnroll");
    enrollUser();
    printEnrollData();
  }

  const handleContinuousPredict = async () => {
    setCurrentAction("useContinuousPredict")
    await continuousPredictUser();
  }

  const handleDelete = async () => {
    setCurrentAction("useDelete")
    onDeleteUser();
    console.log("DELETE STATUS: ", deletionStatus)
  }


  const handleSwitchCamera = (e) => {
    setDeviceId(e.target.value);
    switchCamera(null, e.target.value);
  }

  return (
    <div id="canvasInput" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", flexWrap: "wrap", gap: "10px" }}>
        <label> Select Camera: </label>
        <select onChange={(e) => handleSwitchCamera(e)}>
          {devices.map((e, index) => {
            return <option id={e.value} value={e.value} key={index} > {e.label} </option>
          })}
        </select>
        <div style={{ position: "relative", height: "50vh", marginBottom: "10px", border: "3px solid red" }}>
          <video
            style={{ height: "100%", width: "100%", objectFit: "cover" }}
            id="userVideo"
            muted
            autoPlay
            playsInline
          />
        </div>

        <div>
          {currentAction === "useEnroll" &&
            <ul>
              <li> Enroll Face Detected: {enrollFaceDetected ? "Face Detected" : "No Face Detected"}</li>
              <li> Enroll Status: {enrollStatus} </li>
              <li> Progress: {`${progress} %`}</li>
              <li> Enroll UUID: {`${enrollData ? enrollData.PI.uuid : ""}`}</li>
              <li> Enroll GUID: {`${enrollData ? enrollData.PI.guid : ""}`}</li>
            </ul>
          }

          {currentAction === "isValid" &&
            <div>
              <div>
                {`Face Valid: ${isValidCallData ? isValidCallData : null}`}
              </div>
            </div>
          }

          {currentAction === "useContinuousPredict" &&
            <div>
              <div>
                {`Face Valid: ${continuousFaceDetected ? "Face Detected" : "Face not detected"}`}
              </div>
              <div>
                {`Predicted GUID: ${continuousPredictGUID ? continuousPredictGUID : ""}`}
              </div>
              <div>
                {`Predicted UUID: ${continuousPredictUUID ? continuousPredictUUID : ""}`}
              </div>
            </div>
          }

          {currentAction === "useDelete" &&
            <div>
              <div>
                {`Deletion Status: ${deletionStatus}`}
              </div>
              <div>
                {`User UUID: ${useDeleteUUID ? useDeleteUUID : ""}`}
              </div>
            </div>
          }

        </div>

        <div id="module_functions" >
          <button onClick={handleIsValid}> Is Valid </button>
          <button onClick={handleEnroll}> Enroll </button>
          <button onClick={handleContinuousPredict}> Continuous Predict </button>
          <button onClick={handleDelete}> Delete </button>
        </div>
      </div>


    </div>
  );
};


export default Ready;