import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ImageBackground, ActivityIndicator } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';

type HotelDetailsRouteProp = RouteProp<RootStackParamList, 'FlightDetails'>;
type HotelDetailsNavProp = StackNavigationProp<RootStackParamList, 'FlightDetails'>;

const HotelDetailsScreen = () => {
  const route = useRoute<HotelDetailsRouteProp>();
  const navigation = useNavigation<HotelDetailsNavProp>();
  const params = route.params;
  const [isRoomAvailable, setIsRoomAvailable] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const item = 'hotel' in params ? params.hotel : 'flight' in params ? params.flight : null;

  useEffect(() => {
    if (item && item.hotel_name) {
      checkRoomAvailability();
    } else {
      setIsLoading(false);
    }
  }, [item]);

  const checkRoomAvailability = async () => {
    if (!item) {
      setIsLoading(false);
      return;
    }

    try {
      // Reference to all hotel bookings to check availability
      const bookingsRef = ref(db, 'hotelBookings');
      const snapshot = await get(bookingsRef);
      
      if (snapshot.exists()) {
        const allBookings = snapshot.val();
        
        // Check if this hotel on this date with this room type is already booked
        let isBooked = false;
        Object.values(allBookings).forEach((userBookings: any) => {
          Object.values(userBookings).forEach((booking: any) => {
            if (booking.hotel_id === item.hotel_id && 
                booking.date === item.date && 
                booking.room_type === item.room_type) {
              isBooked = true;
            }
          });
        });
        
        setIsRoomAvailable(!isBooked);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Checking availability...</Text>
      </View>
    );
  }

  const isHotel = item.hotel_name !== undefined;

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

        {isHotel && !isRoomAvailable && (
          <View style={styles.unavailableCard}>
            <Text style={styles.unavailableText}>
              This room is currently unavailable for the selected date.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.button, 
            (isHotel && !isRoomAvailable) && styles.disabledButton
          ]}
          disabled={isHotel && !isRoomAvailable}
          onPress={() =>
            navigation.navigate('Booking', {
              hotel: item,
              date: item.date,
  })
}

        >
          <Text style={styles.buttonText}>
            {isHotel ? (isRoomAvailable ? 'Book Now' : 'Unavailable') : 'Book Now'}
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
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
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  unavailableCard: {
    backgroundColor: '#fff1f0',
    padding: 15,
    marginTop: 20,
    borderRadius: 8,
    borderColor: '#ffccc7',
    borderWidth: 1,
  },
  unavailableText: {
    fontSize: 16,
    color: '#f5222d',
    textAlign: 'center',
  },
});

export default HotelDetailsScreen;