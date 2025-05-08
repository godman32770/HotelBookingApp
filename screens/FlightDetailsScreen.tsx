import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types'; 

type FlightDetailsNavProp = StackNavigationProp<RootStackParamList, 'FlightDetails'>;

const FlightDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<FlightDetailsNavProp>();
  const { flight }: any = route.params;

  const getLocationImage = (destination: string) => {
    const images: Record<string, any> = {
      phuket: require('../assets/cities/phuket.jpg'),
      bangkok: require('../assets/cities/bangkok.jpg'),
      chiangmai: require('../assets/cities/chiangmai.jpg'),
      krabi: require('../assets/cities/krabi.jpg'),
      hatyai: require('../assets/cities/hatyai.jpg'),
    };
    const key = destination.toLowerCase().replace(/\s/g, '');
    return images[key] || require('../assets/cities/default_flight.jpg');
  };

  return (
    <ImageBackground
      source={require('../assets/bg.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <Image source={getLocationImage(flight.to)} style={styles.bannerImage} />
        <Text style={styles.title}>{flight.airline} - {flight.flight_id}</Text>
        <Text style={styles.info}>{flight.from} → {flight.to}</Text>
        <Text style={styles.info}>{flight.date} at {flight.time}</Text>
        <Text style={styles.info}>Price: ${flight.price}</Text>
        {flight.name && flight.email && flight.booked_at &&(
          <View style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>Booking Info</Text>
            <Text style={styles.bookingDetail}>Name: {flight.name}</Text>
            <Text style={styles.bookingDetail}>Email: {flight.email}</Text>
            <Text style={styles.bookingDetail}>Booked at: {new Date(flight.booked_at).toLocaleString()}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Booking', { flight })}
        >
          <Text style={styles.buttonText}>
            {(flight.name && flight.email && flight.booked_at) ? 'Book More' : 'Book Now'}
          </Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default FlightDetailsScreen;

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
  },
  info: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#36cfc9',
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
    backgroundColor: '#f5f5f5',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
    elevation: 2,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bookingDetail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
});
