import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import pt from './locales/pt.json';

// Tipo para as traduções
type TranslationKey = string;
type Translations = Record<string, any>;

// Configuração simples do i18n
class SimpleI18n {
    private currentLocale: string = 'pt';
    private translations: Record<string, Translations> = {
        pt,
        en,
    };

    get locale(): string {
        return this.currentLocale;
    }

    set locale(value: string) {
        if (this.translations[value]) {
            this.currentLocale = value;
        }
    }

    t(key: TranslationKey, options?: any): string {
        const keys = key.split('.');
        let translation: any = this.translations[this.currentLocale];

        for (const k of keys) {
            if (translation && typeof translation === 'object' && k in translation) {
                translation = translation[k];
            } else {
                // Fallback to Portuguese if key doesn't exist in current language
                translation = this.translations['pt'];
                for (const fallbackKey of keys) {
                    if (translation && typeof translation === 'object' && fallbackKey in translation) {
                        translation = translation[fallbackKey];
                    } else {
                        return key; // Return key if translation not found
                    }
                }
                break;
            }
        }

        if (typeof translation === 'string') {
            return translation;
        }

        return key; // Return key if translation not found
    }
}

// Instância global
const i18n = new SimpleI18n();

// Função para carregar idioma salvo
export const loadSavedLanguage = async (): Promise<string> => {
    try {
        const savedLanguage = await AsyncStorage.getItem('app_language');
        if (savedLanguage && (savedLanguage === 'pt' || savedLanguage === 'en')) {
            return savedLanguage;
        }
        
        // Se não há idioma salvo, usar o do dispositivo se disponível
        const deviceLocale = Localization.getLocales()[0]?.languageCode || 'pt';
        if (deviceLocale.startsWith('pt')) {
            return 'pt';
        } else if (deviceLocale.startsWith('en')) {
            return 'en';
        }
        
        // Fallback to Portuguese
        return 'pt';
    } catch (error) {
        console.error('Error loading saved language:', error);
        return 'pt';
    }
};

// Função para trocar idioma
export const changeLanguage = async (locale: string): Promise<void> => {
    try {
        if (locale === 'pt' || locale === 'en') {
            i18n.locale = locale;
            await AsyncStorage.setItem('app_language', locale);
        }
    } catch (error) {
        console.error('Error saving language:', error);
        throw error;
    }
};

// Função de tradução
export const t = (key: string, options?: object): string => {
    return i18n.t(key, options);
};

// Função para obter idioma atual
export const getCurrentLanguage = (): string => {
    return i18n.locale;
};

// Função para obter lista de idiomas disponíveis
export const getAvailableLanguages = () => {
    return [
        { code: 'pt', name: 'Português', flag: '🇦🇴' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
    ];
};

// Inicializar com idioma salvo
export const initializeLanguage = async (): Promise<string> => {
    const savedLanguage = await loadSavedLanguage();
    i18n.locale = savedLanguage;
    return savedLanguage;
};

export default i18n;