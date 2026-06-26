import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@store/index';

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#f44336',
    borderRadius: 8,
    marginTop: 20,
    padding: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  item: {
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  label: {
    color: '#333',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 15,
    marginVertical: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  value: {
    color: '#999',
    fontSize: 14,
  },
});

export default function SettingsScreen(): React.ReactElement {
  const { user, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.item}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.label}>Display Name</Text>
          <Text style={styles.value}>{user?.displayName || 'Not set'}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
