export type Task = {
    id: string;           // identificador único (ej: Date.now().toString())
    text: string;         // contenido de la nota/tarea
    completed: boolean;   // si está tachada/completada
    color: string;        // color elegido (hex o css-like)
    createdAt: number;    // timestamp (Date.now())
    imageUri?: string;    // opcional: foto guardada localmente (URI)
    audioUri?: string;    // opcional: nota de voz (URI)
    deletedAt?: number;
    editedAt?: number;
};
