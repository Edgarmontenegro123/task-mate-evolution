export type Task = {
    id: string;
    text: string;
    completed: boolean;
    color: string;
    createdAt: number;
    imageUri?: string;
    audioUri?: string;
    deletedAt?: number;
    editedAt?: number;
};
