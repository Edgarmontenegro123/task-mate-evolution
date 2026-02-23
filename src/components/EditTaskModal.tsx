import React, {useEffect, useState} from 'react';
import {
    Animated,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import {Task} from '../types/task';
import {useThemeColors} from '../hooks/useThemeColors';
import ScrollView = Animated.ScrollView;

type Props = {
    visible: boolean;
    task: Task | null;
    onSave: (updatedTask: Task) => void;
    onCancel: () => void;
}

const EditTaskModal: React.FC<Props> = ({visible, task, onSave, onCancel}) => {
    const {colors, theme} = useThemeColors();
    const [text, setText] = useState(task?.text || '');
    const [color, setColor] = useState(task?.color || '#ffffff');
    const [remindersEnabled, setRemindersEnabled] = useState<boolean>(
        !!task?.reminders?.length
    );

    const [remindersDraft, setRemindersDraft] = useState<number[]>(
        task?.reminders?.map((r) => r.fireAt) ?? []
    );

    useEffect(() => {
        if (!visible) return;

        if (task) {
            setText(task.text);
            setColor(task.color);

            const fireAts = task.reminders?.map((r) => r.fireAt) ?? [];
            setRemindersEnabled(fireAts.length > 0);
            setRemindersDraft(fireAts);
        } else {
            setText('');
            setColor('#ffffff');
            setRemindersEnabled(false);
            setRemindersDraft([]);
        }
    }, [task, visible]);

    const addPreset = (fireAt: number) => {
        setRemindersEnabled(true);
        setRemindersDraft((prev) => {
            return [...prev, fireAt].sort((a, b) => a - b);
        });
    };

    const removeReminder = (fireAt: number) => {
        setRemindersDraft((prev) => prev.filter((t) => t !== fireAt));
    }

    const handleSave = () => {
        if (!task) return;
        onSave({
            ...task,
            text,
            color,
            reminders: remindersEnabled
                ? remindersDraft.map((fireAt) => ({
                    id: `${fireAt}`,
                    fireAt,
                    notificationId: '',
                }))
                : [],
        });
    };

    const styles = createStyles(colors);

    return (
        <Modal
            animationType='fade'
            transparent
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={StyleSheet.absoluteFillObject}/>
                </TouchableWithoutFeedback>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={[styles.modalContainer, {borderColor: color}]}>
                        <Text style={[styles.title, {color: colors.text}]}>Editar Nota</Text>
                        <ScrollView
                            contentContainerStyle={styles.scrollContent}
                            keyboardShouldPersistTaps="handled"
                        >
                            <TextInput
                                style={[styles.input, {borderColor: color, color: colors.text}]}
                                multiline
                                value={text}
                                onChangeText={setText}
                                placeholder='Edita tu nota...'
                                placeholderTextColor={
                                    theme === 'dark' ? '#CCCCCC' : '#555555'
                                }
                            />
                            <View style={{marginTop: 12}}>
                                <View
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                    <Text style={{color: colors.text, fontSize: 16, fontWeight: '600'}}>
                                        Recordatorios
                                    </Text>
                                    <Switch
                                        value={remindersEnabled}
                                        onValueChange={(v) => {
                                            setRemindersEnabled(v);
                                            if (!v) setRemindersDraft([]);
                                        }}
                                        trackColor={{
                                            false: colors.border,
                                            true: color,
                                        }}
                                        thumbColor={remindersEnabled ? color : '#9c9c9c'}
                                    />
                                </View>
                                {remindersEnabled ? (
                                    <View style={{marginTop: 10}}>
                                        <View style={{flexDirection: 'row', gap: 8, flexWrap: 'wrap'}}>
                                            <TouchableOpacity
                                                onPress={() => addPreset(Date.now() + 60 * 1000)}
                                                style={{
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 10,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <Text style={{color: colors.text}}>+1 min</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={() => addPreset(Date.now() + 10 * 60 * 1000)}
                                                style={{
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 10,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <Text style={{color: colors.text}}>+ 10 min</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => addPreset(Date.now() + 60 * 60 * 1000)}
                                                style={{
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 10,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <Text style={{
                                                    color: colors.text,
                                                }}>+1 h</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={() => {
                                                    const d = new Date();
                                                    d.setDate(d.getDate() + 1);
                                                    d.setHours(9, 0, 0, 0);
                                                    addPreset(d.getTime());
                                                }}
                                                style={{
                                                    paddingVertical: 8,
                                                    paddingHorizontal: 10,
                                                    borderRadius: 8,
                                                    borderWidth: 1,
                                                    borderColor: colors.border,
                                                }}
                                            >
                                                <Text style={{color: colors.text}}>Mañana 09:00</Text>
                                            </TouchableOpacity>
                                        </View>
                                        {remindersDraft.length > 0 ? (
                                            <View style={{marginTop: 10}}>
                                                {remindersDraft.map((t) => (
                                                    <View
                                                        key={t}
                                                        style={{
                                                            flexDirection: 'row',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            marginTop: 6,
                                                        }}
                                                    >
                                                        <Text style={{color: colors.text}}>
                                                            {new Date(t).toLocaleString()}
                                                        </Text>
                                                        <TouchableOpacity onPress={() => removeReminder(t)}
                                                                          style={{padding: 6}}>
                                                            <Text style={{
                                                                color: '#E7180B',
                                                                fontWeight: '700'
                                                            }}>Eliminar</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                ))}
                                            </View>
                                        ) : (
                                            <Text style={{marginTop: 8, color: colors.placeholder}}>
                                                No hay recordatorios configurados.
                                            </Text>
                                        )}
                                    </View>
                                ) : null}
                            </View>
                        </ScrollView>
                        <View style={styles.colorRow}>
                            {['#FF6347', '#1E90FF', '#32CD32', '#FFD700', '#FF69B4'].map((color) => (
                                <TouchableOpacity
                                    key={color}
                                    style={[
                                        styles.colorOption,
                                        {backgroundColor: color},
                                    ]}
                                    onPress={() => setColor(color)}
                                />
                            ))}
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
                                <Text style={{color: colors.text}}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={Keyboard.dismiss} style={styles.cancelButton}>
                                <Text style={{color: colors.text}}>Ocultar teclado</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleSave}
                                              style={[styles.saveButton, {backgroundColor: color}]}>
                                <Text style={styles.saveText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

const createStyles = (colors: ReturnType<typeof useThemeColors>['colors']) =>
    StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: '#00000080',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContainer: {
            width: '90%',
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 20,
            borderWidth: 2,
        },
        title: {
            fontSize: 20,
            marginBottom: 10,
            textAlign: 'center',
        },
        input: {
            borderWidth: 1,
            borderRadius: 8,
            padding: 10,
            minHeight: 100,
            textAlignVertical: 'top',
            fontSize: 16,
        },
        colorRow: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginVertical: 15,
        },
        colorOption: {
            width: 32,
            height: 32,
            borderRadius: 16,
        },
        scrollContent: {
            paddingBottom: 20,
        },
        keyboardView: {
            width: '100%',
            alignItems: 'center',
        },
        hideKeyboardButton: {
            alignSelf: 'center',
            marginBottom: 10,
        },
        hideKeyboardText: {
            fontSize: 16,
            color: '#555',
        },
        buttonRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        cancelButton: {
            padding: 10,
        },
        saveButton: {
            padding: 10,
            borderRadius: 8,
        },
        saveText: {
            color: 'white',
            fontWeight: 'bold',
        },
    });

export default EditTaskModal