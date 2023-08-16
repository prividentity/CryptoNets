import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk-alpha";
let loop = true;
const usePredictOneFa = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null,setShowSuccess) => {
  const [predictOneFaaceDetected, setFaceDetected] = useState(false);
  const [predictOneFaStatus, setPredictStatus] = useState(null);
  const [predictOneFaData, setPredictData] = useState(null);
  const [predictMessage, setPredictMessage] = useState('');
  // const [predictUserIdentifier, setPredictUserIdentifier] = useState([]);

  const predictUserOneFa = async () => {
    setFaceDetected(false);
    setPredictData(null); 
    // eslint-disable-next-line no-unused-vars
 await predict1FA(
      callback,
      {
        input_image_format: "rgba",
      },
    );
  };

  const callback = async (result) => {
    console.log("predict callback hook result:", result);
    switch (result.status) {
      case "WASM_RESPONSE":
        if(result?.returnValue?.error) {
          setFaceDetected(false);
          setPredictMessage("Invalid Image");
          return
        }
        if (result.returnValue?.status === 0) {
          const { message }  = result.returnValue;
          setPredictMessage(message);
          setPredictData(result.returnValue);
          onSuccess(result.returnValue);
          setFaceDetected(true);
          setShowSuccess(true);
          // if(result?.returnValue?.user_identifier_list){
          //   setPredictUserIdentifier(result?.returnValue?.user_identifier_list);
          // }
        }
        if (result.returnValue?.status !== 0) {
          const {status, message}  = result.returnValue;
          setPredictMessage(message);
          setFaceDetected(status===0);
          setPredictStatus(null);
          predictUserOneFa();
        }
        break;
      default:
    }
  };

  return {
    predictOneFaaceDetected,
    predictOneFaStatus,
    predictOneFaData,
    predictUserOneFa,
    predictMessage,
   // predictUserIdentifier,
  };
};

export default usePredictOneFa;
