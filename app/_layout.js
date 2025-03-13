import { View, Text } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import "./global.css"

const RootLayout = () => {
    return (
        <Stack screenOptions={{ headerShown: false }} />
    )
}



export default RootLayout