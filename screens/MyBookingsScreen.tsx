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
 import { ref } from 'firebase/database';
 import { get, remove } from 'firebase/database';
 type MyBookingsRouteProp = RouteProp<RootStackParamList, 'MyBookings'>;
 type MyBookingsNavProp = StackNavigationProp<RootStackParamList, 'MyBookings'>;

 const MyBookingsScreen = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<MyBookingsNavProp>();
  const route = useRoute<MyBookingsRouteProp>();
  const { booking } = route.params || {};

  useEffect(() => {
    if (booking) {
      setBookings(prev => {
        const newBooking = booking;
        const alreadyExists = prev.some(item =>
          item.type === 'hotel' &&
          item.hotel_id === newBooking.hotel_id &&
          item.date === newBooking.date
        );
        if (!alreadyExists) {
          return [{ ...newBooking, key: `temp-${Date.now()}`, type: 'hotel' }, ...prev];
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

    // Fetch hotel bookings
    const hotelSnapshot = await get(ref(db, `hotelBookings/${userId}`));
    if (hotelSnapshot.exists()) {
      const hotelData = hotelSnapshot.val();
      const hotelResults = Object.entries(hotelData).map(([key, value]) =>
        typeof value === 'object' && value !== null ? { ...value, key, type: 'hotel' } : { key, invalid: true, type: 'hotel' }
      );
      fetchedBookings = fetchedBookings.concat(hotelResults);
    }

    setBookings(prevBookings => {
    // Merge fetched bookings, giving priority to those already in state (including the new one)
    const mergedBookings = [...prevBookings];
    fetchedBookings.forEach(fetchedItem => {
      const exists = mergedBookings.some(item => item.key === fetchedItem.key);
      if (!exists && !fetchedItem.invalid && fetchedItem.type === 'hotel') { // Corrected line
        mergedBookings.push(fetchedItem);
      }
    });
    return mergedBookings;
  });
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
              const path = type === 'flight' ? `bookings/<span class="math-inline">\{userId\}/</span>{bookingKey}` : `hotelBookings/<span class="math-inline">\{userId\}/</span>{bookingKey}`;
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
      console.log('MyBookingsScreen focused, route params:', route.params);
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
            keyExtractor={(item) => item.key}
            renderItem={({ item }) => (
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
            )}
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