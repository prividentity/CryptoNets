/* eslint-disable */
import { useState } from "react";
import { openCamera } from "@privateid/cryptonets-web-sdk-test";
import { mapDevices } from "../utils";

const useCamera = (element = "userVideo", resolution = null) => {
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
      } = await openCamera(element, requireHd, null, "front", resolution);
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
