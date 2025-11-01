import { Task } from '../types/task';

export type RootStackParamList = {
    Home: undefined;
    DeletedTasks: {
        deletedTasks: Task[];
        onRecover: (id: string) => void;
    };
};