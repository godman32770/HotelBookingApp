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
  const [flights, setFlights] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [rooms, setRooms] = useState<any[]>([]); // Define state for rooms

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

    const fetchFlights = async () => {
      const snapshot = await get(ref(db, 'flights/'));
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const allFlights = Object.values(raw);
        setFlights(allFlights);
      }
    };

    const fetchRooms = async () => {
      const snapshot = await get(ref(db, 'hotels/'));
      if (snapshot.exists()) {
        const raw = snapshot.val();
        const allRooms = Object.entries(raw).flatMap(([date, hotelData]: [string, any]) => {
          return Object.entries(hotelData.rooms).map(([roomType, roomDetails]: [string, any]) => ({
            date,
            hotel_id: hotelData.hotel_id,
            hotel_name: hotelData.hotel_name,
            location: hotelData.location,
            room_type: roomType,
            ...roomDetails,
          }));
        });
        setRooms(allRooms); // Set rooms data here
      }
    };

    loadUser();
    fetchFlights();
    fetchRooms(); // Fetch rooms as well
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const getLocationImage = (destination: string) => {
    const images: Record<string, any> = {
      phuket: require('../assets/cities/phuket.jpg'),
      bangkok: require('../assets/cities/bangkok.jpg'),
      chiangmai: require('../assets/cities/chiangmai.jpg'),
      krabi: require('../assets/cities/krabi.jpg'),
      hatyai: require('../assets/cities/hatyai.jpg'),
    };
    const key = destination.toLowerCase().replace(/\s/g, '');
    return images[key] || require('../assets/cities/default_flight.jpg');
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

        {/* Flight List */}
        <FlatList
          data={flights}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('FlightDetails', { flight: item })}
            >
              <View style={styles.card}>
                <Image source={getLocationImage(item.to)} style={styles.bannerImage} />
                <Text style={styles.flight}>{item.airline} - {item.flight_id}</Text>
                <Text style={styles.route}>{item.from} → {item.to}</Text>
                <Text style={styles.details}>{item.date} | {item.time}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Hotel Rooms Section (Example) */}
        <View style={styles.roomsSection}>
          <Text style={styles.roomsTitle}>Available Rooms</Text>
          {rooms.length > 0 ? (
            <FlatList
              data={rooms}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.roomCard}>
                  <Text style={styles.roomName}>{item.hotel_name} - {item.room_type}</Text>
                  <Text style={styles.roomLocation}>{item.location}</Text>
                  <Text style={styles.roomPrice}>${item.price_per_night} per night</Text>
                  <Text style={styles.roomAvailability}>
                    {item.available} out of {item.total} available
                  </Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noRoomsText}>No rooms available for your selected criteria.</Text>
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
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  bannerImage: {
    width: '100%',
    height: 140,
  },
  flight: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    paddingHorizontal: 10,
  },
  route: {
    color: '#555',
    paddingHorizontal: 10,
  },
  details: {
    color: '#888',
    fontSize: 12,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  roomsSection: {
    marginTop: 20,
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
