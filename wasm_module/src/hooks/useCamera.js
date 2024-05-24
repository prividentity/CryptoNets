/* eslint-disable */
import { useState } from "react";
import { openCamera } from "@privateid/cryptonets-web-sdk-alpha";
import { mapDevices } from "../utils";
import platform, { os } from "platform";

const useCamera = (
  element = "userVideo",
  resolution = null,
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
  setCameraSettingsList,
) => {
  // Initialize the state
  const [ready, setReady] = useState(false);
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState("");
  const [faceMode, setFaceMode] = useState(false);
  const [cameraFeatures, setCameraFeatures] = useState({});

  const init = async (requireHd = false) => {
    if (ready) return;
    try {
      const {
        devices = [],
        faceMode,
        settings,
        status,
        stream,
        errorMessage,
        capabilities,
      } = await openCamera({ videoElementId: element, requestFaceMode:"front", canvasResolution:{
        width:1440,
        height:1440
      } } );
      setCameraFeatures({ settings, capabilities });
      setFaceMode(faceMode);
      console.log({ devices, faceMode, settings, status, stream, errorMessage, capabilities });
      console.log("hasError??", { status, errorMessage });
      if (devices.length > 0) {
        const options = devices.map(mapDevices);
        setDevices(options);
        setDevice(settings.deviceId);
      }
      setReady(true);
      console.log(platform.os.family);
      // if (
      //   ["Windows", "Windows Server 2008 R2 / 7", "Windows Server 2008 / Vista", "Windows XP"].includes(
      //     platform.os.family
      //   )
      // ) {
        const setCameraFocus = async () => {
          try {
            const video = document.getElementById("userVideo");
            const mediaStream = video.srcObject;
            const track = await mediaStream.getTracks()[0];
            const capabilities = track.getCapabilities();
            if (typeof capabilities.focusDistance !== "undefined") {
              await track.applyConstraints({
                advanced: [
                  {
                    focusMode: capabilities.focusMode.includes("continuous") ? "continuous" : "manual",
                    focusDistance: 50,
                  },
                ],
              });
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log(e);
          }
        };
        await setCameraFocus();
      //}
      console.log("capabilities:", capabilities);
      console.log("settings", settings);
      if (capabilities) {
        let cameraSettings ={
          focusDistance: false,
          exposureTime: false,
          sharpness: false,
          brightness: false,
          saturation: false,
          contrast: false,
        }
        if (capabilities.focusDistance) {
          setCameraFocusMin(capabilities.focusDistance.min);
          setCameraFocusMax(capabilities.focusDistance.max);
          setCameraFocusCurrent(settings.focusDistance);
          cameraSettings = {...settings, focusDistance: true};
        }
        if (capabilities.exposureTime) {
          setCameraExposureTimeMin(Math.ceil(capabilities.exposureTime.min));
          setCameraExposureTimeMax(Math.ceil(capabilities.exposureTime.max));
          setCameraExposureTimeCurrent(Math.ceil(settings.exposureTime));
          cameraSettings = {...settings, exposureTime: true};
        }
        if (capabilities.sharpness){
          setCameraSharpnessMin(Math.ceil(capabilities.sharpness.min));
          setCameraSharpnessMax(Math.ceil(capabilities.sharpness.max));
          setCameraSharpnessCurrent(Math.ceil(settings.sharpness));
          cameraSettings = {...settings, sharpness: true};
        }
        if (capabilities.brightness){
          setCameraBrightnessMin(Math.ceil(capabilities.brightness.min));
          setCameraBrightnessMax(Math.ceil(capabilities.brightness.max));
          setCameraBrightnessCurrent(Math.ceil(settings.brightness));
          cameraSettings = {...settings, brightness: true};
        }
        if (capabilities.saturation){
          setCameraSaturationMin(Math.ceil(capabilities.saturation.min));
          setCameraSaturationMax(Math.ceil(capabilities.saturation.max));
          setCameraSaturationCurrent(Math.ceil(settings.saturation));
          cameraSettings = {...settings, saturation: true};
        }
        if (capabilities.contrast){
          setCameraContrastMin(Math.ceil(capabilities.contrast.min));
          setCameraContrastMax(Math.ceil(capabilities.contrast.max));
          setCameraContrastCurrent(Math.ceil(settings.contrast));
          cameraSettings = {...settings, contrast: true};
        }
        setCameraSettingsList(cameraSettings);
      }
    } catch (e) {
      console.log("Error Message", e);
    }
    // const setCameraFocus = async () => {
    //   try {
    //     const video = document.getElementById("userVideo");
    //     const mediaStream = video.srcObject;
    //     const track = await mediaStream.getTracks()[0];
    //     const capabilities = track.getCapabilities();
    //     if (typeof capabilities.focusDistance !== "undefined") {
    //       await track.applyConstraints({
    //         advanced: [
    //           {
    //             //focusMode: capabilities.focusMode.includes("continuous") ? "continuous" : "manual",
    //             // focusDistance: 1,
    //             width: {ideal: 1280}
    //           },
    //         ],
    //       });
    //     }
    //   } catch (e) {
    //     // eslint-disable-next-line no-console
    //     console.log(e);
    //   }
    // };
    // await setCameraFocus();
  };

  return { ready, init, devices, device, setDevice, faceMode, ...cameraFeatures, setReady };
};

export default useCamera;
