import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { get, ref } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../firebase';
import { RootStackParamList } from '../types';

type HomeNavProp = StackNavigationProp<RootStackParamList, 'Home'>;
const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<HomeNavProp>();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadUser(), fetchRooms()]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUser = async () => {
    try {
      const email = await AsyncStorage.getItem('currentUser');
      setUserEmail(email || '');

      const usersSnap = await get(ref(db, 'users'));
      if (email && usersSnap.exists()) {
        const users = usersSnap.val();
        const user = Object.values(users).find(
          (u: any) => u.email === email
        ) as { name: string };
        setUserName(user?.name || '');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const snapshot = await get(ref(db, 'hotels/'));
      if (snapshot.exists()) {
        const raw = snapshot.val();
        if (Array.isArray(raw)) {
          setRooms(raw);
        } else {
          console.log("Data under 'hotels/' is not an array:", raw);
          setRooms([]);
        }
      } else {
        setRooms([]);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
      setRooms([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  // Get hotel image based on location
  const getHotelImage = (location: string) => {
    const images: Record<string, any> = {
      phuket: require('../assets/cities/phuket.jpg'),
      bangkok: require('../assets/cities/bangkok.jpg'),
      chiangmai: require('../assets/cities/chiangmai.jpg'),
      krabi: require('../assets/cities/krabi.jpg'),
      hatyai: require('../assets/cities/hatyai.jpg'),
    };
    const key = location?.toLowerCase()?.replace(/\s/g, '') || '';
    return images[key] || require('../assets/cities/default_flight.jpg');
  };

  const handleHotelPress = (hotel: any) => {
    navigation.navigate('HotelDetails', { hotel });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1890ff" />
        <Text style={styles.loadingText}>Loading hotels...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header Background with Gradient */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={['#1890ff', '#36cfc9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <SafeAreaView style={styles.headerContent}>
            {/* Top Nav Bar */}
            <View style={styles.topBar}>
              <Text style={styles.appTitle}>StayEase</Text>
              <View style={styles.topBarIcons}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('MyBookings')}
                >
                  <Ionicons name="book-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={handleLogout}
                >
                  <Ionicons name="log-out-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* User Welcome */}
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeTextContainer}>
                <Text style={styles.welcomeMessage}>Welcome back,</Text>
                <Text style={styles.userName}>{userName || 'Guest'}</Text>
              </View>
              <Image source={require('../assets/user.jpg')} style={styles.avatar} />
            </View>

            {/* Search Button */}
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => navigation.navigate('Search')}
            >
              <Ionicons name="search" size={18} color="#1890ff" style={{ marginRight: 8 }} />
              <Text style={styles.searchButtonText}>Find your perfect stay</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Featured Hotels</Text>
        
        {rooms.length > 0 ? (
          <FlatList
            data={rooms}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.hotelCard}
                onPress={() => handleHotelPress(item)}
                activeOpacity={0.8}
              >
                <Image 
                  source={getHotelImage(item.location)} 
                  style={styles.hotelImage} 
                  resizeMode="cover"
                />
                <View style={styles.hotelCardContent}>
                  <View style={styles.hotelHeader}>
                    <Text style={styles.hotelName}>{item.hotel_name}</Text>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>${item.price_per_night}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.locationContainer}>
                    <Ionicons name="location-outline" size={14} color="#777" />
                    <Text style={styles.locationText}>{item.location}</Text>
                  </View>
                  
                  <Text style={styles.roomInfo}>{item.room_type}</Text>
                  
                  <View style={styles.availabilityContainer}>
                    <View style={[
                      styles.availabilityDot, 
                      { backgroundColor: item.available > 0 ? '#52c41a' : '#f5222d' }
                    ]} />
                    <Text style={styles.availabilityText}>
                      {item.available > 0 
                        ? `${item.available} of ${item.total} rooms available` 
                        : 'No rooms available'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1890ff']} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="bed-outline" size={60} color="#ddd" />
                <Text style={styles.emptyStateText}>No hotels available</Text>
                <Text style={styles.emptyStateSubText}>Pull down to refresh</Text>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bed-outline" size={60} color="#ddd" />
            <Text style={styles.emptyStateText}>No hotels available</Text>
            <Text style={styles.emptyStateSubText}>Pull down to refresh</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    height: 230,
    width: '100%',
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  topBarIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginLeft: 20,
    padding: 5,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  welcomeTextContainer: {
    flex: 1,
  },
  welcomeMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: '#1890ff',
    fontWeight: '600',
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginBottom: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  hotelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  hotelImage: {
    width: '100%',
    height: 160,
  },
  hotelCardContent: {
    padding: 16,
  },
  hotelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  hotelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  priceTag: {
    backgroundColor: '#e6f7ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  priceText: {
    color: '#1890ff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 14,
    color: '#777',
    marginLeft: 4,
  },
  roomInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availabilityText: {
    fontSize: 13,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#1890ff',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 15,
    fontWeight: '500',
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 5,
  }
});

export default HomeScreen;