import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert } from 'react-native'
import { Ionicons, FontAwesome5 } from '@expo/vector-icons'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReaderSelector from './components/ReaderSelector'

const ArabicFillBlanks = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [gameData, setGameData] = useState(null)
    const [processStatus, setProcessStatus] = useState('Initializing...')
    const [processingProgress, setProcessingProgress] = useState(0)
    const [forceRegenerate, setForceRegenerate] = useState(false)

    // Game state variables
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0)
    const [selectedWords, setSelectedWords] = useState([])
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
                const storageKey = `arabic-blanks-${subInt}-${index}`
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

                const processedData = await processArabicTextForBlanks(textData, apiKey)
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
            setCurrentPuzzleIndex(0)
            setSelectedWords([])
            setCorrectAnswers(0)
            setTotalAttempts(0)
            setPoints(0)
            setShowResults(false)
            setIsComplete(false)
        }
    }, [gameData])

    // Process Arabic text for blanks game
    const processArabicTextForBlanks = async (arabicText, apiKey) => {
        try {
            setProcessStatus('Extracting text structure...')
            setProcessingProgress(0.3)
            console.log('Processing text for fill-in-the-blanks game')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: 0.1 }
            })

            const blanksPuzzlePrompt = `
            Create a fill-in-the-blanks game from this Arabic text. Focus on important vocabulary words:
            
            Text: ${arabicText}
            
            Return ONLY a JSON array in this exact format without any additional text:
            [
              {
                "name": "Section name in Arabic",
                "puzzles": [
                  {
                    "sentence": "Original Arabic sentence with ________ for blanks",
                    "options": ["word1", "word2", "word3", "word4", "word5", "word6"],
                    "blanks": [
                      {
                        "index": 0,
                        "word": "correct word 1"
                      },
                      {
                        "index": 1,
                        "word": "correct word 2"
                      }
                    ],
                    "translation": "English translation of the full sentence"
                  }
                ]
              }
            ]
            
            Create about 3-5 puzzles per section. Each puzzle should:
            1. Replace 1-2 important vocabulary words with blanks
            2. Provide 6 options to choose from (include the correct answers plus distractors)
            3. Blanks should represent key vocabulary words, not just common words
            4. Keep diacritical marks (harakat) in all Arabic text
            `;

            setProcessStatus('Creating fill-in-the-blanks exercises...')
            setProcessingProgress(0.5)

            const gameResult = await model.generateContent(blanksPuzzlePrompt)
            const gameResponse = gameResult.response.text()
            const jsonMatch = gameResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
            const jsonString = jsonMatch ? jsonMatch[0] : gameResponse
            const gameData = JSON.parse(jsonString)

            console.log('Fill-in-the-blanks game created:', gameData.length, 'sections')
            setProcessingProgress(1)
            return gameData
        } catch (error) {
            console.error('Error creating blanks game:', error)
            return [{
                name: "Error Section",
                puzzles: [{
                    sentence: "Error processing text ____ blanks game.",
                    options: ["for", "with", "into", "as", "from", "by"],
                    blanks: [{ index: 0, word: "for" }],
                    translation: "Error processing text for blanks game."
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
                        const storageKey = `arabic-blanks-${subInt}-${index}`
                        await SecureStore.deleteItemAsync(storageKey)
                        setForceRegenerate(true)
                    }
                }
            ]
        )
    }

    const handleSectionChange = (sectionIndex) => {
        setCurrentSectionIndex(sectionIndex)
        setCurrentPuzzleIndex(0)
        setSelectedWords([])
        setShowResults(false)
    }

    // Select a word from options
    const handleSelectWord = (word, index) => {
        // If word is already selected, do nothing
        if (selectedWords.includes(word)) return

        const currentPuzzle = gameData[currentSectionIndex].puzzles[currentPuzzleIndex]
        const newSelectedWords = [...selectedWords, word]
        setSelectedWords(newSelectedWords)

        // Check if all blanks have been filled
        if (newSelectedWords.length === currentPuzzle.blanks.length) {
            let correct = 0
            newSelectedWords.forEach((selected, idx) => {
                if (selected === currentPuzzle.blanks[idx].word) {
                    correct++
                }
            })

            setTotalAttempts(totalAttempts + 1)
            setCorrectAnswers(correctAnswers + (correct === currentPuzzle.blanks.length ? 1 : 0))

            // Add points based on correctness
            const earnedPoints = correct === currentPuzzle.blanks.length ? 10 : Math.max(0, correct * 2)
            setPoints(points + earnedPoints)

            // Show results before moving to next puzzle
            setShowResults(true)
        }
    }

    // Move to next puzzle
    const handleNextPuzzle = () => {
        const currentSection = gameData[currentSectionIndex]

        // Check if we're at the end of all puzzles in all sections
        if (currentSectionIndex === gameData.length - 1 &&
            currentPuzzleIndex === currentSection.puzzles.length - 1) {
            setIsComplete(true)
            return
        }

        // Move to next puzzle or section
        if (currentPuzzleIndex < currentSection.puzzles.length - 1) {
            setCurrentPuzzleIndex(currentPuzzleIndex + 1)
        } else if (currentSectionIndex < gameData.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1)
            setCurrentPuzzleIndex(0)
        }

        setSelectedWords([])
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
                if (lesson.tools[i].name === "arabic-fib") {
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

    // Render current puzzle
    const renderCurrentPuzzle = () => {
        if (!gameData || gameData.length === 0) return null

        const currentSection = gameData[currentSectionIndex]
        const currentPuzzle = currentSection.puzzles[currentPuzzleIndex]
        if (!currentPuzzle) return null

        // Split sentence by blanks
        const sentenceParts = currentPuzzle.sentence.split('________')


        return (
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-indigo-700 font-medium">
                        Puzzle {currentPuzzleIndex + 1}/{currentSection.puzzles.length}
                    </Text>
                    <View className="bg-indigo-100 px-3 py-1 rounded-full">
                        <Text className="text-indigo-700 font-bold">{points} pts</Text>
                    </View>
                </View>

                {/* The sentence with blanks */}
                <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Text className="text-right text-lg leading-7 mb-2">
                        {sentenceParts.map((part, index) => (
                            <React.Fragment key={index}>
                                {part}
                                {index < sentenceParts.length - 1 && (
                                    <View className="inline mx-1 px-2 py-1 bg-indigo-100 rounded">
                                        <Text className="text-indigo-700 font-bold">
                                            {selectedWords[index] || "_______"}
                                        </Text>
                                    </View>
                                )}
                            </React.Fragment>
                        ))}
                    </Text>
                    <Text className="text-gray-600">{currentPuzzle.translation}</Text>
                </View>

                {/* Word options */}
                {!showResults && (
                    <View className="flex-row flex-wrap justify-center my-2">
                        {currentPuzzle.options.map((word, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => handleSelectWord(word, index)}
                                className={`m-1 px-3 py-2 rounded-lg ${selectedWords.includes(word)
                                        ? 'bg-gray-300 opacity-50'
                                        : 'bg-indigo-600'
                                    }`}
                                disabled={selectedWords.includes(word)}
                            >
                                <Text className={`text-lg ${selectedWords.includes(word)
                                        ? 'text-gray-700'
                                        : 'text-white'
                                    }`}>
                                    {word}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Results feedback */}
                {showResults && (
                    <View className="bg-gray-50 p-3 rounded-lg mb-3">
                        <Text className="text-lg font-bold mb-2 text-center">
                            {selectedWords.every((word, idx) =>
                                word === currentPuzzle.blanks[idx].word)
                                ? "Correct! 🎉"
                                : "Not quite right 🤔"
                            }
                        </Text>

                        {currentPuzzle.blanks.map((blank, idx) => (
                            <View key={idx} className="flex-row justify-between mb-1">
                                <Text>Blank {idx + 1}:</Text>
                                <View className="flex-row">
                                    <Text className={
                                        selectedWords[idx] === blank.word
                                            ? "text-green-600 font-bold"
                                            : "text-red-600"
                                    }>
                                        {selectedWords[idx] || ""}
                                    </Text>
                                    {selectedWords[idx] !== blank.word && (
                                        <Text className="text-green-600 ml-2">
                                            → {blank.word}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={handleNextPuzzle}
                            className="bg-indigo-600 py-2 px-4 rounded-lg mt-3 items-center"
                        >
                            <Text className="text-white font-medium">
                                {isComplete ? "See Results" : "Next Puzzle"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )
    }

    // Loading screen
    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-blue-50">
                <StatusBar barStyle="dark-content" />
                <View className="flex-1 justify-center items-center p-5">
                    <View className="bg-white rounded-2xl p-6 w-full items-center shadow-md">
                        <FontAwesome5 name="puzzle-piece" size={60} color="#5c6bc0" className="mb-5" />
                        <Text className="text-xl font-bold text-gray-800 mb-3">Creating Your Puzzle</Text>
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
                <Text className="text-xl font-bold text-gray-800">{lesson.title || 'Fill in the Blanks'}</Text>
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
                    progress={(currentPuzzleIndex + 1) / gameData[currentSectionIndex].puzzles.length}
                />
            </View>
            {/* Main content */}
            <ScrollView className="flex-1 px-4">
                {renderCurrentPuzzle()}

                {isComplete && (
                    <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
                        <Text className="text-xl font-bold text-center mb-3">Game Complete! 🎉</Text>
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

export default ArabicFillBlanks