import useAlert from "@/hooks/useAlert";
import { fetchRatings, RatingResult } from "@/repository/eventRepository";
import { rate, userIsPresentOrSubscribed } from "@/repository/userRepository";
import { styles } from "@/styles/ratingSection";
import { FontAwesome } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

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
                                star === "star-half" ? "star-half-full" : star
                            }
                            size={28}
                            color="#FFD700"
                            style={{ marginRight: 2 }}
                        />
                    ))}
                </View>
                <Text style={styles.ratingCount}>
                    {rating?.ratingCount ?? 0} avaliações
                </Text>
            </View>
            <View style={styles.ratingRight}>
                {!rating?.userRating ? (
                    <Text
                        style={[
                            styles.tapToRate,
                            {
                                color: userPresentOrSuscribed
                                    ? "#3A86FF"
                                    : "red",
                            },
                        ]}
                    >
                        {userPresentOrSuscribed
                            ? "Toque para avaliar"
                            : "Ausente"}
                    </Text>
                ) : (
                    <Text style={[styles.tapToRate, { color: "green" }]}>
                        Presente
                    </Text>
                )}
                <View style={styles.starsRowSmall}>
                    {[...Array(5)].map((_, i) => (
                        <FontAwesome
                            key={i}
                            name={i < starsToShow ? "star" : "star-o"}
                            size={22}
                            color={i < starsToShow ? "#FFD700" : "#B0B0B0"}
                            style={{ marginRight: 1 }}
                            onPress={
                                rating?.userRating || !userPresentOrSuscribed
                                    ? undefined // desabilita clique se já avaliou
                                    : () => setUserRating(i + 1)
                            }
                        />
                    ))}
                </View>
                <Button
                    title={
                        rating?.userRating
                            ? `${rating.userRating} estrela${
                                  rating.userRating > 1 ? "s" : ""
                              }`
                            : "Enviar Avaliação"
                    }
                    onPress={() => {
                        if (!rating?.userRating) {
                            rate(
                                campusId,
                                cursusId,
                                type,
                                typeId,
                                userId,
                                userRating,
                                () =>
                                    showSuccess(
                                        "SUCESSO",
                                        "Avaliação enviada com sucesso!"
                                    ),
                                (error) => showError("ERRO", error.message)
                            );
                        }
                    }}
                    disabled={!!rating?.userRating || userRating === 0}
                />
            </View>
        </View>
    );
}
