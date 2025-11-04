import React, { createContext, useState, useContext, useCallback } from 'react';

const HelpContext = createContext();

export const useHelp = () => useContext(HelpContext);

export const HelpProvider = ({ children }) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [helpStack, setHelpStack] = useState([]);

    const openHelp = () => {
        if (helpStack.length > 0) {
        setIsHelpOpen(true);
        }
    };

    const closeHelp = () => {
        setIsHelpOpen(false);
    };

    const setHelpContent = useCallback((content) => {
        setHelpStack(prevStack => [...prevStack, content]);
    }, []);
    const revertHelpContent = useCallback(() => {
        setHelpStack(prevStack => prevStack.slice(0, -1));
    }, []);


    const currentHelp = helpStack[helpStack.length - 1] || { title: 'Ajuda', content: [{ item: 'Nenhuma ajuda disponível', description: 'Não há informações de ajuda para o contexto atual.' }] };

    const value = {
        isHelpOpen,
        openHelp,
        closeHelp,
        currentHelp,
        setHelpContent,
        revertHelpContent
    };

    return (
        <HelpContext.Provider value={value}>
            {children}
        </HelpContext.Provider>
    );
};