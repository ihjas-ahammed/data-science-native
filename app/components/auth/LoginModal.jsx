import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';

const LoginModal = ({ visible, onClose, onLoginSuccess }) => {
    const [userId, setUserId] = useState('');
    const [pin, setPin] = useState('');
    const [userClass, setUserClass] = useState('');

    useEffect(() => {
        const loadCredentials = async () => {
            if (visible) {
                const storedUserId = await SecureStore.getItemAsync('userId');
                const storedPin = await SecureStore.getItemAsync('pin');
                const storedClass = await SecureStore.getItemAsync('userClass');
                if (storedUserId) setUserId(storedUserId);
                if (storedPin) setPin(storedPin);
                if (storedClass) setUserClass(storedClass);
            }
        };
        loadCredentials();
    }, [visible]);

    const handleLogin = async () => {
        if (!userId.trim() || !pin.trim() || !userClass.trim()) {
            Alert.alert('Incomplete Information', 'Please fill in all fields: User ID, PIN, and Class.');
            return;
        }
        try {
            await SecureStore.setItemAsync('userId', userId.trim());
            await SecureStore.setItemAsync('pin', pin.trim());
            await SecureStore.setItemAsync('userClass', userClass.trim());
            if (onLoginSuccess) {
                onLoginSuccess({
                    userId: userId.trim(),
                    pin: pin.trim(),
                    userClass: userClass.trim()
                });
            }
            onClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to save your credentials. Please try again.');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <MaterialIcons name="person" size={24} color="#4F46E5" />
                        <Text style={styles.title}>User Information</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        This information is required to save and sync your contributions.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="User ID (e.g., your name)"
                        placeholderTextColor="#9ca3af"
                        value={userId}
                        onChangeText={setUserId}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="PIN (4-6 digits)"
                        placeholderTextColor="#9ca3af"
                        value={pin}
                        onChangeText={setPin}
                        keyboardType="number-pad"
                        secureTextEntry
                        maxLength={6}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Class (e.g., S4-DS)"
                        placeholderTextColor="#9ca3af"
                        value={userClass}
                        onChangeText={setUserClass}
                        autoCapitalize="characters"
                    />

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                            <Text style={styles.closeButtonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveButton} onPress={handleLogin}>
                            <Text style={styles.saveButtonText}>Save & Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
        marginLeft: 8,
    },
    subtitle: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 20,
    },
    input: {
        height: 50,
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginRight: 10,
    },
    closeButtonText: {
        color: '#4b5563',
        fontSize: 16,
        fontWeight: '500',
    },
    saveButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LoginModal;