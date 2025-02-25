import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { getDatabase, ref, set, get } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

const ImportExportRoutineDialog = ({ isOpen, onClose, firebaseApp, username, onImportData }) => {
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

  const showStatus = (type, message) => {
    setStatusMessage({ type, message });
    setTimeout(() => {
      setStatusMessage({ type: '', message: '' });
    }, 3000);
  };

  const handleImport = async () => {
    if (!userId.trim()) {
      showStatus('error', 'Please enter a valid user ID');
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase(firebaseApp);
      const routineRef = ref(db, `routine-${userId}`);
      const snapshot = await get(routineRef);

      if (snapshot.exists()) {
        const routineData = snapshot.val();
        await SecureStore.setItemAsync(`routine-${username}`, JSON.stringify(routineData));
        onImportData(routineData);
        showStatus('success', 'Routine data imported successfully');
        setTimeout(() => onClose(), 2000);
      } else {
        showStatus('error', 'No routine data found for this user ID');
      }
    } catch (error) {
      console.error('Import error:', error);
      showStatus('error', 'Failed to import routine data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!userId.trim()) {
      showStatus('error', 'Please enter a valid user ID');
      return;
    }

    setLoading(true);
    try {
      const storedData = await SecureStore.getItemAsync(`routine-${username}`);
      if (storedData) {
        const db = getDatabase(firebaseApp);
        const routineRef = ref(db, `routine-${userId}`);
        await set(routineRef, JSON.parse(storedData));
        showStatus('success', 'Routine data exported successfully');
        setTimeout(() => onClose(), 2000);
      } else {
        showStatus('error', 'No local routine data found to export');
      }
    } catch (error) {
      console.error('Export error:', error);
      showStatus('error', 'Failed to export routine data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.headerRow}>
            <Text style={styles.modalTitle}>Sync Routine Data</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Ionicons name="close" size={24} color="#555" />
            </TouchableOpacity>
          </View>
          
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
          
          {statusMessage.message ? (
            <View style={[
              styles.statusContainer, 
              statusMessage.type === 'error' ? styles.errorStatus : styles.successStatus
            ]}>
              <Ionicons 
                name={statusMessage.type === 'error' ? 'alert-circle' : 'checkmark-circle'} 
                size={20} 
                color={statusMessage.type === 'error' ? '#fff' : '#fff'} 
              />
              <Text style={styles.statusText}>{statusMessage.message}</Text>
            </View>
          ) : null}
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.importButton, loading && styles.disabledButton]}
              onPress={handleImport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-download" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Import</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.exportButton, loading && styles.disabledButton]}
              onPress={handleExport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Export</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    padding: 4,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    marginBottom: 8,
    color: '#444',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorStatus: {
    backgroundColor: '#ff5252',
  },
  successStatus: {
    backgroundColor: '#4caf50',
  },
  statusText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    width: '48%',
    height: 45,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
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
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ImportExportRoutineDialog;