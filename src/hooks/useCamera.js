/* eslint-disable */
import { useState } from 'react';
import { openCamera } from '@privateid/privid-fhe-modules';

const useCamera = (element = 'userVideo', facingMode = 'face') => {
  // Initialize the state
  const [ready, setReady] = useState(false);
  const [devices, setDevices] = useState(false);
  const [device, setDevice] = useState(false);
  const [faceMode, setFaceMode] = useState(false);

  const init = async () => {
    if (ready) return;
    try {
      console.log("line 14")
      const { devices, faceMode } = await openCamera(element);
      console.log(device, faceMode);
      setFaceMode(faceMode);
      if (devices.length > 0) {
        console.log("Line 18")
        const options = devices.map((d) => ({ label: d.label, value: d.deviceId }));
        setDevices(options);
        setDevice(options[0]);
      }
      console.log("line 23")
      setReady(true);
    } catch (e) {
      console.log("Error Message", e)
    }
  };

  return { ready, init, devices, device, setDevice, faceMode };
};

export default useCamera;
