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

const SearchScreen = () => {
  const [rooms, setRooms] = useState<any[]>([]); // <-- This line defines the state for rooms
  const [location, setLocation] = useState('');
  const [roomType, setRoomType] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showRoomTypeModal, setShowRoomTypeModal] = useState(false);

  type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;
  const navigation = useNavigation<SearchScreenNavigationProp>();

  // Fetch rooms from Firebase and flatten them
  useEffect(() => {
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
        setRooms(allRooms); // <-- This updates the rooms state with fetched data
      }
    };
    fetchRooms();
  }, []);

  // Get unique values for location or room_type
  const uniqueValues = (key: 'location' | 'room_type') => {
    return Array.from(
      new Set(
        rooms.map((r) => r[key]).filter((v) => typeof v === 'string' && v.trim().length > 0)
      )
    );
  };

  // Format the date to yyyy-mm-dd
  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Filter the rooms based on selected filters
  const onSearch = () => {
    const formattedDate = formatDate(date);
    const selectedMonth = date.getMonth();
    const selectedYear = date.getFullYear();

    const filtered = rooms.filter((r) => {
      const roomDate = new Date(r.date);
      return (
        r.location === location &&
        r.room_type === roomType &&
        roomDate.getMonth() === selectedMonth &&
        roomDate.getFullYear() === selectedYear
      );
    });

    const sameDayResults = filtered.filter(r => r.date === formattedDate);

    if (filtered.length === 0) {
      Alert.alert('No Rooms Found', 'There are no rooms in this month.');
      setResults([]);
      return;
    }

    if (sameDayResults.length === 0) {
      Alert.alert('No Rooms on Selected Date', 'Try a different day within the same month.');
    }

    setResults(sameDayResults);
  };

  // Get location image
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

  return (
    <ImageBackground source={require('../assets/bg.jpg')} style={styles.bg}>
      <View style={styles.container}>
        <Text style={styles.header}>🏨  Search Hotels 🏨</Text>

        <View style={styles.searchBox}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity onPress={() => setShowLocationModal(true)} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>{location || 'Select location'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Room Type</Text>
          <TouchableOpacity onPress={() => setShowRoomTypeModal(true)} style={styles.modalButton}>
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
            <TouchableOpacity onPress={() => navigation.navigate('HotelDetails', { hotel: item })}>
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
                  setRoomType(type);
                  setShowRoomTypeModal(false);
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

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  bg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
