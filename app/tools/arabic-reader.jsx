import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Animated, Modal, Alert } from 'react-native'
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons'
import React, { useState, useEffect, useRef } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'
import ReaderSelector from './components/ReaderSelector'

const ArabicReader = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [readerData, setReaderData] = useState(null)
    const [sentence, setSentence] = useState('')
    const [processStatus, setProcessStatus] = useState('Initializing...')
    const [processingProgress, setProcessingProgress] = useState(0)
    const [forceRegenerate, setForceRegenerate] = useState(false) // New state for regeneration

    // Game UI state variables
    const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
    const [showFullSentence, setShowFullSentence] = useState(true)
    const [wordRevealIndex, setWordRevealIndex] = useState(-1)
    const [points, setPoints] = useState(0)
    const [streak, setStreak] = useState(0)

    const [showCompletionModal, setShowCompletionModal] = useState(false)
    const [scoreAdded, setScoreAdded] = useState(0)
    const [totalScore, setTotalScore] = useState(0)
    const confettiAnim = useRef(new Animated.Value(0)).current
    const scoreAnim = useRef(new Animated.Value(0)).current

    // Animation refs
    const fadeAnim = useRef(new Animated.Value(0)).current
    const slideAnim = useRef(new Animated.Value(50)).current

    const { subject, index, subInt, lesson } = JSON.parse(exp)
    const dataUrl = lesson.data

    // Constants for batch processing
    const BATCH_SIZE = 5 // Process 5 sentences at once
    const MAX_TOKENS = 5000 // Target token limit for each request

    // Fetch and process data, with regeneration support
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                
                const apiKey = await SecureStore.getItemAsync('google-api')
                

                if (!apiKey) {
                    console.error('Google API key not found in secure storage')
                    router.back()
                    alert("Please set API Key in tools at home")
                    return
                }

                setProcessStatus('Checking cached data...')
                const storageKey = `arabic-reader-${subInt}-${index}`
                let storedData = await SecureStore.getItemAsync(storageKey)

                if (storedData && !forceRegenerate) {
                    console.log('Using stored reader data')
                    setProcessStatus('Using cached data...')
                    setProcessingProgress(0.9)
                    setReaderData(JSON.parse(storedData))
                    setLoading(false)
                    return
                }

                setProcessStatus('Downloading Arabic text...')
                setProcessingProgress(0.1)
                let sentenceData;
                if (!lesson.text) {
                    const response = await axios.get(dataUrl)
                    sentenceData = response.data
                } else {
                    sentenceData = lesson.text
                }
                setSentence(sentenceData)
                setProcessingProgress(0.2)


                const processedData = await processArabicTextInBatches(sentenceData, apiKey)
                await SecureStore.setItemAsync(storageKey, JSON.stringify(processedData))
                setReaderData(processedData)
            } catch (error) {
                console.error('Error fetching data:', error)
                setProcessStatus(`Error: ${error.message}`)
            } finally {
                setForceRegenerate(false) // Reset regeneration flag
                setLoading(false)
            }
        }

        fetchData()
    }, [forceRegenerate]) // Depend on forceRegenerate to trigger reprocessing

    // Reset indices and game state when readerData changes
    useEffect(() => {
        if (readerData) {
            setCurrentSectionIndex(0)
            setCurrentSentenceIndex(0)
            setWordRevealIndex(-1)
            setShowFullSentence(true)
            setPoints(0)
            setStreak(0)
        }
    }, [readerData])

    // Animation for game UI
    useEffect(() => {
        if (!loading && readerData) {
            fadeAnim.setValue(0)
            slideAnim.setValue(50)
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true })
            ]).start()
        }
    }, [currentSentenceIndex, currentSectionIndex, loading])

    // Handle regeneration
    const handleRegenerate = () => {
        Alert.alert(
            "Regenerate Content",
            "Warning: This will reset your progress in this lesson and may take some time. Are you sure you want to regenerate the content?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Regenerate",
                    onPress: async () => {
                        setLoading(true)
                        setProcessStatus('Regenerating content...')
                        const storageKey = `arabic-reader-${subInt}-${index}`
                        await SecureStore.deleteItemAsync(storageKey)
                        setForceRegenerate(true)
                    }
                }
            ]
        )
    }

    // Extract text structure (unchanged)
    const extractTextStructure = async (arabicText, apiKey) => {
        try {
            setProcessStatus('Extracting text structure...')
            setProcessingProgress(0.25)
            console.log('Extracting text structure')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: 0.1 }
            })

            const structurePrompt = `
            I have an Arabic text that needs to be divided into sections and small sentences (no more than a few words) for processing.
            
            Text: ${arabicText}
            
            Please return ONLY a JSON array in this exact format without any additional text:
            [
              {
                "name": "Section name in Arabic",
                "sentences": ["sentence1", "sentence2", ...]
              }
            ]
            
            Split the text naturally into sections if appropriate (like different stories, paragraphs about different topics, or information about a poet separate from their work). 
            If it's just one continuous text, use a single section.
            Ignore elements like unit names, poet name title (which should be given as section title)
            For each section, split the text small logicallly meaningful sentences with 7-12 words
            Do not include any translations or additional information - ONLY the original Arabic text structure.
            add clear presentation of signs like fathah, kasrah, and shaddah, which are crucial for pronunciation
            all sections must have a name
            `;

            const structureResult = await model.generateContent(structurePrompt)
            const structureResponse = structureResult.response.text()
            const jsonMatch = structureResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
            const jsonString = jsonMatch ? jsonMatch[0] : structureResponse
            const structure = JSON.parse(jsonString)

            console.log('Text structure extracted:', structure)
            setProcessingProgress(0.3)
            return structure
        } catch (error) {
            console.error('Error extracting text structure:', error)
            return [{
                name: "النص الأصلي",
                sentences: [arabicText]
            }]
        }
    }

    // Process sentence batch (unchanged)
    const processSentenceBatch = async (sentences, apiKey) => {
        try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash',
                generationConfig: { temperature: 0.1 }
            })

            const batchPrompt = `
            Analyze these Arabic sentences for a language learning app:
            
            Sentences: ${JSON.stringify(sentences)}
            
            Return ONLY a JSON array in this exact format without any additional text:
            [
              {
                "sentence": "original Arabic sentence",
                "meaning": "english translation",
                "words": [
                  {"word": "arabic-word", "meaning": "english-word"}
                ]
              }
            ]
            
            Process each sentence in the array and provide a detailed analysis for each one.
            Ignore commonly used words for meaning and also names also connecting wors like to, from, he, she etc
            Make sure to keep the exact same order as in the input array.
            keep clear presentation of signs like fathah, kasrah, and shaddah, which are crucial for pronunciation
            `;

            const result = await model.generateContent(batchPrompt)
            const textResponse = result.response.text()
            const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/)
            const jsonString = jsonMatch ? jsonMatch[0] : textResponse
            return JSON.parse(jsonString)
        } catch (error) {
            console.error('Error processing sentence batch:', error, sentences)
            return sentences.map(sentence => ({
                sentence,
                meaning: "Translation unavailable",
                words: []
            }))
        }
    }

    // Estimate tokens (unchanged)
    const estimateTokens = (text) => {
        const wordCount = text.split(/\s+/).length
        return wordCount * 2
    }

    // Create optimized batches (unchanged)
    const createOptimizedBatches = (sentences) => {
        const batches = []
        let currentBatch = []
        let currentTokenCount = 0

        for (const sentence of sentences) {
            const sentenceTokens = estimateTokens(sentence)
            if ((currentTokenCount + sentenceTokens > MAX_TOKENS - 1000) || currentBatch.length >= BATCH_SIZE) {
                if (currentBatch.length > 0) {
                    batches.push([...currentBatch])
                    currentBatch = []
                    currentTokenCount = 0
                }
            }
            currentBatch.push(sentence)
            currentTokenCount += sentenceTokens
        }
        if (currentBatch.length > 0) batches.push(currentBatch)
        return batches
    }

    // Process Arabic text in batches (unchanged)
    const processArabicTextInBatches = async (arabicText, apiKey) => {
        try {
            const textStructure = await extractTextStructure(arabicText, apiKey)
            const processedData = []
            const totalSections = textStructure.length
            let overallProgress = 0.3

            for (let i = 0; i < totalSections; i++) {
                const section = textStructure[i]
                const sectionProgressWeight = 0.7 / totalSections
                setProcessStatus(`Processing section ${i + 1}/${totalSections}...`)
                console.log(`Processing section ${i + 1}/${totalSections}: ${section.name}`)

                const processedSection = { name: section.name, sentences: [] }
                const sentenceBatches = createOptimizedBatches(section.sentences)
                const batchProgressIncrement = sectionProgressWeight / sentenceBatches.length

                for (let j = 0; j < sentenceBatches.length; j++) {
                    const batch = sentenceBatches[j]
                    setProcessStatus(`Processing section ${i + 1}, batch ${j + 1}/${sentenceBatches.length} (${batch.length} sentences)...`)
                    console.log(`Processing batch ${j + 1}/${sentenceBatches.length} with ${batch.length} sentences`)

                    const processedBatch = await processSentenceBatch(batch, apiKey)
                    processedSection.sentences.push(...processedBatch)
                    overallProgress += batchProgressIncrement
                    setProcessingProgress(overallProgress)
                }
                processedData.push(processedSection)
            }

            console.log('All processing complete!')
            setProcessStatus('Processing complete')
            setProcessingProgress(1)
            return processedData
        } catch (error) {
            console.error('Error in batch processing:', error)
            setProcessStatus(`Error in processing: ${error.message}`)
            return [{
                name: "Error Section",
                sentences: [{
                    sentence: arabicText,
                    meaning: "Processing error occurred",
                    words: []
                }]
            }]
        }
    }

    const handleSectionChange = (sectionIndex) => {
        setCurrentSectionIndex(sectionIndex)
        setCurrentSentenceIndex(0)
        setWordRevealIndex(-1)
        setShowFullSentence(true)
    }

    // Game UI handlers (unchanged)
    const handleNextSentence = () => {
        if (!readerData) return
        const currentSection = readerData[currentSectionIndex]
        if (currentSentenceIndex < currentSection.sentences.length - 1) {
            setCurrentSentenceIndex(currentSentenceIndex + 1)
        } else if (currentSectionIndex < readerData.length - 1) {
            setCurrentSectionIndex(currentSectionIndex + 1)
            setCurrentSentenceIndex(0)
        }
        setWordRevealIndex(-1)
        setShowFullSentence(true)
        setPoints(points + 10)
        setStreak(streak + 1)
    }

    const handlePrevSentence = () => {
        if (!readerData) return
        if (currentSentenceIndex > 0) {
            setCurrentSentenceIndex(currentSentenceIndex - 1)
        } else if (currentSectionIndex > 0) {
            setCurrentSectionIndex(currentSectionIndex - 1)
            const prevSection = readerData[currentSectionIndex - 1]
            setCurrentSentenceIndex(prevSection.sentences.length - 1)
        }
        setWordRevealIndex(-1)
        setShowFullSentence(true)
    }

    
    // Progress bar component (unchanged)
    const ProgressBar = ({ progress, width, height = 6, color = '#5c6bc0', backgroundColor = '#e0e0e0' }) => {
        return (
            <View style={{ height, width: width || '100%', backgroundColor, borderRadius: height / 2, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${Math.min(100, Math.max(0, progress * 100))}%`, backgroundColor: color, borderRadius: height / 2 }} />
            </View>
        )
    }

    // Render current sentence (unchanged)
    const renderCurrentSentence = () => {
        if (!readerData || readerData.length === 0) return null
        const currentSection = readerData[currentSectionIndex]
        const currentSentence = currentSection.sentences[currentSentenceIndex]
        if (!currentSentence) return null

        return (
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], backgroundColor: '#f8f8ff', borderRadius: 16, padding: 16, marginVertical: 0, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome5 name="book-reader" size={18} color="#5c6bc0" />
                        <Text style={{ marginLeft: 8, fontSize: 16, color: '#5c6bc0', fontWeight: '500' }}>
                            Sentence {currentSentenceIndex + 1}/{currentSection.sentences.length}
                        </Text>
                    </View>
                </View>
                <View>
                    <View>
                        <Text style={{ fontSize: 24, textAlign: 'right', marginBottom: 12, lineHeight: 36 }}>{currentSentence.sentence}</Text>
                        <Text style={{ fontSize: 18, color: '#555', marginBottom: 16 }}>{currentSentence.meaning}</Text>
                    </View>
                    <View>
                        {currentSentence.words.map((word, index) => (
                            <TouchableOpacity key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: index <= wordRevealIndex ? '#e8f5e9' : '#f5f5f5', padding: 12, borderRadius: 8, marginBottom: 8, opacity: index <= wordRevealIndex ? 1 : 0.7 }} onPress={() => {
                                if (wordRevealIndex < currentSentence.words.length - 1) {
                                    setWordRevealIndex(index)
                                    setPoints(points + 2)
                                }
                            }}>
                                <Text style={{ fontSize: 16, color: index <= wordRevealIndex ? '#2e7d32' : '#aaa' }}>{index <= wordRevealIndex ? word.meaning : '? ? ?'}</Text>
                                <Text style={{ fontSize: 18, fontWeight: '500' }}>{word.word}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Animated.View>
        )
    }

    // Loading screen (unchanged)
    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8ff' }}>
                <StatusBar barStyle="dark-content" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
                        <FontAwesome5 name="bolt" size={60} color="#5c6bc0" style={{ marginBottom: 20 }} />
                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>Processing with AI</Text>
                        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>{processStatus}</Text>
                        <ProgressBar progress={processingProgress} height={8} color="#5c6bc0" backgroundColor="#e0e0e0" />
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                            <ActivityIndicator size="small" color="#5c6bc0" />
                            <Text style={{ marginLeft: 10, color: '#5c6bc0', fontWeight: '500' }}>{Math.round(processingProgress * 100)}% Complete</Text>
                        </View>
                        <Text style={{ fontSize: 14, color: '#999', marginTop: 24, textAlign: 'center' }}>We're analyzing the Arabic text to create{'\n'}an interactive learning experience for you, this will only happen once</Text>
                    </View>
                </View>
            </SafeAreaView>
        )
    }

    // Main render
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />
            {/* Header with regenerate button */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
                    <Ionicons name="arrow-back" size={24} color="#333" />
                    <Text className="ml-2 text-base text-gray-800">Back</Text>
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-800">{lesson.title || 'Arabic Reader'}</Text>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={handleRegenerate} disabled={loading} className={`mr-2 ${loading ? 'opacity-50' : ''}`}>
                        <FontAwesome5 name="sync" size={20} color="#333" />
                    </TouchableOpacity>
                    <View className="bg-green-100 px-2 py-1 rounded-full flex-row items-center">
                        <FontAwesome5 name="star" size={14} color="#4caf50" />
                        <Text className="ml-1 text-green-600 font-bold">{points}</Text>
                    </View>
                    <View className="bg-orange-100 px-2 py-1 rounded-full flex-row items-center ml-2">
                        <FontAwesome5 name="fire" size={14} color="#ff9800" />
                        <Text className="ml-1 text-orange-600 font-bold">{streak}</Text>
                    </View>
                </View>
            </View>

            {/* Section selector */}
            {readerData && readerData.length > 0 && (
                <ReaderSelector sections={readerData} currentSectionIndex={currentSectionIndex} onSelectSection={handleSectionChange} className="mx-4 mt-4" />
            )}

            <View className="px-6">
                <ProgressBar progress={(currentSentenceIndex + 1) / (readerData[currentSectionIndex].sentences.length)} height={8} color="#5c6bc0" backgroundColor="#e0e0e0" />
            </View>

            {/* Main content */}
            <ScrollView style={{ flex: 1, padding: 16 }}>{renderCurrentSentence()}</ScrollView>

            {/* Navigation controls */}
            <View className="flex-row justify-between p-4 border-t border-gray-200 bg-white">
                <TouchableOpacity onPress={handlePrevSentence} className={`bg-gray-100 p-3 rounded-lg flex-row items-center justify-center w-5/12 ${(currentSectionIndex === 0 && currentSentenceIndex === 0) ? 'opacity-50' : ''}`} disabled={currentSectionIndex === 0 && currentSentenceIndex === 0}>
                    <Ionicons name="arrow-back" size={20} color="#666" />
                    <Text className="ml-2 text-gray-600 font-medium">Previous</Text>
                </TouchableOpacity>
                {(currentSectionIndex === readerData.length - 1 && currentSentenceIndex === readerData[currentSectionIndex].sentences.length - 1) ? (
                    <TouchableOpacity onPress={async () => {
                        let oldScore = parseInt(await SecureStore.getItemAsync("score-" + subInt)) || 0
                        let score = oldScore
                        let pointsToAdd = 0
                        for (let i = 0; i < lesson.tools.length; i++) {
                            if (lesson.tools[i].name === "arabic-reader") pointsToAdd += lesson.tools[i].score
                        }
                        score += pointsToAdd
                        setScoreAdded(pointsToAdd)
                        setTotalScore(score)
                        setShowCompletionModal(true)
                        scoreAnim.setValue(0)
                        Animated.timing(scoreAnim, { toValue: 1, duration: 1500, useNativeDriver: false }).start()
                        await SecureStore.setItemAsync('score-' + subInt, score + "")
                    }} className="bg-green-600 p-3 rounded-lg flex-row items-center justify-center w-5/12">
                        <Text className="mr-2 text-white font-medium">Complete</Text>
                        <Ionicons name="checkmark-outline" size={20} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleNextSentence} className="bg-indigo-600 p-3 rounded-lg flex-row items-center justify-center w-5/12">
                        <Text className="mr-2 text-white font-medium">Next</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Completion modal (unchanged) */}
            <Modal visible={showCompletionModal} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{ backgroundColor: 'white', borderRadius: 20, padding: 24, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 }}>
                        <View style={{ backgroundColor: '#FFF9C4', borderRadius: 50, width: 100, height: 100, justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                            <MaterialCommunityIcons name="trophy-award" size={60} color="#FFC107" />
                        </View>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>Lesson Complete!</Text>
                        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>Great job! You've finished this reading exercise.</Text>
                        <View style={{ backgroundColor: '#E8F5E9', borderRadius: 12, padding: 16, width: '100%', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={{ fontSize: 16, color: '#388E3C', marginBottom: 8 }}>Points Earned:</Text>
                            <Animated.Text style={{ fontSize: 36, fontWeight: 'bold', color: '#2E7D32', transform: [{ scale: scoreAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.3, 1] }) }] }}>
                                +{parseInt(scoreAdded)}
                            </Animated.Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <FontAwesome5 name="star" size={20} color="#FFC107" />
                            <Text style={{ marginLeft: 8, fontSize: 16, color: '#555' }}>Total Score: {totalScore}</Text>
                        </View>
                        <TouchableOpacity onPress={() => { setShowCompletionModal(false); router.back() }} style={{ backgroundColor: '#5c6bc0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', alignItems: 'center' }}>
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default ArabicReader