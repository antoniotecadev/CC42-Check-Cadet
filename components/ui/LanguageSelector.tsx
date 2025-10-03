import { useLanguage } from '@/contexts/LanguageContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { t } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActionSheetIOS,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface LanguageSelectorProps {
    showTitle?: boolean;
    color?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
    showTitle = true, 
    color = '#007AFF' 
}) => {
    const { currentLanguage, availableLanguages, changeLanguage } = useLanguage();
    const [modalVisible, setModalVisible] = useState(false);
    const colorScheme = useColorScheme();

    const currentLangData = availableLanguages.find(lang => lang.code === currentLanguage);

    const handleLanguageSelect = async (langCode: string) => {
        try {
            await changeLanguage(langCode);
            setModalVisible(false);
        } catch (error) {
            console.error('Erro ao alterar idioma:', error);
        }
    };

    const showLanguageOptions = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: [
                        ...availableLanguages.map(lang => `${lang.flag} ${lang.name}`),
                        t('common.cancel')
                    ],
                    cancelButtonIndex: availableLanguages.length,
                    userInterfaceStyle: colorScheme === 'dark' ? 'dark' : 'light',
                },
                (selectedIndex) => {
                    if (selectedIndex < availableLanguages.length) {
                        handleLanguageSelect(availableLanguages[selectedIndex].code);
                    }
                }
            );
        } else {
            setModalVisible(true);
        }
    };

    return (
        <View style={styles.container}>
            {showTitle && (
                <Text style={[styles.title, { color }]}>
                    {t('settings.language')}
                </Text>
            )}
            
            <TouchableOpacity
                style={[styles.selector, { borderColor: color }]}
                onPress={showLanguageOptions}
            >
                <View style={styles.currentLanguage}>
                    <Text style={styles.flag}>{currentLangData?.flag}</Text>
                    <Text style={[styles.languageName, { color }]}>
                        {currentLangData?.name}
                    </Text>
                </View>
                <Ionicons 
                    name="chevron-down" 
                    size={20} 
                    color={color} 
                />
            </TouchableOpacity>

            {/* Modal for Android/Web */}
            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[
                        styles.modalContent,
                        { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }
                    ]}>
                        <Text style={[
                            styles.modalTitle,
                            { color: colorScheme === 'dark' ? '#fff' : '#333' }
                        ]}>
                            {t('settings.selectLanguage')}
                        </Text>
                        
                        {availableLanguages.map((lang) => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.languageOption,
                                    currentLanguage === lang.code && { backgroundColor: color + '20' }
                                ]}
                                onPress={() => handleLanguageSelect(lang.code)}
                            >
                                <Text style={styles.flag}>{lang.flag}</Text>
                                <Text style={[
                                    styles.languageOptionText,
                                    { color: colorScheme === 'dark' ? '#fff' : '#333' },
                                    currentLanguage === lang.code && { color }
                                ]}>
                                    {lang.name}
                                </Text>
                                {currentLanguage === lang.code && (
                                    <Ionicons name="checkmark" size={20} color={color} />
                                )}
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity
                            style={[styles.cancelButton, { borderColor: color }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={[styles.cancelButtonText, { color }]}>
                                {t('common.cancel')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    selector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
        backgroundColor: 'transparent',
    },
    currentLanguage: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flag: {
        fontSize: 24,
        marginRight: 8,
    },
    languageName: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        maxWidth: 300,
        borderRadius: 12,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    languageOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 8,
        marginBottom: 4,
    },
    languageOptionText: {
        fontSize: 16,
        marginLeft: 8,
        flex: 1,
    },
    cancelButton: {
        marginTop: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
});

export default LanguageSelector;