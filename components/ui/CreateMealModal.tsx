import {
    breadsList,
    carbohydrates,
    eggsList,
    fungeList,
    leguminousList,
    mealType,
    meatsList,
    pastaList,
    potatoList,
    proteinsLegumesVegetables,
    riceList,
    saucesList,
    vegetablesAndSaladsList,
} from "@/constants/mealOptions";
import useAlert from "@/hooks/useAlert";
import { useCreateMeal } from "@/hooks/useCreateMeal";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useColorCoalition } from "../ColorCoalitionContext";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../ThemedView";
import Chip from "./Chip";

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
    initialMeal,
    editMode,
    onCreated,
}: Props & { initialMeal?: any; editMode?: boolean }) {
    const isWeb = Platform.OS === "web";
    const [name, setName] = useState("");
    const [showPicker, setShowPicker] = useState({
        mealType: false,
        mealDescription: false,
    });
    const [quantity, setQuantity] = useState("");
    const [type, setType] = useState(mealType[0]);
    const [tags, setTags] = React.useState<string[]>([]);
    const [mealValue, setMealValue] = useState<string>("");
    const [image, setImage] = useState<string | null>(null);

    const { color } = useColorCoalition();
    const { showError, showInfo } = useAlert();
    const { createMeal, updateMealData, updateMealImage, loading } = useCreateMeal();

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    function resetForm() {
        setName("");
        setType(mealType[0]);
        setTags([]);
        setQuantity("");
        setImage(null);
        setShowPicker((prev) => ({
            ...prev,
            mealType: false,
            mealDescription: false,
        }));
    }

    async function pickImage() {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    }

    async function takePhoto() {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImage(result.assets[0].uri);
        }
    }

    async function handleSubmit() {
        const description = tags.toString();
        if (!name || !type || !description || !quantity) {
            showInfo("Erro", "Preencha todos os campos obrigatórios.");
            return;
        }
        try {
            if (editMode && initialMeal) {
                // Se só a imagem mudou
                if (
                    image &&
                    image !== initialMeal.pathImage &&
                    name === initialMeal.name &&
                    type === initialMeal.type &&
                    description === initialMeal.description &&
                    quantity === String(initialMeal.quantity)
                ) {
                    await updateMealImage({
                        campusId,
                        cursusId,
                        mealId: initialMeal.id,
                        imageUri: image,
                        oldImageUrl: initialMeal.pathImage,
                    });
                } else {
                    // Se outros campos mudaram (pode ou não ter imagem nova)
                    await updateMealData({
                        campusId,
                        cursusId,
                        mealId: initialMeal.id,
                        meal: {
                            name,
                            type,
                            description,
                            quantity: Number(quantity),
                        },
                        imageUri:
                            image !== initialMeal.pathImage ? image : undefined,
                        oldImageUrl: initialMeal.pathImage,
                    });
                }
            } else {
                // Criação normal
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
            }
            resetForm();
            onClose();
            onCreated && onCreated();
        } catch (e: any) {
            showError("Erro", e.message || "Erro ao salvar refeição");
        }
    }

    async function handleSubmit1() {
        const description = tags.toString();
        if (!name || !type || !description || !quantity) {
            showInfo("Aviso ", "Preencha todos os campos.");
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
            showError("Erro", e.message || "Erro ao criar refeição");
        }
    }

    const PickerItemDescription = (arrayDescription: string[]) => {
        const item = arrayDescription.map((item) => (
            <Picker.Item key={item} label={item} value={item} />
        ));
        return item;
    };

    useEffect(() => {
        if (editMode && initialMeal) {
            setName(initialMeal.name || "");
            setType(initialMeal.type || "");
            setTags([...tags, initialMeal.description]);
            setQuantity(
                initialMeal.quantity ? String(initialMeal.quantity) : "0"
            );
            setImage(initialMeal.pathImage || null);
        } else if (!visible) {
            resetForm();
        }
    }, [editMode, initialMeal, visible]);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={styles.overlay}>
                    <ThemedView style={styles.container}>
                        <ScrollView showsVerticalScrollIndicator={isWeb}>
                            <ThemedText style={styles.title}>
                                Criar Refeição
                            </ThemedText>
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
                                    style={[
                                        styles.photoBtn,
                                        { backgroundColor: color },
                                    ]}
                                    onPress={takePhoto}
                                >
                                    <Text style={styles.photoBtnText}>
                                        Tirar Foto
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.photoBtn,
                                        { backgroundColor: color },
                                    ]}
                                    onPress={pickImage}
                                >
                                    <Text style={styles.photoBtnText}>
                                        Galeria
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                onPress={() =>
                                    setShowPicker((prev) => ({
                                        ...prev,
                                        mealType: false,
                                        mealDescription: false,
                                    }))
                                }
                                style={[styles.input, { borderColor: color }]}
                                placeholder="Nome da Refeição"
                                value={name}
                                onChangeText={setName}
                            />
                            <TextInput
                                onPress={() =>
                                    setShowPicker((prev) => ({
                                        ...prev,
                                        mealType: !showPicker.mealType,
                                        mealDescription: false,
                                    }))
                                }
                                editable={false}
                                style={[styles.input, { borderColor: color }]}
                                placeholder="Tipo (ex: lanche, almoço...)"
                                value={type}
                                onChangeText={setType}
                            />
                            {showPicker.mealType && (
                                <Picker
                                    selectedValue={type}
                                    onValueChange={setType}
                                    style={{ color: "#333" }} // ou ajuste conforme seu tema
                                >
                                    {mealType.map((item) => (
                                        <Picker.Item
                                            key={item}
                                            label={item}
                                            value={item}
                                        />
                                    ))}
                                </Picker>
                            )}
                            <TextInput
                                onPress={() =>
                                    setShowPicker((prev) => ({
                                        ...prev,
                                        mealDescription:
                                            !showPicker.mealDescription,
                                        mealType: false,
                                    }))
                                }
                                editable={false}
                                style={[styles.input, { borderColor: color }]}
                                placeholder="Descrição"
                                value={tags.toString()}
                                multiline
                            />
                            <View
                                style={{
                                    flexDirection: "row",
                                    flexWrap: "wrap",
                                }}
                            >
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onRemove={() => removeTag(tag)}
                                    />
                                ))}
                            </View>
                            {showPicker.mealDescription && (
                                <Picker
                                    selectedValue={mealValue}
                                    onValueChange={(value) => {
                                        if (
                                            typeof value === "string" &&
                                            isNaN(Number(value)) &&
                                            !tags.includes(value)
                                        ) {
                                            setTags([...tags, value]);
                                        }
                                        setMealValue(value);
                                    }}
                                    style={{ color: "#333" }}
                                >
                                    <Picker.Item
                                        key={0}
                                        label={"CARBOIDRATO"}
                                        value={"0"}
                                    />
                                    <Picker.Item
                                        key={1}
                                        label={carbohydrates[0]}
                                        value={carbohydrates[0]}
                                    />
                                    {PickerItemDescription(riceList)}
                                    <Picker.Item
                                        key={2}
                                        label={carbohydrates[1]}
                                        value={carbohydrates[1]}
                                    />
                                    {PickerItemDescription(pastaList)}
                                    <Picker.Item
                                        key={3}
                                        label={carbohydrates[2]}
                                        value={carbohydrates[2]}
                                    />
                                    {PickerItemDescription(fungeList)}
                                    <Picker.Item
                                        key={4}
                                        label={carbohydrates[3]}
                                        value={carbohydrates[3]}
                                    />
                                    {PickerItemDescription(potatoList)}
                                    <Picker.Item
                                        key={5}
                                        label={carbohydrates[4]}
                                        value={carbohydrates[4]}
                                    />
                                    {PickerItemDescription(breadsList)}
                                    <Picker.Item
                                        key={6}
                                        label={
                                            "PROTEÍNAS, VEGETAIS E LEGUMENOSES"
                                        }
                                        value={"1"}
                                    />
                                    <Picker.Item
                                        key={7}
                                        label={proteinsLegumesVegetables[0]}
                                        value={"2"}
                                    />
                                    {PickerItemDescription(leguminousList)}
                                    <Picker.Item
                                        key={8}
                                        label={proteinsLegumesVegetables[1]}
                                        value={"3"}
                                    />
                                    {PickerItemDescription(meatsList)}
                                    <Picker.Item
                                        key={9}
                                        label={proteinsLegumesVegetables[2]}
                                        value={"4"}
                                    />
                                    {PickerItemDescription(eggsList)}
                                    <Picker.Item
                                        key={10}
                                        label={proteinsLegumesVegetables[3]}
                                        value={"5"}
                                    />
                                    {PickerItemDescription(
                                        vegetablesAndSaladsList
                                    )}
                                    <Picker.Item
                                        key={11}
                                        label={proteinsLegumesVegetables[4]}
                                        value={"6"}
                                    />
                                    {PickerItemDescription(saucesList)}
                                </Picker>
                            )}
                            <TextInput
                                onPress={() =>
                                    setShowPicker((prev) => ({
                                        ...prev,
                                        mealType: false,
                                        mealDescription: false,
                                    }))
                                }
                                style={[styles.input, { borderColor: color }]}
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
                                    <Text style={styles.cancelText}>
                                        Cancelar
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.saveBtn,
                                        { backgroundColor: color },
                                    ]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    <Text style={styles.saveText}>
                                        {loading ? "Salvando..." : "Salvar"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </ThemedView>
                </View>
            </KeyboardAvoidingView>
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
        marginHorizontal: 4,
        padding: 8,
        borderRadius: 8,
    },
    photoBtnText: {
        color: "#fff",
        textAlign: "center",
    },
    input: {
        color: "#888",
        borderWidth: 1,
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
