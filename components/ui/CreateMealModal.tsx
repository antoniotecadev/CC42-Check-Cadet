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
import { t } from "@/i18n";
import { optimizeImage } from "@/utility/ImageUtil";
import { Ionicons } from "@expo/vector-icons";
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
import WebCameraCapture from "./WebCameraCapture";

// Tipos para resolver problemas de tipagem
interface SubcategoryItem {
    name: string;
    icon: string;
    items: string[];
}

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategories: Record<string, SubcategoryItem>;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    campusId: string;
    cursusId: string;
    campusName: string;
    userId: string;
    onCreated?: () => void;
}

export default function CreateMealModal({
    visible,
    onClose,
    campusId,
    cursusId,
    campusName,
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
    const [showCameraWeb, setShowCameraWeb] = useState<boolean>(false);

    // Novo sistema de seleção em etapas
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
    const [showCategorySelector, setShowCategorySelector] =
        useState<boolean>(false);

    const { color } = useColorCoalition();
    const { showError, showInfo } = useAlert();
    const { createMeal, updateMealData, updateMealImage, loading } =
        useCreateMeal();

    // Estrutura organizada de categorias
    const categories = {
        carbohydrates: {
            id: "carbohydrates",
            name: "CARBOIDRATOS",
            icon: "🍚",
            color: "#4A90E2",
            subcategories: {
                rice: { name: carbohydrates[0], icon: "🍚", items: riceList },
                pasta: { name: carbohydrates[1], icon: "🍝", items: pastaList },
                funge: { name: carbohydrates[2], icon: "🥣", items: fungeList },
                potato: {
                    name: carbohydrates[3],
                    icon: "🥔",
                    items: potatoList,
                },
                bread: {
                    name: carbohydrates[4],
                    icon: "🍞",
                    items: breadsList,
                },
            },
        },
        proteins: {
            id: "proteins",
            name: "PROTEÍNAS, VEGETAIS E LEGUMINOSAS",
            icon: "🥩",
            color: "#E74C3C",
            subcategories: {
                legumes: {
                    name: proteinsLegumesVegetables[0],
                    icon: "🫘",
                    items: leguminousList,
                },
                meats: {
                    name: proteinsLegumesVegetables[1],
                    icon: "🥩",
                    items: meatsList,
                },
                eggs: {
                    name: proteinsLegumesVegetables[2],
                    icon: "🥚",
                    items: eggsList,
                },
                vegetables: {
                    name: proteinsLegumesVegetables[3],
                    icon: "🥬",
                    items: vegetablesAndSaladsList,
                },
                sauces: {
                    name: proteinsLegumesVegetables[4],
                    icon: "🍯",
                    items: saucesList,
                },
            },
        },
    };

    const addIngredient = (ingredient: string) => {
        if (!tags.includes(ingredient)) {
            setTags([...tags, ingredient]);
        }
        setShowCategorySelector(false);
        setSelectedCategory("");
        setSelectedSubcategory("");
    };

    // Helper functions para acessar categories de forma type-safe
    const getSelectedCategory = (): Category | null => {
        return selectedCategory &&
            categories[selectedCategory as keyof typeof categories]
            ? categories[selectedCategory as keyof typeof categories]
            : null;
    };

    const getSelectedSubcategory = (): SubcategoryItem | null => {
        const category = getSelectedCategory();
        return category &&
            selectedSubcategory &&
            category.subcategories[selectedSubcategory]
            ? category.subcategories[selectedSubcategory]
            : null;
    };

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
            quality: 1,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            const resultUri = await optimizeImage(imageUri);
            setImage(resultUri);
        }
    }

    async function takePhoto() {
        if (isWeb) {
            setShowCameraWeb(true);
        } else {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const imageUri = result.assets[0].uri;
                const resultUri = await optimizeImage(imageUri);
                setImage(resultUri);
            }
        }
    }

    async function handleSubmit() {
        const description = tags.toString();
        if (!name || !type || !description || !quantity) {
            showInfo(t('common.error'), t('meals.fillAllRequiredFields'));
            return;
        }
        try {
            if (editMode && initialMeal) {
                const dataIsEqualse =
                    name === initialMeal.name &&
                    type === initialMeal.type &&
                    description === initialMeal.description &&
                    quantity === String(initialMeal.quantity);

                // Se só a imagem mudou
                if (image && image !== initialMeal.pathImage && dataIsEqualse) {
                    await updateMealImage({
                        campusId,
                        cursusId,
                        mealId: initialMeal.id,
                        imageUri: image,
                        oldImageUrl: initialMeal.pathImage,
                    });
                } else if (
                    !(image === initialMeal.pathImage && dataIsEqualse) // Se nenhun dado for alterado não actualiza
                ) {
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
                    campusName,
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
            showError(t('common.error'), e.message || t('meals.errorSavingMeal'));
        }
    }

    const PickerItemDescription = (arrayDescription: string[]) => {
        const item = arrayDescription.map((item) =>
            isWeb ? (
                <option key={item} value={item}>
                    {item}
                </option>
            ) : (
                <Picker.Item key={item} label={item} value={item} />
            )
        );
        return item;
    };

    useEffect(() => {
        if (editMode && initialMeal) {
            setName(initialMeal.name || "");
            setType(initialMeal.type || "");
            setTags([...tags, initialMeal.description]);
            setQuantity(
                initialMeal.quantityNotReceived
                    ? String(initialMeal.quantityNotReceived)
                    : "0"
            );
            setImage(initialMeal.pathImage || null);
        } else if (!visible) {
            resetForm();
        }
    }, [editMode, initialMeal, visible]);

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={[styles.overlay, isWeb ? styles.inner : {}]}>
                    <ThemedView style={styles.container}>
                        {showCameraWeb ? (
                            <WebCameraCapture
                                onSetImage={setImage}
                                onSetShowCameraWeb={setShowCameraWeb}
                            />
                        ) : (
                            <ScrollView showsVerticalScrollIndicator={isWeb}>
                                <ThemedText style={styles.title}>
                                    {t('meals.createMeal')}
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
                                            {t('meals.selectImage')}
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
                                        accessibilityLabel={t('meals.takePhoto')}
                                    >
                                        <Ionicons
                                            name={isWeb ? "camera" : "camera"}
                                            size={20}
                                            color="#fff"
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.photoBtn,
                                            { backgroundColor: color },
                                        ]}
                                        onPress={pickImage}
                                        accessibilityLabel={t('meals.openGallery')}
                                    >
                                        <Ionicons
                                            name={isWeb ? "image" : "images"}
                                            size={20}
                                            color="#fff"
                                        />
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
                                    style={[
                                        styles.input,
                                        { borderColor: color },
                                    ]}
                                    placeholder={t('meals.mealName')}
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
                                    style={[
                                        styles.input,
                                        { borderColor: color },
                                    ]}
                                    placeholder={t('meals.mealTypePlaceholder')}
                                    value={type}
                                    onChangeText={setType}
                                />
                                {(showPicker.mealType || isWeb) &&
                                    (isWeb ? (
                                        <select
                                            value={type}
                                            onChange={(e) =>
                                                setType(e.target.value)
                                            }
                                            style={{
                                                padding: "12px 16px",
                                                fontSize: 16,
                                                borderRadius: 8,
                                                border: `1px solid ${color}`,
                                                background: "#fafafa",
                                                color: "#333",
                                                marginBottom: 10,
                                                outline: "none",
                                                width: "100%",
                                                appearance: "none",
                                                WebkitAppearance: "none",
                                                MozAppearance: "none",
                                                boxShadow:
                                                    "0 1px 4px rgba(0,0,0,0.04)",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {mealType.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
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
                                    ))}
                                <TouchableOpacity
                                    onPress={() =>
                                        setShowCategorySelector(
                                            !showCategorySelector
                                        )
                                    }
                                    style={[
                                        styles.input,
                                        {
                                            borderColor: color,
                                            flexDirection: "row",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                        },
                                    ]}
                                >
                                    <Text
                                        style={{
                                            color:
                                                tags.length > 0
                                                    ? "#333"
                                                    : "#999",
                                        }}
                                    >
                                        {tags.length > 0
                                            ? t('meals.ingredientsSelected')
                                            : t('meals.addIngredients')}
                                    </Text>
                                    <Ionicons
                                        name="chevron-down"
                                        size={20}
                                        color="#666"
                                    />
                                </TouchableOpacity>

                                {/* Chips dos ingredientes selecionados */}
                                <View
                                    style={{
                                        flexDirection: "row",
                                        flexWrap: "wrap",
                                        marginBottom: 10,
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

                                {/* Seletor de categorias em etapas */}
                                {showCategorySelector && (
                                    <ThemedView
                                        style={[
                                            styles.categorySelector,
                                            { borderColor: color },
                                        ]}
                                    >
                                        {!selectedCategory ? (
                                            // Etapa 1: Selecionar categoria principal
                                            <View>
                                                <Text
                                                    style={styles.selectorTitle}
                                                >
                                                    {t('meals.chooseCategory')}
                                                </Text>
                                                <ThemedView
                                                    style={styles.categoryGrid}
                                                >
                                                    {Object.values(
                                                        categories
                                                    ).map((category) => (
                                                        <TouchableOpacity
                                                            key={category.id}
                                                            style={[
                                                                styles.categoryCard,
                                                                {
                                                                    borderColor:
                                                                        category.color,
                                                                },
                                                            ]}
                                                            onPress={() =>
                                                                setSelectedCategory(
                                                                    category.id
                                                                )
                                                            }
                                                        >
                                                            <Text
                                                                style={
                                                                    styles.categoryIcon
                                                                }
                                                            >
                                                                {category.icon}
                                                            </Text>
                                                            <Text
                                                                style={[
                                                                    styles.categoryName,
                                                                    {
                                                                        color: category.color,
                                                                    },
                                                                ]}
                                                            >
                                                                {category.name}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    ))}
                                                </ThemedView>
                                            </View>
                                        ) : !selectedSubcategory ? (
                                            // Etapa 2: Selecionar subcategoria
                                            <View>
                                                <View style={styles.breadcrumb}>
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            setSelectedCategory(
                                                                ""
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.breadcrumbText
                                                            }
                                                        >
                                                            {
                                                                categories[
                                                                    selectedCategory as keyof typeof categories
                                                                ].icon
                                                            }{" "}
                                                            {
                                                                categories[
                                                                    selectedCategory as keyof typeof categories
                                                                ].name
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                                </View>
                                                <Text
                                                    style={
                                                        styles.breadcrumbCurrent
                                                    }
                                                >
                                                    {t('meals.chooseType')}
                                                </Text>
                                                <View
                                                    style={
                                                        styles.subcategoryList
                                                    }
                                                >
                                                    {Object.entries(
                                                        categories[
                                                            selectedCategory as keyof typeof categories
                                                        ].subcategories
                                                    ).map(
                                                        ([
                                                            key,
                                                            subcategory,
                                                        ]) => (
                                                            <TouchableOpacity
                                                                key={key}
                                                                style={[
                                                                    styles.subcategoryItem,
                                                                    {
                                                                        borderColor:
                                                                            color,
                                                                    },
                                                                ]}
                                                                onPress={() =>
                                                                    setSelectedSubcategory(
                                                                        key
                                                                    )
                                                                }
                                                            >
                                                                <Text
                                                                    style={
                                                                        styles.subcategoryIcon
                                                                    }
                                                                >
                                                                    {
                                                                        subcategory.icon
                                                                    }
                                                                </Text>
                                                                <ThemedText
                                                                    style={
                                                                        styles.subcategoryName
                                                                    }
                                                                >
                                                                    {
                                                                        subcategory.name
                                                                    }
                                                                </ThemedText>
                                                                <Ionicons
                                                                    name="chevron-forward"
                                                                    size={16}
                                                                    color="#666"
                                                                />
                                                            </TouchableOpacity>
                                                        )
                                                    )}
                                                </View>
                                            </View>
                                        ) : (
                                            // Etapa 3: Selecionar item específico
                                            <View>
                                                <ThemedView
                                                    style={styles.breadcrumb}
                                                >
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            setSelectedCategory(
                                                                ""
                                                            )
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.breadcrumbText
                                                            }
                                                        >
                                                            {
                                                                getSelectedCategory()
                                                                    ?.icon
                                                            }
                                                        </Text>
                                                    </TouchableOpacity>
                                                    <Text
                                                        style={
                                                            styles.breadcrumbSeparator
                                                        }
                                                    >
                                                        {" "}
                                                        {">"}{" "}
                                                    </Text>
                                                    <TouchableOpacity
                                                        onPress={() =>
                                                            setSelectedSubcategory(
                                                                ""
                                                            )
                                                        }
                                                    >
                                                        <ThemedText
                                                            style={
                                                                styles.breadcrumbText
                                                            }
                                                        >
                                                            {
                                                                getSelectedSubcategory()
                                                                    ?.name
                                                            }
                                                        </ThemedText>
                                                    </TouchableOpacity>
                                                </ThemedView>
                                                <ThemedText
                                                    style={
                                                        styles.breadcrumbCurrent
                                                    }
                                                >
                                                    {t('meals.select')}
                                                </ThemedText>
                                                <View style={styles.itemsList}>
                                                    {getSelectedSubcategory()?.items?.map(
                                                        (item) => (
                                                            <TouchableOpacity
                                                                key={item}
                                                                style={[
                                                                    styles.itemButton,
                                                                    tags.includes(
                                                                        item
                                                                    ) &&
                                                                        styles.itemSelected,
                                                                    {
                                                                        borderColor:
                                                                            color,
                                                                    },
                                                                ]}
                                                                onPress={() =>
                                                                    addIngredient(
                                                                        item
                                                                    )
                                                                }
                                                            >
                                                                <ThemedText
                                                                    style={[
                                                                        styles.itemText,
                                                                        tags.includes(
                                                                            item
                                                                        ) &&
                                                                            styles.itemTextSelected,
                                                                    ]}
                                                                >
                                                                    {item}
                                                                </ThemedText>
                                                                {tags.includes(
                                                                    item
                                                                ) && (
                                                                    <Ionicons
                                                                        name="checkmark"
                                                                        size={
                                                                            16
                                                                        }
                                                                        color="#fff"
                                                                    />
                                                                )}
                                                            </TouchableOpacity>
                                                        )
                                                    ) || null}
                                                </View>
                                            </View>
                                        )}

                                        {/* Botão fechar */}
                                        <TouchableOpacity
                                            style={styles.closeSelector}
                                            onPress={() => {
                                                setShowCategorySelector(false);
                                                setSelectedCategory("");
                                                setSelectedSubcategory("");
                                            }}
                                        >
                                            <Text
                                                style={styles.closeSelectorText}
                                            >
                                                {t('common.close')}
                                            </Text>
                                        </TouchableOpacity>
                                    </ThemedView>
                                )}
                                <TextInput
                                    onPress={() =>
                                        setShowPicker((prev) => ({
                                            ...prev,
                                            mealType: false,
                                            mealDescription: false,
                                        }))
                                    }
                                    style={[
                                        styles.input,
                                        { borderColor: color },
                                    ]}
                                    placeholder={t('meals.quantity')}
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
                                            {t('common.cancel')}
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
                                            {loading ? t('common.saving') : t('common.save')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
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
        alignItems: "center",
        justifyContent: "center",
        minHeight: 40,
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
    inner: {
        width: "100%",
        maxWidth: 600, // limite superior
        marginHorizontal: "auto", // centraliza na web (usando style prop em web pura)
    },
    // Estilos para o novo seletor de categorias
    categorySelector: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    selectorTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 12,
        color: "#666",
        textAlign: "center",
    },
    categoryGrid: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 16,
    },
    categoryCard: {
        flex: 1,
        alignItems: "center",
        padding: 16,
        margin: 4,
        borderRadius: 12,
        borderWidth: 2,
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    categoryName: {
        fontSize: 12,
        fontWeight: "600",
        textAlign: "center",
    },
    breadcrumb: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#666",
    },
    breadcrumbText: {
        color: "#007AFF",
        fontSize: 14,
        fontWeight: "500",
    },
    breadcrumbSeparator: {
        color: "#666",
        fontSize: 14,
    },
    breadcrumbCurrent: {
        color: "#666",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    subcategoryList: {
        marginBottom: 16,
    },
    subcategoryItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        marginVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    subcategoryIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    subcategoryName: {
        flex: 1,
        fontSize: 14,
        fontWeight: "500",
    },
    itemsList: {
        marginBottom: 16,
    },
    itemButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 10,
        marginVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
    },
    itemSelected: {
        backgroundColor: "#007AFF",
        borderColor: "#007AFF",
    },
    itemText: {
        fontSize: 14,
    },
    itemTextSelected: {
        color: "#fff",
        fontWeight: "500",
    },
    closeSelector: {
        alignSelf: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: "#6c757d",
        borderRadius: 6,
    },
    closeSelectorText: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "500",
    },
});
