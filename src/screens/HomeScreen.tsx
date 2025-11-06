import React, {useState, useEffect, useRef, useLayoutEffect} from 'react';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TaskItem from '../components/TaskItem';
import {Task} from '../types/task';
import {RootStackParamList} from '../navigation/types';
import EditTaskModal from '../components/EditTaskModal';
import {Ionicons} from '@expo/vector-icons';
import {useThemeColors} from '../hooks/useThemeColors';
import {
    useAudioRecorder,
    requestRecordingPermissionsAsync,
    RecordingPresets,
    setAudioModeAsync
} from 'expo-audio';

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Non-serializable values were found in the navigation state']);

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
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const {theme, toggleTheme, colors} = useThemeColors();
    const styles = createStyles(colors);

    const navigation = useNavigation<HomeScreenNavigationProp>();

    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);


    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Ionicons
                    name={theme === 'dark' ? 'sunny' : 'moon'}
                    size={24}
                    color={theme === 'dark' ? '#FFD700' : '#333'}
                    onPress={toggleTheme}
                    style={{marginRight: 15}}
                />
            ),
            headerStyle: {backgroundColor: colors.headerBg}, headerTitleStyle: {color: colors.headerText},
        });
    }, [navigation, theme, colors, toggleTheme]);


    useEffect(() => {
        const loadData = async () => {
            try {
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


    const addTask = (audioUri?: string) => {
        if(!newTask.trim() && !audioUri) return;

        let taskText = newTask;
        if(!newTask.trim() && audioUri) {
            const voiceNotes = tasks.filter(t => t.text.startsWith('grabación.'));
            const nextNumber = voiceNotes.length + 1;
            const padded = nextNumber.toString().padStart(2, '0');
            taskText = `grabación.${padded}`;
        }

        const task: Task = {
            id: Date.now().toString(),
            text: taskText,
            completed: false,
            color: selectedColor,
            createdAt: Date.now(),
            editedAt: Date.now(),
            audioUri: audioUri || undefined,
        };
        setTasks(prev => [task, ...prev]);
        setNewTask('');
        setInputHeight(40);
    }

    const startRecording = async () => {
        try {
            const permission = await requestRecordingPermissionsAsync();
            if(!permission.granted) {
                Alert.alert('Se necesita permiso para grabar audio.');
                return;
            }
            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
            });
            await recorder.prepareToRecordAsync();
            await recorder.record();
            setIsRecording(true);
        } catch(err) {
            console.error('Error al iniciar la grabación: ', err);
        }
    }

    const stopRecording = async () => {
        try {
            await recorder.stop();
            const uri = recorder.uri;
            setIsRecording(false);

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            })

            if(uri) addTask(uri);
        } catch (err) {
            console.error('Error al detener grabación: ', err);
        }
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
        const updatedList = tasks.map((task: Task) => {
            if(task.id === updatedTask.id) {
                return {
                    ...task,
                    text: updatedTask.text,
                    color: updatedTask.color,
                    editedAt: Date.now()
                }
            }
            return task;
        });
        setTasks(updatedList);
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedList));
        setIsEditVisible(false);
        setSelectedTask(null);
    }

    const deleteTask = (id: string) => {
        Alert.alert('Eliminar tarea','¿Estás seguro que deseas eliminar esta nota?', [
                {text: 'Cancelar', style: 'cancel'},
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        const deleted = tasks.find(task => task.id === id);
                        if(deleted) {
                            const deletedWithDate = {...deleted, deletedAt: Date.now()};
                            setDeletedTasks(prev => [deletedWithDate, ...prev])
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

    // Analizar si hay que dejar o eliminar
    const setCaretToStart = () => {
        inputRef.current?.setNativeProps({ selection: { start: 0, end: 0}});
    }

    const renderItem = ({ item, drag, isActive }: RenderItemParams<Task>) => (
        <TaskItem
            task={item}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={() => handleEdit(item)}
            drag={drag}
            isActive={isActive}
        />
    );

    return(
        <View style = {styles.container}>
            <View style={styles.inputContainer}>
                <TextInput
                    value = {newTask}
                    onChangeText = {setNewTask}
                    style = {[styles.input, {height: Math.min(inputHeight, 120)}]}
                    placeholder= 'Agrega una nueva tarea!'
                    placeholderTextColor={colors.placeholder}
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
                <TouchableOpacity
                    onPress={isRecording ? stopRecording : startRecording}
                    style={{marginRight: 6}}
                >
                    <Ionicons
                        name={isRecording ? 'stop' : 'mic'}
                        size={26}
                        color={isRecording ? 'red' : colors.text}
                    />
                </TouchableOpacity>
                <Button
                    title='Agregar'
                    onPress={() => addTask()}
                />
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
                    data={tasks.filter(Boolean)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    onDragEnd={({data}) => setTasks(data.filter(Boolean))}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            Todavía no hay tareas cargadas, agrega una nueva tarea!
                        </Text>
                    }
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

const createStyles = (colors: ReturnType<typeof useThemeColors>['colors']) =>
StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 8,
        paddingTop: 30,
        backgroundColor: colors.background,
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
        borderColor: colors.border,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 4,
        maxHeight: 120,
        color: colors.text,
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
        backgroundColor: colors.card,
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