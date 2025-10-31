import React, {useState, useEffect} from 'react';
import {View, Text, Button, FlatList, StyleSheet, Alert} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RouteProp, useRoute} from '@react-navigation/native';
import {Task} from '../types/task';

type RootStackParamList = {
    DeletedTasks: {
        deletedTasks?: Task[];
        onRecover?: (id: string) => void;
    }
}

type DeletedTasksRouteProp = RouteProp<RootStackParamList, 'DeletedTasks'>

const DeletedTasksScreen: React.FC = () => {
    const route = useRoute<DeletedTasksRouteProp>();
    const initialDeletedTasks = route.params?.deletedTasks || [];
    const onRecover = route.params?.onRecover;
    /*const {deletedTasks: initialDeletedTasks, onRecover} = route.params;*/
    /*const {deletedTasks, onRecover} = route.params;*/
    const [deletedTasks, setDeletedTasks] = useState<Task[]>(initialDeletedTasks);

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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Historial de notas eliminadas</Text>
            <FlatList
                data={deletedTasks}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <View style = {styles.taskContainer}>
                        <Text style={[styles.taskText, {color: item.color}]}>{item.text}</Text>
                        <Button title='Recuperar'
                                onPress={() => handleRecoverPress(item.id)} />
                    </View>
                )}
                ListEmptyComponent={<Text>No hay notas eliminadas.</Text>}
                />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    taskContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
        padding: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    taskText: {
        fontSize: 16,
    }
})

export default DeletedTasksScreen