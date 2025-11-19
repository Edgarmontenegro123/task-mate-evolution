export type RootStackParamList = {
    Home: undefined;
    DeletedTasks: {
        onRecover: (id: string) => void;
    };
};