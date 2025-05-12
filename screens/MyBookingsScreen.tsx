import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { RootStackParamList } from '../types';
import { db } from '../firebase';
import { useNavigation, useFocusEffect, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ref, get, remove } from 'firebase/database';
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
};

type MyBookingsRouteProp = RouteProp<RootStackParamList, 'MyBookings'>;
type MyBookingsNavProp = StackNavigationProp<RootStackParamList, 'MyBookings'>;

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedBookingKey, setSelectedBookingKey] = useState<string | null>(null);

  const navigation = useNavigation<MyBookingsNavProp>();
  const route = useRoute<MyBookingsRouteProp>();
  const { booking } = route.params || {};

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
      return;
    }

    const userId = email.replace(/\./g, '_');
    let fetchedBookings: any[] = [];

    try {
      const fullSnapshot = await get(ref(db, `hotelBookings/${userId}`));
      console.log('🧩 Full user bookings:', fullSnapshot.val());

      if (fullSnapshot.exists()) {
        const hotelData = fullSnapshot.val();
        console.log('✅ Actual Firebase keys:', Object.keys(hotelData));

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

      setBookings(fetchedBookings);
    } catch (error) {
      console.error('Fetch error:', error);
    }

    setLoading(false);
  }, []);

  const confirmCancel = (bookingKey: string) => {
    setSelectedBookingKey(bookingKey);
    setModalVisible(true);
  };

  const handleConfirmedCancel = async () => {
    if (!selectedBookingKey) return;
    try {
      const email = await AsyncStorage.getItem('currentUser');
      if (!email) return;

      const userId = email.replace(/\./g, '_');
      await remove(ref(db, `hotelBookings/${userId}/${selectedBookingKey}`));
      console.log(`Removed booking: hotelBookings/${userId}/${selectedBookingKey}`);

      await fetchBookings();

      Toast.show({
        type: 'success',
        text1: '✅ Booking canceled successfully',
        position: 'bottom',
      });
    } catch (error) {
      console.error('Cancel Error:', error);
      Toast.show({
        type: 'error',
        text1: '❌ Failed to cancel booking',
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#36cfc9" />
      </View>
    );
  }

  return (
    <ImageBackground source={require('../assets/bg.jpg')} style={styles.bg}>
      <View style={styles.container}>
        <Text style={styles.title}>My Bookings</Text>
        {bookings.length === 0 ? (
          <Text style={styles.empty}>You have no bookings yet.</Text>
        ) : (
          <FlatList
            data={bookings.filter(item => item.type === 'hotel')}
            keyExtractor={item => item.key}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.hotelName}>{item.hotel_name}</Text>
                <Text style={styles.route}>{item.location}</Text>
                <Text style={styles.details}>
                  {item.date} | {item.room_type}
                </Text>
                <Text style={styles.details}>Price: ${item.price}</Text>
                <Text style={styles.bookingId}>Booking ID: {item.key.split('_')[0]}</Text>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => confirmCancel(item.key)}
                >
                  <Text style={styles.cancelText}>Cancel Booking</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* Cancel Confirmation Modal */}
        <Modal isVisible={isModalVisible}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalMessage}>Are you sure you want to cancel this booking?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancel}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmedCancel}>
                <Text style={styles.modalConfirm}>Yes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </ImageBackground>
  );
};

export default MyBookingsScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    elevation: 2,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  route: {
    fontSize: 16,
    marginVertical: 2,
    color: '#555',
  },
  details: {
    fontSize: 14,
    color: '#777',
    marginBottom: 3,
  },
  bookingId: {
    fontSize: 12,

    
    color: '#999',
    marginTop: 5,
    marginBottom: 8,
  },
  empty: {
    marginTop: 50,
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff4d4f',
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalCancel: {
    fontSize: 16,
    color: '#888',
  },
  modalConfirm: {
    fontSize: 16,
    color: '#ff4d4f',
    fontWeight: 'bold',
  },
});
