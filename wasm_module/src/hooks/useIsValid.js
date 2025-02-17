import { useState } from "react";
import { isValid } from "@privateid/cryptonets-web-sdk-alpha";

const useIsValid = (element = "userVideo", deviceId = null) => {
  const [antispoofPerformed, setAntispoofPerformed] = useState("");
  const [antispoofStatus, setAntispoofStatus] = useState("");
  const [isValidStatus, setIsValidStatus] = useState("");

  const callback = (response) => {
    console.log("isValid Response:", response);

    if (response?.call_status === 0) {
      setAntispoofStatus(response?.antispoof_status);
      setIsValidStatus(response?.face_validation_status);
    } else {
      setAntispoofPerformed("");
      setAntispoofStatus("");
      setIsValidStatus("");
    }
    isValidCall();
  };

  const isValidCall = async (skipAntispoof = true) => {
    // eslint-disable-next-line no-unused-vars
    await isValid({
      callback,
      config: {
        input_image_format: "rgba",
      },
    });
  };

  return { antispoofPerformed, antispoofStatus, isValidStatus, isValidCall };
};

export default useIsValid;
