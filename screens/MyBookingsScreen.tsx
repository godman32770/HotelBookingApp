import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
  RefreshControl,
  StatusBar,
  Animated,
} from 'react-native';
import { RootStackParamList } from '../types';
import { db } from '../firebase';
import { useNavigation, useFocusEffect, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ref, get, remove } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Modal from 'react-native-modal';

type HotelBooking = {
  date: string;
  hotel_id: string;
  hotel_name: string;
  location: string;
  room_type: string;
  total: number;
  available: number;
  price_per_night: number;
  guests?: string;
};

type MyBookingsRouteProp = RouteProp<RootStackParamList, 'MyBookings'>;
type MyBookingsNavProp = StackNavigationProp<RootStackParamList, 'MyBookings'>;

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedBookingKey, setSelectedBookingKey] = useState<string | null>(null);
  const [selectedHotelName, setSelectedHotelName] = useState<string>('');

  const navigation = useNavigation<MyBookingsNavProp>();
  const route = useRoute<MyBookingsRouteProp>();
  const { booking } = route.params || {};

  // Animation when content loads
  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, fadeAnim]);

  // Add new booking from route params if present
  useEffect(() => {
    if (booking) {
      setBookings(prev => {
        const alreadyExists = prev.some(item =>
          item.type === 'hotel' &&
          item.hotel_id === booking.hotel_id &&
          item.date === booking.date
        );
        if (!alreadyExists) {
          return [{ ...booking, key: `temp-${Date.now()}`, type: 'hotel' }, ...prev];
        }
        return prev;
      });
    }
  }, [booking]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    
    const email = await AsyncStorage.getItem('currentUser');
    if (!email) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const userId = email.replace(/\./g, '_');
    let fetchedBookings: any[] = [];

    try {
      const fullSnapshot = await get(ref(db, `hotelBookings/${userId}`));
      
      if (fullSnapshot.exists()) {
        const hotelData = fullSnapshot.val();
        
        const hotelResults = Object.entries(hotelData).map(([firebaseKey, bookingData]) => {
          const typedBooking = bookingData as HotelBooking;
          return {
            ...typedBooking,
            key: firebaseKey,
            type: 'hotel',
            hotel_name: typedBooking.hotel_name,
            location: typedBooking.location,
            room_type: typedBooking.room_type,
            price: typedBooking.price_per_night,
          };
        });

        fetchedBookings = fetchedBookings.concat(hotelResults);
      }

      // Merge existing temp bookings with fetched ones
      setBookings(prevBookings => {
        // Keep temporary bookings, replace fetched ones
        const tempBookings = prevBookings.filter(item => item.key.startsWith('temp-'));
        return [...tempBookings, ...fetchedBookings];
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load bookings',
        text2: 'Please try again later',
        position: 'bottom',
      });
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBookings();
  }, [fetchBookings]);

  const toggleExpandCard = (key: string) => {
    setExpandedId(prevId => prevId === key ? null : key);
  };

  const confirmCancel = (bookingKey: string, hotelName: string) => {
    setSelectedBookingKey(bookingKey);
    setSelectedHotelName(hotelName);
    setModalVisible(true);
  };

  const handleConfirmedCancel = async () => {
    if (!selectedBookingKey) return;
    
    try {
      const email = await AsyncStorage.getItem('currentUser');
      if (!email) return;

      const userId = email.replace(/\./g, '_');
      
      // Optimistic UI update
      setBookings(prev => prev.filter(item => item.key !== selectedBookingKey));
      
      // Only try to remove from Firebase if it's not a temporary booking
      if (!selectedBookingKey.startsWith('temp-')) {
        await remove(ref(db, `hotelBookings/${userId}/${selectedBookingKey}`));
      }

      Toast.show({
        type: 'success',
        text1: 'Booking canceled successfully',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Cancel Error:', error);
      // Revert the optimistic update if there was an error
      fetchBookings();
      Toast.show({
        type: 'error',
        text1: 'Failed to cancel booking',
        position: 'bottom',
      });
    } finally {
      setModalVisible(false);
      setSelectedBookingKey(null);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  const renderBookingCard = ({ item }: { item: any }) => {
    const isExpanded = expandedId === item.key;
    
    return (
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpandCard(item.key)}
          style={styles.cardHeader}
        >
          <View style={styles.headerRow}>
            <View style={styles.hotelBadge}>
              <Ionicons name="bed-outline" size={18} color="#fff" />
            </View>
            <Text style={styles.hotelName} numberOfLines={1}>
              {item.hotel_name}
            </Text>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={22} 
              color="#555" 
            />
          </View>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#666" />
            <Text style={styles.location} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.divider} />
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Room Type:</Text>
              <Text style={styles.detailValue}>{item.room_type}</Text>
            </View>
            
 
            
            {item.guests && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Guests:</Text>
                <Text style={styles.detailValue}>{item.guests}</Text>
              </View>
            )}
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Booking ID:</Text>
              <Text style={styles.detailValue}>{item.key.split('_')[0]}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => confirmCancel(item.key, item.hotel_name)}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.cancelText}>Cancel Reservation</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" />
        <ImageBackground 
          source={require('../assets/bg.jpg')} 
          style={styles.bg}
          blurRadius={3}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
            style={styles.gradientOverlay}
          >
            <ActivityIndicator size="large" color="#36cfc9" />
            <Text style={styles.loadingText}>Loading your bookings...</Text>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground 
        source={require('../assets/bg.jpg')} 
        style={styles.bg}
        blurRadius={2}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.headerContainer}>
            <Text style={styles.title}>My Bookings</Text>
            {bookings.length > 0 && (
              <Text style={styles.bookingCount}>
                {bookings.length} {bookings.length === 1 ? 'reservation' : 'reservations'}
              </Text>
            )}
          </View>

          {bookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={70} color="rgba(255,255,255,0.7)" />
              <Text style={styles.emptyTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyText}>
                Your hotel reservations will appear here once you make a booking.
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.navigate('Search')}
              >
                <Text style={styles.browseButtonText}>Browse Hotels</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={bookings.filter(item => item.type === 'hotel')}
              keyExtractor={(item) => item.key}
              renderItem={renderBookingCard}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#fff"
                  colors={['#36cfc9', '#36cfc9']}
                />
              }
            />
          )}
          
          {/* Cancel Confirmation Modal */}
          <Modal isVisible={isModalVisible}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cancel Booking</Text>
              <Text style={styles.modalMessage}>
                Are you sure you want to cancel your reservation at {selectedHotelName}?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => {
                    setModalVisible(false);
                    Toast.show({
                      type: 'info',
                      text1: 'Booking retained',
                      position: 'bottom',
                      visibilityTime: 2000,
                    });
                  }}
                >
                  <Text style={styles.modalCancel}>Keep Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleConfirmedCancel}
                >
                  <Text style={styles.modalConfirm}>Cancel Booking</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bg: {
    flex: 1,
    resizeMode: 'cover',
  },
  gradientOverlay: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bookingCount: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hotelBadge: {
    backgroundColor: '#36cfc9',
    borderRadius: 8,
    padding: 4,
    marginRight: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  location: {
    fontSize: 14,
    color: '#555',
    marginLeft: 6,
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#777',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    color: '#36cfc9',
    fontWeight: '600',
    
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff4d4f',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#36cfc9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#555',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    backgroundColor: '#f1f1f1',
  },
  confirmButton: {
    backgroundColor: '#ff4d4f',
  },
  modalCancel: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  modalConfirm: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MyBookingsScreen;