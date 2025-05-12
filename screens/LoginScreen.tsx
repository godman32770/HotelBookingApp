import React, { useState } from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  Text, 
  View, 
  Alert, 
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import Logo from '../components/Logo';
import Header from '../components/Header';
import Button from '../components/Button';
import TextInput from '../components/TextInput';
import BackButton from '../components/BackButton';
import { theme } from '../core/theme';
import { emailValidator, passwordValidator } from '../core/utils';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState({ value: '', error: '' });
  const [password, setPassword] = useState({ value: '', error: '' });
  const [loading, setLoading] = useState(false);

  const _onLoginPressed = async () => {
    Keyboard.dismiss();
    
    const emailError = emailValidator(email.value);
    const passwordError = passwordValidator(password.value);

    if (emailError || passwordError) {
      setEmail({ ...email, error: emailError });
      setPassword({ ...password, error: passwordError });
      return;
    }

    setLoading(true);

    try {
      const snapshot = await get(ref(db, 'users/'));
      const users = snapshot.val();
      let matched = false;

      const inputEmail = email.value.toLowerCase();
      
      for (const userId in users) {
        const user = users[userId];
        
        if (user.email.toLowerCase() === inputEmail && user.password === password.value) {
          await AsyncStorage.setItem('currentUser', inputEmail);
          navigation.reset({
            index: 0,
            routes: [{ name: 'Tabs', params: { screen: 'Home' } }],
          });
          matched = true;
          break;
        }
      }

      if (!matched) {
        Alert.alert(
          'Login Failed', 
          'Email or password is incorrect. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Connection Error', 
        'Unable to connect to the server. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <ImageBackground
        source={require('../assets/bg.jpg')}
        style={styles.background}
        resizeMode="cover"
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={styles.overlay}>
            <View style={styles.headerContainer}>
              <BackButton goBack={() => navigation.navigate('Welcome')} />
            </View>
            
            <View style={styles.contentContainer}>
              <Logo />
              <Header>Welcome Back</Header>
              <Text style={styles.subtitle}>Sign in to continue your journey</Text>

              <View style={styles.formContainer}>
                <TextInput
                  label="Email"
                  returnKeyType="next"
                  value={email.value}
                  onChangeText={(text: string) => setEmail({ value: text, error: '' })}
                  error={!!email.error}
                  errorText={email.error}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={styles.input}
                />

                <TextInput
                  label="Password"
                  returnKeyType="done"
                  value={password.value}
                  onChangeText={(text: string) => setPassword({ value: text, error: '' })}
                  error={!!password.error}
                  errorText={password.error}
                  secureTextEntry
                  textContentType="password"
                  autoComplete="password"
                  style={styles.input}
                />

                <View style={styles.forgotPassword}>
                  <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <Button 
                  mode="contained" 
                  onPress={_onLoginPressed}
                  style={styles.button}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </View>

              <View style={styles.row}>
                <Text style={styles.signUpText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.link}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginTop: 40,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    marginBottom: 32,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginTop: 8,
  },
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  button: {
    marginBottom: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    marginTop: 16,
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 15,
    color: '#666',
  },
  link: {
    fontWeight: 'bold',
    fontSize: 15,
    color: theme.colors.primary,
  },
});

export default LoginScreen;