import React, {useState} from 'react';
import {View, TextInput, Button, Text, TouchableOpacity} from 'react-native';
import {Task} from '../types/task';
import {colors} from '../constants/colors';

type TaskFormProps = {
    onAdd: (newTask: Task) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({onAdd}) => {
    const [text, setText] = useState('');
    const [selectedColor, setSelectedColor] = useState(colors[0]);
    const [error, setError] = useState('');

    const handleAdd = () => {
        if(text.trim() === '') {
            setError('Por favor ingresa un texto para la tarea.');
            return;
        }

        const newTask: Task = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            color: selectedColor,
            createdAt: Date.now(),
        };

        onAdd(newTask);
        setText('');
        setSelectedColor(colors[0]);
        setError('');
    };

    return(
        <View style = {{marginVertical: 12}}>
            <TextInput
                placeholder = 'Ingresa una nueva tarea!'
                value = {text}
                onChangeText={setText}
                style = {{
                    borderColor: '#ccc',
                    borderWidth: 1,
                    padding: 10,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: '#fff',
                }}
            />

            <View style = {{flexDirection: 'row', marginBottom: 8}}>
                {colors.map(color => (
                    <TouchableOpacity
                        key={color}
                        onPress={() => setSelectedColor(color)}
                        style = {{
                            backgroundColor: color,
                            width: 30,
                            height: 30,
                            borderRadius: 6,
                            marginRight: 8,
                            borderWidth: selectedColor === color ? 2 : 0,
                            borderColor: '#333',
                        }}
                    />
                ))}
            </View>

            {error ? (
                <Text style = {{color: 'red', marginBottom: 8}}>{error}</Text>
            ) : null}

            <Button title = 'Agregar Tarea'
                    onPress = {handleAdd}
                    color = '#007BFF'
            />
        </View>
    )
};