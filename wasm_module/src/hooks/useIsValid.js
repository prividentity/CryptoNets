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

  const isValidCall = async (skipAntispoof = true) => {
    // eslint-disable-next-line no-unused-vars
    await isValid(callback, null, {
      input_image_format: "rgba",
      gray_scale_variance_threshold: 100.0,
      gray_scale_threshold: 14,
    });
  };

  return { antispoofPerformed, antispoofStatus, isValidStatus, isValidCall };
};

export default useIsValid;
