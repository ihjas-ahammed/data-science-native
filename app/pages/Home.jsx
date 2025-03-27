import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Define initial course data (unchanged) - TRUNCATED FOR BREVITY
const initialCourseData = { /* ... same as before ... */ };

// --- Constants ---
const COURSE_DATA_FILE = `${FileSystem.documentDirectory}course.json`;
const PROGRESS_DATA_FILE = `${FileSystem.documentDirectory}progress.json`;
const PROFILE_DATA_FILE = `${FileSystem.documentDirectory}profile.json`;
const DATA_REFRESH_INTERVAL = 60 * 1000; // 1 minute
const XP_PER_VIEW = 5;
const XP_LEVEL_FACTOR = 100;

// --- Helper Functions ---

/**
 * Generates a consistent, serialised ID from course title and module text.
 * Converts to lowercase, replaces non-alphanumeric chars with underscores.
 * IMPORTANT: Relies on stable and unique title/text combinations.
 * @param {string} courseTitle
 * @param {string} moduleText
 * @returns {string} A generated module identifier
 */
const generateModuleId = (courseTitle, moduleText) => {
    if (!courseTitle || !moduleText) {
        console.warn("Cannot generate module ID without courseTitle and moduleText");
        return `invalid_module_${Date.now()}_${Math.random()}`;
    }
    const safeTitle = courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const safeText = moduleText.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return `course_${safeTitle}__module_${safeText}`;
};

const calculateLevelInfo = (totalXP) => {
    let level = 1;
    let xpForNextLevel = XP_LEVEL_FACTOR;
    let xpAtLevelStart = 0;
    while (totalXP >= xpAtLevelStart + xpForNextLevel) {
        xpAtLevelStart += xpForNextLevel;
        level++;
        // Example: Level 1 needs 100, Level 2 needs 2*2*100=400, Level 3 needs 3*3*100=900 etc.
        // You might want a simpler progression like level * XP_LEVEL_FACTOR
        xpForNextLevel = level * level * XP_LEVEL_FACTOR;
    }
    const xpInCurrentLevel = totalXP - xpAtLevelStart;
    return { level, xpInCurrentLevel, xpForNextLevel, totalXP };
};


