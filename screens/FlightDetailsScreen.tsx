import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type HotelDetailsRouteProp = RouteProp<RootStackParamList, 'HotelDetails'>;
type HotelDetailsNavProp = StackNavigationProp<RootStackParamList, 'HotelDetails'>;

const HotelDetailsScreen = () => {
  const route = useRoute<HotelDetailsRouteProp>();
  const navigation = useNavigation<HotelDetailsNavProp>();
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
        <Text style={styles.info}>Date: {hotel?.date}</Text>
        <Text style={styles.info}>Room Type: {hotel?.room_type}</Text>
        <Text style={styles.info}>Price per night: ${hotel?.price}</Text>
        <Text style={styles.info}>Availability: {hotel?.available} / {hotel?.total}</Text>

        {/* The following section about booking details (name, email, booked_at) */}
        {/* was likely specific to the flight booking flow. If you need to display */}
        {/* similar information for hotel bookings, you'll need to ensure that */}
        {/* the 'hotel' object passed to this screen contains those properties. */}
        {/* Example of how you might display hotel-specific booking info if available: */}
        {/* {hotel?.guestName && hotel?.contactEmail && hotel?.bookingTime && (
          <View style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>Booking Details</Text>
            <Text style={styles.bookingDetail}>Guest Name: {hotel.guestName}</Text>
            <Text style={styles.bookingDetail}>Email: {hotel.contactEmail}</Text>
            <Text style={styles.bookingDetail}>Booked at: {new Date(hotel.bookingTime).toLocaleString()}</Text>
          </View>
        )} */}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Booking', { hotel })}
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
    backgroundColor: 'transparent',
  },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  button: {
    marginTop: 30,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingCard: {
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
    elevation: 2,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  bookingDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});

export default HotelDetailsScreen;