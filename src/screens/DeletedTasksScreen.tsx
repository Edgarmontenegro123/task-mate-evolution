import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {Task} from '../types/task';
import {RootStackParamList} from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';
import {NativeStackNavigationProp} from "@react-navigation/native-stack";

type DeletedTasksRouteProp = RouteProp<RootStackParamList, 'DeletedTasks'>;

const DeletedTasksScreen: React.FC = () => {
    const route = useRoute<DeletedTasksRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const initialDeletedTasks = route.params?.deletedTasks || [];
    const onRecover = route.params?.onRecover;
    const [deletedTasks, setDeletedTasks] = useState<Task[]>(initialDeletedTasks);

    const {theme, toggleTheme, colors} = useThemeColors();

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

    useEffect(() => {
        const loadDeletedFromStorage = async () => {
            try {
                if (initialDeletedTasks.length === 0) {
                    const savedDeleted = await AsyncStorage.getItem('deletedTasks');
                    if (savedDeleted) {
                        const parsed = JSON.parse(savedDeleted);
                        const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
                        const now = Date.now();
                        const filtered = parsed.filter(
                            (t: Task) => !t.deletedAt || now - t.deletedAt < THIRTY_DAYS
                        );
                        setDeletedTasks(filtered);
                        await AsyncStorage.setItem('deletedTasks', JSON.stringify(filtered));
                    }
                } else {
                    setDeletedTasks(initialDeletedTasks);
                }
            } catch (error) {
                console.error('Error al cargar notas eliminadas: ', error);
            }
        }
        loadDeletedFromStorage();
    }, [initialDeletedTasks]);

    const persist = useCallback(async (data: Task[]) => {
        try {
            await AsyncStorage.setItem('deletedTasks', JSON.stringify(data));
        } catch (error) {
            console.error('Error al cargar notas eliminadas: ', error);
        }
    }, []);

    const handleRecoverPress = async (id: string) => {
        const taskToRecover = deletedTasks.find((t) => t.id === id);
        if (!taskToRecover) return;

        Alert.alert(
            'Recuperar nota',
            `Deseas recuperar la nota "${taskToRecover.text}"?`,
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Recuperar',
                    onPress: async () => {
                        if (onRecover) {
                            onRecover(id);
                        }
                        const updatedDeleted = deletedTasks.filter(t => t.id !== id);
                        setDeletedTasks(updatedDeleted);
                        await persist(updatedDeleted);

                        try {
                            await AsyncStorage.setItem('deletedTasks', JSON.stringify(updatedDeleted));
                        } catch (error) {
                            console.error('Error al guardar deletedTasks: ', error);
                        }
                    }
                }
            ],
            {cancelable: true}
        )
    }

    const handlePermanentDelete = async (id: string) => {
        const taskToDelete = deletedTasks.find((t) => t.id === id);
        if (!taskToDelete) return;

        Alert.alert(
            'Eliminar definitivamente',
            `Esta acción no se puede deshacer.\n\n¿Eliminar la nota "${taskToDelete.text}"?`,
            [
                {text: 'Cancelar', style: 'cancel'},
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const updated = deletedTasks.filter(t => t.id !== id);
                        setDeletedTasks(updated);
                        await persist(updated);
                    }
                }
            ],
            {cancelable: true}
        )
    }

    const renderItem = ({item, drag, isActive}: RenderItemParams<Task>) => {
        const now = Date.now();
        const deletedAt = item.deletedAt || now;
        const msElapsed = now - deletedAt;
        const daysLeft = Math.max(0, 30 - Math.floor(msElapsed / (1000 * 60 * 60 * 24)));

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onLongPress={drag}
                disabled={isActive}
                style={[
                    styles(colors).taskContainer,
                    isActive && styles(colors).activeItem,
                ]}
            >
                <View style={styles(colors).textWrapper}>
                    <Text
                        style={[styles(colors).taskText, {color: item.color}]}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                    >
                        {item.text}
                    </Text>
                    <Text
                        style={[styles(colors).expireText, {color: colors.text}]}>
                        Se eliminará en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                    </Text>
                </View>
                <View style={styles(colors).divider} />
                <View style={styles(colors).actionsRow}>
                    <TouchableOpacity
                        style={[styles(colors).outlineBtn, { borderColor: item.color }]}
                        onPress={() => handleRecoverPress(item.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles(colors).outlineText, { color: item.color }]}>Recuperar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles(colors).dangerBtn}
                        onPress={() => handlePermanentDelete(item.id)}
                        activeOpacity={0.8}
                    >
                        <Text style={styles(colors).dangerText}>Eliminar</Text>
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
                    persist(data);
                }}
                contentContainerStyle={styles(colors).listContent}
                ListEmptyComponent={
                    <Text style={[styles(colors).emptyText, {color: colors.text}]}>
                        No hay notas eliminadas.
                    </Text>
                }
                showsVerticalScrollIndicator={true}
            />
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
        backgroundColor: '#E5484D', // rojo accesible
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
})

export default DeletedTasksScreen