export interface Meal {
    id: string;
    name: string;
    type: string;
    description: string;
    createdDate: string;
    quantity: number;
    quantityReceived: number;
    quantityNotReceived: number;
    isSubscribed: boolean;
    pathImage?: string;
}