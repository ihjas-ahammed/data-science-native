import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Alert, TextInput } from 'react-native'
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons'
import React, { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReaderSelector from './components/ReaderSelector'

const PythonMemoryTest = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [gameData, setGameData] = useState(null)
    const [processStatus, setProcessStatus] = useState('Initializing...')
    const [processingProgress, setProcessingProgress] = useState(0)
    const [forceRegenerate, setForceRegenerate] = useState(false)

    // Game state variables
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [currentLineIndex, setCurrentLineIndex] = useState(0)
    const [userInput, setUserInput] = useState('')
    const [showHint, setShowHint] = useState(false)
    const [showAnswer, setShowAnswer] = useState(false)
    const [correctAnswers, setCorrectAnswers] = useState(0)
    const [totalAttempts, setTotalAttempts] = useState(0)
    const [points, setPoints] = useState(0)
    const [isComplete, setIsComplete] = useState(false)
    const [difficultyLevel, setDifficultyLevel] = useState(1) // 1-3, higher is more difficult
    const [studyMode, setStudyMode] = useState(true) // Start in study mode to allow initial code review
    
    const inputRef = useRef(null)

    const { subject, index, subInt, lesson } = JSON.parse(exp)
    const dataUrl = lesson.data

    // Fetch and process data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                setProcessStatus('Checking cached data...')
                const storageKey = `python-memory-${subInt}-${index}`
                let storedData = await SecureStore.getItemAsync(storageKey)

                if (storedData && !forceRegenerate) {
                    console.log('Using stored game data')
                    setProcessStatus('Using cached data...')
                    setProcessingProgress(0.9)
                    setGameData(JSON.parse(storedData))
                    setLoading(false)
                    return
                }

                setProcessStatus('Downloading Python code...')
                setProcessingProgress(0.1)
                let codeData;
                if (!lesson.text) {
                    const response = await axios.get(dataUrl)
                    codeData = response.data
                } else {
                    codeData = lesson.text
                }

                setProcessingProgress(0.2)

                const apiKey = await SecureStore.getItemAsync('google-api')
                if (!apiKey) {
                    console.error('Google API key not found in secure storage')
                    setProcessStatus('Error: API key not found, Set API Key in Tools')
                    return
                }

                const processedData = await processPythonCodeForMemory(codeData, apiKey)
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
            setCurrentLineIndex(0)
            setUserInput('')
            setShowHint(false)
            setShowAnswer(false)
            setCorrectAnswers(0)
            setTotalAttempts(0)
            setPoints(0)
            setIsComplete(false)
            setStudyMode(true) // Start in study mode
        }
    }, [gameData])

    // Process Python code for memory game
    const processPythonCodeForMemory = async (pythonCode, apiKey) => {
        try {
            setProcessStatus('Analyzing Python code...')
            setProcessingProgress(0.3)
            console.log('Processing Python code for memory game')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: 0.1 }
            })

            const memoryPrompt = `
            Create a Python code memory game from this code. Divide the code into logical sections and prepare each line for memorization practice:
            
            Python Code: ${pythonCode}
            
            Return ONLY a JSON array in this exact format without any additional text:
            [
              {
                "name": "Section name (e.g. 'Functions', 'Classes', 'Main Loop')",
                "description": "Brief description of what this section does",
                "lines": [
                  {
                    "code": "The full line of code",
                    "indentation": "The leading whitespace/indentation",
                    "hint": "A hint about this line's purpose without revealing the exact syntax",
                    "difficulty": 1-3 (1 for easy lines like comments, 3 for complex expressions)
                  }
                ]
              }
            ]
            
            Guidelines:
            1. Break the code into 3-5 logical sections
            2. Include EVERY line of the original code, including blank lines, comments, etc.
            3. For blank lines, use an empty string for 'code' and 'indentation'
            4. For comments and easy syntax, set difficulty to 1
            5. For basic code (variable assignments, simple function calls), set difficulty to 2
            6. For complex expressions, function definitions, class methods, set difficulty to 3
            7. Hints should help recall without giving away the exact answer
            8. Preserve all indentation in the 'indentation' field and the actual code in the 'code' field
            `;

            setProcessStatus('Processing code for memorization...')
            setProcessingProgress(0.5)

            const gameResult = await model.generateContent(memoryPrompt)
            const gameResponse = gameResult.response.text()
            const jsonMatch = gameResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
            const jsonString = jsonMatch ? jsonMatch[0] : gameResponse
            const gameData = JSON.parse(jsonString)

            console.log('Python memory game created:', gameData.length, 'sections')
            setProcessingProgress(1)
            return gameData
        } catch (error) {
            console.error('Error creating Python memory game:', error)
            return [{
                name: "Error Section",
                description: "Could not process the Python code",
                lines: [
                    {
                        code: "print('Error processing code for memory game')",
                        indentation: "",
                        hint: "Simple print statement showing an error",
                        difficulty: 1
                    }
                ]
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
                        const storageKey = `python-memory-${subInt}-${index}`
                        await SecureStore.deleteItemAsync(storageKey)
                        setForceRegenerate(true)
                    }
                }
            ]
        )
    }

    const handleSectionChange = (sectionIndex) => {
        setCurrentSectionIndex(sectionIndex)
        setCurrentLineIndex(0)
        setUserInput('')
        setShowHint(false)
        setShowAnswer(false)
        setStudyMode(true) // Return to study mode when changing sections
    }

    // Check user input against current line
    const checkAnswer = () => {
        if (!gameData || studyMode) return

        const currentSection = gameData[currentSectionIndex]
        const currentLine = currentSection.lines[currentLineIndex]
        const trimmedUserInput = userInput.trim()
        const trimmedCorrectAnswer = currentLine.code.trim()
        
        // Special case for empty lines
        if (currentLine.code === "" && (trimmedUserInput === "" || userInput === "")) {
            handleCorrectAnswer()
            return
        }
        
        // Case-sensitive exact match or close enough (ignores some whitespace differences)
        if (trimmedUserInput === trimmedCorrectAnswer || 
            userInput === currentLine.code) {
            handleCorrectAnswer()
        } else {
            // Wrong answer
            setTotalAttempts(totalAttempts + 1)
            setShowAnswer(true) // Show the correct answer
        }
    }

    const handleCorrectAnswer = () => {
        setTotalAttempts(totalAttempts + 1)
        setCorrectAnswers(correctAnswers + 1)
        
        // Award points based on difficulty
        const currentLine = gameData[currentSectionIndex].lines[currentLineIndex]
        const earnedPoints = currentLine.difficulty * (showHint ? 1 : 2) // Half points if hint was used
        setPoints(points + earnedPoints)
        
        // Move to next line
        handleNextLine()
    }

    // Move to next line
    const handleNextLine = () => {
        const currentSection = gameData[currentSectionIndex]

        // Reset states
        setUserInput('')
        setShowHint(false)
        setShowAnswer(false)

        // Check if we're at the end of all lines in all sections
        if (currentSectionIndex === gameData.length - 1 &&
            currentLineIndex === currentSection.lines.length - 1) {
            setIsComplete(true)
            return
        }

        // Move to next line or section
        if (currentLineIndex < currentSection.lines.length - 1) {
            setCurrentLineIndex(currentLineIndex + 1)
        } else if (currentSectionIndex < gameData.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1)
            setCurrentLineIndex(0)
            setStudyMode(true) // Return to study mode when moving to new section
        }

        // Focus the input field
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus()
            }
        }, 100)
    }

    // Toggle study mode (show all code vs test memory)
    const toggleStudyMode = () => {
        setStudyMode(!studyMode)
    }

    // Adjust difficulty level
    const changeDifficultyLevel = (level) => {
        setDifficultyLevel(level)
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
                if (lesson.tools[i].name === "py-memory") {
                    pointsToAdd += Math.round(lesson.tools[i].score * accuracy)
                }
            }

            const newScore = oldScore + pointsToAdd
            await SecureStore.setItemAsync('score-' + subInt, newScore.toString())

            Alert.alert(
                "Congratulations!",
                `You've completed the memory challenge!\n\nScore: ${points}\nAccuracy: ${Math.round(accuracy * 100)}%\nPoints Added: +${pointsToAdd}`,
                [{ text: "Continue", onPress: () => router.back() }]
            )
        } catch (error) {
            console.error('Error saving score:', error)
            Alert.alert("Error", "Could not save your score.")
            router.back()
        }
    }

    // Render the code lines for study mode
    const renderStudySection = () => {
        if (!gameData || gameData.length === 0) return null

        const currentSection = gameData[currentSectionIndex]

        return (
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-indigo-700 font-medium">Study Mode</Text>
                    <View className="bg-indigo-100 px-3 py-1 rounded-full">
                        <Text className="text-indigo-700 font-bold">{points} pts</Text>
                    </View>
                </View>

                {/* Section description */}
                <View className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <Text className="text-gray-800 font-medium">{currentSection.description}</Text>
                </View>

                {/* Code display */}
                <View className="bg-gray-900 p-3 rounded-lg mb-4">
                    <ScrollView>
                        {currentSection.lines.map((line, idx) => (
                            <Text key={idx} className="font-mono text-green-500">
                                {line.indentation}{line.code}
                            </Text>
                        ))}
                    </ScrollView>
                </View>

                {/* Controls */}
                <TouchableOpacity
                    onPress={toggleStudyMode}
                    className="bg-indigo-600 py-2 rounded-lg mt-3 items-center"
                >
                    <Text className="text-white font-medium">Start Memory Test</Text>
                </TouchableOpacity>
            </View>
        )
    }

    // Render current memory test line
    const renderMemoryTest = () => {
        if (!gameData || gameData.length === 0) return null

        const currentSection = gameData[currentSectionIndex]
        const currentLine = currentSection.lines[currentLineIndex]
        if (!currentLine) return null

        // Only test lines with appropriate difficulty based on user's selected level
        const shouldTest = currentLine.difficulty <= difficultyLevel
        const isEmptyLine = currentLine.code === ""

        // Previous context (show up to 3 previous lines)
        const previousLines = []
        for (let i = Math.max(0, currentLineIndex - 3); i < currentLineIndex; i++) {
            previousLines.push(currentSection.lines[i])
        }

        return (
            <View className="bg-white rounded-xl p-4 shadow-sm mb-4">
                <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-indigo-700 font-medium">
                        Line {currentLineIndex + 1}/{currentSection.lines.length}
                    </Text>
                    <View className="bg-indigo-100 px-3 py-1 rounded-full">
                        <Text className="text-indigo-700 font-bold">{points} pts</Text>
                    </View>
                </View>

                {/* Previous context */}
                <View className="bg-gray-800 p-3 rounded-t-lg">
                    {previousLines.map((line, idx) => (
                        <Text key={idx} className="font-mono text-gray-400">
                            {line.indentation}{line.code}
                        </Text>
                    ))}
                </View>

                {/* Current line */}
                <View className="bg-gray-900 p-3 rounded-b-lg mb-4">
                    {isEmptyLine ? (
                        <Text className="font-mono text-yellow-500 italic">
                            (This is an empty line, press "Submit" to continue)
                        </Text>
                    ) : shouldTest ? (
                        <View className="flex-row">
                            <Text className="font-mono text-green-500">{currentLine.indentation}</Text>
                            <Text className="font-mono text-red-500">Complete this line...</Text>
                        </View>
                    ) : (
                        <Text className="font-mono text-green-500">
                            {currentLine.indentation}{currentLine.code}
                        </Text>
                    )}
                </View>

                {/* Hint */}
                {currentLine.hint && shouldTest && !isEmptyLine && (
                    <View className="mb-3">
                        <TouchableOpacity 
                            onPress={() => setShowHint(!showHint)}
                            className="flex-row items-center"
                        >
                            <FontAwesome5 name={showHint ? "eye-slash" : "eye"} size={16} color="#4f46e5" />
                            <Text className="text-indigo-600 ml-2 font-medium">
                                {showHint ? "Hide Hint" : "Show Hint"}
                            </Text>
                        </TouchableOpacity>
                        
                        {showHint && (
                            <View className="bg-indigo-50 p-2 mt-2 rounded-lg">
                                <Text className="text-indigo-800">{currentLine.hint}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* User input */}
                {shouldTest && !isEmptyLine ? (
                    <View className="mb-3">
                        <TextInput
                            ref={inputRef}
                            className="border border-gray-300 rounded-lg p-2 bg-gray-50 font-mono"
                            value={userInput}
                            onChangeText={setUserInput}
                            placeholder="Type the code line here..."
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>
                ) : null}

                {/* Show answer */}
                {showAnswer && shouldTest && !isEmptyLine && (
                    <View className="bg-red-50 p-3 rounded-lg mb-3">
                        <Text className="text-red-800 font-bold mb-1">Correct answer:</Text>
                        <Text className="font-mono text-red-700">{currentLine.code}</Text>
                    </View>
                )}

                {/* Controls */}
                <View className="flex-row justify-between mt-2">
                    <TouchableOpacity
                        onPress={toggleStudyMode}
                        className="bg-gray-200 py-2 px-4 rounded-lg"
                    >
                        <Text className="text-gray-800">Return to Study</Text>
                    </TouchableOpacity>

                    {shouldTest ? (
                        <TouchableOpacity
                            onPress={showAnswer ? handleNextLine : checkAnswer}
                            className={`py-2 px-4 rounded-lg ${showAnswer ? "bg-green-600" : "bg-indigo-600"}`}
                        >
                            <Text className="text-white font-medium">
                                {showAnswer ? "Next Line" : "Submit"}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            onPress={handleNextLine}
                            className="bg-indigo-600 py-2 px-4 rounded-lg"
                        >
                            <Text className="text-white font-medium">Next Line</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        )
    }

    // Difficulty selector
    const renderDifficultySelector = () => {
        return (
            <View className="bg-white p-3 rounded-lg mb-4 flex-row justify-between">
                <Text className="text-gray-700 font-medium self-center">Difficulty:</Text>
                <View className="flex-row">
                    {[1, 2, 3].map(level => (
                        <TouchableOpacity
                            key={level}
                            onPress={() => changeDifficultyLevel(level)}
                            className={`mx-1 px-3 py-1 rounded ${
                                difficultyLevel === level 
                                    ? 'bg-indigo-600' 
                                    : 'bg-gray-200'
                            }`}
                        >
                            <Text className={`${
                                difficultyLevel === level 
                                    ? 'text-white' 
                                    : 'text-gray-700'
                            }`}>
                                {level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
                        <FontAwesome5 name="brain" size={60} color="#5c6bc0" className="mb-5" />
                        <Text className="text-xl font-bold text-gray-800 mb-3">Preparing Memory Challenge</Text>
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
                <Text className="text-xl font-bold text-gray-800">{lesson.title || 'Python Memory Test'}</Text>
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
                    progress={(currentLineIndex + 1) / gameData[currentSectionIndex].lines.length}
                />
            </View>

            {/* Difficulty selector (only show in memory test mode) */}
            {!studyMode && renderDifficultySelector()}

            {/* Main content */}
            <ScrollView className="flex-1 px-4">
                {studyMode ? renderStudySection() : renderMemoryTest()}

                {isComplete && (
                    <View className="bg-white rounded-xl p-5 shadow-sm mb-4">
                        <Text className="text-xl font-bold text-center mb-3">Memory Challenge Complete! 🎉</Text>
                        <View className="bg-indigo-50 p-4 rounded-lg mb-4">
                            <Text className="text-lg text-center mb-2">Your Results</Text>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-700">Total Points:</Text>
                                <Text className="font-bold">{points}</Text>
                            </View>
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-gray-700">Correct Lines:</Text>
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

export default PythonMemoryTest