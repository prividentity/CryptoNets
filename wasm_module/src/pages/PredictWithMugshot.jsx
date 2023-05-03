/* eslint-disable */
import { useEffect, useMemo, useState } from "react";
import {
  switchCamera,
  setStopLoopContinuousAuthentication,
  closeCamera,
  faceCompareLocal,
} from "@privateid/cryptonets-web-sdk-alpha";

import { useCamera, useWasm } from "../hooks";
import { canvasSizeOptions, isBackCamera, setMax2KForMobile, WIDTH_TO_STANDARDS } from "../utils";

import "./styles.css";
import useScanFrontDocumentWithoutPredictGetMugShot from "../hooks/useScanFrontDocumentWithoutPredictGetMugshot";
import { useNavigate } from "react-router-dom";
import useEnroll1FaWithImage from "../hooks/useEnrollOneFaWithImage";
import usePredictOneFaWithMugshot from "../hooks/usePredictOneFaWithMugshot";

let callingWasm = false;
const PredictWithMugshot = () => {
  const { ready: wasmReady, deviceSupported, init: initWasm } = useWasm();
  const { ready, init: initCamera, device, devices, settings, capabilities, setReady } = useCamera("userVideo");

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

  const [currentAction, setCurrentAction] = useState("standby");

  useEffect(() => {
    console.log("useEffect starting wasm and camera");
    console.log("--- wasm status ", wasmReady, ready);
    if (!wasmReady) {
      if (!callingWasm) {
        console.log("init wasm called:");
        initWasm();
        callingWasm = true;
      }
      return;
    }
    if (!ready) {
      console.log("calling camera");
      initCamera();
    }
  }, [wasmReady, ready]);

  useEffect(() => {
    switch (currentAction) {
      case "usePredictOneFa":
        predictUserOneFa(predictMugshotImageData);
        return;
      case "useScanDocumentFrontValidity":
        scanFrontValidity();
        return;
      default:
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

  const onMugshotSuccess = async () => {
     setCurrentAction("usePredictOneFa");
  };

  // Scan Front DL without predict
  const {
    isFound: isfoundValidity,
    scanFrontDocument: scanFrontValidity,
    confidenceValue,
    predictMugshotImageData,
  } = useScanFrontDocumentWithoutPredictGetMugShot(setShowSuccess, onMugshotSuccess);

//   useEffect(()=>{
//     if(predictMugshotImageData){
//         setCurrentAction("usePredictOneFa");
//     }
//   },[predictMugshotImageData])

  const { predictMessage, predictOneFaData, predictOneFaStatus, predictOneFaaceDetected, predictUserOneFa } = usePredictOneFaWithMugshot(
    setShowSuccess,
    { image_input_format:"rgba", context_string: "mugshot" },
    [predictMugshotImageData],
  );

  const handleReopenCamera = async () => {
    setReady(false);
    await closeCamera();
    await init();
  };

  const handleCloseCamera = async () => {
    await closeCamera();
  };

  const navigate = useNavigate();
  const refreshPage = () => {
    navigate(0);
  };

  return (
    <>
      {deviceSupported.isChecking ? (
        <div>
          <h1> Loading . . . </h1>
        </div>
      ) : !deviceSupported.isChecking && deviceSupported.supported ? (
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
            <div>
              <h4>Predict With Mugshot:</h4>
              <p> Step1 - Scan Front Document </p>
              <p> Step2 - Will use cropped mugshot for predict </p>
            </div>
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
              {/* {currentAction === "useEnrollOneFa" && (
                <div className="enrollDisplay">
                  <span> {enroll1FaWithImageStatus} </span>
                </div>
              )} */}
              <video
                id="userVideo"
                className={
                  (currentAction === "useScanDocumentFrontValidity" ? `cameraDisplay` : `cameraDisplay mirrored`) +
                  " " +
                  (showSuccess ? "cameraDisplaySuccess" : "")
                }
                muted
                autoPlay
                playsInline
              />
            </div>

            <div>
              {currentAction === "usePredictOneFa" && (
                <div>
                  <div>{`Face Valid: ${predictOneFaaceDetected ? "Face Detected" : "Face not detected"}`}</div>
                  <div>{`Message: ${predictMessage || ""}`}</div>
                  <div>{`Predicted GUID: ${predictOneFaData ? predictOneFaData.PI.guid : ""}`}</div>
                  <div>{`Predicted UUID: ${predictOneFaData ? predictOneFaData.PI.uuid : ""}`}</div>
                </div>
              )}

              {currentAction === "useScanDocumentFrontValidity" && (
                <div>
                  <div>{`Scan Document Result: ${isfoundValidity ? "Valid Front Document found" : "not found"}`}</div>
                </div>
              )}

              {currentAction === "standby" && (
                <div>
                  <button
                    className="button"
                    onClick={() => {
                      setCurrentAction("useScanDocumentFrontValidity");
                    }}
                    style={{ fontSize: "28px" }}
                  >
                    Start Flow
                  </button>
                </div>
              )}
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

export default PredictWithMugshot;
