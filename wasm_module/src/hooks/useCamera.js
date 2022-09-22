/* eslint-disable */
import { useState } from 'react';
import { openCamera } from '@privateid/cryptonets-web-sdk';

const useCamera = (element = 'userVideo') => {
  // Initialize the state
  const [ready, setReady] = useState(false);
  const [devices, setDevices] = useState([]);
  const [device, setDevice] = useState(false);
  const [faceMode, setFaceMode] = useState(false);

  const init = async () => {
    if (ready) return;
    try {
      const { devices=[], faceMode, settings, status,stream,errorMessage } = await openCamera(element,false, null,"front");
      setFaceMode(faceMode);
      console.log("hasError??", {status, errorMessage});
      if (devices.length > 0) {
        const options = devices.map((d) => ({ label: d.label, value: d.deviceId }));
        setDevices(options);
        setDevice(options[0]);
      }
      setReady(true);
    } catch (e) {
      console.log("Error Message", e)
    }
  };

  return { ready, init, devices, device, setDevice, faceMode };
};

export default useCamera;
