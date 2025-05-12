import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type HotelDetailsRouteProp = RouteProp<RootStackParamList, 'FlightDetails'>; // Changed to 'FlightDetails'
type HotelDetailsNavProp = StackNavigationProp<RootStackParamList, 'FlightDetails'>; // Changed to 'FlightDetails'

const HotelDetailsScreen = () => {
  const route = useRoute<HotelDetailsRouteProp>();
  const navigation = useNavigation<HotelDetailsNavProp>();
  const params = route.params;

  const item = 'hotel' in params ? params.hotel : 'flight' in params ? params.flight : null;

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

  if (!item) {
    return <Text>Error: No details found.</Text>;
  }

  return (
    <ImageBackground
      source={require('../assets/bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={getLocationImage(item.location)} style={styles.bannerImage} />
        <Text style={styles.title}>{item.hotel_name || `${item.airline} - ${item.flight_id}`}</Text>
        <Text style={styles.info}>{item.location || `${item.from} → ${item.to}`}</Text>
        <Text style={styles.info}>Date: {item.date}</Text>
        <Text style={styles.info}>
          {item.room_type ? `Room Type: ${item.room_type}` : `Time: ${item.time}`}
        </Text>
        <Text style={styles.info}>Price: ${item.price || item.price_per_night}</Text>
        {item.available && <Text style={styles.info}>Availability: {item.available} / {item.total}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Booking', { hotel: item, date: item.date })}

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