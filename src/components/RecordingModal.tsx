import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../hooks/useThemeColors';

type Props = {
    visible: boolean;
    onStop: () => void;
    onCancel: () => void;
};

const format = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60)
        .toString()
        .padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
};

const RecordingModal: React.FC<Props> = ({ visible, onStop, onCancel }) => {
    const { colors } = useThemeColors();
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!visible) return;
        setSeconds(0);
        const id = setInterval(() => setSeconds((t) => t + 1), 1000);
        return () => clearInterval(id);
    }, [visible]);

    return (
        <Modal visible={visible} transparent animationType='fade'>
            <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.title, { color: colors.text }]}>Grabando nota…</Text>
                    <Text style={[styles.timer, { color: colors.text }]}>{format(seconds)}</Text>

                    <View style={styles.row}>
                        <TouchableOpacity onPress={onCancel} style={styles.btn}>
                            <Ionicons name='close-circle' size={56} color='#f04444' />
                            <Text style={styles.btnLabel}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onStop} style={styles.btn}>
                            <Ionicons name='stop-circle' size={56} color='#1E90FF' />
                            <Text style={styles.btnLabel}>Detener</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.helper, { color: colors.text }]}>
                        Tu voz se está grabando. Podés cancelar o detener para guardar.
                    </Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
    },
    card: {
        width: '84%',
        borderRadius: 16,
        paddingVertical: 22,
        paddingHorizontal: 18,
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        alignItems: 'center',
    },
    title: {
        fontSize: 20, fontWeight: '700', marginBottom: 6,
    },
    timer: {
        fontSize: 26, fontWeight: '700', marginBottom: 16,
    },
    row: {
        flexDirection: 'row', gap: 28, marginBottom: 8,
    },
    btn: {
        alignItems: 'center',
    },
    btnLabel: {
        marginTop: 6, fontSize: 14, color: '#666',
    },
    helper: {
        marginTop: 6, fontSize: 12, opacity: 0.8, textAlign: 'center',
    },
});

export default RecordingModal;
