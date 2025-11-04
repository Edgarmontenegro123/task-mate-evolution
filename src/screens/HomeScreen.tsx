import React, {useState, useEffect, useRef} from 'react';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {View, Text, TextInput, Button, StyleSheet, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TaskItem from '../components/TaskItem';
import {Task} from '../types/task';
import {RootStackParamList} from '../navigation/types';
import EditTaskModal from '../components/EditTaskModal';


type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [selectedColor, setSelectedColor] = useState('#1E90FF');
    const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
    const [inputHeight, setInputHeight] = useState(40);
    const inputRef = useRef<TextInput>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditVisible, setIsEditVisible] = useState<boolean>(false);

    const navigation = useNavigation<HomeScreenNavigationProp>();


    useEffect(() => {
        const loadData = async () => {
            try {
                /*const rawTasks = await AsyncStorage.getItem('tasks');
                const rawDeleted = await AsyncStorage.getItem('deletedTasks');
                console.log('Storage Debug: ');
                console.log('Tasks: ', rawTasks);
                console.log('DeletedTasks: ', rawDeleted);

                if(rawTasks) setTasks(JSON.parse(rawTasks));
                if(rawDeleted) setDeletedTasks(JSON.parse(rawDeleted));*/
                const savedTasks = await AsyncStorage.getItem('tasks');
                const savedDeleted = await AsyncStorage.getItem('deletedTasks');
                if(savedTasks) setTasks(JSON.parse(savedTasks));
                if(savedDeleted) setDeletedTasks(JSON.parse(savedDeleted));
            } catch (error) {
                console.error('Error al cargar datos: ', error);
            }
        }
        loadData();
    }, []);

    // Guardar automáticamente tasks y deletedTasks cada vez que cambien
    useEffect(() => {
        const saveData = async () => {
            try {
                await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
                await AsyncStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            } catch (error) {
                console.error('Error al guardar datos: ', error);
            }
        }
        saveData();
    }, [tasks, deletedTasks]);


    const addTask = () => {
        if(newTask.trim() === '') return;

        const task: Task = {
            id: Date.now().toString(),
            text: newTask,
            completed: false,
            color: selectedColor,
            createdAt: Date.now()
        };
        setTasks(prev => [task, ...prev]);
        setNewTask('');
        setInputHeight(40); // eliminar si no funciona
    }

    const toggleTask = (id: string) => {
        setTasks(prev =>
        prev.map(task => (task.id === id ? {...task, completed: !task.completed} : task)))
    }

    const handleEdit = (task: Task) => {
        setSelectedTask(task);
        setIsEditVisible(true);
    }

    const handleSaveEdit = async (updatedTask: Task) => {
        const updatedList = tasks.map((task: Task) => (task.id === updatedTask.id ? updatedTask : task));
        setTasks(updatedList);
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedList));
        setIsEditVisible(false);
        setSelectedTask(null);
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
                        if(deleted) setDeletedTasks(prev => [deleted, ...prev])
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

    const setCaretToStart = () => {
        inputRef.current?.setNativeProps({ selection: { start: 0, end: 0}});
    }


    const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
        <>
            <TaskItem
                task={item}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={() => handleEdit(item)}
                drag={drag}
                isActive={isActive}
            />
        </>
    );

    return(
        <View style = {styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    style = {[styles.input, {height: Math.min(inputHeight, 120)}]}
                    placeholder= 'Agrega una nueva tarea!'
                    value = {newTask}
                    onChangeText = {setNewTask}
                    multiline
                    scrollEnabled={true}
                    textAlignVertical={'top'}
                    onContentSizeChange={(e) => {
                        const newHeight = e.nativeEvent.contentSize.height;
                        setInputHeight(Math.min(newHeight, 120))
                    }}
                    onFocus={() => setCaretToStart()}
                    ref = {inputRef}
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
                                borderColor: selectedColor === color ? '#999' : 'transparent',
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

            <View style = {styles.listContainer}>
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
                    /*showsVerticalScrollIndicator={true} // Eliminar si no gusta*/
                />
            </View>

            <View style = {styles.fixedButtonContainer}>
                <Button
                    title = 'Ver notas eliminadas.'
                    onPress = {() => {
                        navigation.navigate('DeletedTasks', {
                            deletedTasks,
                            onRecover: handleRecoverTask,
                        })
                    }}
                />
                {/*<Button
                    title="🧹 Limpiar notas eliminadas"
                    color="red"
                    onPress={async () => {
                        try {
                            await AsyncStorage.removeItem('deletedTasks');
                            setDeletedTasks([]); // actualiza el estado local también
                            console.log('✅ Clave deletedTasks eliminada del storage');
                            Alert.alert('Storage limpio', 'Se eliminaron las notas eliminadas almacenadas.');
                        } catch (error) {
                            console.error('Error al limpiar deletedTasks:', error);
                        }
                    }}
                />*/}

            </View>
            <EditTaskModal
                visible={isEditVisible}
                task={selectedTask}
                onSave={handleSaveEdit}
                onCancel={() => setIsEditVisible(false)}
            />
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
    listContainer: {
      flex: 1,
      marginBottom: 70,
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
        maxHeight: 120,
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
    },
    fixedButtonContainer: {
        position: 'absolute',
        bottom: 20,
        alignSelf: 'center',
        width: '90%',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 6,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    }
})

export default HomeScreen;