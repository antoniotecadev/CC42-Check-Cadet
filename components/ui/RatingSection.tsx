import useAlert from "@/hooks/useAlert";
import { fetchRatings, RatingResult } from "@/repository/eventRepository";
import { userIsPresentOrSubscribed } from "@/repository/userRepository";
import { styles } from "@/styles/ratingSection";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import CommentBox from "./CommentBox";

interface RatingSectionProps {
    color: string;
    campusId: string;
    cursusId: string;
    type: "events" | "meals";
    typeId: string;
    userId: string;
}

export default function RatingSection({
    color,
    campusId,
    cursusId,
    type,
    typeId,
    userId,
}: RatingSectionProps) {
    const { showError, showSuccess } = useAlert();
    const [rating, setRating] = useState<RatingResult>();
    const [userRating, setUserRating] = useState<number>(0);
    const [userPresentOrSuscribed, setUserPresentOrSuscribed] =
        useState<boolean>(false);

    // Se o usuário já avaliou, mostra a nota dele, senão mostra o que ele está selecionando
    const starsToShow = rating?.userRating ?? userRating; // userRating = estado local para seleção

    // Reset userRating when user submits successfully
    const handleSubmitSuccess = () => {
        setUserRating(0);
        showSuccess("SUCESSO", "Enviado com sucesso!");
    };

    useEffect(() => {
        let isMounted = true;
        const checkUserPresence = async () => {
            try {
                const isUserPresentOrSubscribed =
                    await userIsPresentOrSubscribed({
                        campusId,
                        cursusId,
                        type,
                        typeId,
                        userId,
                    });
                setUserPresentOrSuscribed(isUserPresentOrSubscribed);
            } catch (error) {
                if (isMounted) {
                    showError("ERRO", "Erro ao verificar presença do usuário.");
                }
            }
        };
        checkUserPresence();
        const unsubscribe = fetchRatings(
            campusId,
            cursusId,
            type,
            typeId,
            userId,
            setRating
        );
        return () => {
            isMounted = false;
            unsubscribe();
        };
    }, [typeId]);

    return (
        <View style={localStyles.container}>
            {/* Card com resultado das avaliações */}
            <View style={[styles.ratingContainer, { backgroundColor: color }]}>
                <View style={styles.ratingLeft}>
                    <Text style={styles.ratingValue}>
                        {rating?.ratingValue?.toFixed(1) ?? "-"}
                    </Text>
                    <View style={styles.starsRow}>
                        {rating?.stars.map((star, i) => (
                            <FontAwesome
                                key={i}
                                name={
                                    star === "star-half"
                                        ? "star-half-full"
                                        : star
                                }
                                size={20}
                                color="#FFD700"
                                style={{ marginRight: 2 }}
                            />
                        ))}
                    </View>
                    <Text style={styles.ratingCount}>
                        {rating?.ratingCount ?? 0} avaliações
                    </Text>
                </View>
            </View>

            {/* Card integrado: Avaliação + Comentário */}
            {userPresentOrSuscribed && (
                <View style={[localStyles.interactionCard, { backgroundColor: color }]}>
                    <Text style={localStyles.sectionTitle}>Sua Avaliação & Comentário</Text>
                    
                    {/* Seção de avaliação por estrelas */}
                    <View style={localStyles.ratingSection}>
                        <Text style={localStyles.ratingLabel}>
                            {rating?.userRating ? "Sua avaliação" : "Avalie com estrelas"}
                        </Text>
                        <View style={localStyles.starsContainer}>
                            <View style={styles.starsRowSmall}>
                                {[...Array(5)].map((_, i) => (
                                    <FontAwesome
                                        key={i}
                                        name={i < starsToShow ? "star" : "star-o"}
                                        size={30}
                                        color={i < starsToShow ? "#FFD700" : "#B0B0B0"}
                                        style={{ marginRight: 4 }}
                                        onPress={
                                            rating?.userRating
                                                ? undefined
                                                : () => setUserRating(i + 1)
                                        }
                                    />
                                ))}
                            </View>
                            {rating?.userRating && (
                                <Text style={localStyles.completedRating}>
                                    ✓ {rating.userRating} estrela{rating.userRating > 1 ? "s" : ""}
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* Divisor visual */}
                    <View style={localStyles.divider} />

                    {/* Seção de comentário integrada */}
                    <CommentBox
                        campusId={campusId}
                        cursusId={cursusId}
                        userId={userId}
                        type={type}
                        typeId={typeId}
                        containerStyle={localStyles.commentSection}
                        integrated={true}
                        userRating={userRating}
                        hasExistingRating={!!rating?.userRating}
                        onSubmitSuccess={handleSubmitSuccess}
                    />
                </View>
            )}

            {/* Mensagem para usuários não presentes/subscritos */}
            {!userPresentOrSuscribed && (
                <View style={[localStyles.notPresentCard, { backgroundColor: color }]}>
                    <Text style={localStyles.notPresentText}>
                        {type === "events" 
                            ? "📋 Você precisa estar presente no evento para avaliar e comentar" 
                            : "🍽️ Você precisa estar subscrito na refeição para avaliar e comentar"}
                    </Text>
                </View>
            )}
        </View>
    );
}

const localStyles = StyleSheet.create({
    container: {
        marginHorizontal: 18,
        marginBottom: 18,
    },
    interactionCard: {
        borderRadius: 18,
        padding: 20,
        marginTop: 12,
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#3A86FF",
        marginBottom: 16,
        textAlign: "center",
    },
    ratingSection: {
        alignItems: "center",
        marginBottom: 8,
    },
    ratingLabel: {
        fontSize: 15,
        color: "#666",
        marginBottom: 12,
        fontWeight: "500",
    },
    starsContainer: {
        alignItems: "center",
        gap: 12,
    },
    completedRating: {
        fontSize: 16,
        color: "#4CAF50",
        fontWeight: "bold",
        marginTop: 8,
    },
    divider: {
        height: 1,
        backgroundColor: "#E0E0E0",
        marginVertical: 16,
        opacity: 0.5,
    },
    commentSection: {
        flex: 0,
    },
    notPresentCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        alignItems: "center",
        opacity: 0.8,
    },
    notPresentText: {
        fontSize: 15,
        color: "#666",
        textAlign: "center",
        fontStyle: "italic",
    },
});

