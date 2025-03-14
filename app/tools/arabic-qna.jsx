import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReaderSelector from './components/ReaderSelector'

const ArabicQnA = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [gameData, setGameData] = useState(null)
    const [processStatus, setProcessStatus] = useState('Initializing...')
    const [processingProgress, setProcessingProgress] = useState(0)
    const [forceRegenerate, setForceRegenerate] = useState(false)

    // Game state variables
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [totalAttempts, setTotalAttempts] = useState(0)
    const [points, setPoints] = useState(0)
    const [showResults, setShowResults] = useState(false)
    const [isComplete, setIsComplete] = useState(false)

    const { subject, index, subInt, lesson } = JSON.parse(exp)
    const dataUrl = lesson.data

    // Fetch and process data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setProcessStatus('Checking cached data...')
                const storageKey = `arabic-qna-${subInt}-${index}`
                let storedData = await SecureStore.getItemAsync(storageKey)
                console.log(storedData)

                if (storedData && !forceRegenerate) {
                    console.log('Using stored game data')
                    setProcessStatus('Using cached data...')
                    setProcessingProgress(0.9)
                    setGameData(JSON.parse(storedData))
                    setLoading(false)
                    return
                }

                setProcessStatus('Downloading Arabic text...')
                setProcessingProgress(0.1)
                let textData;
                if (!lesson.text) {
                    const response = await axios.get(dataUrl)
                    textData = response.data
                } else {
                    textData = lesson.text
                }

                setProcessingProgress(0.2)

                const apiKey = await SecureStore.getItemAsync('google-api')
                if (!apiKey) {
                    console.error('Google API key not found in secure storage')
                    setProcessStatus('Error: API key not found, Set API Key in Tools')
                    return
                }

                const processedData = await processArabicTextForQnA(textData, apiKey)
                await SecureStore.setItemAsync(storageKey, JSON.stringify(processedData))
                setGameData(processedData)
            } catch (error) {
                console.error('Error fetching data:', error)
                setProcessStatus(`Error: ${error.message}`)
            } finally {
                setForceRegenerate(false)
                setLoading(false)
            }
        }

        fetchData()
    }, [forceRegenerate])

    // Reset indices and game state when gameData changes
    useEffect(() => {
        if (gameData) {
            setCurrentSectionIndex(0)
            setCurrentQuestionIndex(0)
            setSelectedAnswer(null)
            setCorrectAnswers(0)
            setTotalAttempts(0)
            setPoints(0)
            setShowResults(false)
            setIsComplete(false)
        }
    }, [gameData])

    // Process Arabic text for Q&A
    const processArabicTextForQnA = async (arabicText, apiKey) => {
        try {
            setProcessStatus('Extracting text structure...')
            setProcessingProgress(0.3)
            console.log('Processing text for question and answer exercise')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: 0.1 }
            })

            const qnaPrompt = `
            Create a question and answer exercise from this Arabic text:
            
            Text: ${arabicText}
            
            Return ONLY a JSON array in this exact format without any additional text:
            [
              {
                "name": "Section name in Arabic",
                "questions": [
                  {
                    "question": "Question in Arabic",
                    "options": ["option1", "option2", "option3", "option4"],
                    "correctAnswer": "option1",
                    "translation": {
                      "question": "English translation of the question",
                      "answer": "English translation of the correct answer"
                    }
                  }
                ]
              }
            ]
            
            Create about 3-5 questions per section. Each question should:
            1. Be directly related to the content of the text
            2. Have 4 different options to choose from
            3. Include both vocabulary and comprehension questions
            4. Keep diacritical marks (harakat) in all Arabic text
            5. Include meaningful translations for both the question and correct answer
            `;

            setProcessStatus('Creating question and answer exercises...')
            setProcessingProgress(0.5)

            const gameResult = await model.generateContent(qnaPrompt)
            const gameResponse = gameResult.response.text()
            const jsonMatch = gameResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
            const jsonString = jsonMatch ? jsonMatch[0] : gameResponse
            const gameData = JSON.parse(jsonString)

            console.log('Q&A exercise created:', gameData.length, 'sections')
            setProcessingProgress(1)
            return gameData
        } catch (error) {
            console.error('Error creating Q&A exercise:', error)
            return [{
                name: "Error Section",
                questions: [{
                    question: "Error processing text for Q&A exercise",
                    options: ["Try again", "Check API key", "Verify text", "Contact support"],
                    correctAnswer: "Try again",
                    translation: {
                        question: "Error processing text for Q&A exercise",
                        answer: "Try again"
                    }
                }]
            }]
        }
    }

    // Handle regeneration
    const handleRegenerate = () => {
        Alert.alert(
            "Regenerate Content",
            "This will reset your progress. Regenerate the content?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Regenerate",
                    onPress: async () => {
                        setLoading(true)
                        setProcessStatus('Regenerating content...')
                        const storageKey = `arabic-qna-${subInt}-${index}`
                        await SecureStore.deleteItemAsync(storageKey)
                        setForceRegenerate(true)
                    }
                }
            ]
        )
    }

    const handleSectionChange = (sectionIndex) => {
        setCurrentSectionIndex(sectionIndex)
        setCurrentQuestionIndex(0)
        setSelectedAnswer(null)
        setShowResults(false)
    }

    // Select an answer
    const handleSelectAnswer = (answer) => {
        setSelectedAnswer(answer)
        const currentQuestion = gameData[currentSectionIndex].questions[currentQuestionIndex]

        setTotalAttempts(totalAttempts + 1)
        const isCorrect = answer === currentQuestion.correctAnswer

        if (isCorrect) {
            setCorrectAnswers(correctAnswers + 1)
            setPoints(points + 10)
        }

        setShowResults(true)
    }

    // Move to next question
    const handleNextQuestion = () => {
        const currentSection = gameData[currentSectionIndex]

        // Check if we're at the end of all questions in all sections
        if (currentSectionIndex === gameData.length - 1 &&
            currentQuestionIndex === currentSection.questions.length - 1) {
            setIsComplete(true)
            return
        }

        // Move to next question or section
        if (currentQuestionIndex < currentSection.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
        } else if (currentSectionIndex < gameData.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1)
            setCurrentQuestionIndex(0)
        }

        setSelectedAnswer(null)
        setShowResults(false)
    }

    // Progress bar component
    const ProgressBar = ({ progress, width, height = 6, color = '#5c6bc0', backgroundColor = '#e0e0e0' }) => {
        return (
            <View style={{ height, width: width || '100%', backgroundColor, borderRadius: height / 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color, borderRadius: height / 2 }} />
            </View>
        )
    }

    // Handle game completion
    const handleComplete = async () => {
        try {
            let oldScore = parseInt(await SecureStore.getItemAsync("score-" + subInt)) || 0

            // Calculate score based on correct answers
            const accuracy = correctAnswers / totalAttempts
            let pointsToAdd = 0

            for (let i = 0; i < lesson.tools.length; i++) {
                if (lesson.tools[i].name === "arabic-qna") {
                    pointsToAdd += Math.round(lesson.tools[i].score * accuracy)
                }
            }

            const newScore = oldScore + pointsToAdd
            await SecureStore.setItemAsync('score-' + subInt, newScore.toString())

            Alert.alert(
                "Congratulations!",
                `You've completed the exercise!\n\nScore: ${points}\nAccuracy: ${Math.round(accuracy * 100)}%\nPoints Added: +${pointsToAdd}`,
                [{ text: "Continue", onPress: () => router.back() }]
            )
        } catch (error) {
            console.error('Error saving score:', error)
            Alert.alert("Error", "Could not save your score.")
            router.back()
        }
    }

    // Render current question
    const renderCurrentQuestion = () => {
        if (!gameData || gameData.length === 0) return null

        const currentSection = gameData[currentSectionIndex]
        const currentQuestion = currentSection.questions[currentQuestionIndex]
        if (!currentQuestion) return null

        return (
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-indigo-700 font-medium">
                        Question {currentQuestionIndex + 1}/{currentSection.questions.length}
                    </Text>
                    <View className="bg-indigo-100 px-3 py-1 rounded-full">
                        <Text className="text-indigo-700 font-bold">{points} pts</Text>
                    </View>
                </View>

                {/* The question */}
                <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Text className="text-right text-lg leading-7 mb-2">
                        {currentQuestion.question}
                    </Text>
                    <Text className="text-gray-600">{currentQuestion.translation.question}</Text>
                </View>

                {/* Answer options */}
                {!showResults && (
                    <View className="my-2">
                        {currentQuestion.options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleSelectAnswer(option)}
                                className={`mb-2 p-3 rounded-lg ${selectedAnswer === option
                                        ? 'bg-indigo-200 border border-indigo-400'
                                        : 'bg-gray-100 border border-gray-200'
                                    }`}
                            >
                                <Text className="text-right text-lg">{option}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Results feedback */}
                {showResults && (
                    <View className="bg-gray-50 p-3 rounded-lg mb-3">
                        <Text className="text-lg font-bold mb-2 text-center">
                            {selectedAnswer === currentQuestion.correctAnswer
                                ? "Correct! 🎉"
                                : "Not quite right 🤔"
                            }
                        </Text>

                        <View className="mb-3">
                            <Text className="font-bold mb-1">Your answer:</Text>
                            <View className={`p-2 rounded-lg ${selectedAnswer === currentQuestion.correctAnswer
                                    ? 'bg-green-100 border border-green-300'
                                    : 'bg-red-100 border border-red-300'
                                }`}>
                                <Text className="text-right text-lg">{selectedAnswer}</Text>
                            </View>
                        </View>

                        {selectedAnswer !== currentQuestion.correctAnswer && (
                            <View className="mb-3">
                                <Text className="font-bold mb-1">Correct answer:</Text>
                                <View className="p-2 rounded-lg bg-green-100 border border-green-300">
                                    <Text className="text-right text-lg">{currentQuestion.correctAnswer}</Text>
                                </View>
                                <Text className="text-gray-600 mt-1">{currentQuestion.translation.answer}</Text>
                            </View>
                        )}

                        <TouchableOpacity
                            onPress={handleNextQuestion}
                            className="bg-indigo-600 py-2 px-4 rounded-lg mt-3 items-center"
                        >
                            <Text className="text-white font-medium">
                                {isComplete ? "See Results" : "Next Question"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )
    }

    // Loading screen
    // Loading screen
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-blue-50">
                <StatusBar barStyle="dark-content" />
                <View className="flex-1 justify-center items-center p-5">
                    <View className="bg-white rounded-2xl p-6 w-full items-center shadow-md">
                        <FontAwesome5 name="question-circle" size={60} color="#5c6bc0" className="mb-5" />
                        <Text className="text-xl font-bold text-gray-800 mb-3">Creating Your Quiz</Text>
                        <Text className="text-base text-gray-600 text-center mb-6">{processStatus}</Text>
                        <ProgressBar progress={processingProgress} height={8} />
                        <View className="flex-row items-center mt-5">
                            <ActivityIndicator size="small" color="#5c6bc0" />
                            <Text className="ml-2 text-indigo-600 font-medium">
                                {Math.round(processingProgress * 100)}% Complete
                            </Text>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        )
    }

    // Main render
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-white">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Ionicons name="arrow-back" size={24} color="#333" />
                    <Text className="ml-2 text-gray-800">Back</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">{lesson.title || 'Questions & Answers'}</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={handleRegenerate} disabled={loading} className="mr-2">
                        <FontAwesome5 name="sync" size={20} color="#333" />
                    </TouchableOpacity>
                    <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                        <FontAwesome5 name="star" size={14} color="#4caf50" />
                        <Text className="ml-1 text-green-600 font-bold">{points}</Text>
                    </View>
                </View>
            </View>

            {gameData && gameData.length > 0 && (
                <ReaderSelector
                    sections={gameData}
                    currentSectionIndex={currentSectionIndex}
                    onSelectSection={handleSectionChange}
                    className="mx-4 mt-4"
                />
            )}

            {/* Progress bar */}
            <View className="px-6 my-3">
                <ProgressBar
                    progress={(currentQuestionIndex + 1) / gameData[currentSectionIndex].questions.length}
                />
            </View>

            {/* Main content */}
            <ScrollView className="flex-1 px-4">
                {renderCurrentQuestion()}

                {isComplete && (
                    <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
                        <Text className="text-xl font-bold text-center mb-3">Quiz Complete! 🎉</Text>
                        <View className="bg-indigo-50 p-4 rounded-lg mb-4">
                            <Text className="text-lg text-center mb-2">Your Results</Text>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-700">Total Points:</Text>
                                <Text className="font-bold">{points}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-700">Correct Answers:</Text>
                                <Text className="font-bold">{correctAnswers}/{totalAttempts}</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-700">Accuracy:</Text>
                                <Text className="font-bold">
                                    {totalAttempts > 0 ? Math.round((correctAnswers / totalAttempts) * 100) : 0}%
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={handleComplete}
                            className="bg-green-600 py-3 rounded-lg items-center"
                        >
                            <Text className="text-white font-bold text-lg">Finish & Save Score</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}

export default ArabicQnA