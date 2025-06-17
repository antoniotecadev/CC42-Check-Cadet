import { Colors } from "@/constants/Colors";
import React, { createContext, useContext, useState } from "react";

type ColorContextType = {
    color: string;
    setColor: (newColor: string) => void;
};

const ColorContext = createContext<ColorContextType | undefined>(undefined);
export const ColorCoalitionProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {
    const [color, setColor] = useState(Colors.light_blue_900.default); // cor inicial (azul padrão iOS)

    return (
        <ColorContext.Provider value={{ color, setColor }}>
            {children}
        </ColorContext.Provider>
    );
};

// Hook para usar em qualquer componente
export const useColorCoalition = () => {
    const context = useContext(ColorContext);
    if (!context)
        throw new Error(
            "useColorCoalition deve estar dentro de <ColorProvider>"
        );
    return context;
};
