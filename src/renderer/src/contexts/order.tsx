import React, { createContext, useContext, useState } from 'react';

interface OrderContextProps {
    folderOrder: OrderOptions;
    fileOrder: OrderOptions;
    setOrderFolder: (option: OrderOptions) => void;
    setOrderFile: (option: OrderOptions) => void;
}

const OrderContext = createContext<OrderContextProps>({} as OrderContextProps);

function OrderProvider({ children }: { children: React.ReactNode }) {
    const [folderOrder, setFolderOrder] = useState<OrderOptions>('name-alphabetical');
    const [fileOrder, setFileOrder] = useState<OrderOptions>('name-alphabetical');

    function setOrderFolder(option: OrderOptions) {
        setFolderOrder(option);
    }

    function setOrderFile(option: OrderOptions) {
        setFileOrder(option);
    }

    return (
        <OrderContext.Provider
            value={{
                folderOrder,
                fileOrder,
                setOrderFolder,
                setOrderFile,
            }}
        >
            <>{children}</>
        </OrderContext.Provider>
    );
}

const useOrder = () => {
    const context = useContext(OrderContext);
    return context;
};

export { OrderProvider, useOrder, OrderContext };
