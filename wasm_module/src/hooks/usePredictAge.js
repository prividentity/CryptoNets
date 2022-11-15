import { useState } from "react";
import { predictAge } from "@privateid/cryptonets-web-sdk-alpha";

const usePredictAge = () => {
  const [age, setAge] = useState(null);
  const [predictAgeHasFinished, setPredictAgeHasFinished] = useState(false);

  const predictAgeCallback = (response) => {
    console.log("RESPONSE: ", response);
    const {
      result,
      ageFactor,
      crop_conf_score,
      exposure,
      face_height,
      face_width,
      face_center_x,
      face_center_y,
    } = response.ageData;
    switch (result) {
      case 0:
        setAge(ageFactor);
        setPredictAgeHasFinished(true);
        break;
      default:
        setAge(null);
        setPredictAgeHasFinished(true);
        break;
    }
  };

  const doPredictAge = async () => {
    await predictAge(
      false,
      null,
      predictAgeCallback
    );
  };

  return { doPredictAge, age, predictAgeHasFinished, setPredictAgeHasFinished };
};

export default usePredictAge;
