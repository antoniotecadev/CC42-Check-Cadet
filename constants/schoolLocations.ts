/**
 * 🗺️ CHECKCADET - LOCALIZAÇÕES DA ESCOLA
 * 
 * Este arquivo contém todas as definições de áreas clicáveis
 * no mapa da planta da escola 42 Luanda.
 * 
 * Como ajustar as posições:
 * 1. Abra a imagem da planta (42_luanda_blueprint.png)
 * 2. Identifique a área que deseja mapear
 * 3. Defina as coordenadas em porcentagem:
 *    - top: distância do topo (0% = topo, 100% = fundo)
 *    - left: distância da esquerda (0% = esquerda, 100% = direita)
 *    - width: largura da área em %
 *    - height: altura da área em %
 * 4. Escolha uma cor semi-transparente (rgba)
 */

import type { DimensionValue } from 'react-native';

// Tipo para definir cada localização no mapa
export interface Location {
    id: string;
    name: string;
    top: DimensionValue;    // Posição em % (ex: '20%')
    left: DimensionValue;   // Posição em % (ex: '30%')
    width: DimensionValue;  // Largura em % (ex: '15%')
    height: DimensionValue; // Altura em % (ex: '10%')
    color: string;          // Cor do botão (para visualização)
}

// Definição de todas as áreas interativas no mapa da escola
export const SCHOOL_LOCATIONS: Location[] = [
    {
        id: "formal_auditorium",
        name: "Auditório Formal",
        top: "19%",
        left: "15%",
        width: "22%",
        height: "18%",
        color: "rgba(52, 152, 219, 0.5)", // Azul
    },
    {
        id: "direction",
        name: "Direção",
        top: "37%",
        left: "15%",
        width: "12%",
        height: "9%",
        color: "rgba(52, 213, 219, 0.5)", // Azul claro
    },
    {
        id: "copa",
        name: "Copa",
        top: "19%",
        left: "37%",
        width: "19%",
        height: "18%",
        color: "rgba(46, 204, 113, 0.5)", // Verde
    },
    {
        id: "reception",
        name: "Recepção",
        top: "46%",
        left: "18%",
        width: "9%",
        height: "12%",
        color: "rgba(155, 89, 182, 0.5)", // Roxo
    },
    {
        id: "cluster_1",
        name: "Cluster 1",
        top: "42%",
        left: "30%",
        width: "26%",
        height: "18%",
        color: "rgba(241, 196, 15, 0.5)", // Amarelo
    },
    {
        id: "cluster_2",
        name: "Cluster 2",
        top: "42%",
        left: "56%",
        width: "25%",
        height: "18%",
        color: "rgba(241, 15, 166, 0.5)", // Rosa
    },
    {
        id: "wc",
        name: "WC",
        top: "62%",
        left: "17.4%",
        width: "9.1%",
        height: "10%",
        color: "rgba(231, 76, 60, 0.5)", // Vermelho
    },
    {
        id: "cluster_3",
        name: "Cluster 3",
        top: "60%",
        left: "65%",
        width: "16%",
        height: "10%",
        color: "rgba(72, 188, 26, 0.5)", // Verde limão
    },
    {
        id: "libriary",
        name: "Biblioteca",
        top: "82%",
        left: "64%",
        width: "17%",
        height: "13%",
        color: "rgba(26, 115, 188, 0.5)", // Azul escuro
    },
    {
        id: "bocal",
        name: "Bocal",
        top: "70%",
        left: "64%",
        width: "6%",
        height: "12%",
        color: "rgba(188, 123, 26, 0.5)", // Laranja
    },
    {
        id: "informal_auditorium",
        name: "Auditório Informal",
        top: "19%",
        left: "56%",
        width: "18%",
        height: "18%",
        color: "rgba(217, 230, 34, 0.5)", // Amarelo limão
    },
    {
        id: "server_room",
        name: "Servidores",
        top: "19%",
        left: "74%",
        width: "7%",
        height: "18%",
        color: "rgba(230, 126, 34, 0.5)", // Laranja escuro
    },
    {
        id: "hallway",
        name: "Corredor",
        top: "37%",
        left: "30%",
        width: "48%",
        height: "5%",
        color: "rgba(238, 222, 170, 0.43)", // Bege
    },
    {
        id: "decompression_zone",
        name: "Zona de Descompressão",
        top: "43%",
        left: "81%",
        width: "6%",
        height: "39%",
        color: "rgba(149, 165, 166, 0.5)", // Cinza
    },
];

/**
 * Função helper para buscar uma localização pelo ID
 * @param id - ID da localização
 * @returns Location ou undefined
 */
export function getLocationById(id: string): Location | undefined {
    return SCHOOL_LOCATIONS.find(location => location.id === id);
}

/**
 * Função helper para obter todas as localizações por tipo
 * Útil para agrupar clusters, auditórios, etc.
 */
export function getLocationsByType(type: 'cluster' | 'auditorium' | 'service' | 'other'): Location[] {
    const typePatterns = {
        cluster: /^cluster_/,
        auditorium: /auditorium/,
        service: /^(wc|reception|direction|server_room)$/,
        other: /.*/
    };

    return SCHOOL_LOCATIONS.filter(location => 
        typePatterns[type].test(location.id)
    );
}

/**
 * Constantes de cores por categoria
 * Use isso para manter consistência visual
 */
export const LOCATION_COLORS = {
    cluster: 'rgba(241, 196, 15, 0.5)',      // Amarelo
    auditorium: 'rgba(52, 152, 219, 0.5)',   // Azul
    service: 'rgba(155, 89, 182, 0.5)',       // Roxo
    recreation: 'rgba(46, 204, 113, 0.5)',    // Verde
    library: 'rgba(26, 115, 188, 0.5)',       // Azul escuro
    wc: 'rgba(231, 76, 60, 0.5)',            // Vermelho
} as const;
