export type Flight = {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
};

export type Room = {
  room_type: string;
  total: number;
  available: number;
  price_per_night: number;
};

export type Hotel = {
  hotel_id: string;
  hotel_name: string;
  location: string;
  date: string;
  rooms: Record<string, Room>; // Keyed by room type (e.g., "single", "double")
};

export type Navigation = {
  navigate: (scene: string) => void;
};

export type RootStackParamList = {
  HotelSearch: undefined;
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  Tabs: { screen: 'Home' | 'Search' | 'MyBookings' } | undefined;
  Home: undefined;
  Search: undefined;
  MyBookings: { booking?: any } | undefined; // Make 'booking' optional
  FlightDetails: { flight: any } | { hotel: any };
  Booking: { hotel: any; date: string } | { flight: any }; // Modified Booking type
  HotelDetails: { hotel: Hotel }; // Update HotelDetails to reflect Hotel type
 };