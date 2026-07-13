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
  buttonSwitch: {
    backgroundColor: '#2196F3',
    borderRadius: 6,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  buttonSwitchText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  emailValue: {
    color: '#999',
    fontSize: 11,
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
  itemActions: {
    flexDirection: 'row',
  },
  itemCurrentLabel: {
    fontWeight: 'bold',
  },
  label: {
    color: '#333',
    fontSize: 14,
  },
  labelFlex: {
    flex: 1,
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
  const { user, selectedUser, savedAccounts, signOut, switchToAccount } =
    useAuthStore();

  const handleSwitch = (account: (typeof savedAccounts)[0]) => {
    if (account.userId === selectedUser?.id) return;
    switchToAccount(account);
  };

  const isCurrentUser = (account: (typeof savedAccounts)[0]) =>
    account.userId === selectedUser?.id;

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

      {savedAccounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accounts on this device</Text>
          {savedAccounts.map((account) => (
            <View key={account.userId} style={styles.item}>
              <View style={styles.labelFlex}>
                <Text
                  style={[
                    styles.label,
                    isCurrentUser(account) && styles.itemCurrentLabel,
                  ]}
                >
                  {account.email}
                </Text>
                {isCurrentUser(account) && (
                  <Text style={styles.emailValue}>Current</Text>
                )}
              </View>
              <View style={styles.itemActions}>
                {!isCurrentUser(account) && (
                  <TouchableOpacity
                    style={styles.buttonSwitch}
                    onPress={() => handleSwitch(account)}
                  >
                    <Text style={styles.buttonSwitchText}>Switch</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
