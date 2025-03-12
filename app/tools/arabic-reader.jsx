import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import axios from 'axios'
import { GoogleGenerativeAI } from '@google/generative-ai'

const ArabicReader = () => {
    const { exp } = useLocalSearchParams()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [readerData, setReaderData] = useState(null)
    const [sentence, setSentence] = useState('')
    const [processStatus, setProcessStatus] = useState('Initializing...')

    const { subject, index, subInt, lesson } = JSON.parse(exp)
    const dataUrl = lesson.data
    console.log(dataUrl)

    // Constants for batch processing
    const BATCH_SIZE = 5 // Process 5 sentences at once
    const MAX_TOKENS = 5000 // Target token limit for each request

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Step 1: Download the sentence from dataUrl
                setProcessStatus('Downloading Arabic text...')
                const response = await axios.get(dataUrl)
                const sentenceData = response.data
                setSentence(sentenceData)
                
                // Step 2: Try to get readerData from secure-store
                const storageKey = `arabic-reader-${subInt}-${index}`
                const storedData = await SecureStore.getItemAsync(storageKey)
                
                if (storedData) {
                    // Use stored data if available
                    console.log('Using stored reader data')
                    setProcessStatus('Using cached data...')
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
                setLoading(false)
            }
        }
        
        fetchData()
    }, [])
    
    // Step 1: Extract structure and split text into sections and sentences
    const extractTextStructure = async (arabicText, apiKey) => {
        try {
            setProcessStatus('Extracting text structure...')
            console.log('Extracting text structure')
            
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
            
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
            For each section, split the text small sentences.
            Do not include any translations or additional information - ONLY the original Arabic text structure.
            `;
            
            const structureResult = await model.generateContent(structurePrompt)
            const structureResponse = structureResult.response.text()
            
            // Find JSON content
            const jsonMatch = structureResponse.match(/\[\s*\{[\s\S]*\}\s*\]/);
            const jsonString = jsonMatch ? jsonMatch[0] : structureResponse;
            const structure = JSON.parse(jsonString);
            
            console.log('Text structure extracted:', structure);
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
    
    // Step 2: Process a batch of sentences together
    const processSentenceBatch = async (sentences, apiKey) => {
        try {
            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' })
            
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
            
            for (let i = 0; i < textStructure.length; i++) {
                const section = textStructure[i]
                setProcessStatus(`Processing section ${i+1}/${textStructure.length}...`)
                console.log(`Processing section ${i+1}/${textStructure.length}: ${section.name}`)
                
                const processedSection = {
                    name: section.name,
                    sentences: []
                }
                
                // Create optimized batches for this section
                const sentenceBatches = createOptimizedBatches(section.sentences);
                
                // Process each batch
                for (let j = 0; j < sentenceBatches.length; j++) {
                    const batch = sentenceBatches[j];
                    setProcessStatus(`Processing section ${i+1}, batch ${j+1}/${sentenceBatches.length} (${batch.length} sentences)...`);
                    console.log(`Processing batch ${j+1}/${sentenceBatches.length} with ${batch.length} sentences`);
                    
                    const processedBatch = await processSentenceBatch(batch, apiKey);
                    processedSection.sentences.push(...processedBatch);
                }
                
                processedData.push(processedSection);
            }
            
            console.log('All processing complete!');
            setProcessStatus('Processing complete');
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

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{processStatus}</Text>
            </View>
        )
    }

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            <View style={{ padding: 16 }}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                    <Text style={{ marginLeft: 8, fontSize: 16 }}>Back</Text>
                </TouchableOpacity>
                
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>
                    {lesson.title || 'Arabic Reader'}
                </Text>
                
                {readerData && (
                    <ScrollView style={{ marginTop: 16 }}>
                        {readerData.map((section, sectionIndex) => (
                            <View key={sectionIndex} style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
                                    {section.name}
                                </Text>
                                
                                {section.sentences.map((item, sentenceIndex) => (
                                    <View key={sentenceIndex} style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                                        <Text style={{ fontSize: 20, textAlign: 'right', marginBottom: 8, lineHeight: 32 }}>
                                            {item.sentence}
                                        </Text>
                                        <Text style={{ fontSize: 16, marginBottom: 12, color: '#555' }}>
                                            {item.meaning}
                                        </Text>
                                        
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 4 }}>
                                            Word Breakdown:
                                        </Text>
                                        
                                        {item.words.map((word, wordIndex) => (
                                            <View key={wordIndex} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                                                <Text style={{ fontSize: 16 }}>{word.meaning}</Text>
                                                <Text style={{ fontSize: 18, fontWeight: '500' }}>{word.word}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        ))}
                    </ScrollView>
                )}
                
                {!readerData && (
                    <View style={{ padding: 16, alignItems: 'center' }}>
                        <Text>No reader data available</Text>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}

export default ArabicReader