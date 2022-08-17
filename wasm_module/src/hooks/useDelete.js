import { useState } from "react";
import { deleteUser } from "@privateid/privid-fhe-modules";

// useDelete
const useDelete = (onDeleteEnd, ready) => {
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = (result) => {
    setLoading(false);
    onDeleteEnd(result.returnValue.status === 0 ? "success" : result.returnValue.message);
  };

  const onDeleteUser = async (uuid) => {
    deleteUser(uuid, callback);
  };

  return { loading, onDeleteUser };
};

export default useDelete;
