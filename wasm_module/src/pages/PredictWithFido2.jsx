// /* eslint-disable */
// import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   switchCamera,
//   setStopLoopContinuousAuthentication,
//   closeCamera,
//   faceCompareLocal,
// } from "@privateid/cryptonets-web-sdk-alpha";
// import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
// import { useCamera, useWasm, useEnrollOneFa, usePredictOneFa } from "../hooks";
// import { canvasSizeOptions, isBackCamera, setMax2KForMobile, WIDTH_TO_STANDARDS } from "../utils";

// import "./styles.css";
// import useScanFrontDocumentWithoutPredictGetMugShot from "../hooks/useScanFrontDocumentWithoutPredictGetMugshot";
// import { useNavigate } from "react-router-dom";

// let callingWasm = false;
// const PredictWithFIDO = (props) => {
//   const { ready: wasmReady, deviceSupported, init: initWasm } = useWasm();
//   const { ready, init: initCamera, device, devices, settings, capabilities, setReady } = useCamera("userVideo");
//   const baseURL = "https://simplewebauthn.privateid.com";
//   const [showSuccess, setShowSuccess] = useState(false);
//   const [deviceCapabilities, setDeviceCapabilities] = useState(capabilities);
//   const canvasSizeList = useMemo(() => {
//     let canvasList = [...canvasSizeOptions];
//     const maxHeight = deviceCapabilities?.height?.max || capabilities?.height?.max;
//     let label = WIDTH_TO_STANDARDS[setMax2KForMobile(deviceCapabilities?.width?.max || capabilities?.width?.max)];
//     const sliceIndex = canvasList.findIndex((option) => option.value === label);
//     const slicedArr = canvasList.slice(sliceIndex);
//     if (label === "FHD" && maxHeight === 1440) {
//       return [{ label: "iPhoneCC", value: "iPhoneCC" }, ...slicedArr];
//     }
//     return slicedArr;
//   }, [capabilities, deviceCapabilities]);
//   const initialCanvasSize = WIDTH_TO_STANDARDS[settings?.width];
//   const isBack = isBackCamera(devices, device);
//   const [deviceId, setDeviceId] = useState(device);
//   const [devicesList] = useState(devices);

//   const [label, setLabel] = useState("");

//   const [canvasSize, setCanvasSize] = useState();
//   const [verificationStatus, setVerificationStatus] = useState();
//   const [currentAction, setCurrentAction] = useState("standby");

//   useEffect(() => {
//     console.log("useEffect starting wasm and camera");
//     console.log("--- wasm status ", wasmReady, ready);
//     if (!wasmReady) {
//       if (!callingWasm) {
//         console.log("init wasm called:");
//         initWasm();
//         callingWasm = true;
//       }
//       return;
//     }
//     if (!ready) {
//       console.log("calling camera");
//       initCamera();
//     }
//   }, [wasmReady, ready]);

//   const [confidenceScore, setConfidenceScore] = useState("Checking . . .");

//   const doFaceCompare = async () => {
//     const callback = (result) => {
//       console.log("COMPARE RESULT: ", result);
//       setConfidenceScore(result.returnValue.conf_score);
//     };

//     console.log("Image Data:", { enrollImageData, predictMugshotImageData });
//     if (enrollImageData && predictMugshotImageData) {
//       await faceCompareLocal(callback, enrollImageData, predictMugshotImageData, { input_image_format: "rgba" });
//     }
//   };

//   useEffect(() => {
//     switch (currentAction) {
//       case "useEnrollOneFa":
//         enrollUserOneFa({ identifier: label || "wasmsample-label" });
//         return;
//       case "usePredictOneFa":
//         predictUserOneFa();
//         return;
//       default:
//     }
//   }, [currentAction]);

//   // Enroll ONEFA
//   const useEnrollSuccess = async (enrollData) => {
//     console.log("enroll success");
//   };

