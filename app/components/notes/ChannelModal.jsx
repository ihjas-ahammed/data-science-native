import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChannelModal = ({ visible, onClose, channels, onSelectChannel, onDeleteChannel }) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Select Channel</Text>
          
          <TouchableOpacity
            style={styles.channelItem}
            onPress={() => onSelectChannel('default')}
          >
            <Text style={styles.channelName}>Default (Original)</Text>
          </TouchableOpacity>

          {channels.map(channel => (
            <View key={channel.id} style={styles.channelItem}>
              <TouchableOpacity
                onPress={() => onSelectChannel(channel.id)}
                style={styles.channelTouchable}
              >
                <Text style={styles.channelName}>{channel.name} ({channel.type})</Text>
              </TouchableOpacity>
              {channel.canDelete && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => onDeleteChannel(channel.id)}
                >
                  <Ionicons name="trash" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#1f2937',
  },
  channelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  channelTouchable: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    color: '#374151',
  },
  deleteButton: {
    padding: 8,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
});

export default ChannelModal;