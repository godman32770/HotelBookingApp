import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Alert,
  Image,
  ImageBackground,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
interface HotelRoom {
  date: string;
  hotel_id: string;
  hotel_name: string;
  location: string;
  room_type: string;
  price_per_night: number;
  total: number;
  available: number;
}
const SearchScreen = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [location, setLocation] = useState('');
  const [roomType, setRoomType] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);

  type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;
  const navigation = useNavigation<SearchScreenNavigationProp>();

    useEffect(() => {
    const fetchRooms = async () => {
      const snapshot = await get(ref(db));
      console.log('Snapshot exists:', snapshot.exists());
      if (snapshot.exists()) {
        const raw = snapshot.val();
        console.log('Raw data from Firebase:', raw);
        if (typeof raw === 'object' && raw !== null) {
          const roomsArray: HotelRoom[] = Object.values(raw) as HotelRoom[];
          const mappedRooms = roomsArray
            .filter(item => item.location !== undefined && item.room_type !== undefined) // Filter out items with undefined location or room_type
            .map((item) => {
              console.log('Mapping item:', item);
              return {
                date: item.date,
                hotel_id: item.hotel_id,
                hotel_name: item.hotel_name,
                location: item.location,
                room_type: item.room_type,
                price: item.price_per_night,
                total: item.total,
                available: item.available,
              };
            });
          setRooms(mappedRooms);
          console.log('Rooms state set to:', mappedRooms);
        } else {
          console.log("Data at root is not an object:", raw);
          setRooms([]);
        }
      } else {
        setRooms([]);
        console.log('Snapshot does not exist at root.');
      }
    };
    fetchRooms();
  }, []);

  const uniqueValues = (key: 'location' | 'room_type') => {
    const values = Array.from(new Set(rooms.map((r) => r[key])));
    console.log(`Unique ${key}:`, values);
    return values;
  };

  const formatDate = (d: Date) => {
    const เต็มปี = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${เต็มปี}-${mm}-${dd}`;
  };

  const onSearch = () => {
    console.log('Searching with:', { location, roomType, date: formatDate(date) });
    console.log('First room in state:', rooms[0]);

    if (!location || !roomType) {
      Alert.alert('Invalid selection', 'Please select location and room type.');
      return;
    }

    const formattedDate = formatDate(date);

    const filtered = rooms.filter((r) => {
      const roomDate = r.date;
      const locationMatch = !location || r.location?.toLowerCase() === location?.toLowerCase();
      const roomTypeMatch = !roomType || r.room_type?.toLowerCase() === roomType?.toLowerCase();
      const dateMatch = roomDate === formattedDate;

      console.log('Checking room:', r.hotel_name, r.location, r.room_type, r.date, 'Matches:', locationMatch, roomTypeMatch, dateMatch);

      return locationMatch && roomTypeMatch && dateMatch;
    });

    setResults(filtered);

    console.log('Search results:', filtered);

    if (filtered.length === 0) {
      Alert.alert('No Rooms Found', 'No rooms match your search criteria.');
    }

    setShowDatePicker(false); // Dismiss date picker on search
  };

  const getLocationImage = (loc: string) => {
    if (!loc) return require('../assets/cities/default_flight.jpg');
    const images: Record<string, any> = {
      phuket: require('../assets/cities/phuket.jpg'),
      bangkok: require('../assets/cities/bangkok.jpg'),
      chiangmai: require('../assets/cities/chiangmai.jpg'),
      krabi: require('../assets/cities/krabi.jpg'),
      hatyai: require('../assets/cities/hatyai.jpg'),
    };
    const key = loc.toLowerCase().replace(/\s/g, '');
    return images[key] || require('../assets/cities/default_flight.jpg');
  };
  console.log('All Rooms:', rooms);
  console.log('Unique Locations:', uniqueValues('location'));
  return (
    <ImageBackground source={require('../assets/bg.jpg')} style={styles.bg}>
      <View style={styles.container}>
        <Text style={styles.header}>🏨  Search Hotels 🏨</Text>

        <View style={styles.searchBox}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity onPress={() => { console.log('Location TouchableOpacity pressed'); setShowLocationModal(true); }} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>{location || 'Select location'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Room Type</Text>
          <TouchableOpacity onPress={() =>{console.log('Room Type TouchableOpacity pressed');setShowRoomTypeModal(true);}} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>{roomType || 'Select room type'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{date.toDateString()}</Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || date;
                setShowDatePicker(Platform.OS === 'ios');
                setDate(currentDate);
              }}
            />
          )}

          <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('FlightDetails', { hotel: item })}>
              <View style={styles.card}>
                <Image source={getLocationImage(item.location)} style={styles.bannerImage} />
                <Text style={styles.flight}>{item.hotel_name}</Text>
                <Text style={styles.route}>{item.location}</Text>
                <Text style={styles.details}>{item.date} | {item.room_type}</Text>
                <Text style={styles.price}>${item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <Modal visible={showLocationModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            {uniqueValues('location').map((city) => (
              <Pressable
                key={city}
                style={styles.option}
                onPress={() => {
                  setLocation(city);
                  setShowLocationModal(false);
                  console.log(`showLocationModal set to false, location set to: ${city}`);
                }}
              >
                <Text style={styles.optionText}>{city}</Text>
              </Pressable>
            ))}
          </View>
        </Modal>

        <Modal visible={showRoomTypeModal} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            {uniqueValues('room_type').map((type) => (
              <Pressable
                key={type}
                style={styles.option}
                onPress={() => {
                  console.log(`Room Type pressed: ${type}`);
                  setRoomType(type);
                  setShowRoomTypeModal(false);
                  console.log(`showRoomTypeModal set to false, roomType set to: ${type}`);
                }}
              >
                <Text style={styles.optionText}>{type}</Text>
              </Pressable>
            ))}
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 20,
  },
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    gap: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  modalButton: {
    backgroundColor: '#36cfc9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  dateButton: {
    backgroundColor: '#36cfc9',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#36cfc9',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  modalContainer: {
    backgroundColor: '#ffffffee',
    marginTop: '50%',
    borderRadius: 10,
    padding: 20,
    marginHorizontal: 20,
  },
  option: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#36cfc9',
    paddingHorizontal: 10,
    paddingBottom: 10,
  }
});
export default SearchScreen;