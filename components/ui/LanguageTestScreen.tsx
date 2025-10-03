import LanguageSelector from '@/components/ui/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/i18n';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const LanguageTestScreen: React.FC = () => {
    const { currentLanguage, isLoading } = useLanguage();

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text>Loading language...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sistema de Internacionalização</Text>
            <Text style={styles.subtitle}>Current Language: {currentLanguage}</Text>
            
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Seletor de Idioma:</Text>
                <LanguageSelector />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Exemplos de Tradução:</Text>
                <Text>• {t('common.save')}</Text>
                <Text>• {t('common.cancel')}</Text>
                <Text>• {t('common.loading')}</Text>
                <Text>• {t('home.checkCadet')}</Text>
                <Text>• {t('home.logout')}</Text>
                <Text>• {t('events.title')}</Text>
                <Text>• {t('events.checkIn')}</Text>
                <Text>• {t('events.checkOut')}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    section: {
        marginVertical: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});

export default LanguageTestScreen;