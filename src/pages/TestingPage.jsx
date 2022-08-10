/* eslint-disable */
import { useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { isValid } from '@privateid/privid-fhe-modules';

import useCamera from '../hooks/useCamera';
import useWasm from '../hooks/useWasm';
import { isAndroid, isIOS, osVersion } from '../utils';

const Ready = () => {
  const { ready: wasmReady } = useWasm();
  const { ready, init } = useCamera('userVideo', 'front');

  useEffect(() => {
    if (!wasmReady) return;
    if (!ready) init();
    if (isIOS && osVersion < 15) {
        console.log("Old version of IOS");
    } else if (isAndroid && osVersion < 11) {
        console.log("Old version of Android");
    }
    console.log(wasmReady, ready)
    if (wasmReady && ready) handleCaptcha();
  }, [wasmReady, ready]);

  const handleCaptcha = async () => {
    console.log("Inside Captcha")
    const {
      result,
      imageData,
      resultData,
      checkSpeed
    } = await isValid('userVideo');
    console.log("Result Data:", imageData)
    handleCaptcha();
  };

  return (
    <div id="canvasInput" style={{height:"100vh", width:"100vw", display:"flex", justifyContent:"center", alignItems:"center"}}>
        <Webcam
          className={"facedec-webcam"}
          height={1280}
          width={720}
          videoConstraints={{
            height: 720,
            width: 1280
          }}
          id="userVideo"
          autoPlay
          playsInline
          mirrored
        />
    </div>
  );
};


export default Ready;