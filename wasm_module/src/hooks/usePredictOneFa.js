import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk-alpha";
let loop = true;
const usePredictOneFa = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess) => {
  const [predictOneFaaceDetected, setFaceDetected] = useState(false);
  const [predictOneFaStatus, setPredictStatus] = useState(null);
  const [predictOneFaData, setPredictData] = useState(null);
  const [predictMessage, setPredictMessage] = useState("");
  // const [predictUserIdentifier, setPredictUserIdentifier] = useState([]);

  const callback = async (result) => {
    console.log("predict callback hook result:", result);

  //   {
  //     "message": "",
  //     "status": 0,
  //     "token": "09BDA209D06CE291ED27F311B0385FDCF1E3192DC8C0535DFFAE5E07D2D22B5E3DFD9A2F1999E3D1DCB4D245C2561D89E3AC593750F3008FA909538B8D0669B5D36052CA0636B9F3A69329A864A7870E8688D16A011EEBF3E674111D644CAD5E7530303030303138613531383833353434",
  //     "guid": "0429GVi9-oFyk-ykCh-rfEy-JscMARybZxAP",
  //     "puid": "jZcSX87a-HK90-ADro-x4Bz-ncY0wJjkLw11",
  //     "enroll_level": 1,
  //     "anti_spoof_performed": false,
  //     "anti_spoof_status": -4
  // }

    switch (result.status) {
      case "WASM_RESPONSE":
        if (result?.returnValue?.error) {
          setFaceDetected(false);
          setPredictMessage("Invalid Image");
          return;
        }
        if (result.returnValue?.status === 0) {
          const { message } = result.returnValue;
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
          const { status, message } = result.returnValue;
          setPredictMessage(message);
          setFaceDetected(status === 0);
          setPredictStatus(null);
          predictUserOneFa();
        }
        break;
      default:
    }
  };


  const predictUserOneFa = async () => {
    setFaceDetected(false);
    setPredictData(null);
    // eslint-disable-next-line no-unused-vars
    await predict1FA(callback,
      {
      input_image_format: "rgba",
      antispoof_face_margin: 1.5,
    });

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
