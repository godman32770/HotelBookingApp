import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import { get, ref } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../firebase';
import { RootStackParamList } from '../types';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavProp>();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [rooms, setRooms] = useState<any[]>([]); // State for rooms

  useEffect(() => {
    const loadUser = async () => {
      const email = await AsyncStorage.getItem('currentUser');
      setUserEmail(email || '');

      const usersSnap = await get(ref(db, 'users'));
      if (email && usersSnap.exists()) {
        const users = usersSnap.val();
        const user = Object.values(users).find(
          (u: any) => u.email === email
        ) as { name: string };
        setUserName(user?.name || '');
      }
    };

    const fetchRooms = async () => {
      const snapshot = await get(ref(db, 'hotels/'));
      if (snapshot.exists()) {
        const raw = snapshot.val();
        if (Array.isArray(raw)) {
          setRooms(raw);
        } else {
          console.log("Data under 'hotels/' is not an array:", raw);
          setRooms([]);
        }
      } else {
        setRooms([]);
      }
    };

    loadUser();
    fetchRooms(); // Fetch rooms
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <ImageBackground
      source={require('../assets/bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={26} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
            <Ionicons name="book-outline" size={26} color="#333" />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.profile}>
          <Image source={require('../assets/user.jpg')} style={styles.avatar} />
          <Text style={styles.name}>{userName || 'Welcome'}</Text>
          <Text style={styles.email}>{userEmail}</Text>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Search')}
        >
          <Ionicons name="search" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.searchButtonText}>Search Hotels</Text>
        </TouchableOpacity>

        {/* Hotel Rooms Section */}
        <View style={styles.roomsSection}>
          <Text style={styles.roomsTitle}>Available Hotels</Text>
          {rooms.length > 0 ? (
            <FlatList
              data={rooms}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.roomCard}>
                  <Text style={styles.roomName}>{item.hotel_name}</Text>
                  <Text style={styles.roomLocation}>{item.location}</Text>
                  <Text style={styles.roomDetails}>{item.date} | {item.room_type}</Text>
                  <Text style={styles.roomPrice}>${item.price_per_night} per night</Text>
                  <Text style={styles.roomAvailability}>
                    {item.available} out of {item.total} available
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noRoomsText}>No hotels available.</Text>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginBottom: 10,
  },
  profile: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#555',
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#36cfc9',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roomsSection: {
    marginTop: 20,
    flex: 1, // Allow the FlatList to take up remaining space
  },
  roomsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  roomCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  roomName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  roomLocation: {
    fontSize: 14,
    color: '#555',
  },
  roomDetails: {
    fontSize: 12,
    color: '#888',
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#36cfc9',
  },
  roomAvailability: {
    fontSize: 14,
    color: '#888',
  },
  noRoomsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default HomeScreen;