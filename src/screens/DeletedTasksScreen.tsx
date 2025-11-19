import React, {useState, useCallback, useLayoutEffect} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity, Modal} from 'react-native';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp, useRoute, useNavigation, useFocusEffect} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {Task} from '../types/task';
import {RootStackParamList} from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

type DeletedTasksRouteProp = RouteProp<RootStackParamList, 'DeletedTasks'>;

const AudioControl: React.FC<{ uri: string; color: string }> = ({ uri, color }) => {
    const player = useAudioPlayer(uri, { downloadFirst: true });
    const status = useAudioPlayerStatus(player);

    const handlePlayPause = () => {
        if (!uri || !player) return;
        if (status?.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    return (
        <TouchableOpacity onPress={handlePlayPause} style={{ marginLeft: 8 }}>
            <Ionicons
                name={status?.playing ? 'pause-circle' : 'play-circle'}
                size={26}
                color={color}
            />
        </TouchableOpacity>
    );
};

const DeletedTasksScreen: React.FC = () => {
    const route = useRoute<DeletedTasksRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const onRecover = route.params?.onRecover;
    const {theme, toggleTheme, colors} = useThemeColors();
    const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);

    const loadDeletedTasks = useCallback(async () => {
        try {
            const savedDeleted = await AsyncStorage.getItem('deletedTasks');
            if(savedDeleted) {
                const parsed = JSON.parse(savedDeleted);
                const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
                const now = Date.now();
                const filtered = parsed.filter(
                    (t: Task) => !t.deletedAt || now - t.deletedAt < THIRTY_DAYS
                );
                setDeletedTasks(filtered);
                await AsyncStorage.setItem('deletedTasks', JSON.stringify(filtered));
            }
            else {
            setDeletedTasks([]);
            }
        } catch (error) {
            console.error('Error al cargar notas eliminadas: ', error);
        }
    }, []);

    const persist = useCallback(async (data: Task[]) => {
        try {
            await AsyncStorage.setItem('deletedTasks', JSON.stringify(data));
            setDeletedTasks(data);
        } catch (error) {
            console.error('Error al guardar notas eliminadas: ', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            void loadDeletedTasks();
        }, [loadDeletedTasks])
    );

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
            headerStyle: {backgroundColor: colors.headerBg},
            headerTitleStyle: {color: colors.headerText},
            headerTintColor: colors.headerText,
        });
    }, [navigation, theme, colors, toggleTheme]);

    const handleRecoverPress = useCallback(
        async (id: string) => {
            const taskToRecover = deletedTasks.find((t) => t.id === id);
            if (!taskToRecover) return;

            Alert.alert(
                'Recuperar nota',
                `Deseas recuperar la nota "${taskToRecover.text}"?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Recuperar',
                        onPress: async () => {
                            if (onRecover) onRecover(id);
                            const updated = deletedTasks.filter((t) => t.id !== id);
                            await persist(updated);
                            await loadDeletedTasks();
                        },
                    },
                ],
                { cancelable: true }
            );
        },
        [deletedTasks, persist, onRecover, loadDeletedTasks]
    );

    const handlePermanentDelete = useCallback(
        async (id: string) => {
            const taskToDelete = deletedTasks.find((t) => t.id === id);
            if (!taskToDelete) return;

            Alert.alert(
                'Eliminar definitivamente',
                `Esta acción no se puede deshacer.\n¿Eliminar la nota "${taskToDelete.text}"?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: async () => {
                            const updated = deletedTasks.filter((t) => t.id !== id);
                            await persist(updated);
                            await loadDeletedTasks();
                        },
                    },
                ],
                { cancelable: true }
            );
        },
        [deletedTasks, persist, loadDeletedTasks]
    );

    const renderItem = ({item, drag, isActive}: RenderItemParams<Task>) => {
        const now = Date.now();
        const deletedAt = item.deletedAt || now;
        const msElapsed = now - deletedAt;
        const daysLeft = Math.max(0, 30 - Math.floor(msElapsed / (1000 * 60 * 60 * 24)));

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={drag}
                onPress={() => {
                    setSelectedTask(item);
                    setIsPreviewVisible(true)
                }}
                disabled={isActive}
                style={[
                    styles(colors).taskContainer,
                    isActive && styles(colors).activeItem,
                ]}
            >
                <View style={styles(colors).leftContent}>
                    <Text
                        style={[styles(colors).taskText, {color: item.color}]}
                        numberOfLines={3}
                        ellipsizeMode='tail'
                    >
                        {item.text}
                    </Text>
                    <Text
                        style={[styles(colors).expireText, {color: colors.text}]}>
                        Se eliminará en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                    </Text>
                </View>
                <View style={styles(colors).divider} />
                <View style={styles(colors).rightContent}>
                    {item.audioUri ? (
                        <AudioControl uri={item.audioUri} color={colors.text} />
                    ) : null}
                    <TouchableOpacity
                        onPress={() => handleRecoverPress(item.id)}
                    >
                        <Ionicons
                            name='arrow-undo-sharp'
                            size={28}
                            color='#4BAC00'
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handlePermanentDelete(item.id)}
                    >
                        <Ionicons
                            name='close-circle-sharp'
                            size={28}
                            color='#E7180B'
                        />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }

    return (
        <View style={styles(colors).container}>
            <Text style={[styles(colors).title, {color: colors.text}]}>
                Historial de notas eliminadas
            </Text>
            <DraggableFlatList
                data={deletedTasks}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({data}) => {
                    setDeletedTasks(data);
                    void persist(data);
                }}
                contentContainerStyle={styles(colors).listContent}
                ListEmptyComponent={
                    <Text style={[styles(colors).emptyText, {color: colors.text}]}>
                        No hay notas eliminadas.
                    </Text>
                }
                showsVerticalScrollIndicator={true}
            />
            <Modal
                visible={isPreviewVisible}
                transparent
                animationType='slide'
                onRequestClose={() => setIsPreviewVisible(false)}
            >
                <View style={styles(colors).overlay}>
                    <View style={styles(colors).modalContainer}>
                        <Text style={[styles(colors).title, {color: colors.text}]}>
                            Nota Eliminada
                        </Text>
                        <Text style={[styles(colors).modalText, {color: colors.text}]}>
                            {selectedTask?.text}
                        </Text>
                        <View style={styles(colors).modalButtons}>
                            <TouchableOpacity
                                style={[styles(colors).outlineBtn, {borderColor: selectedTask?.color}]}
                                onPress={() => {
                                    if(selectedTask) void handleRecoverPress(selectedTask.id);
                                    setIsPreviewVisible(false);
                                }}
                                >
                                <Text style={[styles(colors).outlineText, {color: selectedTask?.color}]}>Recuperar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles(colors).dangerBtn}
                                onPress={() => {
                                    if(selectedTask) void handlePermanentDelete(selectedTask.id);
                                    setIsPreviewVisible(false);
                                }}
                                >
                                <Text style={[styles(colors).dangerText]}>Eliminar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles(colors).cancelBtn]}
                                onPress={() => setIsPreviewVisible(false)}
                                >
                                <Text style={styles(colors).cancelText}>Cerrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = (colors: ReturnType<typeof useThemeColors>['colors']) =>
    StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    leftContent: {
        flex: 1,
        paddingRight: 10,
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        opacity: 0.2,
        marginVertical: 6,
    },
    listContent: {
      paddingBottom: 100,
    },
    taskContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 10,
        padding: 8,
        backgroundColor: colors.card,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    activeItem: {
        opacity: 0.85,
        transform: [{scale: 0.99}],
    },
    textWrapper: {
      flex: 1,
      paddingRight: 8,
    },
    expireText: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 4,
    },
    taskText: {
        fontSize: 16,
        flexShrink: 1,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    buttonWrapper: {
        alignSelf: 'center',
    },
    outlineBtn: {
        width: 110,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        backgroundColor: 'transparent',
    },
    outlineText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dangerBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: '#E5484D',
    },
    dangerText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'justify',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    cancelBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: colors.border,
    },
    cancelText: {
        color: colors.text,
        fontWeight: '600',
    },
})

export default DeletedTasksScreen