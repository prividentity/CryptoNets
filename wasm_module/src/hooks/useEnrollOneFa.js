import { useState } from 'react';
import { enrollOneFA } from '@privateid/cryptonets-web-sdk';

const useEnrollOneFa = (element = 'userVideo', onSuccess, retryTimes = 4 , deviceId = null) => {
  const [faceDetected, setFaceDetected] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [enrollData, setEnrollData] = useState(null)

  let tries = 0;

  const enrollUserOneFa = async () => {
      // eslint-disable-next-line no-unused-vars
      const portrait = await enrollOneFA(callback, element, deviceId);
  };


  function wait(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  const getDisplayedMessage = (result) => {
    switch (result) {
      case -1:
        return 'Please look at the camera';
      case 0:
        return 'Face detected';
      case 1:
        return 'Image Spoof';
      case 2:
        return 'Video Spoof';
      case 3:
        return 'Video Spoof';
      case 4:
        return 'Too far away';
      case 5:
        return 'Too far to right';
      case 6:
        return 'Too far to left';
      case 7:
        return 'Too far up';
      case 8:
        return 'Too far down';
      case 9:
        return 'Too blurry';
      case 10:
        return 'PLEASE REMOVE EYEGLASSES';
      case 11:
        return 'PLEASE REMOVE FACEMASK';
      default:
        return '';
    }
  };

  const callback = async (result) => {
    console.log("callback hook result:", result)
    switch (result.status) {
      case 'VALID_FACE':
        setFaceDetected(true);
        setEnrollStatus(null);
        setProgress(result.progress);
        break;
      case 'INVALID_FACE':
        if (enrollStatus && enrollStatus?.length > 0) {
          wait(1500);
          setEnrollStatus(getDisplayedMessage(result.result));
        } else {
          setEnrollStatus(getDisplayedMessage(result.result));
        }

        setFaceDetected(false);
        break;
      case 'ENROLLING':
        setEnrollStatus('ENROLLING');
        setFaceDetected(true);
        break;
      case 'WASM_RESPONSE':
        if (result.returnValue?.status === 0) {
          setEnrollStatus('ENROLL SUCCESS');
          setEnrollData(result.returnValue);
          onSuccess();
        }
        if (result.returnValue?.status === -1) {
          if (tries === retryTimes) {
            // onFailure();
          } else {
            tries += 1;
            // enrollUserOneFa();
          }
        }
        break;
      default:
    }
  };

  return { faceDetected, enrollStatus, enrollData, enrollUserOneFa, progress };
};

export default useEnrollOneFa;
