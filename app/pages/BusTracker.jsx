import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar, SafeAreaView, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

// Bus schedule data
const busSchedules = {
  "S.S College": {
    "EDAVANNAPPARA": [
      "06:30 AM", "06:35 AM", "06:40 AM", "06:55 AM", "07:20 AM", "07:40 AM", "07:55 AM",
      "08:10 AM", "08:15 AM", "08:30 AM", "08:40 AM", "08:50 AM", "09:05 AM", "09:25 AM",
      "09:40 AM", "10:05 AM", "10:13 AM", "10:18 AM", "10:40 AM", "10:50 AM", "11:05 AM",
      "11:20 AM", "11:38 AM", "11:55 AM", "12:03 PM", "12:18 PM", "12:30 PM", "12:40 PM",
      "01:08 PM", "01:32 PM", "01:42 PM", "01:50 PM", "01:55 PM", "02:05 PM", "02:15 PM",
      "02:25 PM", "02:48 PM", "03:00 PM", "03:10 PM", "03:25 PM", "03:40 PM", "04:05 PM",
      "04:20 PM", "04:37 PM", "04:50 PM", "04:55 PM", "05:10 PM", "05:22 PM", "05:35 PM",
      "05:45 PM", "05:53 PM", "05:55 PM", "06:03 PM", "06:13 PM", "06:23 PM", "06:35 PM"
    ],
    "AREEKODE": [
      "07:06 AM", "07:28 AM", "07:43 AM", "07:53 AM", "08:03 AM", "08:20 AM", "08:35 AM", 
      "08:50 AM", "09:13 AM", "09:23 AM", "09:35 AM", "09:43 AM", "10:02 AM", "10:20 AM", 
      "10:31 AM", "10:35 AM", "10:53 AM", "11:03 AM", "11:20 AM", "11:30 AM", "11:38 AM", 
      "11:58 AM", "12:18 PM", "12:28 PM", "12:33 PM", "12:43 PM", "12:50 PM", "01:03 PM",
      "01:11 PM", "01:18 PM", "01:31 PM", "01:48 PM", "02:03 PM", "02:16 PM", "02:33 PM", 
      "02:48 PM", "03:10 PM", "03:38 PM", "03:48 PM", "03:58 PM", "04:08 PM", "04:16 PM", 
      "04:33 PM", "04:50 PM", "04:58 PM", "05:10 PM", "05:18 PM", "05:38 PM", "05:43 PM", 
      "06:01 PM", "06:10 PM", "06:18 PM", "06:23 PM", "06:38 PM", "06:48 PM", "07:08 PM"
    ]
  },
  "EDAVANNAPPARA": {
    "S.S College": [
      "08:00 AM", "08:15 AM", "08:35 AM", "08:55 AM", "09:15 AM", "09:30 AM", "09:45 AM",
      "10:05 AM", "10:20 AM", "10:35 AM", "10:50 AM", "11:10 AM", "11:25 AM", "11:40 AM",
      "12:00 PM", "12:15 PM", "12:30 PM", "12:45 PM", "01:00 PM", "01:15 PM", "01:30 PM",
      "01:45 PM", "02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM", "03:00 PM", "03:15 PM",
      "03:30 PM", "03:45 PM", "04:00 PM", "04:15 PM", "04:30 PM", "04:45 PM", "05:00 PM",
      "05:15 PM", "05:30 PM", "05:45 PM", "06:00 PM", "06:15 PM", "06:30 PM"
    ],
    "AREEKODE": [] // Will be filled with calculated times
  },
  "AREEKODE": {
    "S.S College": [],
    "EDAVANNAPPARA": [] // Will be filled with calculated times
  }
};

// Calculate EDAVANNAPPARA to AREEKODE (18 + 2 = 20 minutes travel time)
busSchedules["EDAVANNAPPARA"]["AREEKODE"] = busSchedules["EDAVANNAPPARA"]["S.S College"].map(time => {
  return addMinutesToTime(time, 20);
});

// Calculate AREEKODE to S.S College (direct, approx 2 minutes)
busSchedules["AREEKODE"]["S.S College"] = busSchedules["S.S College"]["AREEKODE"].map(time => {
  return addMinutesToTime(time, 30); // Adding 30 min for return journey
});

// Calculate AREEKODE to EDAVANNAPPARA (approx 18 minutes)
busSchedules["AREEKODE"]["EDAVANNAPPARA"] = busSchedules["S.S College"]["AREEKODE"].map(time => {
  return addMinutesToTime(time, 28); // Adding 28 min for return journey
});

