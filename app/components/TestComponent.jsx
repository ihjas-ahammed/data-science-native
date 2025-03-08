import React, { useState, useEffect } from 'react';
import { View, Text, TouchableHighlight, TextInput, Image, ActivityIndicator, Alert, Animated } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { LinearGradient } from 'expo-linear-gradient';

const TestComponent = ({ sampleQ, isDiceRolled = false }) => {
    // State declarations
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [evaluations, setEvaluations] = useState({});
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [apiKey, setApiKey] = useState(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [feedbackAnimation] = useState(new Animated.Value(1)); // Set to 1 by default so feedback is visible immediately

    // Load API key and previous evaluations on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load API key
                const storedApiKey = await SecureStore.getItemAsync('google-api');
                setApiKey(storedApiKey);
                
                // Load stored evaluations for each question
                const loadedEvaluations = {};
                
                // Only load evaluations if the component is shown after dice roll or always load them
                if (sampleQ) {
                    for (let sectionIndex = 0; sectionIndex < sampleQ.length; sectionIndex++) {
                        const section = sampleQ[sectionIndex];
                        for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex++) {
                            const question = section.questions[questionIndex];
                            const sanitizedKey = `eval-${sanitizeKey(question)}`;
                            
                            const storedEvaluation = await SecureStore.getItemAsync(sanitizedKey);
                            if (storedEvaluation) {
                                try {
                                    loadedEvaluations[`${sectionIndex}-${questionIndex}`] = JSON.parse(storedEvaluation);
                                } catch (e) {
                                    console.error('Error parsing stored evaluation:', e);
                                }
                            }
                        }
                    }
                    setEvaluations(loadedEvaluations);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };
        
        loadData();
    }, [sampleQ]); // Removed isDiceRolled dependency so evaluations load regardless

    // Helper function to sanitize question text for use as a SecureStore key
    const sanitizeKey = (text) => {
        // Limit length and remove special characters that might cause issues in key names
        return text.slice(0, 50)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .replace(/-+/g, '-')
            .toLowerCase();
    };

    // Function to pick an image from the library
    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
            alert('Permission to access camera roll is required!');
            return;
        }
        const pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });
        if (!pickerResult.canceled) {
            setSelectedImage(pickerResult.assets[0].uri);
        }
    };

    // Function to take a picture using the camera
    const takePicture = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
            alert('Permission to access camera is required!');
            return;
        }
        const pickerResult = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 1,
        });
        if (!pickerResult.canceled) {
            setSelectedImage(pickerResult.assets[0].uri);
        }
    };

    // Helper function to determine MIME type from file extension
    const getMimeType = (uri) => {
        const extension = uri.split('.').pop().toLowerCase();
        switch (extension) {
            case 'jpg':
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            case 'gif':
                return 'image/gif';
            default:
                return 'image/jpeg';
        }
    };

    // Function to save image to FileSystem and return a unique identifier
    const saveImage = async (uri) => {
        if (!uri) return null;
        
        try {
            // Create a unique filename based on timestamp
            const timestamp = new Date().getTime();
            const newFilename = `${timestamp}.jpg`;
            const newUri = `${FileSystem.documentDirectory}images/${newFilename}`;
            
            // Ensure the images directory exists
            const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}images`);
            if (!dirInfo.exists) {
                await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}images`, { intermediates: true });
            }
            
            // Copy the image file
            await FileSystem.copyAsync({
                from: uri,
                to: newUri
            });
            
            return newUri;
        } catch (error) {
            console.error('Error saving image:', error);
            return null;
        }
    };
    
    // Function to load a saved image
    const loadSavedImage = async (uri) => {
        if (!uri) return null;
        
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            if (fileInfo.exists) {
                return uri;
            }
            return null;
        } catch (error) {
            console.error('Error loading saved image:', error);
            return null;
        }
    };

    // Function to handle retry for a question
    const handleRetry = async (sectionIndex, questionIndex) => {
        try {
            // Set UI state to show the answer form
            setActiveQuestion({ sectionIndex, questionIndex });
            setPrompt('');
            setSelectedImage(null);
            setErrorMessage(null);
            setIsInputFocused(false);
            
            // Delete evaluation from state
            const key = `${sectionIndex}-${questionIndex}`;
            const newEvaluations = { ...evaluations };
            delete newEvaluations[key];
            setEvaluations(newEvaluations);
            
            // Delete evaluation from SecureStore
            const currentQuestion = sampleQ[sectionIndex].questions[questionIndex];
            const sanitizedKey = `eval-${sanitizeKey(currentQuestion)}`;
            await SecureStore.deleteItemAsync(sanitizedKey);
        } catch (error) {
            console.error('Error clearing evaluation data:', error);
            setErrorMessage('Failed to reset. Please try again.');
        }
    };

    // Animation for feedback reveal - no longer needed as we show it immediately
    const animateFeedback = () => {
        // Always set to 1 to ensure visibility
        feedbackAnimation.setValue(1);
    };

    // Function to submit the answer for evaluation
    const handleSend = async () => {
        if (!activeQuestion) return;
        
        // Check if API key exists
        if (!apiKey) {
            Alert.alert(
                "API Key Missing",
                "Please set your Google API key in tools section.",
                [{ text: "OK" }]
            );
            return;
        }
        
        const { sectionIndex, questionIndex } = activeQuestion;
        const currentQuestion = sampleQ[sectionIndex].questions[questionIndex];
        const maxMarks = sampleQ[sectionIndex].marks;

        if (!prompt.trim() && !selectedImage) {
            setErrorMessage('Please provide an answer with text or an image.');
            return;
        }

        try {
            setIsApiLoading(true);
            setErrorMessage(null);
            feedbackAnimation.setValue(1); // Always visible

            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: selectedImage ? 'gemini-1.5-pro' : 'gemini-2.0-flash-lite'
            });

            const fullPrompt = `Question: ${currentQuestion}\nMax Marks: ${maxMarks}\n\nUser's Answer: ${prompt}\n\nPlease evaluate the user's answer and provide a score out of ${maxMarks}. If an image is provided, consider it as part of the answer. {give only a raw json {with explanation and score as output}, explanation must be like a teacher explaining to a student. explanaton should be pain with no markdown or anything}`;

            let imagePart = null;
            let savedImageUri = null;
            
            if (selectedImage) {
                // Save the image first
                savedImageUri = await saveImage(selectedImage);
                
                const mimeType = getMimeType(selectedImage);
                const base64Data = await FileSystem.readAsStringAsync(selectedImage, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                imagePart = { inlineData: { mimeType, data: base64Data } };
            }

            const parts = [{ text: fullPrompt }];
            if (imagePart) parts.push(imagePart);

            const result = await model.generateContent({
                contents: [{ role: 'user', parts }],
            });

            const responseText = result.response.text();
            const processed = responseText.startsWith('```')
                ? responseText.substring(7, responseText.length - 3)
                : responseText;
            const dt = JSON.parse(processed);
            
            const newEvaluation = { 
                score: dt.score, 
                explanation: dt.explanation,
                userAnswer: prompt,
                timestamp: new Date().toISOString(),
                savedImageUri: savedImageUri // Save the image URI
            };
            
            // Update state
            setEvaluations(prev => ({ ...prev, [`${sectionIndex}-${questionIndex}`]: newEvaluation }));
            
            // Store in SecureStore for persistence
            const sanitizedKey = `eval-${sanitizeKey(currentQuestion)}`;
            await SecureStore.setItemAsync(sanitizedKey, JSON.stringify(newEvaluation));
            
            // No animation delay needed, show immediately
            animateFeedback();
            
        } catch (err) {
            setErrorMessage(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsApiLoading(false);
            setActiveQuestion(null);
            setPrompt('');
            setSelectedImage(null);
            setIsInputFocused(false);
        }
    };

    // Gamified progress bar component with dynamic circles based on max score
    const GameProgressBar = ({ score, maxScore }) => {
        // Calculate percentage for color determination
        const percentage = (score / maxScore) * 100;

        // Determine color based on score percentage
        const getProgressColor = () => {
            if (percentage < 40) return ['#FF4D4D', '#FF8C8C']; // Red gradient for low scores
            if (percentage < 70) return ['#FFD700', '#FFF06A']; // Gold gradient for medium scores
            return ['#32CD32', '#7AFF7A']; // Green gradient for high scores
        };

        // Create array of circles based on maxScore
        const circles = Array.from({ length: maxScore }, (_, i) => i + 1);

        return (
            <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                flexDirection: 'row',
                flexWrap: 'wrap',
                maxWidth: maxScore > 5 ? 100 : 80,
                justifyContent: 'flex-end',
                zIndex: 10,
                borderRadius: 12,
                padding: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
            }}>
                {circles.map((circle) => {
                    // Determine if this circle should be filled based on score
                    const isActive = circle <= score;
                    const colorGradient = getProgressColor();

                    return (
                        <View
                            key={circle}
                            style={{
                                height: 10,
                                width: 10,
                                borderRadius: 5,
                                margin: 2,
                                backgroundColor: isActive ? colorGradient[0] : 'rgba(255,255,255,0.3)',
                                shadowColor: isActive ? colorGradient[0] : 'transparent',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: isActive ? 0.7 : 0,
                                shadowRadius: isActive ? 2 : 0,
                                borderWidth: isActive ? 0 : 1,
                                borderColor: 'rgba(0,0,0,0.1)',
                            }}
                        />
                    );
                })}
            </View>
        );
    };
    
    // Format the date for display
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };
    
    // Render logic
    if (sampleQ.length === 0) {
        return (
            <View className="flex items-center justify-center p-4">
                <Text className="text-gray-500">No challenges available!</Text>
            </View>
        );
    }

    // Only show the component if isDiceRolled is true
    if (!isDiceRolled) {
        return (
            <View className="flex items-center justify-center p-4">
                <Text className="text-gray-500">Roll the dice to start challenges!</Text>
            </View>
        );
    }

    return (
        <View className="bg-indigo-50 dark:bg-gray-800 rounded-xl p-4 shadow-md">
            {sampleQ.map((section, sectionIndex) => (
                <View key={sectionIndex} className="mb-6">
                    <LinearGradient
                        colors={['#4f46e5', '#6366f1']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="flex-row items-center mb-3 p-3 rounded-lg shadow-sm"
                    >
                        <MaterialIcons name="school" size={24} color="#ffffff" />
                        <Text className="text-lg font-bold text-white ml-2">
                            {section.name}
                        </Text>
                    </LinearGradient>

                    {section.questions.map((question, questionIndex) => {
                        const key = `${sectionIndex}-${questionIndex}`;
                        const evaluation = evaluations[key];
                        return (
                            <View key={questionIndex} className="mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow-md border border-indigo-100 dark:border-indigo-800">
                                <Text className="text-gray-800 dark:text-gray-200 font-medium mb-3">{question}</Text>

                                {evaluation ? (
                                    <Animated.View 
                                        style={{ opacity: 1 }} // Always fully visible
                                        className="rounded-lg relative overflow-hidden"
                                    >
                                        <LinearGradient
                                            colors={['#f5f3ff', '#e0e7ff']}
                                            className="p-4 rounded-lg dark:opacity-90"
                                        >
                                            {/* Progress indicator positioned in top right */}
                                            <GameProgressBar score={evaluation.score} maxScore={section.marks} />
                                            
                                            {/* Score display */}
                                            <View className="items-center justify-center mb-3">
                                                <View className="bg-indigo-600 px-4 py-1 rounded-full">
                                                    <Text className="text-white font-bold">
                                                        Score: {evaluation.score}/{section.marks}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* User answer section with gamified UI */}
                                            <View className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-3 shadow-sm border border-indigo-100 dark:border-indigo-700">
                                                <View className="flex-row items-center mb-2">
                                                    <MaterialIcons name="question-answer" size={20} color="#6366f1" />
                                                    <Text className="text-indigo-700 dark:text-indigo-300 font-bold ml-2">Your Answer</Text>
                                                </View>
                                                
                                                <Text className="text-gray-700 dark:text-gray-300 mb-3">{evaluation.userAnswer}</Text>
                                                
                                                {/* Display saved image if available */}
                                                {evaluation.savedImageUri && (
                                                    <View className="mt-2 border border-indigo-200 dark:border-indigo-700 rounded-lg overflow-hidden">
                                                        <Image 
                                                            source={{ uri: evaluation.savedImageUri }} 
                                                            style={{ width: '100%', height: 150 }} 
                                                            className="rounded" 
                                                        />
                                                    </View>
                                                )}
                                            </View>
                                            
                                            {/* Feedback section with improved UI */}
                                            <View className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-indigo-100 dark:border-indigo-700">
                                                <View className="flex-row items-center mb-2">
                                                    <MaterialIcons name="psychology" size={20} color="#6366f1" />
                                                    <Text className="text-indigo-700 dark:text-indigo-300 font-bold ml-2">Teacher's Feedback</Text>
                                                </View>
                                                <Text className="text-gray-700 dark:text-gray-300">{evaluation.explanation}</Text>
                                            </View>
                                            
                                            {evaluation.timestamp && (
                                                <Text className="text-gray-500 dark:text-gray-400 text-xs text-center mt-3">
                                                    Answered on: {formatDate(evaluation.timestamp)}
                                                </Text>
                                            )}
                                            
                                            <TouchableHighlight
                                                onPress={() => handleRetry(sectionIndex, questionIndex)}
                                                underlayColor="#e0e7ff"
                                                className="bg-indigo-500 hover:bg-indigo-600 p-2 rounded-lg mt-3 w-1/3 self-end shadow"
                                            >
                                                <View className="flex-row items-center justify-center">
                                                    <MaterialIcons name="refresh" size={16} color="#ffffff" />
                                                    <Text className="text-white text-center font-medium ml-1">Retry</Text>
                                                </View>
                                            </TouchableHighlight>
                                        </LinearGradient>
                                    </Animated.View>
                                ) : activeQuestion && activeQuestion.sectionIndex === sectionIndex && activeQuestion.questionIndex === questionIndex ? (
                                    <View>
                                        <View className="flex relative">
                                            {/* Only show image and camera buttons when no image is selected AND input is not focused */}
                                            {!selectedImage && !isInputFocused && (
                                                <View className="flex-row w-fit mb-2 right-2 top-3 z-10 mr-1 absolute">
                                                    <TouchableHighlight
                                                        onPress={pickImage}
                                                        underlayColor="#e0e7ff"
                                                        className="rounded-full mr-2 p-1 bg-indigo-100 dark:bg-indigo-800"
                                                    >
                                                        <MaterialIcons name="image" size={20} color="#6366f1" />
                                                    </TouchableHighlight>
                                                    <TouchableHighlight
                                                        onPress={takePicture}
                                                        underlayColor="#e0e7ff"
                                                        className="rounded-full p-1 bg-indigo-100 dark:bg-indigo-800"
                                                    >
                                                        <MaterialIcons name="camera-alt" size={20} color="#6366f1" />
                                                    </TouchableHighlight>
                                                </View>
                                            )}
                                            <View className="w-full z-0">
                                                <TextInput
                                                    className="bg-indigo-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 p-3 rounded-lg mb-2 w-full z-0 border border-indigo-200 dark:border-indigo-700"
                                                    placeholder="Type your answer here..."
                                                    placeholderTextColor="#9ca3af"
                                                    value={prompt}
                                                    onChangeText={setPrompt}
                                                    onFocus={() => setIsInputFocused(true)}
                                                    onBlur={() => setIsInputFocused(false)}
                                                    multiline
                                                />
                                            </View>
                                        </View>

                                        {selectedImage && (
                                            <View className="mt-2 relative border border-indigo-200 dark:border-indigo-700 rounded-lg overflow-hidden shadow">
                                                <Image source={{ uri: selectedImage }} style={{ width: '100%', height: 150 }} className="rounded" />
                                                <TouchableHighlight
                                                    onPress={() => setSelectedImage(null)}
                                                    underlayColor="#e0e7ff"
                                                    className="rounded-full bg-indigo-100 dark:bg-indigo-700 absolute right-1 top-2 mr-1 p-1"
                                                >
                                                    <MaterialIcons name="delete" size={20} color="#6366f1" />
                                                </TouchableHighlight>
                                            </View>
                                        )}

                                        <TouchableHighlight
                                            onPress={handleSend}
                                            underlayColor="#818cf8"
                                            className={`bg-indigo-600 p-3 rounded-lg mt-3 shadow ${isApiLoading ? 'opacity-50' : ''}`}
                                            disabled={isApiLoading || (!prompt.trim() && !selectedImage)}
                                        >
                                            <Text className="text-white text-center font-medium">Submit Answer</Text>
                                        </TouchableHighlight>

                                        {isApiLoading && (
                                            <View className="flex items-center justify-center mt-4">
                                                <Text className="text-indigo-600 dark:text-indigo-400 mb-2">Evaluating...</Text>
                                                <ActivityIndicator size="large" color="#6366f1" />
                                            </View>
                                        )}

                                        {errorMessage && (
                                            <View className="bg-red-50 dark:bg-red-900 p-2 rounded-lg mt-2 border border-red-200 dark:border-red-700">
                                                <Text className="text-red-600 dark:text-red-300">{errorMessage}</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    <TouchableHighlight
                                        onPress={() => {
                                            setActiveQuestion({ sectionIndex, questionIndex });
                                            setPrompt('');
                                            setSelectedImage(null);
                                            setErrorMessage(null);
                                            setIsInputFocused(false);
                                        }}
                                        underlayColor="#e0e7ff"
                                        className="bg-indigo-500 hover:bg-indigo-600 p-3 rounded-lg shadow"
                                    >
                                        <Text className="text-white text-center font-medium">Answer</Text>
                                    </TouchableHighlight>
                                )}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

export default TestComponent;