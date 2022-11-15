/* eslint-disable */
import { useState } from "react";
import { openCamera } from "@privateid/cryptonets-web-sdk-alpha";

const useCamera = (element = "userVideo") => {
  // Initialize the state
  const [ready, setReady] = useState(false);
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState('');
  const [faceMode, setFaceMode] = useState(false);

  const init = async () => {
    if (ready) return;
    try {
      const {
        devices = [],
        faceMode,
        settings,
        status,
        stream,
        errorMessage,
      } = await openCamera(element, false, null, "front");
      setFaceMode(faceMode);
      console.log("hasError??", { status, errorMessage });
      if (devices.length > 0) {
        const options = devices.map((d) => ({
          label: d.label,
          value: d.deviceId,
        }));
        setDevices(options);
        setDevice(settings.deviceId)
      }
      setReady(true);
    } catch (e) {
      console.log("Error Message", e);
    }
    const setCameraFocus = async () => {
      try {
        const video = document.getElementById('userVideo');
        const mediaStream = video.srcObject;
        const track = await mediaStream.getTracks()[0];
        const capabilities = track.getCapabilities();
        if (typeof capabilities.focusDistance !== 'undefined') {
          await track.applyConstraints({
            advanced: [
              {
                focusMode: capabilities.focusMode.includes('continuous') ? 'continuous' : 'manual',
                focusDistance: 100,
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
  };

  return { ready, init, devices, device, setDevice, faceMode };
};

export default useCamera;
