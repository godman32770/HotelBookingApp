import React, { useEffect, useState, useCallback } from 'react';
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
  TextInput,
  Platform,
} from 'react-native';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Calendar } from 'react-native-calendars';
import { format, Locale } from 'date-fns';
import { enUS, th } from 'date-fns/locale'; // Import locales


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
  const [markedDates, setMarkedDates] = useState({});
  const [locale, setLocale] = useState<Locale>(enUS); // Default locale

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
            .filter(item => item.location !== undefined && item.room_type !== undefined)
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

  useEffect(() => {
      // Set the locale.  You'd normally get this from the user's settings.
      //  For this example, I'm just setting it to English.  If you want Thai,
      //  you would use setLocale(th);
      setLocale(enUS);
  }, []);

  const uniqueValues = (key: 'location' | 'room_type') => {
    const values = Array.from(new Set(rooms.map((r) => r[key])));
    console.log(`Unique ${key}:`, values);
    return values;
  };

  const formatDate = (d: Date) => {
    return format(d, 'yyyy-MM-dd', { locale });
  };

  const onDayPress = (day: any) => {
    const selectedDate = new Date(day.dateString);
    setDate(selectedDate);
    setMarkedDates({
      [day.dateString]: { selected: true, color: '#007bff', textColor: '#fff' },
    });
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

    setShowDatePicker(false);
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
        <Text style={styles.header}>🏨  Search Hotels 🏨</Text>

        <View style={styles.searchBox}>
          <Text style={styles.label}>Location</Text>
          <TouchableOpacity onPress={() => { console.log('Location TouchableOpacity pressed'); setShowLocationModal(true); }} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>{location || 'Select location'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Room Type</Text>
          <TouchableOpacity onPress={() => { console.log('Room Type TouchableOpacity pressed'); setShowRoomTypeModal(true); }} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>{roomType || 'Select room type'}</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>{format(date, 'PPP', { locale })}</Text>
          </TouchableOpacity>

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

        <Modal visible={showDatePicker} transparent={true} animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.datePickerContainer}>
              <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#b6c1cd',
                  selectedDayBackgroundColor: '#007bff',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#007bff',
                  dayTextColor: '#2d4150',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#007bff',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#007bff',
                  monthTextColor: '#43515c',
                  indicatorColor: '#007bff',
                  textDayFontFamily: 'monospace',
                  textMonthFontFamily: 'monospace',
                  textDayHeaderFontFamily: 'monospace',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 16,
                }}
              />
              <TouchableOpacity
                style={styles.selectDateButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.selectDateButtonText}>Select Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  searchBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    fontSize: 16,
    alignItems: 'flex-start',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  flight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  route: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  details: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
    textAlign: 'center',
  },
  option: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    color: '#333',
  },
  selectDateButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  selectDateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333'
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingBottom: 15,
    paddingTop: 10,
    width: '90%',
    alignItems: 'center',
  },
});

export default SearchScreen;

