import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Task} from '../types/task';
import {Ionicons} from '@expo/vector-icons';

type TaskItemProps = {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({task, onToggle, onDelete}) => {
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderRadius: 10,
            padding: 12,
            marginBottom: 10,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowOffset: {width: 0, height: 2},
            shadowRadius: 4,
            elevation: 3,
        }}>

            <TouchableOpacity
                onPress={() => onToggle(task.id)}
                style = {{marginRight: 10}}>
                <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={26}
                    color={task.completed ? '#32CD32' : '#aaa'}
                />
            </TouchableOpacity>

            <View style = {{flex: 1}}>
                <Text
                    style={{
                        fontSize: 16,
                        textDecorationLine: task.completed ? 'line-through' : 'none',
                        color: task.completed ? '#888' : '#000',
                    }}>
                    {task.text}
                </Text>
                <View style = {{
                    width: 30,
                    height: 6,
                    borderRadius: 4,
                    backgroundColor: task.color,
                    marginTop: 4,
                }}/>
            </View>
            <TouchableOpacity
                onPress={() => onDelete(task.id)}>
                <Ionicons
                    name= 'trash-outline'
                    size={24}
                    color='#FF6347' />
            </TouchableOpacity>
        </View>
    )
}
