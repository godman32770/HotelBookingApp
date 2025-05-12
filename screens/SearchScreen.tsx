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
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { db } from '../firebase';
import { ref, get, onValue } from 'firebase/database';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { Calendar } from 'react-native-calendars';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale'; // Import locales
import { Ionicons } from '@expo/vector-icons';

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
  const [locale, setLocale] = useState<typeof enUS>(enUS); // Default locale
  const [isSearchPerformed, setIsSearchPerformed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  type SearchScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Search'>;
  const navigation = useNavigation<SearchScreenNavigationProp>();

  useEffect(() => {
    setIsLoading(true);
    fetchRooms();
    
    // Set up a listener for any changes in the database
    const dbRef = ref(db);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      // Only refresh results after a search has been performed
      if (isSearchPerformed) {
        onSearch(); // Re-run search to get the latest data
      } else {
        fetchRooms(); // Just update the rooms data
      }
    });
    
    // Clean up listener when component unmounts
    return () => {
      // This removes the listener
      onValue(dbRef, () => {}, { onlyOnce: true });
    };
  }, [isSearchPerformed]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
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
    } catch (error) {
      console.error('Error fetching rooms:', error);
      Alert.alert('Error', 'Failed to load available rooms.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      // Set the locale. You'd normally get this from the user's settings.
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
      [day.dateString]: { selected: true, color: '#5271FF', textColor: '#fff' },
    });
  };

  const onSearch = () => {
    console.log('Searching with:', { location, roomType, date: formatDate(date) });
    
    if (!location || !roomType) {
      Alert.alert('Invalid selection', 'Please select location and room type.');
      return;
    }

    setIsLoading(true);
    const formattedDate = formatDate(date);

    // Get the latest room data first
    get(ref(db)).then((snapshot) => {
      if (snapshot.exists()) {
        const raw = snapshot.val();
        if (typeof raw === 'object' && raw !== null) {
          const roomsArray: HotelRoom[] = Object.values(raw) as HotelRoom[];
          const updatedRooms = roomsArray
            .filter(item => item.location !== undefined && item.room_type !== undefined)
            .map((item) => {
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
          
          // Apply filters on the latest data
          const filtered = updatedRooms.filter((r) => {
            const roomDate = r.date;
            const locationMatch = !location || r.location?.toLowerCase() === location?.toLowerCase();
            const roomTypeMatch = !roomType || r.room_type?.toLowerCase() === roomType?.toLowerCase();
            const dateMatch = roomDate === formattedDate;
            // Add check for availability > 0
            const availableCheck = r.available > 0;
    
            console.log('Checking room:', r.hotel_name, r.location, r.room_type, r.date, 'Available:', r.available, 'Matches:', locationMatch, roomTypeMatch, dateMatch, availableCheck);
    
            return locationMatch && roomTypeMatch && dateMatch && availableCheck;
          });
    
          setResults(filtered);
          setIsSearchPerformed(true);
    
          console.log('Search results:', filtered);
    
          if (filtered.length === 0) {
            Alert.alert('No Rooms Found', 'No available rooms match your search criteria.');
          }
        }
      }
    }).catch((error) => {
      console.error('Error during search:', error);
      Alert.alert('Error', 'Failed to search for rooms.');
    }).finally(() => {
      setIsLoading(false);
      setShowDatePicker(false);
    });
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
  
  return (
    <ImageBackground source={require('../assets/bg.jpg')} style={styles.bg}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.header}>Find Your Perfect Stay</Text>
        </View>

        <View style={styles.searchBox}>
          <View style={styles.searchRow}>
            <Ionicons name="location-outline" size={22} color="#5271FF" style={styles.inputIcon} />
            <TouchableOpacity 
              onPress={() => setShowLocationModal(true)} 
              style={styles.modalButton}
            >
              <Text style={[styles.modalButtonText, !location && styles.placeholderText]}>
                {location || 'Select location'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="bed-outline" size={22} color="#5271FF" style={styles.inputIcon} />
            <TouchableOpacity 
              onPress={() => setShowRoomTypeModal(true)} 
              style={styles.modalButton}
            >
              <Text style={[styles.modalButtonText, !roomType && styles.placeholderText]}>
                {roomType || 'Select room type'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <Ionicons name="calendar-outline" size={22} color="#5271FF" style={styles.inputIcon} />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.modalButtonText}>{format(date, 'PPP', { locale })}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.searchButton} onPress={onSearch}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </TouchableOpacity>
        </View>

        {isSearchPerformed && (
          <Text style={styles.resultsCount}>
            {results.length} {results.length === 1 ? 'room' : 'rooms'} found
          </Text>
        )}

        {isLoading && !results.length ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5271FF" />
            <Text style={styles.loadingText}>Finding available rooms...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.card}
                onPress={() => navigation.navigate('HotelDetails', { hotel: item })}
              >
                <Image source={getLocationImage(item.location)} style={styles.bannerImage} />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.hotelName}>{item.hotel_name}</Text>
                    <Text style={styles.price}>${item.price}</Text>
                  </View>
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color="#777" />
                    <Text style={styles.location}>{item.location}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color="#777" />
                      <Text style={styles.detailText}>{item.date}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Ionicons name="bed-outline" size={16} color="#777" />
                      <Text style={styles.detailText}>{item.room_type}</Text>
                    </View>
                  </View>
                  <View style={styles.availabilityContainer}>
                    <Text style={styles.availability}>
                      <Text style={styles.availabilityNumber}>{item.available}</Text> rooms left at this price
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <Modal visible={showLocationModal} transparent={true} animationType="slide">
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowLocationModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Location</Text>
                <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={uniqueValues('location')}
                keyExtractor={(item) => item}
                renderItem={({ item: city }) => (
                  <Pressable
                    style={[
                      styles.option,
                      location === city && styles.selectedOption
                    ]}
                    onPress={() => {
                      setLocation(city);
                      setShowLocationModal(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      location === city && styles.selectedOptionText
                    ]}>{city}</Text>
                    {location === city && (
                      <Ionicons name="checkmark" size={20} color="#5271FF" />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        <Modal visible={showRoomTypeModal} transparent={true} animationType="slide">
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowRoomTypeModal(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Room Type</Text>
                <TouchableOpacity onPress={() => setShowRoomTypeModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={uniqueValues('room_type')}
                keyExtractor={(item) => item}
                renderItem={({ item: type }) => (
                  <Pressable
                    style={[
                      styles.option,
                      roomType === type && styles.selectedOption
                    ]}
                    onPress={() => {
                      setRoomType(type);
                      setShowRoomTypeModal(false);
                    }}
                  >
                    <Text style={[
                      styles.optionText,
                      roomType === type && styles.selectedOptionText
                    ]}>{type}</Text>
                    {roomType === type && (
                      <Ionicons name="checkmark" size={20} color="#5271FF" />
                    )}
                  </Pressable>
                )}
              />
            </View>
          </Pressable>
        </Modal>

        <Modal visible={showDatePicker} transparent={true} animationType="slide">
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.datePickerContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Date</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <Calendar
                onDayPress={onDayPress}
                markedDates={markedDates}
                minDate={new Date().toISOString().split('T')[0]}
                theme={{
                  backgroundColor: '#ffffff',
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#666',
                  selectedDayBackgroundColor: '#5271FF',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#5271FF',
                  dayTextColor: '#333',
                  textDisabledColor: '#d9e1e8',
                  dotColor: '#5271FF',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#5271FF',
                  monthTextColor: '#333',
                  indicatorColor: '#5271FF',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontSize: 16,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 14,
                }}
              />
              <TouchableOpacity
                style={styles.selectDateButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.selectDateButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
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
    paddingTop: 50,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  searchBox: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 4,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  searchButton: {
    backgroundColor: '#5271FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  resultsCount: {
    paddingHorizontal: 20,
    marginBottom: 12,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5271FF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#777',
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  detailText: {
    fontSize: 14,
    color: '#777',
    marginLeft: 4,
  },
  availabilityContainer: {
    backgroundColor: '#f0f5ff',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  availability: {
    fontSize: 14,
    color: '#5271FF',
  },
  availabilityNumber: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f0f5ff',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#5271FF',
    fontWeight: 'bold',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
    width: '100%',
  },
  selectDateButton: {
    backgroundColor: '#5271FF',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  selectDateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchScreen;