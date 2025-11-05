import React, {useState, useEffect, useCallback, useLayoutEffect} from 'react';
import {View, Text, Button, StyleSheet, Alert, TouchableOpacity} from 'react-native';
import DraggableFlatList, {RenderItemParams} from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp, useRoute, useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {Task} from '../types/task';
import {RootStackParamList} from '../navigation/types';
import { useThemeColors } from '../hooks/useThemeColors';

type DeletedTasksRouteProp = RouteProp<RootStackParamList, 'DeletedTasks'>;

const DeletedTasksScreen: React.FC = () => {
    const route = useRoute<DeletedTasksRouteProp>();
    const navigation = useNavigation();
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
                if(initialDeletedTasks.length === 0) {
                    const savedDeleted = await AsyncStorage.getItem('deletedTasks');
                    if(savedDeleted) setDeletedTasks(JSON.parse(savedDeleted));
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
        if(!taskToRecover) return;

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
                        if(onRecover) {
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

    const renderItem = ({item, drag, isActive} : RenderItemParams<Task>) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onLongPress={drag}
            disabled={isActive}
            /*style={[styles.taskContainer, isActive && styles.activeItem]}*/
            style={[
                styles(colors).taskContainer,
                isActive && styles(colors).activeItem,
            ]}
        >
            <View style={styles(colors).textWrapper}>
                {/*<View style={styles.textWrapper}>*/}
                <Text
                    style={[styles(colors).taskText, { color: item.color }]}
                    /*style={[styles.taskText, { color: item.color }]}*/
                    numberOfLines={3}
                    ellipsizeMode="tail"
                >
                    {item.text}
                </Text>
            </View>
            <View style={styles(colors).buttonWrapper}>
            {/*<View style={styles.buttonWrapper}>*/}
                <Button title="Recuperar" onPress={() => handleRecoverPress(item.id)} />
            </View>
        </TouchableOpacity>
    )

    return (
        <View style={styles(colors).container}>
        {/*<View style={styles.container}>*/}
            <Text style={[styles(colors).title, {color: colors.text}]}>Historial de notas eliminadas</Text>
            {/*<Text style={styles.title}>Historial de notas eliminadas</Text>*/}
            <DraggableFlatList
                data={deletedTasks}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                onDragEnd={({data}) => {
                    setDeletedTasks(data);
                    persist(data);
                }}
                contentContainerStyle = {styles(colors).listContent}
                ListEmptyComponent={
                    <Text style={[styles(colors).emptyText, {color: colors.text}]}>No hay notas eliminadas.</Text>
                    /*<Text>No hay notas eliminadas.</Text>*/
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
    taskText: {
        fontSize: 16,
        flexShrink: 1,
    },
    buttonWrapper: {
        alignSelf: 'center',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 30,
    },
})

export default DeletedTasksScreen