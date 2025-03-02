import { View, Text, StatusBar, ActivityIndicator } from 'react-native'
import React, { useState, useEffect } from 'react'
import { useLocalSearchParams } from 'expo-router'
import QuizScreen from './pages/QuizPage'
import { SafeAreaView } from 'react-native-safe-area-context'
import RNFS from 'react-native-fs'

const cog = () => {
  const { qa } = useLocalSearchParams()
  const { name, path, obj } = JSON.parse(qa)
  
  const [data, setData] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Define the file path in app's document directory
  const filePath = `${RNFS.DocumentDirectoryPath}/quiz_data/${path}`
  // Get the directory path (parent of the file)
  const directoryPath = filePath.substring(0, filePath.lastIndexOf('/'))

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if file exists
        const fileExists = await RNFS.exists(filePath)
        
        if (fileExists) {
          // Read existing file
          const fileContent = await RNFS.readFile(filePath, 'utf8')
          setData(JSON.parse(fileContent))
        } else {
          // Create all parent directories recursively
          await RNFS.mkdir(directoryPath, {
            NSURLIsExcludedFromBackupKey: true
          })
          
          // Download the file
          const downloadUrl = `https://ihjas-ahammed.github.io/${path}`
          const downloadResult = await RNFS.downloadFile({
            fromUrl: downloadUrl,
            toFile: filePath,
          }).promise

          if (downloadResult.statusCode === 200) {
            const downloadedContent = await RNFS.readFile(filePath, 'utf8')
            setData(JSON.parse(downloadedContent))
          } else {
            throw new Error('Download failed')
          }
        }
      } catch (err) {
        setError('Failed to load quiz data')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [path, filePath, directoryPath]) // Added filePath and directoryPath to dependencies

  // Loading screen
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={{ marginTop: 10 }}>Loading Quiz Data...</Text>
      </SafeAreaView>
    )
  }

  // Error screen
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor="#4f46e5" />
      <QuizScreen sampleQuestions={data[obj]} />
    </SafeAreaView>
  )
}

export default cog