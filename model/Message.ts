export type Message = {
    id?: string;
    title?: string | null;
    message?: string | null;
    timestamp?: number | null;
    createdBy?: number | null;
};

export default Message;
