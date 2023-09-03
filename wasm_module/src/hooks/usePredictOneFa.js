import { useState } from "react";
import { predict1FA } from "@privateid/cryptonets-web-sdk-alpha";
let loop = true;
const usePredictOneFa = (element = "userVideo", onSuccess, retryTimes = 4, deviceId = null, setShowSuccess) => {
  const [predictMessage, setPredictMessage] = useState("");

  const [predictAntispoofPerformed, setPredictAntispoofPerformed] = useState(null);
  const [predictAntispoofStatus, setPredictAntispoofStatus] = useState(null);
  const [predictValidationStatus, setPredictValidationStatus] = useState(null);
  const [predictGUID, setPredictGUID] = useState("");
  const [predictPUID, setPredictPUID] = useState("");

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
        if (result.returnValue?.status === 0) {
          const { message } = result.returnValue;
          setPredictMessage(message);
          onSuccess(result.returnValue);
          setShowSuccess(true);
          setPredictAntispoofPerformed(result.returnValue.anti_spoof_performed);
          setPredictAntispoofStatus(result.returnValue.anti_spoof_status);
          setPredictValidationStatus(result.returnValue.status);
          setPredictGUID(result.returnValue.guid);
          setPredictPUID(result.returnValue.puid);
          // if(result?.returnValue?.user_identifier_list){
          //   setPredictUserIdentifier(result?.returnValue?.user_identifier_list);
          // }
        }
        if (result.returnValue?.status !== 0) {
          const { status, message } = result.returnValue;
          setPredictMessage(message);
          setPredictAntispoofPerformed(result.returnValue.anti_spoof_performed);
          setPredictAntispoofStatus(result.returnValue.anti_spoof_status);
          setPredictValidationStatus(result.returnValue.status);
          setPredictGUID(result.returnValue.guid);
          setPredictPUID(result.returnValue.puid);
          predictUserOneFa();
        }
        break;
      default:
    }
  };

  const predictUserOneFa = async () => {
    // eslint-disable-next-line no-unused-vars
    await predict1FA(callback, {
      input_image_format: "rgba",
      "angle_rotation_left_threshold": 5.0,
      "angle_rotation_right_threshold": 5.0,
      "threshold_user_right": 0.01,
      "threshold_user_left": 0.99,
      "threshold_high_vertical_predict": -0.1,
      "threshold_down_vertical_predict": 0.1,
      "threshold_profile_predict": 0.65,
      "threshold_user_too_close": 0.8,
      "threshold_user_too_far": 0.1,
      "angle_rotation_left_threshold": 5.0,
      "angle_rotation_right_threshold": 5.0,
      "gray_scale_threshold": 25.0,
      "anti_spoofing_threshold": 0.8,
      "gray_scale_variance_threshold": 100.0,
    });
  };

  return {
    predictUserOneFa,
    predictMessage,
    predictAntispoofPerformed,
    predictAntispoofStatus,
    predictValidationStatus,
    predictGUID,
    predictPUID,
  };
};

export default usePredictOneFa;
