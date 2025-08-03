import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDatabase, ref, set } from 'firebase/database';
import Toast from 'react-native-toast-message';

import LoginModal from '../auth/LoginModal';

const UploadSyllabusDialog = ({ visible, onClose, firebaseApp }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [isLoginModalVisible, setLoginModalVisible] = useState(false);
    const [syllabusName, setSyllabusName] = useState('');
    const [syllabusContent, setSyllabusContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const checkUser = async () => {
            if (visible) {
                const userId = await SecureStore.getItemAsync('userId');
                const pin = await SecureStore.getItemAsync('pin');
                const userClass = await SecureStore.getItemAsync('userClass');
                if (userId && pin && userClass) {
                    setUserInfo({ userId, pin, userClass });
                } else {
                    setUserInfo(null);
                }
            }
        };
        checkUser();
    }, [visible]);

    const handleUpload = async () => {
        if (!userInfo) {
            setLoginModalVisible(true);
            return;
        }

        if (!syllabusName.trim() || !syllabusContent.trim()) {
            Alert.alert('Incomplete', 'Please provide a name and JSON content for the syllabus.');
            return;
        }

        let parsedContent;
        try {
            parsedContent = JSON.parse(syllabusContent);
            if (!Array.isArray(parsedContent)) throw new Error("JSON must be an array.");
        } catch (error) {
            Alert.alert('Invalid JSON', `The provided content is not valid JSON. ${error.message}`);
            return;
        }

        setIsLoading(true);
        try {
            const db = getDatabase(firebaseApp);
            const sanitizedSyllabusName = syllabusName.trim().replace(/[^a-zA-Z0-9-]/g, '_');
            const syllabusRef = ref(db, `syllabi/${userInfo.userId}/${sanitizedSyllabusName}`);

            const dataToUpload = {
                content: parsedContent,
                metadata: {
                    uploader: userInfo.userId,
                    class: userInfo.userClass,
                    timestamp: Date.now(),
                    originalName: syllabusName.trim(),
                },
            };

            await set(syllabusRef, dataToUpload);

            Toast.show({
                type: 'success',
                text1: 'Upload Successful',
                text2: `Syllabus '${syllabusName.trim()}' has been saved.`
            });
            onClose(); // Close the main dialog on success
        } catch (error) {
            console.error("Syllabus upload error:", error);
            Alert.alert('Upload Failed', 'Could not save the syllabus to the database. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const onLoginSuccess = (credentials) => {
        setUserInfo(credentials);
        setLoginModalVisible(false);
        // Automatically trigger upload after successful login
        // But need to ensure syllabus content is already entered.
        // Better to just let the user click "Upload" again.
        Toast.show({ type: 'success', text1: 'Logged In', text2: 'You can now upload your syllabus.' });
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Upload New Syllabus</Text>
                    {!userInfo ? (
                        <View style={styles.loginPrompt}>
                            <Text style={styles.loginPromptText}>You must be logged in to upload a syllabus.</Text>
                            <TouchableOpacity style={styles.loginButton} onPress={() => setLoginModalVisible(true)}>
                                <Text style={styles.loginButtonText}>Login / Register</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <ScrollView>
                            <Text style={styles.label}>Syllabus Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., S4 Data Science"
                                value={syllabusName}
                                onChangeText={setSyllabusName}
                            />
                            <Text style={styles.label}>Syllabus JSON Content</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder='[{"name":"Module 1", "topics":...}]'
                                value={syllabusContent}
                                onChangeText={setSyllabusContent}
                                multiline
                                numberOfLines={10}
                            />
                            {isLoading ? (
                                <ActivityIndicator size="large" color="#4F46E5" />
                            ) : (
                                <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
                                    <Text style={styles.uploadButtonText}>Upload to Firebase</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <LoginModal
                    visible={isLoginModalVisible}
                    onClose={() => setLoginModalVisible(false)}
                    onLoginSuccess={onLoginSuccess}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#1f2937',
    },
    loginPrompt: {
        alignItems: 'center',
        marginVertical: 20,
    },
    loginPromptText: {
        fontSize: 16,
        color: '#4b5563',
        textAlign: 'center',
        marginBottom: 16,
    },
    loginButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    loginButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#374151',
    },
    input: {
        borderColor: '#d1d5db',
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9fafb',
    },
    textArea: {
        textAlignVertical: 'top',
        height: 200,
    },
    uploadButton: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    uploadButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 12,
        padding: 10,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        color: '#6b7280',
    },
});

export default UploadSyllabusDialog;