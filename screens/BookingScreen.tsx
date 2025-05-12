import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ImageBackground, 
  Alert, 
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Animated
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { set, ref, get, onValue } from 'firebase/database';
import { db } from '../firebase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type BookingRouteProp = RouteProp<RootStackParamList, 'Booking'>;
type BookingNavProp = StackNavigationProp<RootStackParamList, 'Booking'>;

const BookingScreen = () => {
  const route = useRoute<BookingRouteProp>();
  const navigation = useNavigation<BookingNavProp>();
  const { hotel }: any = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [isRoomAvailable, setIsRoomAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Check if this room is already booked
    checkRoomAvailability();
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
  }, []);

  const checkRoomAvailability = async () => {
    setIsLoading(true);
    
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
            if (booking.hotel_id === hotel.hotel_id && 
                booking.date === hotel.date && 
                booking.room_type === hotel.room_type) {
              isBooked = true;
            }
          });
        });
        
        setIsRoomAvailable(!isBooked);
      }
    } catch (error) {
      console.error('Error checking availability:', error);
      Alert.alert(
        'Connection Error', 
        'Unable to verify room availability. Please check your connection and try again.',
        [
          { text: 'Try Again', onPress: () => checkRoomAvailability() },
          { text: 'Go Back', onPress: () => navigation.goBack(), style: 'cancel' }
        ]
      );
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

  const handleBooking = async () => {
    setIsSubmitting(true);
    
    try {
      // First, check availability again (in case someone booked while viewing)
      await checkRoomAvailability();
      
      if (!isRoomAvailable) {
        Alert.alert('Not Available', 'Sorry, this room has just been booked by another user.');
        return;
      }
      
      const email = await AsyncStorage.getItem('currentUser');
      if (!email) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const userId = email.replace(/\./g, '_');
      const bookingKey = `${hotel.hotel_id}_${hotel.date}_${hotel.room_type.replace(/\s/g, '_')}`;

      const bookingData = {
        ...hotel,
        booked_at: Date.now(),
        user_id: userId,
      };

      await set(ref(db, `hotelBookings/${userId}/${bookingKey}`), bookingData);
      console.log('Booking saved:', bookingData);
      
      // Show success feedback before navigating
      Alert.alert(
        'Booking Confirmed!', 
        `Your stay at ${hotel?.hotel_name} has been successfully booked.`,
        [{ text: 'View My Bookings', onPress: () => navigation.navigate('MyBookings') }]
      );
      
    } catch (error) {
      console.error('Booking failed:', error);
      Alert.alert('Error', 'Failed to save booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Checking availability...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView style={styles.scrollView}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Image source={getLocationImage(hotel?.location)} style={styles.bannerImage} />
          
          <View style={styles.contentContainer}>
            <View style={styles.hotelInfoCard}>
              <Text style={styles.title}>{hotel?.hotel_name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color="#36cfc9" />
                <Text style={styles.locationText}>{hotel?.location}</Text>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={18} color="#36cfc9" />
                  <Text style={styles.detailText}>{hotel?.date}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="bed" size={18} color="#36cfc9" />
                  <Text style={styles.detailText}>{hotel?.room_type}</Text>
                </View>
              </View>
              
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price per night</Text>
                <Text style={styles.priceValue}>${hotel?.price}</Text>
              </View>
            </View>
            
            {!isRoomAvailable && (
              <View style={styles.unavailableCard}>
                <Ionicons name="alert-circle" size={24} color="#f5222d" />
                <Text style={styles.unavailableText}>
                  This room is currently unavailable for the selected date.
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[
                styles.button, 
                !isRoomAvailable && styles.disabledButton,
                isSubmitting && styles.submittingButton
              ]}
              disabled={!isRoomAvailable || isSubmitting}
              onPress={handleBooking}
            >
              {isSubmitting ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.buttonText, styles.loadingButtonText]}>Processing...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {isRoomAvailable ? 'Confirm Booking' : 'Unavailable'}
                </Text>
              )}
            </TouchableOpacity>
            
            {isRoomAvailable && (
              <Text style={styles.termsText}>
                By confirming, you agree to our booking terms and cancellation policy.
              </Text>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007bff',
  },
  bannerImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  hotelInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  priceContainer: {
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#888',
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#36cfc9',
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
  },
  submittingButton: {
    backgroundColor: '#3c95ff',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingButtonText: {
    marginLeft: 8,
  },
  unavailableCard: {
    backgroundColor: '#fff1f0',
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
    borderColor: '#ffccc7',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  unavailableText: {
    fontSize: 15,
    color: '#f5222d',
    marginLeft: 8,
    flex: 1,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default BookingScreen;