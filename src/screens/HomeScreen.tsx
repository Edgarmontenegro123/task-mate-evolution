import React, {useState} from 'react';
import {View, Text, TextInput, Button, FlatList, StyleSheet} from 'react-native';
import TaskItem from '../components/TaskItem';
import {Task} from '../types/task';
import {Alert} from 'react-native';

const HomeScreen: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [newTask, setNewTask] = useState('');
    const [selectedColor, setSelectedColor] = useState('#FF6347');


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
                        setTasks(prev => prev.filter(task => task.id !== id));
                    }
                }
            ],
            {cancelable: true}
        )
    }

    return(
        <View style = {styles.container}>
            <Text style={styles.title}>TaskMate 📋</Text>
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

            <FlatList
                data={tasks}
                keyExtractor={(item) => item.id}
                renderItem={({item}) => (
                    <TaskItem task = {item}
                              onToggle = {toggleTask}
                              onDelete = {deleteTask}
                    />
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>
                        Todavía no hay tareas cargadas, agrega una nueva tarea!
                    </Text>
                }
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