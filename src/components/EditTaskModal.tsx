import React, {useState, useEffect} from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    TouchableWithoutFeedback,
    Keyboard, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import {Task} from '../types/task';
import ScrollView = Animated.ScrollView;

type Props = {
    visible: boolean;
    task: Task | null;
    onSave: (updatedTask: Task) => void;
    onCancel: () => void;
}

const EditTaskModal: React.FC<Props> = ({visible, task, onSave, onCancel}) => {
    const [text, setText] = useState(task?.text || '');
    const [color, setColor] = useState(task?.color || '#ffffff');

    useEffect(() => {
        if(task) {
            setText(task.text);
            setColor(task.color);
        }
    }, [task]);

    const handleSave = () => {
        if(!task) return;
        onSave({ ...task, text, color})
    }

    return (
        <Modal
            animationType='slide'
            transparent
            visible={visible}
            onRequestClose={onCancel}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <View style={[styles.modalContainer, {borderColor: color}]}>
                            <Text style={styles.title}>Editar Nota</Text>
                            <ScrollView
                                contentContainerStyle={styles.scrollContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                <TextInput
                                    style={[styles.input, {borderColor: color}]}
                                    multiline
                                    value={text}
                                    onChangeText={setText}
                                    placeholder='Edita tu nota...'
                            />
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
                                    <Text>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={Keyboard.dismiss} style={styles.cancelButton}>
                                    <Text>Ocultar teclado</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSave} style={[styles.saveButton, {backgroundColor: color}]}>
                                    <Text style={styles.saveText}>Guardar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        borderWidth: 2,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
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