// --- Data Management Hook ---
const useGamifiedData = () => {
    const [courseData, setCourseData] = useState(null);
    const [progressData, setProgressData] = useState({}); // { generatedModuleId: { views: number, completed: boolean } }
    const [profileData, setProfileData] = useState({ totalXP: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- File System Operations ---
    // saveData remains largely the same, but we won't await it directly in callbacks
    const saveData = useCallback(async (filePath, data) => {
        try {
            await FileSystem.writeAsStringAsync(filePath, JSON.stringify(data), { encoding: FileSystem.EncodingType.UTF8 });
            // console.log(`Data saved successfully to ${filePath}`); // Optional: for debugging
        } catch (err) {
            // Log error, could potentially add more robust error handling/reporting later
            console.error(`Error saving data to ${filePath}:`, err);
            // Maybe update an error state specific to saving? For now, just log.
        }
    }, []); // No dependencies needed

    // loadData remains the same
    const loadData = useCallback(async (filePath, defaultData) => {
        try {
            const info = await FileSystem.getInfoAsync(filePath);
            if (info.exists) {
                const fileContent = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.UTF8 });
                // Add extra validation for parsed data
                try {
                    const parsedData = JSON.parse(fileContent);
                     // Ensure it's a non-null object before returning
                    if (typeof parsedData === 'object' && parsedData !== null) {
                         return parsedData;
                    } else {
                        console.warn(`Invalid data structure loaded from ${filePath}. Using default.`);
                        await saveData(filePath, defaultData); // Overwrite corrupted/invalid data
                        return defaultData;
                    }
                } catch (parseError) {
                    console.error(`Error parsing JSON from ${filePath}:`, parseError);
                    setError(`Failed to parse ${filePath.split('/').pop()}. Using defaults and overwriting.`);
                    await saveData(filePath, defaultData); // Overwrite corrupted data
                    return defaultData;
                }
            } else {
                // File doesn't exist, create it with default data
                await saveData(filePath, defaultData);
                return defaultData;
            }
        } catch (err) {
            console.error(`Error loading data from ${filePath}:`, err);
            setError(`Failed to load ${filePath.split('/').pop()}. Using defaults.`);
            return defaultData; // Return default data on error
        }
    }, [saveData]); // Add saveData as dependency for the overwrite case

    // downloadCourseData remains the same
     const downloadCourseData = useCallback(async (currentData) => {
        try {
            // Use cache-busting query param if needed
            const response = await fetch(`https://ihjas-ahammed.github.io/course.json?cb=${Date.now()}`);
            if (response.ok) {
                const downloadedData = await response.json();
                if (JSON.stringify(downloadedData) !== JSON.stringify(currentData)) {
                    console.log("Downloaded new course data.");
                    setCourseData(downloadedData);
                    // Save the new data in the background
                    saveData(COURSE_DATA_FILE, downloadedData);
                } else {
                    console.log("Course data is up-to-date.");
                }
            } else {
                 console.warn(`Failed to download course data: ${response.status}`);
                 // Optionally set an error state if download fails consistently
            }
        } catch (err) {
            console.log('No internet or failed to download course data:', err);
             // Optionally set an error state
        }
    }, [saveData]); // Add saveData dependency

    // useEffect for initialization and refresh remains the same structure
     useEffect(() => {
        let isMounted = true;
        const initializeData = async () => {
            setIsLoading(true);
            setError(null); // Reset error on load
            // Load all data concurrently
            const [loadedCourses, loadedProgress, loadedProfile] = await Promise.all([
                loadData(COURSE_DATA_FILE, initialCourseData),
                loadData(PROGRESS_DATA_FILE, {}),
                loadData(PROFILE_DATA_FILE, { totalXP: 0 }),
            ]);

            if (isMounted) {
                setCourseData(loadedCourses);
                setProgressData(loadedProgress);
                setProfileData(loadedProfile);
                setIsLoading(false);
                // Trigger background download after initial load
                downloadCourseData(loadedCourses);
            }
        };

        initializeData();

        // Set up interval for periodic refresh
        const intervalId = setInterval(() => {
             // Use functional update for setCourseData to get the latest state
             // if downloadCourseData relies on it, though here it receives `current` directly.
             setCourseData(current => {
                downloadCourseData(current); // Trigger background download
                return current; // Return current state, download will update it later if needed
             });
        }, DATA_REFRESH_INTERVAL);

        return () => {
            isMounted = false;
            clearInterval(intervalId); // Clear interval on unmount
        };
    }, [loadData, downloadCourseData]); // Add dependencies


    // --- Gamification Actions ---

    const incrementViewCount = useCallback((generatedModuleId) => {
        if (!generatedModuleId || generatedModuleId.startsWith('invalid_module')) {
            console.warn("incrementViewCount called with invalid generatedModuleId:", generatedModuleId);
            return;
        }

        // --- Optimistic UI Updates ---
        // Update progress state immediately
        const newProgressData = { ...progressData };
        const currentModuleProgress = newProgressData[generatedModuleId] || { views: 0, completed: false };
        newProgressData[generatedModuleId] = { ...currentModuleProgress, views: currentModuleProgress.views + 1 };
        setProgressData(newProgressData);

        // Update profile state immediately
        const newTotalXP = profileData.totalXP + XP_PER_VIEW;
        const newProfileData = { ...profileData, totalXP: newTotalXP };
        setProfileData(newProfileData);
        // --- End Optimistic Updates ---

        // --- Trigger Background Saves (Fire and Forget) ---
        // We don't await these promises. saveData handles errors internally.
        saveData(PROGRESS_DATA_FILE, newProgressData);
        saveData(PROFILE_DATA_FILE, newProfileData);
        // --- End Background Saves ---

        // console.log(`Module ${generatedModuleId} viewed (optimistic). Total XP: ${newTotalXP}`);

    }, [progressData, profileData, saveData]); // Include saveData dependency

    const toggleModuleCompletion = useCallback((generatedModuleId) => {
        if (!generatedModuleId || generatedModuleId.startsWith('invalid_module')) {
            console.warn("toggleModuleCompletion called with invalid generatedModuleId:", generatedModuleId);
            return;
        }

        // --- Optimistic UI Update ---
        const newProgressData = { ...progressData };
        const currentModuleProgress = newProgressData[generatedModuleId] || { views: 0, completed: false };
        const newModuleProgress = { ...currentModuleProgress, completed: !currentModuleProgress.completed };
        newProgressData[generatedModuleId] = newModuleProgress;
        setProgressData(newProgressData);
         // --- End Optimistic Update ---

        // --- Trigger Background Save (Fire and Forget) ---
        saveData(PROGRESS_DATA_FILE, newProgressData);
        // --- End Background Save ---

        // console.log(`Module ${generatedModuleId} completion toggled to: ${newModuleProgress.completed} (optimistic)`);

    }, [progressData, saveData]); // Include saveData dependency

    // levelInfo calculation remains the same
    const levelInfo = useMemo(() => calculateLevelInfo(profileData.totalXP), [profileData.totalXP]);

    return {
        courseData,
        progressData,
        profileData,
        levelInfo,
        isLoading,
        error,
        incrementViewCount, // Now performs background save
        toggleModuleCompletion, // Now performs background save
    };
};


