import React, {useState} from 'react';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TaskItem from '../components/TaskItem';
import {Task} from '../types/task';

type RootStackParamList = {
    Home: undefined;
    DeletedTasks: {
        deletedTasks: Task[];
        onRecover: (taskId: string) => void;
    };
}

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [selectedColor, setSelectedColor] = useState('#FF6347');
    const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
    const navigation = useNavigation<HomeScreenNavigationProp>();


    const addTask = () => {
        if(newTask.trim() === '') return;

        const task: Task = {id: Date.now().toString(),
                            text: newTask,
                            completed: false,
                            color: selectedColor,
                            createdAt: Date.now()};
        setTasks(prev => [task, ...prev]);
        setNewTask('');
    }

    const toggleTask = (id: string) => {
        setTasks(prev =>
        prev.map(task => (task.id === id ? {...task, completed: !task.completed} : task)))
    }

    const deleteTask = (id: string) => {
        Alert.alert(
            'Eliminar tarea',
            '¿Estás seguro que deseas eliminar esta nota?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        const deleted = tasks.find(task => task.id === id);
                        if(deleted) {
                            setDeletedTasks(prev => [deleted, ...prev])
                        }
                        setTasks(prev => prev.filter(task => task.id !== id));
                    }
                }
            ],
            {cancelable: true}
        )
    }

    const handleRecoverTask = (taskId: string) => {
        const recovered = deletedTasks.find(task => task.id === taskId);
        if(recovered) {
            setTasks(prev => [recovered, ...prev]);
            setDeletedTasks(prev => prev.filter(task => task.id !== taskId));
        }
    }

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
        <TaskItem
            task={item}
            onToggle={toggleTask}
            onDelete={deleteTask}
            drag={drag}
            isActive={isActive}
        />
    );

    return(
        <View style = {styles.container}>
            <Text style={styles.title}>Task Mate Evolution 📋</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style = {styles.input}
                    placeholder= 'Agrega una nueva tarea!'
                    value = {newTask}
                    onChangeText = {setNewTask}
                    onSubmitEditing={addTask}
                />
                <Button
                    title='Agregar'
                    onPress={addTask}/>
            </View>

            <View style = {styles.colorContainer}>
                {['#FF6347', '#1E90FF', '#32CD32', '#FFD700', '#FF69B4'].map((color) => (
                    <View
                        key={color}
                        style = {[
                            styles.colorOption,
                            {
                                backgroundColor: color,
                                borderWidth: selectedColor === color ? 2 : 0,
                                borderColor: selectedColor === color ? '#000' : 'transparent',
                            }
                        ]}
                    >
                        <Text
                            onPress={() => setSelectedColor(color)}
                            style = {styles.colorPressArea}
                        />
                    </View>
                ))}
            </View>

            <DraggableFlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({data}) => setTasks(data)}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        Todavía no hay tareas cargadas, agrega una nueva tarea!
                    </Text>
                }
                    />
            <View style = {{marginBottom: 30}}>
                <Button
                    title = 'Ver notas eliminadas.'
                    onPress = {() => {
                        navigation.navigate('DeletedTasks', {
                            deletedTasks,
                            onRecover: handleRecoverTask,
                        })
                    }}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 8,
        paddingTop: 30,
        backgroundColor: '#F8F9FA',
        marginTop: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    input: {
        flex: 1,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: '#999',
        marginTop: 20,
    },
    colorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    colorOption: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 6
    },
    colorPressArea: {
        width: '100%',
        height: '100%',
    }
})

export default HomeScreen;