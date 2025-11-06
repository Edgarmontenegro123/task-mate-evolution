import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {Task} from '../types/task';
import {useThemeColors} from '../hooks/useThemeColors';
import {Ionicons} from '@expo/vector-icons';
import {useAudioPlayer, useAudioPlayerStatus} from 'expo-audio';

type TaskItemProps = {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
    drag?: () => void;
    isActive?: boolean;
}

const AudioControl: React.FC<{
    uri: string;
    iconColor: string;
    playToken: number;
    onRequestRestart: () => void;
}> = ({ uri, iconColor, playToken, onRequestRestart }) => {
    const player = useAudioPlayer(uri, { downloadFirst: true });
    const status = useAudioPlayerStatus(player);

    useEffect(() => {
        if(playToken > 0) {
            player.play();
        }
    }, [playToken, player]);

    const handlePlayPause = () => {
        if (!uri || !player) return;
        if (status?.playing) {
            player.pause();
        } else {
            onRequestRestart();
        }
    };

    return (
        <TouchableOpacity onPress={handlePlayPause} style={{ marginLeft: 8 }}>
            <Ionicons
                name={status?.playing ? 'pause-circle' : 'play-circle'}
                size={26}
                color={iconColor}
            />
        </TouchableOpacity>
    );
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onEdit, drag, isActive}) => {
    const {colors} = useThemeColors();
    const [audioKey, setAudioKey] = useState(0);
    const [playToken, setPlayToken] = useState(0);

    useEffect(() => {
        setAudioKey((k) => k + 1);
    }, [task.audioUri, task.editedAt]);

    const requestRestart = () => {
        setAudioKey((k) => k + 1);
        setPlayToken((t) => t + 1);
    }

    if(!task) return null;

    return (
        <View style={[styles.view, {backgroundColor: colors.card}]}>
            <TouchableOpacity
                onLongPress={drag}
                delayLongPress={150}
                disabled={!drag}
                style = {[
                    styles.container,
                    {backgroundColor: isActive ? '#FAFAF9' : colors.card},
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
                    {task.text ? (
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
                    ) : (
                        <Text
                            style={[
                                styles.taskText,
                                {color: colors.placeholder, fontStyle: 'italic'},
                            ]}
                        >(nota de voz)</Text>
                    )}
                </View>
                {task.audioUri ? (
                    <AudioControl
                        key={`${task.audioUri}-${task.editedAt ?? 0}-${audioKey}`}
                        uri={task.audioUri}
                        iconColor={colors.text}
                        playToken={playToken}
                        onRequestRestart={requestRestart}
                    />
                ) : null}

                <TouchableOpacity onPress={() => onEdit(task)}>
                    <Ionicons
                        name='create-sharp'
                        size={28}
                        color='#8EC5FF'
                        style={{ marginLeft: 10 }}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onDelete(task.id)}>
                    <Ionicons
                        name='trash-outline'
                        size={28}
                        color='#E7180B'
                        style={{ marginLeft: 5 }}
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
