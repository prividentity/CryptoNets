/* eslint-disable */
import { useCallback, useEffect, useState } from 'react';
import { isValid, switchCamera } from '@privateid/cryptonets-web-sdk';
import './styles.css'
import useCamera from '../hooks/useCamera';
import useWasm from '../hooks/useWasm';
import { isAndroid, isIOS, osVersion } from '../utils';
import useEnroll from '../hooks/useEnroll';
import useContinuousPredict from '../hooks/useContinuousPredict';
import useDelete from '../hooks/useDelete';
import usePredict from '../hooks/usePredict';
import useScanFrontDocument from '../hooks/useScanFrontDocument';
import useScanBackDocument from '../hooks/useScanBackDocument';


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

  // isValid
  const handleIsValid = async () => {
    setCurrentAction("isValid")
  };
  // do isValid call every 2 sec
  useEffect(() => {
    const doIsValid = async () => {
      const result = await isValid();
      console.log("result react: ", result)
      setIsValidCallData(result.result === 0 ? "Valid Face Detected" : "No Face Detected");
    }
    let interval;
    if (currentAction === "isValid") {
      doIsValid();
      interval = setInterval(doIsValid, 2000)
    }
    return () => clearInterval(interval)
  }, [currentAction])


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
  useEffect(() => {
    if (currentAction === "useDelete") {
      if (predictData) {
        onDeleteUser(predictData.uuid)
      }
    }
  }, [currentAction, predictData])


  // Scan Document Front
  const { scanResult, scanFrontDocument, isFound, scannedIdData, resultStatus } = useScanFrontDocument();
  const handleScanDLFront = async () => {
    setCurrentAction("useScanDocumentFront")
  }

  // useEffect To scan front of the DL every 0.3 sec
  useEffect(()=>{
    const doScan = async () => {
      console.log("scanning front:")
      await scanFrontDocument();
    }
    let interval;
    if (currentAction === "useScanDocumentFront") {
      if (!isFound) {
        doScan();
        interval = setInterval(doScan,300);
      }
    }
    return () => clearInterval(interval)
  },[currentAction, isFound])


  // Scan Document Back
  const { scanBackDocument, scannedCodeData } = useScanBackDocument()
  const handleScanDocumentBack = async () => {
    setCurrentAction("useScanDocumentBack");
  }
 // useEffect To scan front of the DL every 0.3 sec
   useEffect(()=>{
    const doScan = async () => {
      console.log("scanning back:")
      await scanBackDocument();
    }
    let interval;
    if (currentAction === "useScanDocumentBack") {
      if(!scannedCodeData){
        doScan();
        interval = setInterval(doScan,300)
      }
    }
    return () => clearInterval(interval)
  },[currentAction,scannedCodeData])

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


          {currentAction === "useScanDocumentFront" &&
            <div>
              <div>
                {`Scan Document Result: ${resultStatus === 0? "success" : "not found" }`}
              </div>
              <div>
                {`Has found valid document: ${isFound}`}
              </div>
              {/* <div>
                {`Valid document UUID: ${scannedIdData ? scannedIdData.PI.uuid : ""}`}
              </div> */}
            </div>
          }

          {currentAction === "useScanDocumentBack" &&
            <div>
              <div>
                {`Scanned code data: ${scannedCodeData? JSON.stringify(scannedCodeData): ""}`}
              </div>
              {/* {scannedCodeData&& 
                <ul>
                  {Object.entries(scannedCodeData).map((data)=>{
                    return <li> {`${data[0]}: ${JSON.stringify(data[1])}`}</li>
                  })}

                </ul>
              } */}
            </div>
          }
        </div>

        <div id="module_functions" className='buttonContainer' >
          <button className='button' onClick={handleIsValid}> Is Valid </button>
          <button className='button' onClick={handleEnroll}> Enroll </button>
          <button className='button' onClick={handleContinuousPredict}> Continuous Predict </button>
          <button className='button' onClick={handleDelete}> Delete </button>
          <button className='button' onClick={handleScanDLFront}> Scan Front Document</button>
          <button className='button' onClick={handleScanDocumentBack}> Scan Back Document</button>
        </div>
      </div>

    </div>
  );
};


export default Ready;