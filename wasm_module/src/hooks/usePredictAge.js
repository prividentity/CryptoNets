import { useState } from "react";
import { predictAge } from "@privateid/cryptonets-web-sdk";

const usePredictAge = () => {
  const [age, setAge] = useState(null);
  const [antispoofPerformed, setAntispoofPerformed] = useState(false);
  const [antispoofStatus, setAntispoofStatus] = useState("");
  const [validationStatus, setValidationStatus] = useState("");

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
  };

  const doPredictAge = async (skipAntispoof = true) => {

    await predictAge(callback, {
      input_image_format: "rgba",
      antispoof_face_margin: 2,
      angle_rotation_left_threshold: 20.0,
      angle_rotation_right_threshold: 20.0,
      threshold_user_too_far: 0.1,
      gray_scale_threshold: 25.0,
      anti_spoofing_threshold: 0.5,
      gray_scale_variance_threshold: 100.0,
      skip_antispoof: true,
    });
  };

  return { doPredictAge, age, antispoofPerformed, antispoofStatus, validationStatus };
};

export default usePredictAge;