// Helper function to add minutes to a time string
function addMinutesToTime(timeStr, minutesToAdd) {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  totalMinutes += minutesToAdd;
  
  let newHours = Math.floor(totalMinutes / 60);
  let newMinutes = totalMinutes % 60;
  
  let newPeriod = period;
  if (newHours > 12) {
    newHours -= 12;
    if (period === 'AM') newPeriod = 'PM';
  }
  
  if (newHours === 12 && period === 'AM') {
    newPeriod = 'PM';
  }
  
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')} ${newPeriod}`;
}

// Convert time string to minutes since midnight for comparison
function timeToMinutes(timeStr) {
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let totalMinutes = hours * 60 + minutes;
  if (period === 'PM' && hours !== 12) {
    totalMinutes += 12 * 60;
  } else if (period === 'AM' && hours === 12) {
    totalMinutes -= 12 * 60;
  }
  
  return totalMinutes;
}

// Get current time in the format "HH:MM AM/PM"
function getCurrentTime() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // Convert 0 to 12
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function BusScheduleApp() {
  const [origin, setOrigin] = useState("S.S College");
  const [destination, setDestination] = useState("EDAVANNAPPARA");
  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [nextBus, setNextBus] = useState(null);
  
  const locations = ["S.S College", "EDAVANNAPPARA", "AREEKODE"];
  
  useEffect(() => {
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    // Find next bus whenever origin/destination/time changes
    findNextBus();
  }, [origin, destination, currentTime]);
  
  const findNextBus = () => {
    if (!busSchedules[origin] || !busSchedules[origin][destination] || busSchedules[origin][destination].length === 0) {
      setNextBus(null);
      return;
    }
    
    const currentMinutes = timeToMinutes(currentTime);
    let closestBus = null;
    let smallestDifference = Infinity;
    
    for (const time of busSchedules[origin][destination]) {
      const busMinutes = timeToMinutes(time);
      const difference = busMinutes - currentMinutes;
      
      if (difference >= 0 && difference < smallestDifference) {
        smallestDifference = difference;
        closestBus = {
          time,
          minutes: difference
        };
      }
    }
    
    // If no bus found for today, get the first bus for tomorrow
    if (!closestBus && busSchedules[origin][destination].length > 0) {
      const firstBusTomorrow = busSchedules[origin][destination][0];
      const tomorrowMinutes = timeToMinutes(firstBusTomorrow) + 24 * 60;
      const difference = tomorrowMinutes - currentMinutes;
      
      closestBus = {
        time: firstBusTomorrow,
        minutes: difference,
        tomorrow: true
      };
    }
    
    setNextBus(closestBus);
  };
  
  const handleOriginChange = (newOrigin) => {
    if (newOrigin === destination) {
      // Swap origin and destination
      setOrigin(newOrigin);
      setDestination(origin);
    } else {
      setOrigin(newOrigin);
    }
  };
  
  const handleDestinationChange = (newDestination) => {
    if (newDestination === origin) {
      // Swap origin and destination
      setDestination(newDestination);
      setOrigin(destination);
    } else {
      setDestination(newDestination);
    }
  };
  
  const formatTimeRemaining = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
  };
  
  const getRouteInfo = () => {
    if (origin === "S.S College" && destination === "EDAVANNAPPARA") {
      return "Direct - 18 min";
    } else if (origin === "S.S College" && destination === "AREEKODE") {
      return "Direct - 20 min";
    } else if (origin === "EDAVANNAPPARA" && destination === "S.S College") {
      return "Direct - 18 min";
    } else if (origin === "EDAVANNAPPARA" && destination === "AREEKODE") {
      return "Direct - 20 min";
    } else if (origin === "AREEKODE" && destination === "S.S College") {
      return "Direct - 2 min";
    } else if (origin === "AREEKODE" && destination === "EDAVANNAPPARA") {
      return "Direct - 18 min";
    }
    return "Route info unavailable";
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80' }}
        style={styles.backgroundImage}
        blurRadius={3}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(20,20,40,0.9)']}
          style={styles.container}
        >
          <View style={styles.header}>
            <Text style={styles.title}>BusTime</Text>
            <Text style={styles.currentTime}>{currentTime}</Text>
          </View>
          
          <View style={styles.routeSelector}>
            <View style={styles.locationSelector}>
              <Text style={styles.selectorLabel}>From</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={`origin-${loc}`}
                    style={[
                      styles.locationButton,
                      origin === loc && styles.locationButtonActive
                    ]}
                    onPress={() => handleOriginChange(loc)}
                  >
                    <Text style={[
                      styles.locationButtonText,
                      origin === loc && styles.locationButtonTextActive
                    ]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <TouchableOpacity 
              style={styles.swapButton}
              onPress={() => {
                const temp = origin;
                setOrigin(destination);
                setDestination(temp);
              }}
            >
              <Ionicons name="swap-vertical" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.locationSelector}>
              <Text style={styles.selectorLabel}>To</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationScroll}>
                {locations.map((loc) => (
                  <TouchableOpacity
                    key={`dest-${loc}`}
                    style={[
                      styles.locationButton,
                      destination === loc && styles.locationButtonActive,
                      loc === origin && styles.locationButtonDisabled
                    ]}
                    onPress={() => handleDestinationChange(loc)}
                    disabled={loc === origin}
                  >
                    <Text style={[
                      styles.locationButtonText,
                      destination === loc && styles.locationButtonTextActive,
                      loc === origin && styles.locationButtonTextDisabled
                    ]}>
                      {loc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
          
          <View style={styles.nextBusCard}>
            <Text style={styles.nextBusTitle}>Next Bus</Text>
            {nextBus ? (
              <>
                <View style={styles.nextBusTimeContainer}>
                  <Text style={styles.nextBusTime}>{nextBus.time}</Text>
                  {nextBus.tomorrow && (
                    <Text style={styles.tomorrowIndicator}>Tomorrow</Text>
                  )}
                </View>
                
                <View style={styles.busInfoContainer}>
                  <View style={styles.busInfoItem}>
                    <Ionicons name="time-outline" size={20} color="#fff" />
                    <Text style={styles.busInfoText}>
                      {formatTimeRemaining(nextBus.minutes)} remaining
                    </Text>
                  </View>
                  
                  <View style={styles.busInfoItem}>
                    <Ionicons name="git-network-outline" size={20} color="#fff" />
                    <Text style={styles.busInfoText}>{getRouteInfo()}</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.noBusText}>No bus schedule available for this route</Text>
            )}
          </View>
          
          <View style={styles.scheduleContainer}>
            <Text style={styles.scheduleTitle}>Today's Schedule</Text>
            {busSchedules[origin] && busSchedules[origin][destination] && busSchedules[origin][destination].length > 0 ? (
              <ScrollView style={styles.scheduleList}>
                {busSchedules[origin][destination].map((time, index) => {
                  const isPassed = timeToMinutes(time) < timeToMinutes(currentTime);
                  const isNext = nextBus && time === nextBus.time;
                  
                  return (
                    <View 
                      key={index} 
                      style={[
                        styles.scheduleItem,
                        isPassed && styles.scheduleItemPassed,
                        isNext && styles.scheduleItemNext
                      ]}
                    >
                      <Text style={[
                        styles.scheduleTime,
                        isPassed && styles.scheduleTimePassed,
                        isNext && styles.scheduleTimeNext
                      ]}>
                        {time}
                      </Text>
                      
                      {isNext && (
                        <View style={styles.nextIndicator}>
                          <Text style={styles.nextIndicatorText}>NEXT</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.noScheduleText}>No schedule available for this route</Text>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentTime: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  routeSelector: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  locationSelector: {
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  locationScroll: {
    flexDirection: 'row',
  },
  locationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  locationButtonActive: {
    backgroundColor: '#3f51b5',
  },
  locationButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  locationButtonTextActive: {
    fontWeight: 'bold',
  },
  locationButtonTextDisabled: {
    color: 'rgba(255,255,255,0.3)',
  },
  swapButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  nextBusCard: {
    backgroundColor: 'rgba(63, 81, 181, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  nextBusTitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  nextBusTimeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  nextBusTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  tomorrowIndicator: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 4,
  },
  busInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 8,
  },
  busInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busInfoText: {
    color: '#fff',
    marginLeft: 4,
  },
  noBusText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  scheduleContainer: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  scheduleTitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 12,
  },
  scheduleList: {
    flex: 1,
  },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  scheduleItemPassed: {
    opacity: 0.5,
  },
  scheduleItemNext: {
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  scheduleTime: {
    color: '#fff',
    fontSize: 16,
  },
  scheduleTimePassed: {
    textDecorationLine: 'line-through',
  },
  scheduleTimeNext: {
    fontWeight: 'bold',
  },
  nextIndicator: {
    backgroundColor: '#3f51b5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nextIndicatorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  noScheduleText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  }
});