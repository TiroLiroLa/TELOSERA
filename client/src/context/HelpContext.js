import React, { createContext, useState, useContext, useCallback } from 'react';

const HelpContext = createContext();

export const useHelp = () => useContext(HelpContext);

export const HelpProvider = ({ children }) => {
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    // Agora usamos uma pilha para gerenciar os contextos de ajuda
    const [helpStack, setHelpStack] = useState([]);

    const openHelp = () => {
        if (helpStack.length > 0) { // Só abre se houver conteúdo
        setIsHelpOpen(true);
        }
    };

    const closeHelp = () => {
        setIsHelpOpen(false);
    };

    // Adiciona um novo conteúdo de ajuda à pilha (para páginas e modais)
    const setHelpContent = useCallback((content) => {
        setHelpStack(prevStack => [...prevStack, content]);
    }, []);

    // Remove o último conteúdo de ajuda da pilha (quando um modal fecha)
    const revertHelpContent = useCallback(() => {
        setHelpStack(prevStack => prevStack.slice(0, -1));
    }, []);

    // O conteúdo de ajuda atual é sempre o último item da pilha
    const currentHelp = helpStack[helpStack.length - 1] || { title: 'Ajuda', content: [{ item: 'Nenhuma ajuda disponível', description: 'Não há informações de ajuda para o contexto atual.' }] };

    const value = {
        isHelpOpen,
        openHelp,
        closeHelp,
        currentHelp,
        setHelpContent,
        revertHelpContent // Expondo a nova função
    };

    return (
        <HelpContext.Provider value={value}>
            {children}
        </HelpContext.Provider>
    );
};