//   // Predict ONEFA
//   const usePredictSuccess = async (predictData) => {
//     const response = await fetch(baseURL + "/generate-authentication-options", {
//       method: "POST", // *GET, POST, PUT, DELETE, etc.
//       headers: {
//         "Content-Type": "application/json",
//       },
//       credentials: "include",
//       body: JSON.stringify({ uuid: predictData.PI.uuid }), // body data type must match "Content-Type" header
//     });
//     let asseResp;
//     try {
//       const opts = await response.json();
//       // printDebug(elemDebug, 'Authentication Options', JSON.stringify(opts, null, 2));

//       // hideAuthForm();

//       asseResp = await startAuthentication(opts);
//       // printDebug(elemDebug, 'Authentication Response', JSON.stringify(asseResp, null, 2));
//     } catch (error) {
//       console.log(error);
//       // elemError.innerText = error;
//       throw new Error(error);
//     }

//     const verificationResp = await fetch(baseURL + "/verify-authentication", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       credentials: "include",
//       body: JSON.stringify({ data: asseResp, uuid: predictData.PI.uuid }),
//     });

//     const verificationJSON = await verificationResp.json();
//     // printDebug(elemDebug, 'Server Response', JSON.stringify(verificationJSON, null, 2));
//     setVerificationStatus(verificationJSON);
//     // if (verificationJSON && verificationJSON.verified) {
//     // elemSuccess.innerHTML = `User authenticated!`;
//     // } else {
//     // elemError.innerHTML = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
//     //     verificationJSON,
//     // )}</pre>`;
//     // }
//   };

//   const {
//     faceDetected: enrollOneFaFaceDetected,
//     enrollStatus: enrollOneFaStatus,
//     enrollData: enrollOneFaData,
//     enrollUserOneFa,
//     progress: enrollOneFaProgress,
//     enrollPortrait,
//     enrollImageData,
//   } = useEnrollOneFa("userVideo", useEnrollSuccess, null, deviceId, setShowSuccess);

//   const handleSwitchCamera = async (e) => {
//     setDeviceId(e.target.value);
//     const { capabilities = {}, settings = {}, devices } = await switchCamera(null, e.target.value);
//     setDeviceCapabilities(capabilities);
//     // setDevicesList(devices.map(mapDevices));
//     if (currentAction === "useScanDocumentFront") {
//       let width = WIDTH_TO_STANDARDS[settings?.width];
//       if (width === "FHD" && settings?.height === 1440) {
//         width = "iPhoneCC";
//       }
//       await handleCanvasSize({ target: { value: width } }, true);
//     }
//   };

//   // Predict One FA
//   const {
//     predictMessage,
//     predictOneFaData,
//     predictOneFaStatus,
//     predictOneFaaceDetected,
//     predictUserOneFa,
//     predictUserIdentifier,
//   } = usePredictOneFa("userVideo", usePredictSuccess, null, deviceId, setShowSuccess);

//   const handleReopenCamera = async () => {
//     setReady(false);
//     await closeCamera();
//     await init();
//   };

//   const handleCloseCamera = async () => {
//     await closeCamera();
//   };

//   const navigate = useNavigate();

