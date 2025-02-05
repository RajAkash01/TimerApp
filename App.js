import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Modal,
  Animated,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';

const TimerApp = () => {
  const [timers, setTimers] = useState([]);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [completedTimer, setCompletedTimer] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [categoryHeights, setCategoryHeights] = useState({});
  const [progressValues, setProgressValues] = useState({});
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadTimers();
  }, []);

  const loadTimers = async () => {
    const data = await AsyncStorage.getItem('timers');
    if (data) setTimers(JSON.parse(data));
  };

  const saveTimers = async updatedTimers => {
    setTimers(updatedTimers);
    await AsyncStorage.setItem('timers', JSON.stringify(updatedTimers));
  };

  const addTimer = () => {
    if (!name || !duration || !category) return;
    const newTimer = {
      id: Date.now(),
      name,
      duration: parseInt(duration),
      remaining: parseInt(duration),
      category,
      status: 'Paused',
      halfwayAlert: false, // Default halfway alert as false
      halfwayDuration: Math.floor(parseInt(duration) / 2),
    };
    saveTimers([...timers, newTimer]);
    setName('');
    setDuration('');
    setCategory('');
  };

  const startTimer = id => {
    const updatedTimers = timers.map(timer => {
      if (timer.id === id && timer.status !== 'Completed') {
        return {...timer, status: 'Running'};
      }
      return timer;
    });
    saveTimers(updatedTimers);
  };

  const pauseTimer = id => {
    const updatedTimers = timers.map(timer => {
      if (timer.id === id && timer.status === 'Running') {
        return {...timer, status: 'Paused'};
      }
      return timer;
    });
    saveTimers(updatedTimers);
  };

  const resetTimer = id => {
    const updatedTimers = timers.map(timer => {
      if (timer.id === id) {
        return {...timer, remaining: timer.duration, status: 'Paused'};
      }
      return timer;
    });
    saveTimers(updatedTimers);
  };

  const toggleHalfwayAlert = (id, value) => {
    const updatedTimers = timers.map(timer => {
      if (timer.id === id) {
        return {...timer, halfwayAlert: value};
      }
      return timer;
    });
    saveTimers(updatedTimers);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = timers.map(timer => {
        if (timer.status === 'Running' && timer.remaining > 0) {
          const progress = (timer.duration - timer.remaining) / timer.duration;
          setProgressValues(prev => ({
            ...prev,
            [timer.id]: progress,
          }));

          // Check if it's halfway through the timer and the alert hasn't been shown yet
          if (timer.halfwayAlert && timer.remaining === timer.halfwayDuration) {
            Alert.alert(
              'Halfway Alert!',
              `${timer.name} has reached halfway (${timer.halfwayDuration} seconds).`,
            );
            // Disable the halfway alert after it has been triggered
            timer.halfwayAlert = false; // Disable alert after it's triggered
          }

          return {...timer, remaining: timer.remaining - 1};
        } else if (timer.remaining === 0 && timer.status === 'Running') {
          setCompletedTimer(timer);
          setModalVisible(true);
          return {...timer, status: 'Completed'};
        }
        return timer;
      });
      saveTimers(updatedTimers);
    }, 1000);
    return () => clearInterval(interval);
  }, [timers]);

  const toggleCategory = category => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }));

    const toValue = expandedCategories[category] ? 0 : 1;
    Animated.timing(categoryHeights[category], {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const startAllTimersInCategory = category => {
    const updatedTimers = timers.map(timer => {
      if (timer.category === category && timer.status !== 'Completed') {
        return {...timer, status: 'Running'};
      }
      return timer;
    });
    saveTimers(updatedTimers);
  };

  const pauseAllTimersInCategory = category => {
    const updatedTimers = timers.map(timer => {
      if (timer.category === category && timer.status === 'Running') {
        return {...timer, status: 'Paused'};
      }
      return timer;
    });
    saveTimers(updatedTimers);
  };

  const groupedTimers = timers.reduce((acc, timer) => {
    if (!acc[timer.category]) acc[timer.category] = [];
    acc[timer.category].push(timer);
    return acc;
  }, {});

  const completedTimers = timers.filter(timer => timer.status === 'Completed');

  return (
    <ScrollView style={{padding: 20}}>
      <Button
        title="Show History"
        onPress={() => setShowHistory(!showHistory)}
      />
      {!showHistory ? (
        <>
          <TextInput placeholder="Name" value={name} onChangeText={setName} />
          <TextInput
            placeholder="Duration"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Category"
            value={category}
            onChangeText={setCategory}
          />
          <Button title="Add Timer" onPress={addTimer} />
          {Object.keys(groupedTimers).map(category => {
            if (!categoryHeights[category]) {
              categoryHeights[category] = new Animated.Value(0);
            }

            return (
              <View key={category}>
                <TouchableOpacity
                  onPress={() => toggleCategory(category)}
                  style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text
                    style={{fontWeight: 'bold', marginVertical: 5, flex: 1}}>
                    {category}
                  </Text>
                  <Icon
                    name={
                      expandedCategories[category]
                        ? 'chevron-up'
                        : 'chevron-down'
                    }
                    size={20}
                    color="black"
                  />
                </TouchableOpacity>
                <Button
                  title={`Start All ${category}`}
                  onPress={() => startAllTimersInCategory(category)}
                />
                <Button
                  title={`Pause All ${category}`}
                  onPress={() => pauseAllTimersInCategory(category)}
                />
                <Animated.View
                  style={{
                    overflow: 'hidden',
                    height: categoryHeights[category].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 300],
                    }),
                  }}>
                  <FlatList
                    data={groupedTimers[category]}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({item}) => (
                      <View style={{padding: 10, borderBottomWidth: 1}}>
                        <Text>
                          {item.name} - {item.remaining}s ({item.status})
                        </Text>
                        <View
                          style={{
                            marginTop: 10,
                            marginBottom: 10,
                            height: 10,
                            backgroundColor: '#e0e0e0',
                          }}>
                          <Animated.View
                            style={{
                              height: '100%',
                              width: progressValues[item.id]
                                ? `${progressValues[item.id] * 100}%`
                                : '0%',
                              backgroundColor: 'green',
                            }}
                          />
                        </View>
                        <Button
                          title="Start"
                          onPress={() => startTimer(item.id)}
                        />
                        <Button
                          title="Pause"
                          onPress={() => pauseTimer(item.id)}
                        />
                        <Button
                          title="Reset"
                          onPress={() => resetTimer(item.id)}
                        />
                        <View
                          style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Text>Enable Halfway Alert</Text>
                          <Switch
                            value={item.halfwayAlert}
                            onValueChange={value =>
                              toggleHalfwayAlert(item.id, value)
                            }
                          />
                        </View>
                      </View>
                    )}
                  />
                </Animated.View>
              </View>
            );
          })}
        </>
      ) : (
        <View>
          <Text style={{fontSize: 18, fontWeight: 'bold'}}>History</Text>
          <FlatList
            data={completedTimers}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={{padding: 10, borderBottomWidth: 1}}>
                <Text>{item.name}</Text>
                <Text>Category: {item.category}</Text>
                <Text>Duration: {item.duration}s</Text>
                <Text>Status: Completed</Text>
              </View>
            )}
          />
        </View>
      )}
      <Modal visible={modalVisible} transparent>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}>
          <View style={{padding: 20, backgroundColor: 'white'}}>
            <Text>Congratulations! {completedTimer?.name} completed!</Text>
            <Button title="OK" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default TimerApp;
