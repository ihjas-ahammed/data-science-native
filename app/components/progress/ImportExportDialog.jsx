import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import Toast from 'react-native-toast-message';

import * as SecureStore from 'expo-secure-store'; // For offline storage

const ImportExportDialog = ({ open, onClose, firebaseApp, onImportData }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!userId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid user ID',
      });
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const progressRef = ref(db, `progress-${userId}`);
      const snapshot = await get(progressRef);

      if (snapshot.exists()) {
        const progressData = snapshot.val();
        onImportData(progressData);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Progress data imported successfully',
        });
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No progress data found for this user ID',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to import progress data',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!userId.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid user ID',
      });
      return;
    }

    setLoading(true);
    try {
      const storedData = await SecureStore.getItemAsync('progressData');
      if (storedData) {
        const db = getDatabase(firebaseApp);
        const progressRef = ref(db, `progress-${userId}`);
        await set(progressRef, JSON.parse(storedData));
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Progress data exported successfully',
        });
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No local progress data found to export',
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to export progress data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Import/Export Progress</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>User ID:</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="Enter user ID"
              placeholderTextColor="#aaa"
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.importButton, loading && styles.disabledButton]}
              onPress={handleImport}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Import</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.exportButton, loading && styles.disabledButton]}
              onPress={handleExport}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Export</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  button: {
    width: '48%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  importButton: {
    backgroundColor: '#3498db',
  },
  exportButton: {
    backgroundColor: '#2ecc71',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ecf0f1',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ImportExportDialog;