import { useCallback, useState } from "react";
import { deleteUser } from "@privateid/privid-fhe-modules";
import usePredict from "./usePredict";

// useDelete
// here in this hook we are first using usePredict to get the UUID of the user,
// afterwards we are passing the UUID from the use predict to the deleteUser and a callback
const useDelete = (onDeleteEnd, ready) => {
  const [loading, setLoading] = useState(false);
  const [predictData, setPredictData] = useState(null);
  const callbackPredict = (guid, uuid) => {
    setPredictData({ guid, uuid });
  };
  const predictFailureCallback = () => {
    console.log("Face not detected.");
  };
  const { faceDetected, predictUser, predictResultData } = usePredict(
    "userVideo",
    callbackPredict,
    predictFailureCallback,
    predictFailureCallback
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = (result) => {
    setLoading(false);
    console.log("delete callback result:", result);
    onDeleteEnd(result.returnValue.status === 0 ? "success" : "error on callback");
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getUserUUID = (predictCallback) => {
    if (ready) {
      setLoading(true);
      predictUser(predictCallback);
    }
  };

  function wait(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

  const onDeleteUser = async () => {
    console.log("onDeletePredictData", predictData);

    getUserUUID();
    wait(4000);
    deleteUser(predictData.uuid, callback);
  };

  
  const userUUID = predictData ? predictData.uuid : "";
  return { loading, onDeleteUser, userUUID };
};

export default useDelete;
