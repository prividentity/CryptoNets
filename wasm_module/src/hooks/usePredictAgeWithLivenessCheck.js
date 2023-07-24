import { useState } from "react";
import { predictAge } from "@privateid/cryptonets-web-sdk-alpha";

const usePredictAgeWithLivenessCheck = () => {
  const [age, setAge] = useState(null);
  const [predictAgeHasFinished, setPredictAgeHasFinished] = useState(false);
  const [predictAgeLivenessResult, setPredictAgeLivenessResult] = useState(null);

  const predictAgeCallback = (response) => {
    console.log(response);
    const { livenessCheck } = response;
    setPredictAgeLivenessResult(livenessCheck);
    if (livenessCheck === 0) {
      const { faces } = response.returnValue;

      if (faces.length === 0) {
        setAge("");
        setPredictAgeHasFinished(true);
      } else {
        for (let index = 0; faces.length > index; index++) {
          const { status, age } = faces[index];
          if (age > 0) {
            setAge(age);
            setPredictAgeHasFinished(true);
            index = faces.length;
          }

          if (index + 1 === faces.length && age <= 0) {
            setAge("");
            setPredictAgeHasFinished(true);
          }
        }
      }
    } else {
      setAge("");
      setPredictAgeHasFinished(true);
    }
  };

  const doPredictAge = async () => {
    await predictAge(null, predictAgeCallback, undefined,undefined, true);
  };

  return { doPredictAge, age, predictAgeHasFinished, setPredictAgeHasFinished, predictAgeLivenessResult };
};

export default usePredictAgeWithLivenessCheck;
