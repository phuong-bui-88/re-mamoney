import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '@store/index';
import { getDeviceId } from '@utils/device';
import { saveDeviceUser, getDeviceUsers } from '@services/deviceUsers';
import { C } from '@theme/colors';

export const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: C.blue,
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: C.white,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 15,
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  toggleText: {
    color: C.blue,
    marginTop: 15,
    textAlign: 'center',
  },
});

export default function LoginScreen(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const { signIn, signUp, isLoading, setSavedAccounts } = useAuthStore();

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }

      const storedUser = useAuthStore.getState().user;
      if (storedUser) {
        const deviceId = await getDeviceId();
        await saveDeviceUser(deviceId, storedUser.id, storedUser.email, storedUser.displayName);
        const accounts = await getDeviceUsers(deviceId);
        setSavedAccounts(accounts);
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleAuth}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
      </TouchableOpacity>

      <Text style={styles.toggleText} onPress={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
      </Text>
    </View>
  );
}
