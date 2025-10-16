import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Task} from '../types/task';
import {Ionicons} from '@expo/vector-icons';

type TaskItemProps = {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    drag?: () => void;
    isActive?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, drag, isActive}) => {
    return (
        <View style={styles.view}>
            <TouchableOpacity
                onLongPress={drag}
                disabled={!drag}
                style = {[
                    styles.container,
                    {backgroundColor: isActive ? '#e0e0e0' : '#fff'},
                ]}
                >
                <TouchableOpacity
                    onPress={() => onToggle(task.id)}
                    style={{ marginRight: 10 }}
                >
                    <Ionicons
                        name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                        size={26}
                        color={task.completed ? '#32CD32' : '#aaa'}
                    />
                </TouchableOpacity>

                <View style={{ flex: 1 }}>
                    <Text
                        style={[
                            styles.taskText,
                            {
                                textDecorationLine: task.completed ? 'line-through' : 'none',
                                color: task.color,
                            }
                        ]}
                    >
                        {task.text}
                    </Text>
                </View>

                <TouchableOpacity onPress={() => onDelete(task.id)}>
                    <Ionicons
                        name='trash-outline'
                        size={24}
                        color='#FF6347'
                    />
                </TouchableOpacity>
            </TouchableOpacity>
        </View>
    )
}

export default TaskItem;

const styles = StyleSheet.create({
    view: {
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
        width: '100%',
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
    },
    taskText: {
        fontSize: 16,
    }
});
