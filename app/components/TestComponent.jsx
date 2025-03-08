import React, { useState } from 'react';
import { View, Text, TouchableHighlight, TextInput, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleGenerativeAI } from '@google/generative-ai';

const TestComponent = ({ sampleQ }) => {
    // State declarations
    const [activeQuestion, setActiveQuestion] = useState(null);
    const [prompt, setPrompt] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [evaluations, setEvaluations] = useState({});
    const [isApiLoading, setIsApiLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

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

    // Function to submit the answer for evaluation
    const handleSend = async () => {
        if (!activeQuestion) return;
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

            const apiKey = 'AIzaSyAu9swfNci4KFg63TjnxoV9zCfwXz9wuuA'; // Note: Replace with your actual API key
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({
                model: selectedImage ? 'gemini-1.5-pro' : 'gemini-2.0-flash-lite'
            });

            const fullPrompt = `Question: ${currentQuestion}\nMax Marks: ${maxMarks}\n\nUser's Answer: ${prompt}\n\nPlease evaluate the user's answer and provide a score out of ${maxMarks}. If an image is provided, consider it as part of the answer. {give only a raw json {with explanation and score as output}, explanation must be like a teacher explaining to a student. explanaton should be pain with no markdown or anything}`;

            let imagePart = null;
            if (selectedImage) {
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
            const newEvaluation = { score: dt.score, explanation: dt.explanation };
            setEvaluations(prev => ({ ...prev, [`${sectionIndex}-${questionIndex}`]: newEvaluation }));
        } catch (err) {
            setErrorMessage(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsApiLoading(false);
            setActiveQuestion(null);
            setPrompt('');
            setSelectedImage(null);
        }
    };

    // Gamified progress bar component
    // Gamified progress bar component with dynamic circles based on max score
    const GameProgressBar = ({ score, maxScore }) => {
        // Calculate percentage for color determination
        const percentage = (score / maxScore) * 100;

        // Determine color based on score percentage
        const getProgressColor = () => {
            if (percentage < 40) return '#FF4D4D'; // Bright red for low scores
            if (percentage < 70) return '#FFD700'; // Gold for medium scores
            return '#32CD32'; // Lime green for high scores
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
                maxWidth: maxScore > 5 ? 100 : 80, // Wider container for more circles
                justifyContent: 'flex-end',
                zIndex: 10,
                borderRadius: 12,
                padding: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
            }}>
                {circles.map((circle) => {
                    // Determine if this circle should be filled based on score
                    const isActive = circle <= score;

                    return (
                        <View
                            key={circle}
                            style={{
                                height: 8,
                                width: 8,
                                borderRadius: 4,
                                margin: 2,
                                backgroundColor: isActive ? getProgressColor() : 'rgba(255,255,255,0.3)',
                                shadowColor: isActive ? getProgressColor() : 'transparent',
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: isActive ? 0.7 : 0,
                                shadowRadius: isActive ? 2 : 0,
                            }}
                        />
                    );
                })}
            </View>
        );
    };
    // Render logic
    if (sampleQ.length === 0) {
        return (
            <View className="flex items-center justify-center p-4">
                <Text className="text-gray-500">No challenges available!</Text>
            </View>
        );
    }

    return (
        <View className="bg-indigo-50 dark:bg-gray-800 rounded-xl p-4 shadow-md">

            {sampleQ.map((section, sectionIndex) => (
                <View key={sectionIndex} className="mb-6">
                    <View className="flex-row items-center mb-3 bg-indigo-100 dark:bg-indigo-900 p-2 rounded-lg">
                        <MaterialIcons name="stars" size={24} color="#6366f1" />
                        <Text className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 ml-2">
                            {section.name}
                        </Text>
                    </View>

                    {section.questions.map((question, questionIndex) => {
                        const key = `${sectionIndex}-${questionIndex}`;
                        const evaluation = evaluations[key];
                        return (
                            <View key={questionIndex} className="mb-4 p-4 bg-white dark:bg-gray-700 rounded-lg shadow border border-indigo-100 dark:border-indigo-800">
                                <Text className="text-gray-800 dark:text-gray-200 mb-3">{question}</Text>

                                {evaluation ? (
                                    <View className="bg-indigo-50 dark:bg-gray-600 p-3 rounded-lg relative">
                                        {/* Progress indicator positioned in top right */}
                                        <GameProgressBar score={evaluation.score} maxScore={section.marks} />

                                        {/* Add some extra padding to avoid text overlapping with indicator */}
                                        <View style={{ paddingTop: 20 }}>
                                            <Text className="text-gray-600 dark:text-gray-300 mt-1">{evaluation.explanation}</Text>
                                        </View>
                                    </View>
                                ) : activeQuestion && activeQuestion.sectionIndex === sectionIndex && activeQuestion.questionIndex === questionIndex ? (
                                    <View>
                                        <View className="flex relative">
                                            <View className="flex-row w-fit mb-2 right-2 top-3 z-10 mr-1 absolute">
                                                <TouchableHighlight
                                                    onPress={pickImage}
                                                    underlayColor="#e0e7ff"
                                                    className=" rounded-full mr-2"
                                                >
                                                    <MaterialIcons name="image" size={20} color="#6366f1" />
                                                </TouchableHighlight>
                                                <TouchableHighlight
                                                    onPress={takePicture}
                                                    underlayColor="#e0e7ff"
                                                    className=" rounded-full"
                                                >
                                                    <MaterialIcons name="camera-alt" size={20} color="#6366f1" />
                                                </TouchableHighlight>
                                            </View>
                                            <View className="w-full z-0">
                                                <TextInput
                                                    className="bg-indigo-50 dark:bg-gray-600 text-gray-800 dark:text-gray-200 p-3 rounded-lg mb-2 w-full z-0 border border-indigo-200 dark:border-indigo-700"
                                                    placeholder="Type your answer here..."
                                                    placeholderTextColor="#9ca3af"
                                                    value={prompt}
                                                    onChangeText={setPrompt}
                                                    multiline
                                                />
                                            </View>
                                        </View>

                                        {selectedImage && (
                                            <View className="mt-2 relative border border-indigo-200 dark:border-indigo-700 rounded-lg overflow-hidden">
                                                <Image source={{ uri: selectedImage }} style={{ width: '100%', height: 100 }} className="rounded" />
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
                                            className={`bg-indigo-600 p-3 rounded-lg mt-3 ${isApiLoading ? 'opacity-50' : ''}`}
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
                                        }}
                                        underlayColor="#e0e7ff"
                                        className="bg-indigo-500 hover:bg-indigo-600 p-3 rounded-lg"
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