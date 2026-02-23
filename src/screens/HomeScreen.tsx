import React, {useState, useEffect, useRef, useLayoutEffect, useCallback} from 'react';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, Platform} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import TaskItem from '../components/TaskItem';
import {Task} from '../types/task';
import {RootStackParamList} from '../navigation/types';
import EditTaskModal from '../components/EditTaskModal';
import {Ionicons} from '@expo/vector-icons';
import {useThemeColors} from '../hooks/useThemeColors';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
    useAudioRecorder,
    requestRecordingPermissionsAsync,
    RecordingPresets,
    setAudioModeAsync
} from 'expo-audio';

import {
    ensureNotifPermission,
    scheduleOneReminder,
    cancelReminder,
} from '../utils/notifications';

import {configureAndroidChannel} from '../utils/notifications';
import {LogBox} from 'react-native';
import RecordingModal from '../components/RecordingModal';

LogBox.ignoreLogs(['Non-serializable values were found in the navigation state',
    'expo-notifications: Android push notifications (remote notifications)',
]);

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen: React.FC = () => {
    useEffect(() => {
        void configureAndroidChannel();
    }, []);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [selectedColor, setSelectedColor] = useState('#1E90FF');
    const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
    const [inputHeight, setInputHeight] = useState(40);
    const inputRef = useRef<TextInput>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditVisible, setIsEditVisible] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isRecordingVisible, setIsRecordingVisible] = useState<boolean>(false);
    const {theme, toggleTheme, colors} = useThemeColors();
    const styles = createStyles(colors);
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
    const [webReminderText, setWebReminderText] = useState('');
    const [webReminderVisible, setWebReminderVisible] = useState(false);

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

    useFocusEffect(
        useCallback(() => {
            const loadData = async () => {
                try {
                    const savedTasks = await AsyncStorage.getItem('tasks');
                    const savedDeleted = await AsyncStorage.getItem('deletedTasks');
                    if (savedTasks) {
                        const parsed: Task[] = JSON.parse(savedTasks);
                        const now = Date.now();
                        const cleaned = parsed.map((t) => ({
                            ...t,
                            reminders: (t.reminders ?? []).filter((r) => r.fireAt > now - 2000),
                        }));
                        setTasks(cleaned);
                        await AsyncStorage.setItem('tasks', JSON.stringify(cleaned));
                    }
                    if (savedDeleted) setDeletedTasks(JSON.parse(savedDeleted));
                } catch (error) {
                    console.error('Error al cargar datos: ', error);
                }
            };
            void loadData();
        }, [])
    );

    useEffect(() => {
        const saveData = async () => {
            try {
                await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
                await AsyncStorage.setItem('deletedTasks', JSON.stringify(deletedTasks));
            } catch (error) {
                console.error('Error al guardar datos: ', error);
            }
        }
        void saveData();
    }, [tasks, deletedTasks]);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        const interval = setInterval(() => {
            const now = Date.now();

            let due: {taskId: string; fireAt: number; text: string} | null = null;

            for (const t of tasks) {
                for(const r of t.reminders ?? []) {
                    if (r.fireAt <= now) {
                        due = {taskId: t.id, fireAt: r.fireAt, text: t.text};
                        break;
                    }
                }
                if (due) break;
            }

            if (!due) return;

            console.log('[web-reminders] DUE!', due);

            setWebReminderText(due.text || '(nota de voz)');
            setWebReminderVisible(true);

            setTasks((prev) =>
                prev.map((t) =>
                    t.id !== due!.taskId
                    ? t
                        : {...t, reminders: (t.reminders ?? []).filter((r) => r.fireAt !== due!.fireAt),
                    }
                )
            );
        }, 1000);

        return () => clearInterval(interval);
    }, [tasks]);


    const addTask = (audioUri?: string) => {
        if (!newTask.trim() && !audioUri) return;

        let taskText = newTask;
        if (!newTask.trim() && audioUri) {
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
            if (!permission.granted) {
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
            setIsRecordingVisible(true);
        } catch (err) {
            console.error('Error al iniciar la grabación: ', err);
        }
    }

    const stopRecording = async () => {
        try {
            await recorder.stop();
            const uri = recorder.uri;
            setIsRecording(false);
            setIsRecordingVisible(false);

            await setAudioModeAsync({
                allowsRecording: false,
                playsInSilentMode: true,
            })

            if (uri) addTask(uri);
        } catch (err) {
            console.error('Error al detener grabación: ', err);
        }
    }

    const cancelRecording = async () => {
        try {
            if (isRecording) await recorder.stop();
        } catch (e) {
            console.error(e);
        } finally {
            setIsRecording(false);
            setIsRecordingVisible(false);
            try {
                await setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                });
            } catch {
            }
        }
    }

    const toggleTask = (id: string) => {
        setTasks(prev =>
            prev.map(task => (task.id === id ? {...task, completed: !task.completed} : task)))
    }

    const handleEdit = (task: Task) => {
        const now = Date.now();
        const cleanedTask = {
            ...task,
            reminders: (task.reminders ?? []).filter((r) => r.fireAt >= now),
        }
        if ((task.reminders?.length ?? 0) !== (cleanedTask.reminders?.length ?? 0)) {
            setTasks((prev) => {
                const next = prev.map((t) => (t.id === task.id ? cleanedTask : t));
                AsyncStorage.setItem('tasks', JSON.stringify(next)).catch(() => {
                });
                return next;
            });
        }
        setSelectedTask(cleanedTask);
        setIsEditVisible(true);
    }

    const handleSaveEdit = async (updatedTask: Task) => {
        console.log('[handleSaveEdit] incoming reminders: ', updatedTask.reminders);

        const previous = tasks.find(t => t.id === updatedTask.id);

        if (previous?.reminders?.length) {
            for (const r of previous.reminders) {
                if (r.notificationId) {
                    try {
                        await cancelReminder(r.notificationId);
                    } catch (e) {
                        console.log('[handleSaveEdit] cancelReminder error: ', e);
                    }
                }
            }
        }

        const draft = updatedTask.reminders ?? [];

        if (draft.length === 0) {
            const updatedList = tasks.map((t) =>
                t.id === updatedTask.id ? {
                        ...updatedTask,
                        editedAt: Date.now(),
                        reminders: [],
                    }
                    : t);

            setTasks(updatedList);
            await AsyncStorage.setItem('tasks', JSON.stringify(updatedList));

            setIsEditVisible(false);
            setSelectedTask(null);
            return;
        }

        if (Platform.OS === 'web') {
            Alert.alert(
                'No disponible en web',
                'Los recordatorios funcionan solo en Android / IOS. En PWA no se pueden programar notificaciones.'
            );

            const keep = draft.map((r) => ({
                id: `${r.fireAt}`,
                fireAt: r.fireAt,
                notificationId: '',
            }));

            console.log('[handleSaveEdit] web -> keeping reminders (no schedule): ', keep);

            const updatedList = tasks.map((t) =>
                t.id === updatedTask.id ? {
                    ...updatedTask,
                    text: updatedTask.text,
                    color: updatedTask.color,
                    editedAt: Date.now(),
                    reminders: keep,
                } : t
            );
            setTasks(updatedList);
            await AsyncStorage.setItem('tasks', JSON.stringify(updatedList));

            setIsEditVisible(false);
            setSelectedTask(null);
            return;
        }

        const ok = await ensureNotifPermission();
        console.log('[handleSaveEdit] notif permission: ', ok);

        if (!ok) {
            Alert.alert(
                'Permiso requerido.',
                'Debes habilitar notificaciones para usar recordatorios.'
            );

            const updatedList = tasks.map((t) =>
                t.id === updatedTask.id ?
                    {
                        ...updatedTask,
                        editedAt: Date.now(),
                        reminders: [],
                    }
                    : t
            );

            setTasks(updatedList);
            await AsyncStorage.setItem('tasks', JSON.stringify(updatedList));
            setIsEditVisible(false);
            setSelectedTask(null);
            return;
        }
        const scheduled: Task['reminders'] = [];

        for (const r of draft) {
            if (r.fireAt <= Date.now() + 1000) continue;

            try {
                const notificationId = await scheduleOneReminder({
                    title: 'Task Mate Evolution',
                    body: updatedTask.text || '(nota de voz)',
                    fireAt: r.fireAt,
                });

                scheduled.push({
                    id: `${r.fireAt}`,
                    fireAt: r.fireAt,
                    notificationId: notificationId ?? '',
                });
            } catch (e) {
                console.log('[handleSaveEdit] scheduleOneReminder error: ', e);
                scheduled.push({
                    id: `${r.fireAt}`,
                    fireAt: r.fireAt,
                    notificationId: '',
                });
            }
        }

        console.log('[handleSaveEdit] final scheduled reminders: ', scheduled);

        const updatedList = tasks.map((t) =>
            t.id === updatedTask.id ?
                {
                    ...updatedTask,
                    editedAt: Date.now(),
                    reminders: scheduled,
                } : t
        );

        setTasks(updatedList);
        await AsyncStorage.setItem('tasks', JSON.stringify(updatedList));
        setIsEditVisible(false);
        setSelectedTask(null);
    };

    const deleteTask = (id: string) => {
        const doDelete = () => {
            const deleted = tasks.find(task => task.id === id);

            if (deleted?.reminders?.length) {
                for (const r of deleted.reminders) {
                    if (r.notificationId) {
                        void cancelReminder(r.notificationId);
                    }
                }
            }
            if (deleted) {
                const deletedWithDate = {...deleted, deletedAt: Date.now()};
                setDeletedTasks(prev => [deletedWithDate, ...prev])
            }

            setTasks(prev => prev.filter(task => task.id !== id));
        }

        if (Platform.OS === 'web') {
            const ok = window.confirm('¿Estás seguro que deseas eliminar esta nota?');
            if (ok) doDelete();
            return;
        }

        Alert.alert(
            'Eliminar tarea',
            '¿Estás seguro que deseas eliminar esta nota?',
            [
                {text: 'Cancelar', style: 'cancel'},
                {text: 'Eliminar', style: 'destructive', onPress: doDelete},
            ],
            {cancelable: true}
        );
    };

    const handleRecoverTask = (taskId: string) => {
        const recovered = deletedTasks.find(task => task.id === taskId);
        if (recovered) {
            setTasks(prev => [recovered, ...prev]);
            setDeletedTasks(prev => prev.filter(task => task.id !== taskId));
        }
    }

    const renderItem = ({item, drag, isActive}: RenderItemParams<Task>) => (
        <TaskItem
            task={item}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onEdit={() => handleEdit(item)}
            drag={drag}
            isActive={isActive}
        />
    );

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' && webReminderVisible ? (
                <View style={styles.webBanner}>
                    <View style={{flex: 1}}>
                        <Text style={styles.webBannerTitle}>Recordatorio</Text>
                        <Text style={styles.webBannerText}>{webReminderText}</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => {
                            setWebReminderVisible(false);
                            setWebReminderText('');
                        }}
                        style={styles.webBannerClose}
                    >
                        <Text style={styles.webBannerCloseText}>OK</Text>
                    </TouchableOpacity>
                </View>
            ) : null}

            <View style={styles.inputContainer}>
                <TextInput
                    value={newTask}
                    onChangeText={setNewTask}
                    style={[styles.input, {height: Math.min(inputHeight, 120)}]}
                    placeholder='Agrega una nueva tarea!'
                    placeholderTextColor={colors.placeholder}
                    multiline
                    scrollEnabled={true}
                    textAlignVertical={'top'}
                    onContentSizeChange={(e) => {
                        const newHeight = e.nativeEvent.contentSize.height;
                        setInputHeight(Math.min(newHeight, 120))
                    }}
                    ref={inputRef}
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

            <View style={styles.colorContainer}>
                {['#FF6347', '#1E90FF', '#32CD32', '#FFD700', '#FF69B4'].map((color) => (
                    <View
                        key={color}
                        style={[
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
                            style={styles.colorPressArea}
                        />
                    </View>
                ))}
            </View>

            <View style={styles.listContainer}>
                <DraggableFlatList
                    data={tasks.filter(Boolean)}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    onDragEnd={({data}) => setTasks(data.filter(Boolean))}
                    activationDistance={1}
                    dragItemOverflow
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            Todavía no hay tareas cargadas, agrega una nueva tarea!
                        </Text>
                    }
                />
            </View>

            <View style={[styles.fixedButtonContainer, {marginBottom: insets.bottom + 10}]}>
                <Button
                    title='Ver notas eliminadas.'
                    onPress={() => {
                        navigation.navigate('DeletedTasks', {
                            onRecover: handleRecoverTask,
                        })
                    }}
                />
            </View>
            <RecordingModal
                visible={isRecordingVisible}
                onStop={stopRecording}
                onCancel={cancelRecording}
            />
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
            shadowOffset: {width: 0, height: 2},
        },
        webBanner: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            marginBottom: 10,
        },
        webBannerTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: colors.text,
        },
        webBannerText: {
            marginTop: 2,
            fontSize: 12,
            color: colors.text,
            opacity: 0.8,
        },
        webBannerClose: {
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
        },
        webBannerCloseText: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.text,
        },
    })

export default HomeScreen;