//   return (
//     <>
//       {deviceSupported.isChecking ? (
//         <div>
//           <h1> Loading . . . </h1>
//         </div>
//       ) : !deviceSupported.isChecking && deviceSupported.supported ? (
//         <div id="canvasInput" className="container">
//           <div
//             style={{
//               height: "100%",
//               display: "flex",
//               justifyContent: "center",
//               alignItems: "center",
//               flexDirection: "column",
//               flexWrap: "wrap",
//               gap: "10px",
//             }}
//           >
//             <div>
//               <h4>Predict With WebAuthn:</h4>
//               <p> Step 1 - Do Predict </p>
//             </div>
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: currentAction === "useScanDocumentFront" ? "space-between" : "center",
//                 width: "47%",
//               }}
//             >
//               <div>
//                 <div
//                   style={{
//                     display: "flex",
//                     justifyContent: "center",
//                     gap: "20px",
//                     padding: "10px",
//                   }}
//                 >
//                   <button onClick={handleReopenCamera}> Open Camera</button>
//                   <button onClick={handleCloseCamera}> Close Camera</button>
//                 </div>
//                 <label> Select Camera: </label>
//                 <select value={deviceId || device} onChange={(e) => handleSwitchCamera(e)}>
//                   {(devicesList?.length ? devicesList : devices).map((e, index) => {
//                     return (
//                       <option id={e.value} value={e.value} key={index}>
//                         {e.label}
//                       </option>
//                     );
//                   })}
//                 </select>
//               </div>
//               {currentAction === "useScanDocumentFront" || currentAction === "useScanDocumentBack" ? (
//                 <div>
//                   <label> Canvas Size: </label>
//                   <select defaultValue={initialCanvasSize} value={canvasSize} onChange={(e) => handleCanvasSize(e)}>
//                     {canvasSizeList.map(({ label, value }) => (
//                       <option id={value} value={value} key={value}>
//                         {label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//               ) : (
//                 <></>
//               )}
//             </div>
//             <div className={"cameraContainer"}>
//               {currentAction === "useEnrollOneFa" && !enrollOneFaFaceDetected && (
//                 <div className="enrollDisplay">
//                   <span> {enrollOneFaStatus} </span>
//                 </div>
//               )}
//               <video
//                 id="userVideo"
//                 className={
//                   (currentAction === "useScanDocumentFrontValidity" ? `cameraDisplay` : `cameraDisplay mirrored`) +
//                   " " +
//                   (showSuccess ? "cameraDisplaySuccess" : "")
//                 }
//                 muted
//                 autoPlay
//                 playsInline
//               />
//             </div>

//             <div>
//               {currentAction === "useEnrollOneFa" && (
//                 <div>
//                   <div>
//                     Enroll Face Detected:
//                     {enrollOneFaFaceDetected ? "Face Detected" : "No Face Detected"}
//                   </div>
//                   <div> Enroll Status: {enrollOneFaStatus} </div>
//                   <div> Progress: {`${enrollOneFaProgress} %`}</div>
//                   <div>
//                     Enroll GUID:&nbsp;
//                     {`${enrollOneFaData ? enrollOneFaData.guid : ""}`}
//                   </div>
//                   <div>
//                     Enroll UUID:&nbsp;
//                     {`${enrollOneFaData ? enrollOneFaData.puid : ""}`}
//                   </div>
//                 </div>
//               )}

//               {currentAction === "usePredictOneFa" && (
//                 <div>
//                   <div>{`Face Valid: ${predictOneFaaceDetected ? "Face Detected" : "Face not detected"}`}</div>
//                   <div>{`Message: ${predictMessage || ""}`}</div>
//                   <div>{`Predicted GUID: ${predictOneFaData ? predictOneFaData.guid : ""}`}</div>
//                   <div>{`Predicted UUID: ${predictOneFaData ? predictOneFaData.puid : ""}`}</div>
//                   <div>{JSON.stringify(verificationStatus, null, 2)}</div>
//                 </div>
//               )}

//               {currentAction === "standby" && (
//                 <div>
//                   <button
//                     className="button"
//                     onClick={() => {
//                       setCurrentAction("usePredictOneFa");
//                     }}
//                     style={{ fontSize: "28px" }}
//                   >
//                     Start Flow
//                   </button>
//                   {/*<button*/}
//                   {/*    className="button"*/}
//                   {/*    onClick={() => navigate("/enroll_with_fido")}*/}
//                   {/*    style={{ marginLeft: 16, fontSize: "28px" }}*/}
//                   {/*>*/}
//                   {/*  Enroll User*/}
//                   {/*</button>*/}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       ) : !deviceSupported.isChecking && !deviceSupported.supported ? (
//         <div>
//           <h1> Not Supported. </h1>
//           <h4> Please use a different device or updated device. </h4>
//           <p>{deviceSupported.message}</p>
//         </div>
//       ) : (
//         <></>
//       )}
//     </>
//   );
// };

// export default PredictWithFIDO;
