import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ImageBackground,
} from 'react-native';
import { RootStackParamList } from '../types';
import { db } from '../firebase';
import { useNavigation, useFocusEffect, RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ref, onValue } from 'firebase/database';
import { get,remove } from 'firebase/database';
type MyBookingsRouteProp = RouteProp<RootStackParamList, 'MyBookings'>;
type MyBookingsNavProp = StackNavigationProp<RootStackParamList, 'MyBookings'>;

const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<MyBookingsNavProp>();
  const route = useRoute<MyBookingsRouteProp>();
  const { booking } = route.params || {}; // Get the booking passed from BookingScreen

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const email = await AsyncStorage.getItem('currentUser');
    if (!email) {
      setLoading(false);
      return;
    }

    const userId = email.replace(/\./g, '_');
    let allBookings: any[] = [];

    // Fetch flight bookings
    const flightSnapshot = await get(ref(db, `bookings/${userId}`));
    if (flightSnapshot.exists()) {
      const flightData = flightSnapshot.val();
      const flightResults = Object.entries(flightData).map(([key, value]) =>
        typeof value === 'object' && value !== null ? { ...value, key, type: 'flight' } : { key, invalid: true, type: 'flight' }
      );
      allBookings = allBookings.concat(flightResults);
    }

    // Fetch hotel bookings
    const hotelSnapshot = await get(ref(db, `hotelBookings/${userId}`));
    if (hotelSnapshot.exists()) {
      const hotelData = hotelSnapshot.val();
      const hotelResults = Object.entries(hotelData).map(([key, value]) =>
        typeof value === 'object' && value !== null ? { ...value, key, type: 'hotel' } : { key, invalid: true, type: 'hotel' }
      );
      allBookings = allBookings.concat(hotelResults);
    }

    // Combine and set
    setBookings(allBookings);
    setLoading(false);
  }, []);

  const handleCancel = async (bookingKey: string, type: 'flight' | 'hotel') => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const email = await AsyncStorage.getItem('currentUser');
              if (!email) return;

              const userId = email.replace(/\./g, '_');
              const path = type === 'flight' ? `bookings/${userId}/${bookingKey}` : `hotelBookings/${userId}/${bookingKey}`;
              await remove(ref(db, path));
              await fetchBookings(); // Refresh bookings
              Toast.show({
                type: 'success',
                text1: '✅ Booking canceled successfully',
                position: 'bottom',
              });
            } catch (error) {
              console.error('Cancel Error:', error);
              Alert.alert('Error', 'Failed to cancel booking.');
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [fetchBookings])
  );

  useEffect(() => {
    if (booking) {
      // Add the passed booking to the list.  Important:  Check for duplicates.
      setBookings(prev => {
        const alreadyExists = prev.some(item =>
          item.type === 'hotel' && item.hotel_id === booking.hotel_id && item.date === booking.date
        );
        if (alreadyExists) {
          return prev; // Don't add duplicate
        }
        return [{ ...booking, key: `new-${Date.now()}`, type: 'hotel' }, ...prev];
      });
    }
  }, [booking]);

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
            data={bookings}
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => {
              if (item.type === 'flight') {
                return (
                  <View style={styles.card}>
                    <Text style={styles.flight}>{item.airline} - {item.flight_id}</Text>
                    <Text style={styles.route}>{item.from} → {item.to}</Text>
                    <Text style={styles.details}>{item.date} | {item.time}</Text>
                    <Text style={styles.details}>
                      Booked by: {item.name} ({item.email})
                    </Text>
                    {item.booked_at && (
                      <Text style={styles.details}>
                        Booked at: {new Date(item.booked_at).toLocaleString()}
                      </Text>
                    )}
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancel(item.key, 'flight')}
                    >
                      <Text style={styles.cancelText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </View>
                );
              } else if (item.type === 'hotel') {
                return (
                  <View style={styles.card}>
                    <Text style={styles.hotelName}>{item.hotel_name}</Text>
                    <Text style={styles.route}>{item.location}</Text>
                    <Text style={styles.details}>{item.date} | {item.room_type}</Text>
                    <Text style={styles.details}>Price: ${item.price}</Text>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancel(item.key, 'hotel')}
                    >
                      <Text style={styles.cancelText}>Cancel Booking</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return null; // Or some default/error message
            }}
          />
        )}
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
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  flight: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
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
});

export default MyBookingsScreen;
