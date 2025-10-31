import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '../types/task';

const TASKS_KEY = '@taskmate:tasks';

export const loadTasks = async (): Promise<Task[]> => {
    try {
        const raw = await AsyncStorage.getItem(TASKS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as Task[];

        if (!Array.isArray(parsed)) return [];
        return parsed;
    } catch (error) {
        console.error('[storage] loadTasks failed:', error);
        return [];
    }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
    try {
        await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error('[storage] saveTasks failed:', error);
    }
};

// Helpers opcionales (devuelven el array actualizado)
// Añadir tarea y retornar el nuevo array
export const addTaskToStorage = async (task: Task): Promise<Task[]> => {
    const tasks = await loadTasks();
    const updated = [task, ...tasks];
    await saveTasks(updated);
    return updated;
};

// Reemplazar una tarea por id
export const updateTaskInStorage = async (updatedTask: Task): Promise<Task[]> => {
    const tasks = await loadTasks();
    const newTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    await saveTasks(newTasks);
    return newTasks;
};

// Eliminar por id
export const removeTaskFromStorage = async (id: string): Promise<Task[]> => {
    const tasks = await loadTasks();
    const newTasks = tasks.filter(t => t.id !== id);
    await saveTasks(newTasks);
    return newTasks;
};
