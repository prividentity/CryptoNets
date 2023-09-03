import { useState } from "react";
import { isValid } from "@privateid/cryptonets-web-sdk-alpha";

const useIsValid = (element = "userVideo", deviceId = null) => {
  const [antispoofPerformed, setAntispoofPerformed] = useState("");
  const [antispoofStatus, setAntispoofStatus] = useState("");
  const [isValidStatus, setIsValidStatus] = useState("");

  const callback = (response) => {
    console.log("isValid Response:", response);

    if (response?.returnValue?.faces?.length > 0) {
      setAntispoofPerformed(response?.returnValue?.faces[0].anti_spoof_performed);
      setAntispoofStatus(response?.returnValue?.faces[0].anti_spoof_status);
      setIsValidStatus(response?.returnValue?.faces[0].status);
    } else {
      setAntispoofPerformed("");
      setAntispoofStatus("");
      setIsValidStatus("");
    }
    isValidCall();
  };

  const isValidCall = async () => {
    // eslint-disable-next-line no-unused-vars
    await isValid(callback, null, {
      input_image_format: "rgba",
      detect_spoof_only: false,
      angle_rotation_left_threshold: 5.0,
      angle_rotation_right_threshold: 5.0,
      antispoof_face_margin: 1.0,
      antis_spoof_threshold: 0.5,
      gray_scale_threshold: 25.0,
      gray_scale_variance_threshold: 100.0,
    });
  };

  return { antispoofPerformed, antispoofStatus, isValidStatus, isValidCall };
};

export default useIsValid;
