import React, { createContext, useMemo, useState } from "react"


export const DebugContext = createContext({
    functionLoop: false,
    setFuctionLoop: (functionLoop)=>{},
    showDebugOptions: false, 
    setShowDebugOptions: (showDebugOptions)=>{}
})


const DebugContextProvider = ({children})=>{

    const [functionLoop, setFuctionLoop] = useState(false);
    const [showDebugOptions, setShowDebugOptions] = useState(false);
    
    const values = {
        functionLoop,
        setFuctionLoop,
        showDebugOptions, 
        setShowDebugOptions
    }

    const memoizedValue = useMemo(()=>values,[values])

    return(
        <DebugContext.Provider value={memoizedValue}>
            {children}
        </DebugContext.Provider>
    )
}

export default DebugContextProvider;