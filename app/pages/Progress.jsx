import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import * as SecureStore from 'expo-secure-store'; // For offline storage
import { getDatabase, ref, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons'; // For icons
import Toast from 'react-native-toast-message'; // For toast notifications

import LearningCard from '../components/progress/LearningCard';
import TopicProgress from '../components/progress/TopicProgress';
import ProgressStats from '../components/progress/ProgressStats';
import EditDialog from '../components/progress/EditDialog';
import ImportExportDialog from '../components/progress/ImportExportDialog'; // New component
import RoutineModal from '../components/progress/RoutineModal';

const checkNetworkStatus = async () => {
    try {
        // Attempt a simple fetch to a reliable endpoint
        const response = await fetch("https://8.8.8.8", {
            method: "HEAD",
            timeout: 5000 // 5-second timeout
        });
        return response.status >= 200 && response.status < 300; // Success if status is 2xx
    } catch (error) {
        return false; // Offline or request failed
    }
};

const Progress = ({ firebaseApp,setPage }) => {
    const [data, setData] = useState([]);
    const [activeBook, setActiveBook] = useState(null);
    const [activeTopic, setActiveTopic] = useState(null);
    const [editDialog, setEditDialog] = useState(false);
    const [importExportDialog, setImportExportDialog] = useState(false); // New state for import/export dialog
    const [store, setStore] = useState([]);
    const [isOnline, setIsOnline] = useState(true); // Track network status
    const [routineModal, setRoutineModal] = useState(false);
    const [currentModule, setCurrentModule] = useState([]);

    const defaultData = [
            // ... (rest of defaultData remains the same as in your original code)
];

    // Load progress data from expo-secure-store
    const loadData = async () => {
        try {
            const storedData = await SecureStore.getItemAsync('progressData');
            if (storedData) {
                setData(JSON.parse(storedData));
            } else {
                await SecureStore.setItemAsync('progressData', JSON.stringify(defaultData));
                setData(defaultData);
            }
        } catch (error) {
            console.error('Error loading progress data:', error);
        }
    };

    // Load syllabus store from Firebase
    const loadStore = async () => {
        try {
            const db = getDatabase(firebaseApp);
            const storeRef = ref(db, 'store');
            const snapshot = await get(storeRef);
            if (snapshot.exists()) {
                setStore(snapshot.val());
            } else {
                console.log('No syllabus store found in Firebase');
            }
        } catch (error) {
            console.error('Error loading store data:', error);
        }
    };

    // Check network status
    useEffect(() => {
        // Initial check
        const loadInitialData = async () => {
            const onlineStatus = await checkNetworkStatus();
            setIsOnline(onlineStatus);
            loadData(); // Your existing function
            loadStore(); // Your existing function
        };
        loadInitialData();

        // Poll every 5 seconds to monitor status
        const intervalId = setInterval(async () => {
            const onlineStatus = await checkNetworkStatus();
            setIsOnline(onlineStatus);
        }, 5000);

        // Cleanup interval on unmount
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    // Save progress data to expo-secure-store
    const saveData = async (newData) => {
        try {
            await SecureStore.setItemAsync('progressData', JSON.stringify(newData));
            setData(newData);
        } catch (error) {
            console.error('Error saving progress data:', error);
        }
    };

    // Handle imported data
    const handleImportData = async (importedData) => {
        await saveData(importedData);
    };

    const handleLevelChange = async (bookName, topicName, subtopicName, newValue) => {
        const newData = data.map((book) => {
            if (book.name === bookName) {
                return {
                    ...book,
                    topics: book.topics.map((topic) => {
                        if (topic.name === topicName) {
                            return {
                                ...topic,
                                subtopics: topic.subtopics.map((subtopic) => {
                                    if (subtopic.name === subtopicName) {
                                        return { ...subtopic, level: newValue + 1 };
                                    }
                                    return subtopic;
                                }),
                            };
                        }
                        return topic;
                    }),
                };
            }
            return book;
        });
        await saveData(newData);
    };

    const getColorByPercentage = (percentage) => {
        if (percentage < 0 || percentage > 100) return '#777777';
        const hue = Math.floor((percentage / 100) * 300);
        const saturation = 80 + Math.floor(Math.random() * 20);
        const lightness = 60 + Math.floor(Math.random() * 10);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    };

    const calculateProgress = (items) => {
        if (!items || items.length === 0) return 0;
        const totalPossible = items.length * 6;
        const current = items.reduce((sum, item) => sum + (item.level - 1 || 0), 0);
        return (current / totalPossible) * 100;
    };

    const calculateStats = () => {
        const allTopics = data.flatMap(book => book.topics.flatMap(topic => topic.subtopics));
        const totalProgress = calculateProgress(allTopics);
        const rt = [
            {
                title: 'Overall Progress',
                value: Math.round(totalProgress),
                color: getColorByPercentage(Math.round(totalProgress)),
                description: 'Total learning progress',
            },
        ];
        data.forEach(book => {
            rt.push({
                title: book.name,
                value: parseInt(calculateProgress(book.topics.flatMap(t => t.subtopics))),
                color: getColorByPercentage(parseInt(calculateProgress(book.topics.flatMap(t => t.subtopics)))),
                description: '',
            });
        });
        return rt;
    };

    // Handler for cloud button click
    const handleCloudButtonClick = () => {
        if (!isOnline) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'No network available for import/export',
            });
            return;
        }
        setImportExportDialog(true);
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Header with Buttons */}
                <View className="flex-row items-center justify-end space-x-3 mr-2">
                    {/* Cloud Button for Import/Export */}
                    <TouchableOpacity
                        onPress={handleCloudButtonClick}
                        className="bg-black p-2 rounded-lg mr-2"
                    >
                        <Ionicons name="cloud" size={24} color="white" />
                    </TouchableOpacity>
                    
                    {/* Edit Button */}
                    <TouchableOpacity
                        onPress={() => isOnline ? setEditDialog(true) : alert('No network available')}
                        className="bg-black/10 p-2 rounded-lg"
                        style={{ backgroundColor: '#222', backdropFilter: 'blur(5px)' }}
                    >
                        <Ionicons name="pencil" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Progress Stats */}
                <ProgressStats stats={calculateStats()} onAddTask={(index)=>{
                    setCurrentModule(data[index])
                    setRoutineModal(true)
                }}/>

                {/* Learning Cards */}
                <View className="space-y-4">
                    {data.map(book => (
                        <View key={book.name}>
                            <LearningCard
                                title={book.name}
                                progress={calculateProgress(book.topics.flatMap(t => t.subtopics))}
                                onClick={() => setActiveBook(activeBook === book.name ? null : book.name)}
                                isActive={activeBook === book.name}
                            />
                            {activeBook === book.name && (
                                <View className="ml-8 mt-4 space-y-4">
                                    {book.topics.map(topic => (
                                        <View key={topic.name}>
                                            <LearningCard
                                                title={topic.name}
                                                progress={calculateProgress(topic.subtopics)}
                                                onClick={() => setActiveTopic(activeTopic === topic.name ? null : topic.name)}
                                                isActive={activeTopic === topic.name}
                                            />
                                            {activeTopic === topic.name && (
                                                <View className="ml-8 mt-4 space-y-3">
                                                    {topic.subtopics.map(subtopic => (
                                                        <TopicProgress
                                                            key={subtopic.name}
                                                            topic={subtopic}
                                                            onLevelChange={(newValue) =>
                                                                handleLevelChange(book.name, topic.name, subtopic.name, newValue)
                                                            }
                                                        />
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* Edit Dialog */}
            <EditDialog
                open={editDialog}
                courses={store}
                onClose={() => setEditDialog(false)}
                data={data}
                onSave={async (dt) => {
                    if (isOnline) {
                        await saveData(dt);
                    } else {
                        alert('Cannot save changes offline');
                    }
                }}
            />

            {/* Import/Export Dialog */}
            <ImportExportDialog
                open={importExportDialog}
                onClose={() => setImportExportDialog(false)}
                firebaseApp={firebaseApp}
                onImportData={handleImportData}
            />
            <RoutineModal
                visible={routineModal}
                courseData={currentModule}
                onClose={()=>{
                    setRoutineModal(false)
                    setPage("Routine")
                }}
            />

            {/* Toast Component for Notifications */}
            <Toast />
        </View>
    );
};

export default Progress;