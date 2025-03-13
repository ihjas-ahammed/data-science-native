import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Animated, Modal } from 'react-native'
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Step 1: Download the sentence from dataUrl
                setProcessStatus('Downloading Arabic text...')

                setProcessingProgress(0.1)


                // Step 2: Try to get readerData from secure-store
                const storageKey = `arabic-reader-${subInt}-${index}`
                const storedData = await SecureStore.getItemAsync(storageKey)
                let sentenceData;

                if (!lesson.text) {
                    if (!storedData) {
                        const response = await axios.get(dataUrl)
                        sentenceData = response.data
                        setSentence(sentenceData)
                    } else {
                        sentenceData = storedData
                        setSentence(storedData)
                    }
                } else {
                    sentenceData = lesson.text
                    setSentence(lesson.text)
                }
                setProcessingProgress(0.2)


                if (storedData) {
                    // Use stored data if available
                    console.log('Using stored reader data')
                    setProcessStatus('Using cached data...')
                    setProcessingProgress(0.9)
                    setReaderData(JSON.parse(storedData))
                } else {
                    // Step 3: If not found, use the new optimized batch approach
                    console.log('Processing Arabic text with optimized batch method')
                    const apiKey = await SecureStore.getItemAsync('google-api')

                    if (!apiKey) {
                        console.error('Google API key not found in secure storage')
                        setProcessStatus('Error: API key not found')
                        return
                    }

                    const processedData = await processArabicTextInBatches(sentenceData, apiKey)

                    // Save the processed data to secure store for future use
                    await SecureStore.setItemAsync(storageKey, JSON.stringify(processedData))

                    setReaderData(processedData)
                }
            } catch (error) {
                console.error('Error fetching data:', error)
                setProcessStatus(`Error: ${error.message}`)
            } finally {
                setProcessingProgress(1)
                setTimeout(() => setLoading(false), 500) // Small delay for smooth transition
            }
        }

        fetchData()
    }, [])

    // Animation functions for game UI
    useEffect(() => {
        if (!loading && readerData) {
            // Reset animations when navigating to a new sentence
            fadeAnim.setValue(0)
            slideAnim.setValue(50)

            // Trigger fade in and slide up animations
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                })
            ]).start()
        }
    }, [currentSentenceIndex, currentSectionIndex, loading])

    // Extract structure and split text into sections and sentences
    const extractTextStructure = async (arabicText, apiKey) => {
        try {
            setProcessStatus('Extracting text structure...')
            setProcessingProgress(0.25)
            console.log('Extracting text structure')

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash', generationConfig: {
                    temperature: 0.1, // Low temperature for consistency
                }
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
            For each section, split the text small sentences with 7-10 words
            Do not include any translations or additional information - ONLY the original Arabic text structure.
            also in the arabic text, remove things like titles, which we use as section titles 
            add clear presentation of signs like fathah, kasrah, and shaddah, which are crucial for pronunciation
            only create sections with  a name, if you can't include it with previous section
            `;

            const structureResult = await model.generateContent(structurePrompt)
            const structureResponse = structureResult.response.text()

            // Find JSON content
            const jsonMatch = structureResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            const jsonString = jsonMatch ? jsonMatch[0] : structureResponse;
            const structure = JSON.parse(jsonString);

            console.log('Text structure extracted:', structure);
            setProcessingProgress(0.3)
            return structure;
        } catch (error) {
            console.error('Error extracting text structure:', error);
            // Return a basic structure if extraction fails
            return [{
                name: "النص الأصلي",
                sentences: [arabicText]
            }];
        }
    }

    // Process a batch of sentences together
    const processSentenceBatch = async (sentences, apiKey) => {
        try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: 'gemini-2.0-flash-lite', generationConfig: {
                    temperature: 0.1, // Low temperature for consistency
                }
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
            Make sure to keep the exact same order as in the input array.
            keep clear presentation of signs like fathah, kasrah, and shaddah, which are crucial for pronunciation
            `;

            const result = await model.generateContent(batchPrompt)
            const textResponse = result.response.text()

            // Find JSON content
            const jsonMatch = textResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            const jsonString = jsonMatch ? jsonMatch[0] : textResponse;
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('Error processing sentence batch:', error, sentences);
            // Return basic structures if processing fails
            return sentences.map(sentence => ({
                sentence: sentence,
                meaning: "Translation unavailable",
                words: []
            }));
        }
    }

    // Function to estimate token count (rough approximation)
    const estimateTokens = (text) => {
        // A rough estimate: approximately 1.5 tokens per word for English
        // For Arabic, let's estimate 2 tokens per word to be safe
        const wordCount = text.split(/\s+/).length;
        return wordCount * 2;
    }

    // Group sentences into optimized batches based on token estimates
    const createOptimizedBatches = (sentences) => {
        const batches = [];
        let currentBatch = [];
        let currentTokenCount = 0;

        for (const sentence of sentences) {
            const sentenceTokens = estimateTokens(sentence);

            // If adding this sentence would exceed our target token limit or batch size,
            // finish the current batch and start a new one
            if ((currentTokenCount + sentenceTokens > MAX_TOKENS - 1000) ||
                currentBatch.length >= BATCH_SIZE) {
                if (currentBatch.length > 0) {
                    batches.push([...currentBatch]);
                    currentBatch = [];
                    currentTokenCount = 0;
                }
            }

            // Add the sentence to the current batch
            currentBatch.push(sentence);
            currentTokenCount += sentenceTokens;
        }

        // Add any remaining sentences
        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        return batches;
    }

    // Main function to process the text in optimized batches
    const processArabicTextInBatches = async (arabicText, apiKey) => {
        try {
            // Step 1: Extract the structure
            const textStructure = await extractTextStructure(arabicText, apiKey)

            // Step 2: Process each section and its sentences in batches
            const processedData = []

            const totalSections = textStructure.length
            let overallProgress = 0.3 // Starting after structure extraction

            for (let i = 0; i < textStructure.length; i++) {
                const section = textStructure[i]
                const sectionProgressWeight = 0.7 / totalSections
                setProcessStatus(`Processing section ${i + 1}/${textStructure.length}...`)
                console.log(`Processing section ${i + 1}/${textStructure.length}: ${section.name}`)

                const processedSection = {
                    name: section.name,
                    sentences: []
                }

                // Create optimized batches for this section
                const sentenceBatches = createOptimizedBatches(section.sentences);
                const batchProgressIncrement = sectionProgressWeight / sentenceBatches.length

                // Process each batch
                for (let j = 0; j < sentenceBatches.length; j++) {
                    const batch = sentenceBatches[j];
                    setProcessStatus(`Processing section ${i + 1}, batch ${j + 1}/${sentenceBatches.length} (${batch.length} sentences)...`);
                    console.log(`Processing batch ${j + 1}/${sentenceBatches.length} with ${batch.length} sentences`);

                    const processedBatch = await processSentenceBatch(batch, apiKey);
                    processedSection.sentences.push(...processedBatch);

                    // Update progress
                    overallProgress += batchProgressIncrement
                    setProcessingProgress(overallProgress)
                }

                processedData.push(processedSection);
            }

            console.log('All processing complete!');
            setProcessStatus('Processing complete');
            setProcessingProgress(1)
            return processedData;

        } catch (error) {
            console.error('Error in batch processing:', error);
            setProcessStatus(`Error in processing: ${error.message}`);
            return [{
                name: "Error Section",
                sentences: [{
                    sentence: arabicText,
                    meaning: "Processing error occurred",
                    words: []
                }]
            }];
        }
    }

    const handleSectionChange = (sectionIndex) => {
        setCurrentSectionIndex(sectionIndex)
        setCurrentSentenceIndex(0)
        setWordRevealIndex(-1)
        setShowFullSentence(true)
    }


    // Game UI handlers
    const handleNextSentence = () => {
        if (!readerData) return;

        const currentSection = readerData[currentSectionIndex];
        if (currentSentenceIndex < currentSection.sentences.length - 1) {
            // Move to next sentence in current section
            setCurrentSentenceIndex(currentSentenceIndex + 1);
        } else if (currentSectionIndex < readerData.length - 1) {
            // Move to next section
            setCurrentSectionIndex(currentSectionIndex + 1);
            setCurrentSentenceIndex(0);
        }

        // Reset word reveal state
        setWordRevealIndex(-1);
        setShowFullSentence(true);

        // Add points for completing a sentence
        setPoints(points + 10);
        setStreak(streak + 1);
    }

    const handlePrevSentence = () => {
        if (!readerData) return;

        if (currentSentenceIndex > 0) {
            // Move to previous sentence in current section
            setCurrentSentenceIndex(currentSentenceIndex - 1);
        } else if (currentSectionIndex > 0) {
            // Move to last sentence of previous section
            setCurrentSectionIndex(currentSectionIndex - 1);
            const prevSection = readerData[currentSectionIndex - 1];
            setCurrentSentenceIndex(prevSection.sentences.length - 1);
        }

        // Reset word reveal state
        setWordRevealIndex(-1);
        setShowFullSentence(true);
    }

    const toggleSentenceMode = () => {
        setShowFullSentence(!showFullSentence);
        setWordRevealIndex(-1);
    }

    const revealNextWord = () => {
        if (!readerData) return;

        const currentSection = readerData[currentSectionIndex];
        const currentSentence = currentSection.sentences[currentSentenceIndex];

        if (wordRevealIndex < currentSentence.words.length - 1) {
            setWordRevealIndex(wordRevealIndex + 1);
            // Add points for revealing a word
            setPoints(points + 2);
        }
    }

    // Custom progress bar component
    const ProgressBar = ({ progress, width, height = 6, color = '#5c6bc0', backgroundColor = '#e0e0e0' }) => {
        return (
            <View style={{
                height: height,
                width: width || '100%',
                backgroundColor: backgroundColor,
                borderRadius: height / 2,
                overflow: 'hidden'
            }}>
                <View style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, progress * 100))}%`,
                    backgroundColor: color,
                    borderRadius: height / 2
                }} />
            </View>
        );
    };

    // Render the current sentence and word list with animations
    const renderCurrentSentence = () => {
        if (!readerData || readerData.length === 0) return null;

        const currentSection = readerData[currentSectionIndex];
        const currentSentence = currentSection.sentences[currentSentenceIndex];

        if (!currentSentence) return null;

        return (
            <Animated.View
                style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: '#f8f8ff',
                    borderRadius: 16,
                    padding: 16,
                    marginVertical: 0,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4
                }}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <FontAwesome5 name="book-reader" size={18} color="#5c6bc0" />
                        <Text style={{ marginLeft: 8, fontSize: 16, color: '#5c6bc0', fontWeight: '500' }}>
                            Sentence {currentSentenceIndex + 1}/{currentSection.sentences.length}
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={toggleSentenceMode}
                        style={{
                            backgroundColor: showFullSentence ? '#e3f2fd' : '#bbdefb',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}
                    >
                        <FontAwesome5
                            name={showFullSentence ? "eye" : "list"}
                            size={14}
                            color="#1976d2"
                        />
                        <Text style={{ color: '#1976d2', marginLeft: 4, fontSize: 14 }}>
                            {showFullSentence ? "Sentence" : "Word List"}
                        </Text>
                    </TouchableOpacity>
                </View>

                {showFullSentence ? (
                    <View>
                        <Text style={{ fontSize: 24, textAlign: 'right', marginBottom: 12, lineHeight: 36 }}>
                            {currentSentence.sentence}
                        </Text>
                        <Text style={{ fontSize: 18, color: '#555', marginBottom: 16 }}>
                            {currentSentence.meaning}
                        </Text>
                    </View>
                ) : (
                    <View>
                        {currentSentence.words.map((word, index) => (
                            <TouchableOpacity
                                key={index}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    backgroundColor: index <= wordRevealIndex ? '#e8f5e9' : '#f5f5f5',
                                    padding: 12,
                                    borderRadius: 8,
                                    marginBottom: 8,
                                    opacity: index <= wordRevealIndex ? 1 : 0.7,
                                }}
                                onPress={() => {
                                    if (wordRevealIndex < currentSentence.words.length - 1) {
                                        revealNextWord()
                                    }
                                }}
                            >
                                <Text style={{ fontSize: 16, color: index <= wordRevealIndex ? '#2e7d32' : '#aaa' }}>
                                    {index <= wordRevealIndex ? word.meaning : '? ? ?'}
                                </Text>
                                <Text style={{ fontSize: 18, fontWeight: '500' }}>
                                    {word.word}
                                </Text>
                            </TouchableOpacity>
                        ))}

                    </View>
                )}
            </Animated.View>
        );
    }

    // Custom loading screen
    if (loading) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#f0f8ff' }}>
                <StatusBar barStyle="dark-content" />
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 20,
                        padding: 24,
                        width: '100%',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 5
                    }}>
                        <FontAwesome5 name="brain" size={60} color="#5c6bc0" style={{ marginBottom: 20 }} />

                        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 12 }}>
                            AI Brain Working...
                        </Text>

                        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>
                            {processStatus}
                        </Text>

                        <ProgressBar
                            progress={processingProgress}
                            height={8}
                            color="#5c6bc0"
                            backgroundColor="#e0e0e0"
                        />

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
                            <ActivityIndicator size="small" color="#5c6bc0" />
                            <Text style={{ marginLeft: 10, color: '#5c6bc0', fontWeight: '500' }}>
                                {Math.round(processingProgress * 100)}% Complete
                            </Text>
                        </View>

                        <Text style={{ fontSize: 14, color: '#999', marginTop: 24, textAlign: 'center' }}>
                            We're analyzing the Arabic text to create{'\n'}an interactive learning experience for you
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center"
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                    <Text className="ml-2 text-base text-gray-800">Back</Text>
                </TouchableOpacity>

                <Text className="text-xl font-bold text-gray-800">
                    {lesson.title || 'Arabic Reader'}
                </Text>

                <View className="flex-row items-center">
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

            {/* Current Section Title */}
            {readerData && readerData.length > 0 && (
                <ReaderSelector
                    sections={readerData}
                    currentSectionIndex={currentSectionIndex}
                    onSelectSection={handleSectionChange}
                    className="mx-4 mt-4"
                />
            )}

            <View
                className="px-6">
                <ProgressBar
                    progress={(currentSentenceIndex + 1) / (readerData[currentSectionIndex].sentences.length)}
                    height={8}
                    color="#5c6bc0"
                    backgroundColor="#e0e0e0"
                />
            </View>

            {/* Main Content */}
            <ScrollView style={{ flex: 1, padding: 16 }}>
                {renderCurrentSentence()}
            </ScrollView>

            {/* Navigation Controls */}
            <View className="flex-row justify-between p-4 border-t border-gray-200 bg-white">
                <TouchableOpacity
                    onPress={handlePrevSentence}
                    className={`bg-gray-100 p-3 rounded-lg flex-row items-center justify-center w-5/12 ${(currentSectionIndex === 0 && currentSentenceIndex === 0) ? 'opacity-50' : ''
                        }`}
                    disabled={(currentSectionIndex === 0 && currentSentenceIndex === 0)}
                >
                    <Ionicons name="arrow-back" size={20} color="#666" />
                    <Text className="ml-2 text-gray-600 font-medium">Previous</Text>
                </TouchableOpacity>

                {(
                    currentSectionIndex === readerData.length - 1 &&
                    currentSentenceIndex === readerData[currentSectionIndex].sentences.length - 1
                ) ? (
                    <TouchableOpacity
                        onPress={async () => {
                            let oldScore = parseInt(await SecureStore.getItemAsync("score-" + subInt)) || 0
                            let score = oldScore

                            let pointsToAdd = 0
                            for (let i = 0; i < lesson.tools.length; i++) {
                                if (lesson.tools[i].name == "arabic-reader") pointsToAdd += lesson.tools[i].score
                            }

                            score += pointsToAdd
                            setScoreAdded(pointsToAdd)
                            setTotalScore(score)
                            setShowCompletionModal(true)

                            // Animate the score count up
                            scoreAnim.setValue(0)
                            Animated.timing(scoreAnim, {
                                toValue: 1,
                                duration: 1500,
                                useNativeDriver: false
                            }).start()

                            
                            await SecureStore.setItemAsync('score-' + subInt, score + "")


                        }}
                        className="bg-green-600 p-3 rounded-lg flex-row items-center justify-center w-5/12"
                    >
                        <Text className="mr-2 text-white font-medium">Complete</Text>
                        <Ionicons name="checkmark-outline" size={20} color="white" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={handleNextSentence}
                        className="bg-indigo-600 p-3 rounded-lg flex-row items-center justify-center w-5/12"
                    >
                        <Text className="mr-2 text-white font-medium">Next</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </View>
            {/* Completion Modal */}
            <Modal
                visible={showCompletionModal}
                transparent={true}
                animationType="fade"
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 20,
                        padding: 24,
                        width: '90%',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 10
                    }}>
                        {/* Confetti Animation */}
                        

                        {/* Trophy Icon */}
                        <View style={{
                            backgroundColor: '#FFF9C4',
                            borderRadius: 50,
                            width: 100,
                            height: 100,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <MaterialCommunityIcons name="trophy-award" size={60} color="#FFC107" />
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 8 }}>
                            Lesson Complete!
                        </Text>

                        <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 }}>
                            Great job! You've finished this reading exercise.
                        </Text>

                        <View style={{
                            backgroundColor: '#E8F5E9',
                            borderRadius: 12,
                            padding: 16,
                            width: '100%',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <Text style={{ fontSize: 16, color: '#388E3C', marginBottom: 8 }}>
                                Points Earned:
                            </Text>

                            <Animated.Text style={{
                                fontSize: 36,
                                fontWeight: 'bold',
                                color: '#2E7D32',
                                transform: [{
                                    scale: scoreAnim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [1, 1.3, 1]
                                    })
                                }]
                            }}>
                                +{parseInt(scoreAdded)}
                            </Animated.Text>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <FontAwesome5 name="star" size={20} color="#FFC107" />
                            <Text style={{ marginLeft: 8, fontSize: 16, color: '#555' }}>
                                Total Score: {totalScore}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShowCompletionModal(false)
                                router.back()
                            }}
                            style={{
                                backgroundColor: '#5c6bc0',
                                paddingVertical: 12,
                                paddingHorizontal: 24,
                                borderRadius: 8,
                                width: '100%',
                                alignItems: 'center'
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }}>
                                Continue
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

export default ArabicReader