/* eslint-disable */
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  switchCamera,
  setStopLoopContinuousAuthentication,
  closeCamera,
  faceCompareLocal,
} from "@privateid/cryptonets-web-sdk-alpha";

import { useCamera, useWasm, useEnrollOneFa } from "../hooks";
import { canvasSizeOptions, isBackCamera, setMax2KForMobile, WIDTH_TO_STANDARDS } from "../utils";

import "./styles.css";
import { useNavigate } from "react-router-dom";
import useScanFrontWithBoundingBox from "../hooks/useScanFrontWithBoundingBox";
import useScanBackWithBoundingBox from "../hooks/useScanBackWithBoundingBox";

let callingWasm = false;
const ScanDocumentBoundingBox = () => {
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
    if (wasmReady && ready) {
      scanFrontValidity();
    }
  }, [wasmReady, ready]);

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

  // Scan Front with Bounding Box 
  // const {
  //   isFound: isfoundValidity,
  //   scanFrontDocument: scanFrontValidity,
  //   confidenceValue,
  //   predictMugshotImageData,
  //   scanResult,
  //   scaledBoundingBoxRef,
  // } = useScanFrontWithBoundingBox(setShowSuccess, () => {});

  // Scan Back With Bounding Box
  const {
    isFound: isfoundValidity,
    scanFrontDocument: scanFrontValidity,
    confidenceValue,
    predictMugshotImageData,
    scanResult,
    scaledBoundingBoxRef,
  } = useScanBackWithBoundingBox(setShowSuccess, ()=>{})

  const handleReopenCamera = async () => {
    setReady(false);
    await closeCamera();
    await init();
  };

  const handleCloseCamera = async () => {
    await closeCamera();
  };
  // const handleVideoLoad = useCallback(() => {
  //   const videoElement = document.getElementById("userVideo");
  //   if (!scanResultRef?.current || !videoElement) return;
  //   // use the dimensions of the video element to calculate the scaling factors
  //   const scaleX = videoElement.videoWidth / scanResultRef?.current?.cropped_doc_width;
  //   const scaleY = videoElement.videoHeight / scanResultRef?.current?.cropped_doc_height;
  //   // apply the scaling factors to the bounding box coordinates
  //   const scaledTopLeftX = scanResultRef?.current?.doc_x1 * scaleX;
  //   const scaledTopLeftY = scanResultRef?.current?.doc_y1 * scaleY;
  //   const scaledDocumentWidth = scanResultRef?.current?.cropped_doc_width * scaleX;
  //   const scaledDocumentHeight = scanResultRef?.current?.cropped_doc_height * scaleY;

  //   console.log("scaledTopLeftX", scaledTopLeftX);
  //   console.log("scaledTopLeftY", scaledTopLeftY);
  //   console.log("scaledDocumentWidth", scaledDocumentWidth);
  //   console.log("scaledDocumentHeight", scaledDocumentHeight);
  // }, [scanResultRef]);

  // useEffect(() => {
  //   const videoElement = document.getElementById("userVideo");

  // }, [scanResult]);
  const res = scaledBoundingBoxRef?.current;
  console.log("res123", res);
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
              <h4>Bounding Box:</h4>
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
            <div style={{ position: "relative" }}>
              {console.log("ScanResult??", scanResult)};
              {res && (
                <Box
                  topLeftX={res.doc_x1}
                  topLeftY={res.doc_y1}
                  documentHeight={res.cropped_doc_height}
                  documentWidth={res.cropped_doc_width}
                  scale={res.roughScale}
                />
              )}
              <video id="userVideo" muted autoPlay playsInline />
            </div>

            <div>
              {currentAction === "useScanDocumentFrontValidity" && (
                <div>
                  <div>{`Scan Document Result: ${isfoundValidity ? "Valid Front Document found" : "not found"}`}</div>
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

export default ScanDocumentBoundingBox;

const Box = ({ topLeftX, topLeftY, documentHeight, documentWidth, scale }) => {
  console.log("BOX POSITION:", { topLeftX, topLeftY, documentWidth, documentHeight });
  return (
    <>
      {topLeftX && topLeftY && documentWidth && documentHeight && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            top: `${topLeftY}px`,
            left: `${topLeftX}px`,
            border: `${4 * Math.min(Math.max(scale, 0.8), 1.25)}px solid green`,
            height: `${documentHeight ? documentHeight : "50"}px`,
            width: `${documentWidth ? documentWidth : "50"}px`,
          }}
        />
      )}
    </>
  );
};
