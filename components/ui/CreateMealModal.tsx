import { carbohydrates } from "@/constants/mealOptions";
import { useCreateMeal } from "@/hooks/useCreateMeal";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    campusId: string;
    cursusId: string;
    userId: string;
    onCreated?: () => void;
}

export default function CreateMealModal({
    visible,
    onClose,
    campusId,
    cursusId,
    userId,
    onCreated,
}: Props) {
    const [name, setName] = useState("");
    const [type, setType] = useState(carbohydrates[0]);
    const [description, setDescription] = useState("");
    const [quantity, setQuantity] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const { createMeal, loading } = useCreateMeal();

    function resetForm() {
        setName("");
        setType(carbohydrates[0]);
        setDescription("");
        setQuantity("");
        setImage(null);
    }

    async function pickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    }

    async function takePhoto() {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    }

    async function handleSubmit() {
        if (!name || !type || !description || !quantity) {
            Alert.alert("Erro", "Preencha todos os campos obrigatórios.");
            return;
        }
        try {
            await createMeal({
                campusId,
                cursusId,
                userId,
                meal: {
                    name,
                    type,
                    description,
                    quantity: Number(quantity),
                },
                imageUri: image,
            });
            resetForm();
            onClose();
            onCreated && onCreated();
        } catch (e: any) {
            Alert.alert("Erro", e.message || "Erro ao criar refeição");
        }
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <ScrollView>
                        <Text style={styles.title}>Criar Refeição</Text>
                        <TouchableOpacity
                            style={styles.imagePicker}
                            onPress={pickImage}
                        >
                            {image ? (
                                <Image
                                    source={{ uri: image }}
                                    style={styles.image}
                                />
                            ) : (
                                <Text style={styles.imagePlaceholder}>
                                    Selecionar Imagem
                                </Text>
                            )}
                        </TouchableOpacity>
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={styles.photoBtn}
                                onPress={takePhoto}
                            >
                                <Text style={styles.photoBtnText}>
                                    Tirar Foto
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.photoBtn}
                                onPress={pickImage}
                            >
                                <Text style={styles.photoBtnText}>Galeria</Text>
                            </TouchableOpacity>
                        </View>
                        <TextInput
                            style={styles.input}
                            placeholder="Nome da Refeição"
                            value={name}
                            onChangeText={setName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Tipo (ex: Arroz, Massas...)"
                            value={type}
                            onChangeText={setType}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Descrição"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Quantidade"
                            value={quantity}
                            onChangeText={setQuantity}
                            keyboardType="numeric"
                        />
                        <View style={styles.rowBtns}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => {
                                    resetForm();
                                    onClose();
                                }}
                            >
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                <Text style={styles.saveText}>
                                    {loading ? "Salvando..." : "Salvar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        backgroundColor: "#333",
        borderRadius: 12,
        padding: 20,
        width: "90%",
        maxHeight: "90%",
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
        textAlign: "center",
    },
    imagePicker: {
        alignSelf: "center",
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#eee",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
        overflow: "hidden",
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    imagePlaceholder: {
        color: "#888",
        textAlign: "center",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    photoBtn: {
        flex: 1,
        backgroundColor: "#007AFF",
        marginHorizontal: 4,
        padding: 8,
        borderRadius: 8,
    },
    photoBtnText: {
        color: "#fff",
        textAlign: "center",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
        fontSize: 16,
        paddingVertical: 16,
    },
    rowBtns: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: "#eee",
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: "#007AFF",
        padding: 12,
        borderRadius: 8,
        marginLeft: 8,
    },
    cancelText: {
        color: "#333",
        textAlign: "center",
        fontWeight: "bold",
    },
    saveText: {
        color: "#fff",
        textAlign: "center",
        fontWeight: "bold",
    },
});
