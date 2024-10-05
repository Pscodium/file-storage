/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';


const useDidMount = (f: any) => useEffect(() => {
    f();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

export default useDidMount;
