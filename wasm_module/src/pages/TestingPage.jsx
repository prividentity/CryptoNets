/* eslint-disable */
import { useContext, useEffect, useMemo, useState } from "react";
import {
  switchCamera,
  closeCamera,
  documentMugshotFaceCompare,
} from "@privateid/cryptonets-web-sdk";
import {
  useCamera,
  useWasm,
  useEnrollOneFa,
  useScanBackDocument,
} from "../hooks";
import {
  CANVAS_SIZE,
  canvasSizeOptions,
  setMax2KForMobile,
  WIDTH_TO_STANDARDS,
} from "../utils";

import "./styles.css";
import useScanFrontDocumentWithoutPredict from "../hooks/useScanFrontDocument";
import useFaceLogin from "../hooks/useFaceLogin";
import { getFrontDocumentStatusMessage, getRawFaceValidationStatus } from "@privateid/cryptonets-web-sdk/dist/utils";
import { DebugContext } from "../context/DebugContext";
import { useParams } from "react-router-dom";

let callingWasm = false;
const Ready = () => {
  const debugContext = useContext(DebugContext);
  let { loadSimd } = useParams();
  console.log(loadSimd);
  const { ready: wasmReady, deviceSupported, init: initWasm } = useWasm();

  const [cameraSettingsList, setCameraSettingsList] = useState({
    focusDistance: false,
    exposureTime: false,
    sharpness: false,
    brightness: false,
    saturation: false,
    contrast: false,
  });

  const [cameraFocusMin, setCameraFocusMin] = useState(0);
  const [cameraFocusMax, setCameraFocusMax] = useState(0);
  const [cameraFocusCurrent, setCameraFocusCurrent] = useState(0);

  const [cameraExposureTimeMin, setCameraExposureTimeMin] = useState(0);
  const [cameraExposureTimeMax, setCameraExposureTimeMax] = useState(0);
  const [cameraExposureTimeCurrent, setCameraExposureTimeCurrent] = useState(0);

  const [cameraSharpnessMin, setCameraSharpnessMin] = useState(0);
  const [cameraSharpnessMax, setCameraSharpnessMax] = useState(0);
  const [cameraSharpnessCurrent, setCameraSharpnessCurrent] = useState(0);

  const [cameraBrightnessMin, setCameraBrightnessMin] = useState(0);
  const [cameraBrightnessMax, setCameraBrightnessMax] = useState(0);
  const [cameraBrightnessCurrent, setCameraBrightnessCurrent] = useState(0);

  const [cameraSaturationMin, setCameraSaturationMin] = useState(0);
  const [cameraSaturationMax, setCameraSaturationMax] = useState(0);
  const [cameraSaturationCurrent, setCameraSaturationCurrent] = useState(0);

  const [cameraContrastMin, setCameraContrastMin] = useState(0);
  const [cameraContrastMax, setCameraContrastMax] = useState(0);
  const [cameraContrastCurrent, setCameraContrastCurrent] = useState(0);

  const {
    ready: cameraReady,
    init: initCamera,
    device,
    devices,
    settings,
    capabilities,
    setReady,
  } = useCamera(
    "userVideo",
    undefined,
    setCameraFocusMin,
    setCameraFocusMax,
    setCameraFocusCurrent,
    setCameraExposureTimeMin,
    setCameraExposureTimeMax,
    setCameraExposureTimeCurrent,
    setCameraSharpnessMin,
    setCameraSharpnessMax,
    setCameraSharpnessCurrent,
    setCameraBrightnessMin,
    setCameraBrightnessMax,
    setCameraBrightnessCurrent,
    setCameraSaturationMin,
    setCameraSaturationMax,
    setCameraSaturationCurrent,
    setCameraContrastMin,
    setCameraContrastMax,
    setCameraContrastCurrent,
    setCameraSettingsList
  );

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
  const [deviceId, setDeviceId] = useState(device);
  const [devicesList] = useState(devices);

  const [canvasSize, setCanvasSize] = useState();

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
        initWasm(loadSimd);
        callingWasm = true;
      }
      return;
    }
    if (!cameraReady) {
      initCamera();
    }
  }, [wasmReady, cameraReady]);

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

  const handleSwitchCamera = async (e) => {
    setDeviceId(e.target.value);
    const { capabilities = {}, settings = {}, devices } = await switchCamera(null, e.target.value);
    setDeviceCapabilities(capabilities);
    // setDevicesList(devices.map(mapDevices));
    console.log("switch camera capabilities:", capabilities);
    console.log("switch camera settings:", settings);
    if (currentAction === "useScanDocumentFront") {
      let width = WIDTH_TO_STANDARDS[settings?.width];
      if (width === "FHD" && settings?.height === 1440) {
        width = "iPhoneCC";
      }
      await handleCanvasSize({ target: { value: width } }, true);
    }

    try {
      if (capabilities) {
        let cameraSettings = {
          focusDistance: false,
          exposureTime: false,
          sharpness: false,
          brightness: false,
          saturation: false,
          contrast: false,
        };
        if (capabilities.focusDistance) {
          setCameraFocusMin(capabilities.focusDistance.min);
          setCameraFocusMax(capabilities.focusDistance.max);
          setCameraFocusCurrent(settings.focusDistance);
          cameraSettings = { ...settings, focusDistance: true };
        }
        if (capabilities.exposureTime) {
          setCameraExposureTimeMin(Math.ceil(capabilities.exposureTime.min));
          setCameraExposureTimeMax(Math.ceil(capabilities.exposureTime.max));
          setCameraExposureTimeCurrent(Math.ceil(settings.exposureTime));
          cameraSettings = { ...settings, exposureTime: true };
        }
        if (capabilities.sharpness) {
          setCameraSharpnessMin(Math.ceil(capabilities.sharpness.min));
          setCameraSharpnessMax(Math.ceil(capabilities.sharpness.max));
          setCameraSharpnessCurrent(Math.ceil(settings.sharpness));
          cameraSettings = { ...settings, sharpness: true };
        }
        if (capabilities.brightness) {
          setCameraBrightnessMin(Math.ceil(capabilities.brightness.min));
          setCameraBrightnessMax(Math.ceil(capabilities.brightness.max));
          setCameraBrightnessCurrent(Math.ceil(settings.brightness));
          cameraSettings = { ...settings, brightness: true };
        }
        if (capabilities.saturation) {
          setCameraSaturationMin(Math.ceil(capabilities.saturation.min));
          setCameraSaturationMax(Math.ceil(capabilities.saturation.max));
          setCameraSaturationCurrent(Math.ceil(settings.saturation));
          cameraSettings = { ...settings, saturation: true };
        }
        if (capabilities.contrast) {
          setCameraContrastMin(Math.ceil(capabilities.contrast.min));
          setCameraContrastMax(Math.ceil(capabilities.contrast.max));
          setCameraContrastCurrent(Math.ceil(settings.contrast));
          cameraSettings = { ...settings, contrast: true };
        }
        setCameraSettingsList(cameraSettings);
      }
    } catch (e) {
      //
    }
  };

  // Scan Document Back
  const {
    scanBackDocument,
    scannedCodeData,
    barcodeStatusCode,
    croppedBarcodeImage: croppedBarcodeBase64,
    croppedDocumentImage: croppedBackDocumentBase64,
    clearStatusBackScan,
  } = useScanBackDocument(setShowSuccess);
  const handleScanDocumentBack = async () => {
    setShowSuccess(false);
    clearStatusBackScan();
    setCurrentAction("useScanDocumentBack");
    await scanBackDocument(undefined, debugContext.functionLoop);
  };

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
      // setShouldTriggerCallback(false);
      setCanvasSize(e.target.value);
      const canvasSize = CANVAS_SIZE[e.target.value];
      if (!skipSwitchCamera) {
        const { capabilities = {} } = await switchCamera(null, deviceId || device, canvasSize);
        setDeviceCapabilities(capabilities);
      }
      // setShouldTriggerCallback(true);

      if (currentAction === "useScanFrontValidity") {
        setTimeout(async () => {
          await useScanFrontDocumentWithoutPredict(e.target.value);
        }, 1000);
      } else {
        setTimeout(async () => {
          await scanBackDocument(e.target.value);
        }, 3000);
      }
    }
  };

  const handleReopenCamera = async () => {
    setReady(false);
    await closeCamera();
    await init();
  };

  const handleCloseCamera = async () => {
    await closeCamera();
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

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handleFocusChange = async (val) => {
    try {
      const video = document.getElementById("userVideo");
      const mediaStream = video.srcObject;
      const track = await mediaStream.getTracks()[0];
      const capabilities = track.getCapabilities();

      await track.applyConstraints({
        advanced: [
          {
            focusMode: "manual",
            focusDistance: val,
          },
        ],
      });

      const newSettings = await track.getSettings();

      console.log("new Settings", newSettings);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  const handleExposureTimeChange = async (val) => {
    try {
      const video = document.getElementById("userVideo");
      const mediaStream = video.srcObject;
      const track = await mediaStream.getTracks()[0];
      const capabilities = track.getCapabilities();
      await track.applyConstraints({
        advanced: [
          {
            exposureMode: "manual",
            exposureTime: val,
          },
        ],
      });
      const newSettings = await track.getSettings();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  const handleSharpnessChange = async (val) => {
    try {
      const video = document.getElementById("userVideo");
      const mediaStream = video.srcObject;
      const track = await mediaStream.getTracks()[0];
      const capabilities = track.getCapabilities();
      await track.applyConstraints({
        advanced: [
          {
            sharpness: val,
          },
        ],
      });
      const newSettings = await track.getSettings();

      console.log("new Settings", newSettings);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  const handleBrightnessChange = async (val) => {
    try {
      const video = document.getElementById("userVideo");
      const mediaStream = video.srcObject;
      const track = await mediaStream.getTracks()[0];
      const capabilities = track.getCapabilities();
      await track.applyConstraints({
        advanced: [
          {
            brightness: val,
          },
        ],
      });
      const newSettings = await track.getSettings();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  const handleSaturationChange = async (val) => {
    try {
      const video = document.getElementById("userVideo");
      const mediaStream = video.srcObject;
      const track = await mediaStream.getTracks()[0];
      const capabilities = track.getCapabilities();
      await track.applyConstraints({
        advanced: [
          {
            saturation: val,
          },
        ],
      });
      const newSettings = await track.getSettings();

      console.log("new Settings", newSettings);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
    }
  };

  const handleContrastChange = async (val) => {
    try {
      const video = document.getElementById("userVideo");
      const mediaStream = video.srcObject;
      const track = await mediaStream.getTracks()[0];
      const capabilities = track.getCapabilities();

      await track.applyConstraints({
        advanced: [
          {
            contrast: val,
          },
        ],
      });
      const newSettings = await track.getSettings();

      console.log("new Settings", newSettings);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e);
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
            {cameraSettingsList.focusDistance && (
              <div>
                Focus Slider:
                <input
                  type="range"
                  min={cameraFocusMin}
                  max={cameraFocusMax}
                  defaultValue={cameraFocusCurrent}
                  onChange={async (e) => {
                    console.log("changed");
                    await handleFocusChange(e.currentTarget.value);
                  }}
                />
              </div>
            )}

            {cameraSettingsList.exposureTime && (
              <div>
                Exposure Time Slider:
                <input
                  type="range"
                  min={cameraExposureTimeMin}
                  max={cameraExposureTimeMax}
                  defaultValue={cameraExposureTimeCurrent}
                  onChange={async (e) => {
                    console.log("changed");
                    await handleExposureTimeChange(e.currentTarget.value);
                  }}
                />
              </div>
            )}

            {cameraSettingsList.sharpness && (
              <div>
                Sharpness Slider:
                <input
                  type="range"
                  min={cameraSharpnessMin}
                  max={cameraSharpnessMax}
                  defaultValue={cameraSharpnessCurrent}
                  onChange={async (e) => {
                    console.log("changed");
                    await handleSharpnessChange(e.currentTarget.value);
                  }}
                />
              </div>
            )}

            {cameraSettingsList.brightness && (
              <div>
                Brightness Slider:
                <input
                  type="range"
                  min={cameraBrightnessMin}
                  max={cameraBrightnessMax}
                  defaultValue={cameraBrightnessCurrent}
                  onChange={async (e) => {
                    console.log("changed");
                    await handleBrightnessChange(e.currentTarget.value);
                  }}
                />
              </div>
            )}

            {cameraSettingsList.saturation && (
              <div>
                Saturation Slider:
                <input
                  type="range"
                  min={cameraSaturationMin}
                  max={cameraSaturationMax}
                  defaultValue={cameraSaturationCurrent}
                  onChange={async (e) => {
                    console.log("changed");
                    await handleSaturationChange(e.currentTarget.value);
                  }}
                />
              </div>
            )}

            {cameraSettingsList.contrast && (
              <div>
                Contrast Slider:
                <input
                  type="range"
                  min={cameraContrastMin}
                  max={cameraContrastMax}
                  defaultValue={cameraContrastCurrent}
                  onChange={async (e) => {
                    console.log("changed");
                    await handleContrastChange(e.currentTarget.value);
                  }}
                />
              </div>
            )}

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
                  (showSuccess ? "cameraDisplaySuccess" : "") +
                  " "
                  // +
                  // (iOS() ? "cameraObjectFitFill" : "")
                }
                muted
                autoPlay
                playsInline
              />
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
            </div>

            <div id="module_functions" className="buttonContainer">
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
