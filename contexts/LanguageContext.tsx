import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { changeLanguage, getAvailableLanguages, initializeLanguage } from '../i18n';

interface LanguageContextType {
    currentLanguage: string;
    availableLanguages: Array<{ code: string; name: string; flag: string }>;
    changeLanguage: (locale: string) => Promise<void>;
    isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState<string>('pt');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const availableLanguages = getAvailableLanguages();

    useEffect(() => {
        const initLang = async () => {
            try {
                const savedLanguage = await initializeLanguage();
                setCurrentLanguage(savedLanguage);
            } catch (error) {
                console.error('Error initializing language:', error);
                setCurrentLanguage('pt');
            } finally {
                setIsLoading(false);
            }
        };

        initLang();
    }, []);

    const handleChangeLanguage = async (locale: string): Promise<void> => {
        try {
            await changeLanguage(locale);
            setCurrentLanguage(locale);
        } catch (error) {
            console.error('Erro ao alterar idioma:', error);
            throw error;
        }
    };

    const value: LanguageContextType = {
        currentLanguage,
        availableLanguages,
        changeLanguage: handleChangeLanguage,
        isLoading,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export default LanguageContext;