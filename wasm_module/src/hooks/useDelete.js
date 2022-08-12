import { useState } from 'react';
import { deleteUser } from '@privateid/privid-fhe-modules';
import { deleteUser as deleteUUID } from '../api/config';

const useDelete = (onDeleteEnd, ready) => {
  const [loading, setLoading] = useState(false);

  const callback = (result) => {
    setLoading(false);
    onDeleteEnd(result.returnValue.status === 0 ? 'success' : 'error');
  };

  const onDeleteUser = async (uuid) => {
    const guid = localStorage.getItem('guid');

    try {
      await deleteUUID(guid);
    } catch (e) {
      console.log(e);
    }

    if (ready) {
      setLoading(true);
      deleteUser(uuid, callback);
    }
  };

  return { loading, onDeleteUser };
};

export default useDelete;
