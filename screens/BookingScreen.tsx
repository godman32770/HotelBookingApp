import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { set, ref } from 'firebase/database';
import { db } from '../firebase';
import { Alert } from 'react-native';

type BookingRouteProp = RouteProp<RootStackParamList, 'Booking'>;
type BookingNavProp = StackNavigationProp<RootStackParamList, 'Booking'>;

const BookingScreen = () => {
  const route = useRoute<BookingRouteProp>();
  const navigation = useNavigation<BookingNavProp>();
  // Assuming the route.params now contains a 'hotel' object instead of 'flight'
  const { hotel }: any = route.params;

  const getLocationImage = (location: string) => {
    const images: Record<string, any> = {
      phuket: require('../assets/cities/phuket.jpg'),
      bangkok: require('../assets/cities/bangkok.jpg'),
      chiangmai: require('../assets/cities/chiangmai.jpg'),
      krabi: require('../assets/cities/krabi.jpg'),
      hatyai: require('../assets/cities/hatyai.jpg'),
    };
    const key = location?.toLowerCase().replace(/\s/g, '');
    return images[key] || require('../assets/cities/default_flight.jpg');
  };

  return (
    <ImageBackground
      source={require('../assets/bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={getLocationImage(hotel?.location)} style={styles.bannerImage} />
        <Text style={styles.title}>{hotel?.hotel_name}</Text>
        <Text style={styles.info}>{hotel?.location}</Text>
        <Text style={styles.info}>{hotel?.date} | {hotel?.room_type}</Text>
        <Text style={styles.info}>Price per night: ${hotel?.price}</Text>
        {/* You might want to display availability or other details here */}
        {/* Example of potentially displaying booking info if you pass it */}
        {/* {hotel?.bookingDetails && (
          <View style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>Booking Info</Text>
            <Text style={styles.bookingDetail}>Name: {hotel.bookingDetails.name}</Text>
            <Text style={styles.bookingDetail}>Email: {hotel.bookingDetails.email}</Text>
            <Text style={styles.bookingDetail}>Booked at: {new Date(hotel.bookingDetails.booked_at).toLocaleString()}</Text>
          </View>
        )} */}
        <TouchableOpacity
          style={styles.button}
          // The onPress action should likely navigate to a confirmation or booking details screen
         onPress={async () => {
              const email = await AsyncStorage.getItem('currentUser');
              if (!email) return;

              const userId = email.replace(/\./g, '_');
              const bookingKey = `${hotel.hotel_id}_${hotel.date}`; // Simple key. You can also use push().

              const bookingData = {
                ...hotel,
                booked_at: Date.now(), // optional: timestamp
              };

              try {
                await set(ref(db, `hotelBookings/${userId}/${bookingKey}`), bookingData);
                console.log('Booking saved:', bookingData);
                navigation.navigate('MyBookings');
              } catch (error) {
                console.error('Booking failed:', error);
                Alert.alert('Error', 'Failed to save booking.');
              }
            }}

        >
          <Text style={styles.buttonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    borderColor: '#eee',
    borderWidth: 1,
  },
  bookingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  bookingDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
});

export default BookingScreen;