// --- Gamified Components ---

// Module Button (No changes needed here)
const ModuleButton = ({ module, generatedModuleId, progress, onOpen, onToggleComplete, onQuiz, last }) => {
    const router = useRouter();
    const { text, path, webview, qa2 } = module;
    const { views = 0, completed = false } = progress || {};

    const handleOpenPress = () => {
        onOpen(generatedModuleId); // Calls incrementViewCount
        if (webview) router.push(`/webview${path}`); else router.push(`/notes${path}`);
    };

    const handleTogglePress = () => {
        onToggleComplete(generatedModuleId); // Calls toggleModuleCompletion
    };

    const handleQuizPress = () => {
        onQuiz(generatedModuleId);
    };

    return (
        <View className={`py-3 ${!last ? 'border-b border-gray-200 dark:border-gray-700' : ''} flex-row items-center justify-between space-x-2`}>
            {/* Checkbox */}
             <TouchableOpacity onPress={handleTogglePress} className="p-1" accessibilityLabel={`Mark ${text} as ${completed ? 'incomplete' : 'complete'}`}>
                {completed ? (
                    <MaterialCommunityIcons name="checkbox-marked" size={24} color="#10b981" />
                ) : (
                    <MaterialCommunityIcons name="checkbox-blank-outline" size={24} color="#6b7280" />
                )}
            </TouchableOpacity>

            {/* Text & Views */}
            <TouchableOpacity
                className="flex-1 flex-col"
                activeOpacity={0.7}
                onPress={handleOpenPress}
                accessibilityLabel={`Open module: ${text}, Viewed ${views} times`}
            >
                <Text className={`text-base font-medium ${completed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
                    {text}
                </Text>
                 {views > 0 && (
                    <Text className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                        Viewed {views} {views === 1 ? 'time' : 'times'} (+{views * XP_PER_VIEW} XP)
                    </Text>
                )}
            </TouchableOpacity>

            {/* Quiz Button */}
             {qa2 && (
                <TouchableOpacity
                    className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/50 ml-2"
                    activeOpacity={0.7}
                    onPress={handleQuizPress}
                    accessibilityLabel={`Take quiz for ${text}`}
                >
                    <MaterialIcons name="quiz" size={20} color="#6366f1" />
                </TouchableOpacity>
            )}
        </View>
    );
};

// XPProgressBar (No changes needed)
const XPProgressBar = ({ current, max, height = 8, backgroundColor = 'bg-gray-200 dark:bg-gray-600', fillColor = 'bg-amber-500' }) => {
    const progress = max > 0 ? Math.min(current / max, 1) : 0; // Ensure progress doesn't exceed 1
    return (
      <View className={`h-${height / 4} ${backgroundColor} rounded-full overflow-hidden`}>
        {/* Use inline style for width percentage */}
        <View style={[{ height: '100%', width: `${progress * 100}%` }, styles.progressBarFill]} className={fillColor} />
      </View>
    );
};


// Course Card (No changes needed here, relies on parent passing correct callbacks)
const CourseCard = ({ title, modules = [], progressData, onOpenModule, onToggleModuleComplete, onQuiz }) => {

    const completedModules = modules.filter(m => {
        const generatedId = generateModuleId(title, m.text);
        return progressData[generatedId]?.completed;
    }).length;
    const totalModules = modules.length;
    const progress = totalModules > 0 ? completedModules / totalModules : 0;
    const isMastered = progress === 1 && totalModules > 0;

    const handleQuiz = (generatedModuleId) => {
        const module = modules.find(m => generateModuleId(title, m.text) === generatedModuleId);
        if (module?.qa2) {
             const data = JSON.stringify({ title: module.text, qa: module.qa2 });
             onQuiz(data);
        } else {
            console.warn(`Quiz data not found for generated module ID: ${generatedModuleId}`);
        }
    };

    return (
        <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700 mb-5" accessibilityLabel={`Course: ${title}, ${completedModules} of ${totalModules} modules completed.`}>
             {/* Header */}
             <LinearGradient
                colors={isMastered ? ['#10b981', '#059669'] : ['#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                className="p-4 flex-row items-center justify-between"
            >
                <View className="flex-row items-center">
                    <MaterialIcons name="school" size={26} color="white" />
                    <Text className="text-xl font-bold text-white ml-3">{title}</Text>
                </View>
                {isMastered && (
                    <View className="bg-amber-400 p-1 rounded-full shadow-md" accessibilityLabel="Course Mastered">
                        <MaterialCommunityIcons name="trophy-award" size={24} color="#a16207" />
                    </View>
                )}
            </LinearGradient>

            {/* Content */}
            <View className="p-5">
                {/* Progress Section */}
                 <View className="mb-4">
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm font-medium text-gray-600 dark:text-gray-300">Mastery</Text>
                        <Text className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                            {completedModules} / {totalModules} Completed
                        </Text>
                    </View>
                    <View className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <View
                        // Use inline style for width percentage
                        style={[{ height: '100%', width: `${progress * 100}%` }, styles.progressBarFill]}
                        className={isMastered ? "bg-emerald-500" : "bg-indigo-500"}
                        />
                    </View>
                </View>

                {/* Module List */}
                <View className="flex flex-col">
                    {modules.map((module, idx) => {
                         const generatedModuleId = generateModuleId(title, module.text);
                         return (
                            <ModuleButton
                                key={generatedModuleId}
                                module={module}
                                generatedModuleId={generatedModuleId}
                                progress={progressData[generatedModuleId]}
                                onOpen={onOpenModule}
                                onToggleComplete={onToggleModuleComplete}
                                onQuiz={handleQuiz}
                                last={idx === modules.length - 1}
                            />
                         );
                    })}
                </View>
            </View>
        </View>
    );
};

// --- Main Home Screen ---
// No changes needed here, uses the optimized hook
const Home = () => {
    const router = useRouter();
    const {
        courseData,
        progressData,
        levelInfo,
        isLoading,
        error,
        incrementViewCount,      // Now triggers background save
        toggleModuleCompletion,  // Now triggers background save
    } = useGamifiedData();

    const handleQuizNavigation = (stringifiedData) => {
         // Ensure data is properly encoded for URL
         router.push(`/cog?dt=${encodeURIComponent(stringifiedData)}`);
    }

    // Loading State
     if (isLoading) {
        return (
            <LinearGradient colors={['#f3f4f6', '#e5e7eb']} style={styles.containerCenter}>
                <ActivityIndicator size="large" color="#6366f1" />
                <Text className="mt-3 text-gray-600">Loading your learning journey...</Text>
            </LinearGradient>
        );
    }

    // Error State (Partial data might still be shown if courseData exists)
     if (error && !courseData) {
        return (
            <SafeAreaView style={styles.containerCenter} className="bg-red-100">
                <MaterialIcons name="error-outline" size={40} color="#dc2626" />
                <Text className="mt-3 text-red-700 text-center px-5">{error}</Text>
                <Text className="mt-2 text-red-500 text-center px-5">Could not load critical course data.</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <View className="p-4 pt-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <View className="flex-row justify-between items-center mb-1">
                     <Text className="text-lg font-bold text-amber-600 dark:text-amber-400" accessibilityLabel={`Current level: ${levelInfo.level}`}>Level {levelInfo.level}</Text>
                    <Text className="text-sm font-medium text-gray-700 dark:text-gray-200" accessibilityLabel={`Total experience points: ${levelInfo.totalXP}`}>Total XP: {levelInfo.totalXP}</Text>
                </View>
                 <XPProgressBar current={levelInfo.xpInCurrentLevel} max={levelInfo.xpForNextLevel} />
                <Text className="text-xs text-gray-500 dark:text-gray-400 text-right mt-1" accessibilityLabel={`${levelInfo.xpInCurrentLevel} of ${levelInfo.xpForNextLevel} experience points needed for next level`}>
                    {levelInfo.xpInCurrentLevel} / {levelInfo.xpForNextLevel} XP to Level {levelInfo.level + 1}
                </Text>
                {/* Display non-critical errors (like load errors where defaults were used) */}
                {error && <Text className="text-xs text-orange-500 mt-1 text-center" role="alert">{error}</Text>}
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
                {/* Render Course Cards */}
                {courseData?.semester2?.map((course, idx) => {
                     const courseKey = `course-${idx}-${generateModuleId(course.title, '')}`; // Use title in key for better stability
                     return (
                        <CourseCard
                            key={courseKey}
                            title={course.title}
                            modules={course.modules}
                            progressData={progressData}
                            onOpenModule={incrementViewCount}
                            onToggleModuleComplete={toggleModuleCompletion}
                            onQuiz={handleQuizNavigation}
                        />
                     );
                })}

                 {/* Empty State */}
                 {(!courseData || !courseData.semester2 || courseData.semester2.length === 0) && !isLoading && (
                    <View className="items-center justify-center mt-10 p-5 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <MaterialCommunityIcons name="cloud-question" size={40} color="#9ca3af" />
                        <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">No courses available right now. Check back later!</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    containerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // Make sure progressBarFill style doesn't conflict with Tailwind classes
    progressBarFill: { borderRadius: 9999 },
});

export default Home;