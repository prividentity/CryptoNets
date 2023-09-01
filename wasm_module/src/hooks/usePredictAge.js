import { useState } from "react";
import { predictAge } from "@privateid/cryptonets-web-sdk-alpha";

const usePredictAge = () => {
  const [age, setAge] = useState(null);
  const [antispoofPerformed, setAntispoofPerformed] = useState(false);
  const [antispoofStatus, setAntispoofStatus] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);


  const callback = (response) => {
    console.log("predict Age Callback", response);

    if (response?.returnValue?.faces.length > 0) {
      setAge(response?.returnValue?.faces[0].age);
      setAntispoofPerformed(response?.returnValue?.faces[0].anti_spoof_performed);
      setAntispoofStatus(response?.returnValue?.faces[0].anti_spoof_status);
      setValidationStatus(response?.returnValue?.faces[0].status);
    } else {
      setAge("");
      setAntispoofPerformed("");
      setAntispoofStatus("");
      setValidationStatus("");  
    }

    doPredictAge();
  }


  const doPredictAge = async () => {
    //   {
    //     "error": 0,
    //     "faces": [
    //         {
    //             "status": 0,
    //             "age": -1,
    //             "conf_score": 69.52000427246094,
    //             "anti_spoof_performed": true,
    //             "anti_spoof_status": -4,
    //             "box": {
    //                 "top_left": {
    //                     "x": 224,
    //                     "y": 205
    //                 },
    //                 "bottom_right": {
    //                     "x": 377,
    //                     "y": 356
    //                 }
    //             }
    //         }
    //     ]
    // }

    await predictAge(callback,
      {
      input_image_format: "rgba",
      antispoof_face_margin: 2,
      angle_rotation_left_threshold: 5.0,
      angle_rotation_right_threshold: 5.0,
      detect_spoof_only: false,
      gray_scale_threshold: 25.0,
      gray_scale_variance_threshold: 100.0,
    });

    
  };

  return { doPredictAge, age, antispoofPerformed, antispoofStatus, validationStatus };
};

export default usePredictAge;
