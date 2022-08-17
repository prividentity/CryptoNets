/* eslint-disable */
import { useCallback, useEffect, useState } from 'react';
import { isValid, switchCamera } from '@privateid/privid-fhe-modules';
import './styles.css'
import useCamera from '../hooks/useCamera';
import useWasm from '../hooks/useWasm';
import { isAndroid, isIOS, osVersion } from '../utils';
import useEnroll from '../hooks/useEnroll';
import useContinuousPredict from '../hooks/useContinuousPredict';
import useDelete from '../hooks/useDelete';
import usePredict from '../hooks/usePredict';


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
    setIsValidCallData(resultData.result === 0 ? "Valid Face Detected" : "Invalid Face");
    // handleIsValid();
  };


  const handleEnroll = async () => {
    setCurrentAction("useEnroll");
    enrollUser();
  }

  const handleContinuousPredict = async () => {
    setCurrentAction("useContinuousPredict")
    await continuousPredictUser();
  }


  const handleSwitchCamera = (e) => {
    setDeviceId(e.target.value);
    switchCamera(null, e.target.value);
  }


  // Use Delete
  // for useDelete, first we need to get the UUID of the user by doing a predict
  const [deletionStatus, setDeletionStatus] = useState(null);
  const useDeleteCallback = (deleteStatus) => { setDeletionStatus(deleteStatus) }
  const { loading, onDeleteUser } = useDelete(useDeleteCallback, ready)
  const [predictData, setPredictData] = useState(null)
  const callbackPredict = (guid, uuid) => {
    setPredictData({ guid, uuid });
  };
  const predictFailureCallback = () => {
    console.log("Face not detected.");
  };
  const { faceDetected, predictUser, predictResultData } = usePredict(
    "userVideo",
    callbackPredict,
    predictFailureCallback,
    predictFailureCallback
  );

  const handleDelete = useCallback(async () => {
    setCurrentAction("useDelete")
    predictUser();
  }, [predictResultData])
  // deleting
  useEffect(()=>{
    if(currentAction === "useDelete"){
      if(predictData){
        onDeleteUser(predictData.uuid)
      }
    }
  }, [currentAction,predictData])

  return (
    <div id="canvasInput" className='container'>
      <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", flexWrap: "wrap", gap: "10px" }}>
        <label> Select Camera: </label>
        <select onChange={(e) => handleSwitchCamera(e)}>
          {devices.map((e, index) => {
            return <option id={e.value} value={e.value} key={index} > {e.label} </option>
          })}
        </select>
        <div className='cameraContainer'>
          <video
            id="userVideo"
            className='cameraDisplay'
            muted
            autoPlay
            playsInline
          />
        </div>

        <div>
          {currentAction === "useEnroll" &&
            <div>
              <div> Enroll Face Detected: {enrollFaceDetected ? "Face Detected" : "No Face Detected"}</div>
              <div> Enroll Status: {enrollStatus} </div>
              <div> Progress: {`${progress} %`}</div>
              <div> Enroll UUID: {`${enrollData ? enrollData.PI.uuid : ""}`}</div>
              <div> Enroll GUID: {`${enrollData ? enrollData.PI.guid : ""}`}</div>
            </div>
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
                {`User UUID: ${predictData ? predictData.uuid : ""}`}
              </div>
            </div>
          }

        </div>

        <div id="module_functions" className='buttonContainer' >
          <button className='button' onClick={handleIsValid}> Is Valid </button>
          <button className='button' onClick={handleEnroll}> Enroll </button>
          <button className='button' onClick={handleContinuousPredict}> Continuous Predict </button>
          <button className='button' onClick={handleDelete}> Delete </button>
        </div>
      </div>

    </div>
  );
};


export default Ready;