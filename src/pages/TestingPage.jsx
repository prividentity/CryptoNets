/* eslint-disable */
import { useEffect, useState } from 'react';
import { isValid, switchCamera } from '@privateid/privid-fhe-modules';

import useCamera from '../hooks/useCamera';
import useWasm from '../hooks/useWasm';
import { isAndroid, isIOS, osVersion } from '../utils';
import usePredict from '../hooks/usePredict';
import useEnroll from '../hooks/useEnroll';
import useContinuousPredict from '../hooks/useContinuousPredict';

const Ready = () => {
  const { ready: wasmReady } = useWasm();
  const { ready, init, device, devices, faceMode, setDevice } = useCamera('userVideo');
  const [deviceId, setDeviceId] = useState("");

  // Use Predict
  // I have created callbacks here for usePredict hook to use for now i am just printing statuses
  const usePredictSuccess = () => console.log("Prediction successful.");
  const usePredictUnsuccessful = () => console.log("Prediction unseccessful.");
  const usePredictNotFound = () => console.log("Prediction face not found.")
  const predictRetryTimes = 100;
  const { faceDetected, predictUser } = usePredict('userVideo', usePredictSuccess, usePredictUnsuccessful, usePredictNotFound, predictRetryTimes)

  // Use Continuous Predict
  const { faceDetected: continuousFaceDetected, predictUser: continuousPredictUser } = useContinuousPredict('userVideo', usePredictSuccess, usePredictUnsuccessful, usePredictNotFound, predictRetryTimes)

  // Use Enroll
  const useEnrollSuccess = () => console.log("=======ENROLL SUCCESS=======");
  const { faceDetected: enrollFaceDetected, enrollStatus, enrollUser, progress } = useEnroll('userVideo', useEnrollSuccess, null, deviceId);

  const [currentAction, setCurrentAction] = useState(null)

  useEffect(() => {
    if (!wasmReady) return;
    if (!ready) init();
    if (isIOS && osVersion < 15) {
      console.log("Old version of IOS");
    } else if (isAndroid && osVersion < 11) {
      console.log("Old version of Android");
    }
    console.log("--- wasm status ", wasmReady, ready)
    if (wasmReady && ready) {
      console.log("ACTION: ", currentAction)
      switch (currentAction) {
        case "isValid":
          handleIsValid()
          break;
        case "usePredict":
          handlePredict();
          break;
        default:
          console.log("Please select an action!");
          break;
      }
    };
  }, [wasmReady, ready, currentAction]);

  const handleIsValid = async () => {
    setCurrentAction("isValid")
    console.log("----isValid----");
    const {
      imageData,
      resultData,
    } = await isValid('userVideo');
    console.log("Is Valid Result Data:", imageData, resultData)
    // handleIsValid();
  };


  const handleEnroll = async () => {
    console.log("------enrollPredict(Enroll)------");
    setCurrentAction("useEnroll");
    enrollUser();
  }

  const handlePredict = async () => {
    setCurrentAction("usePredict");
    await predictUser();
    console.log("Face detection: ", faceDetected);
  }

  const handleContinuousPredict = async () => {
    setCurrentAction("useContinuousPredict");
    await continuousPredictUser();
    console.log("Continuous Face detection: ", continuousFaceDetected);
  }

  const handleDelete = async () => {

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
              <li> Enroll Face Detected: {enrollFaceDetected}</li>
              <li> Enroll Status: {enrollStatus} </li>
              <li> Progress: {`${progress} %`}</li>
            </ul>
          }
        </div>

        <div id="module_functions" >
          <button onClick={handleIsValid}> Is Valid </button>
          <button onClick={handleEnroll}> Enroll </button>
          <button onClick={handlePredict}> Predict </button>
          <button onClick={handleContinuousPredict}> Continuous Predict </button>
          <button> Delete </button>
        </div>
      </div>


    </div>
  );
};


export default Ready;