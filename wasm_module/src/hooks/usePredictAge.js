// import { useState } from "react";
// import { predictAge } from "@privateid/cryptonets-web-sdk";

// let skipAntispoofGlobal = false;
// const usePredictAge = () => {
//   const [age, setAge] = useState(null);
//   const [antispoofPerformed, setAntispoofPerformed] = useState(false);
//   const [antispoofStatus, setAntispoofStatus] = useState("");
//   const [validationStatus, setValidationStatus] = useState("");

//   const callback = (response) => {
//     console.log("predict Age Callback", response);

//     if (response?.returnValue?.faces.length > 0) {
//       setAge(response?.returnValue?.faces[0].age);
//       setAntispoofPerformed(response?.returnValue?.faces[0].anti_spoof_performed);
//       setAntispoofStatus(response?.returnValue?.faces[0].anti_spoof_status);
//       setValidationStatus(response?.returnValue?.faces[0].status);
//     } else {
//       setAge("");
//       setAntispoofPerformed("");
//       setAntispoofStatus("");
//       setValidationStatus("");
//     }

//     doPredictAge(skipAntispoofGlobal);
//   };

//   const doPredictAge = async (skipAntispoof=false) => {
//     skipAntispoofGlobal = skipAntispoof;
//     await predictAge(callback, {
//       skip_antispoof: skipAntispoofGlobal,
//     });
//   };

//   return { doPredictAge, age, antispoofPerformed, antispoofStatus, validationStatus };
// };

// export default usePredictAge;
