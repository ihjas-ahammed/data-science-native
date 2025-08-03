import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getDatabase, ref, get } from 'firebase/database';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import LearningCard from '../components/progress/LearningCard';
import TopicProgress from '../components/progress/TopicProgress';
import ProgressStats from '../components/progress/ProgressStats';
import EditDialog from '../components/progress/EditDialog';
import ImportExportDialog from '../components/progress/ImportExportDialog';
import RoutineModal from '../components/progress/RoutineModal';
import UploadSyllabusDialog from '../components/progress/UploadSyllabusDialog';

const checkNetworkStatus = async () => {
    try {
        const response = await fetch("https://8.8.8.8", {
            method: "HEAD",
            timeout: 5000
        });
        return response.status >= 200 && response.status < 300;
    } catch (error) {
        return false;
    }
};

const Progress = ({ firebaseApp, setPage }) => {
    // State declarations
    const [data, setData] = useState([]);
    const [store, setStore] = useState([]);
    const [activeBook, setActiveBook] = useState(null);
    const [activeTopic, setActiveTopic] = useState(null);
    const [editDialog, setEditDialog] = useState(false);
    const [importExportDialog, setImportExportDialog] = useState(false);
    const [routineModal, setRoutineModal] = useState(false);
    const [isUploadSyllabusModalVisible, setUploadSyllabusModalVisible] = useState(false);
    const [currentModule, setCurrentModule] = useState([]);
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const defaultData = [
        // Your default data structure here
    ];

    // Data loading functions
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

    const loadStore = async () => {
        try {
            const db = getDatabase(firebaseApp);
            const storeRef = ref(db, 'store');
            const snapshot = await get(storeRef);
            if (snapshot.exists()) {
                setStore(snapshot.val());
            }
        } catch (error) {
            console.error('Error loading store data:', error);
        }
    };

    // Initial data loading and network checking
    useEffect(() => {
        const initializeData = async () => {
            setIsLoading(true);
            await Promise.all([loadData()]);
            setIsLoading(false);
        };

        initializeData();

        const intervalId = setInterval(async () => {
            setIsOnline(await checkNetworkStatus());
            await Promise.all([loadStore()]);
        }, 5000);

        const netStat = async () => {
            setIsOnline(await checkNetworkStatus());
            await Promise.all([loadStore()]);
        }

        try{
            netStat()
        }catch(e){

        }

        return () => clearInterval(intervalId);
    }, []);

    // Data manipulation functions
    const saveData = async (newData) => {
        try {
            await SecureStore.setItemAsync('progressData', JSON.stringify(newData));
            setData(newData);
        } catch (error) {
            console.error('Error saving progress data:', error);
        }
    };

    const handleImportData = async (importedData) => {
        await saveData(importedData);
    };

    const handleLevelChange = async (bookName, topicName, subtopicName, newValue) => {
        const newData = data.map(book => {
            if (book.name === bookName) {
                return {
                    ...book,
                    topics: book.topics.map(topic => {
                        if (topic.name === topicName) {
                            return {
                                ...topic,
                                subtopics: topic.subtopics.map(subtopic => {
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

    // Progress calculation functions
    const getColorByPercentage = (percentage) => {
        if (percentage < 0 || percentage > 100) return '#94A3B8'; // Slate color for invalid values
        
        // Create a color scale that avoids the indigo/purple spectrum used in backgrounds
        if (percentage < 25) {
            // Low progress - red
            return '#7bed9f'; // Tailwind red-500
        } else if (percentage < 50) {
            // Some progress - yellow/amber
            return '#2ed573'; // Tailwind amber-500
        } else if (percentage < 75) {
            // Good progress - teal (avoiding pure green which might be hard to read)
            return '#1e90ff'; // Tailwind teal-500
        } else {
            // Excellent progress - cyan (avoiding blue/indigo used in the UI)
            return '#6c5ce7'; // Tailwind cyan-500
        }
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
        const stats = [{
            title: 'Overall Progress',
            value: Math.round(totalProgress),
            color: getColorByPercentage(Math.round(totalProgress)),
            description: 'Total learning progress',
        }];
        
        data.forEach(book => {
            const bookProgress = calculateProgress(book.topics.flatMap(t => t.subtopics));
            stats.push({
                title: book.name,
                value: parseInt(bookProgress),
                color: getColorByPercentage(parseInt(bookProgress)),
                description: '',
            });
        });
        return stats;
    };

    // Button handlers
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
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-800">
            <View className="h-[1px] bg-indigo-100 dark:bg-indigo-800" />
            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Header */}
                <View className="flex-row justify-end items-center mb-4">
                    <View className="flex-row space-x-3 gap-2">
                        <TouchableOpacity
                            onPress={() => setUploadSyllabusModalVisible(true)}
                            className="bg-indigo-600 dark:bg-indigo-700 p-2 rounded-lg"
                        >
                            <MaterialIcons name="upload-file" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleCloudButtonClick}
                            className="bg-indigo-600 dark:bg-indigo-700 p-2 rounded-lg"
                        >
                            <MaterialIcons name="cloud" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => isOnline ? setEditDialog(true) : alert('No network available')}
                            className="bg-indigo-600 dark:bg-indigo-700 p-2 rounded-lg"
                        >
                            <MaterialIcons name="edit" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Progress Stats */}
                <ProgressStats 
                    stats={calculateStats()} 
                    onAddTask={(index) => {
                        setCurrentModule(data[index]);
                        setRoutineModal(true);
                    }}
                />

                {/* Learning Cards */}
                <View className="space-y-4 mt-4">
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

            {/* Dialogs and Modals */}
            <EditDialog
                open={editDialog}
                courses={store}
                onClose={() => setEditDialog(false)}
                data={data}
                onSave={async (dt) => {
                    if (isOnline) await saveData(dt);
                    else alert('Cannot save changes offline');
                }}
            />

            <ImportExportDialog
                open={importExportDialog}
                onClose={() => setImportExportDialog(false)}
                firebaseApp={firebaseApp}
                onImportData={handleImportData}
            />

            <RoutineModal
                visible={routineModal}
                courseData={currentModule}
                onClose={() => {
                    setRoutineModal(false);
                }}
                onSave={() => {
                    setRoutineModal(false);
                    setPage("Routine");
                }}
            />

            <UploadSyllabusDialog
                visible={isUploadSyllabusModalVisible}
                onClose={() => setUploadSyllabusModalVisible(false)}
                firebaseApp={firebaseApp}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <View 
                    className="absolute inset-0 flex justify-center items-center"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                >
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            )}

            <Toast />
        </SafeAreaView>
    );
};

export default Progress;