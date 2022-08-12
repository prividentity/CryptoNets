import { useState } from 'react';
import { deleteUser } from '@privateid/privid-fhe-modules';
import usePredict from './usePredict';

const useDelete = (onDeleteEnd, ready,) => {
  const [loading, setLoading] = useState(false);
  const [predictData, setPredictData] = useState(null)
  const callbackPredict = (x,y) =>{
    setPredictData({x,y});
  }
  const { faceDetected, predictUser, resultData } = usePredict('userVideo', callbackPredict)

  const callback = (result) => {
    setLoading(false);
    onDeleteEnd(result.returnValue.status === 0 ? 'success' : 'error');
  };

  const onDeleteUser = async (uuid) => {
    
    await predictUser();
    console.log("Is face detected: ", faceDetected);
    console.log("Predict result data: ", resultData);
    console.log("Predict data:", predictData);
    if (ready) {
      setLoading(true);
      deleteUser("123456", callback);
    }
  };

  return { loading, onDeleteUser };
};

export default useDelete;
