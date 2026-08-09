import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuthStore } from '@store/index';
import { C } from '@theme/index';

const styles = StyleSheet.create({
  accountAvatar: {
    alignItems: 'center',
    backgroundColor: C.primaryLight,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  accountAvatarCurrent: {
    backgroundColor: C.primary,
  },
  accountAvatarText: {
    color: C.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  accountAvatarTextCurrent: {
    color: C.white,
  },
  accountEmail: {
    color: C.textDark,
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
  },
  accountItem: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  accountItemCurrent: {
    backgroundColor: C.primaryLight,
    borderBottomWidth: 0,
    borderRadius: 8,
    marginBottom: 2,
    marginTop: 8,
  },
  accountSwitch: {
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 6,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  accountSwitchText: {
    color: C.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
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
  quickAction: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 6,
  },
  quickActionIcon: {
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    marginRight: 12,
    width: 36,
  },
  quickActionLabel: {
    color: C.textDark,
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
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
  value: {
    color: '#999',
    fontSize: 14,
  },
});

export default function SettingsScreen(): React.ReactElement {
  const { user, selectedUser, savedAccounts, signOut, switchToAccount } =
    useAuthStore();
  const navigation = useNavigation();

  const handleAddTransaction = () => {
    navigation.getParent()?.navigate('AddTransaction' as never);
  };

  const handleSwitch = (account: (typeof savedAccounts)[0]) => {
    if (account.userId === selectedUser?.id) return;
    switchToAccount(account);
  };

  const isCurrentUser = (account: (typeof savedAccounts)[0]) =>
    account.userId === selectedUser?.id;

  return (
    <View style={styles.container}>
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

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.quickAction}
          onPress={handleAddTransaction}
          activeOpacity={0.7}
        >
          <View style={styles.quickActionIcon}>
            <Ionicons name="add" size={20} color={C.white} />
          </View>
          <Text style={styles.quickActionLabel}>Add Transaction</Text>
          <Ionicons name="chevron-forward" size={18} color={C.textLight} />
        </TouchableOpacity>
      </View>

      {savedAccounts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accounts on this device</Text>
          {savedAccounts.map((account) => {
            const current = isCurrentUser(account);
            return (
              <View
                key={account.userId}
                style={[styles.accountItem, current && styles.accountItemCurrent]}
              >
                <View
                  style={[styles.accountAvatar, current && styles.accountAvatarCurrent]}
                >
                  <Text
                    style={[styles.accountAvatarText, current && styles.accountAvatarTextCurrent]}
                  >
                    {(account.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {account.email}
                </Text>
                {!current && (
                  <TouchableOpacity
                    style={styles.accountSwitch}
                    onPress={() => handleSwitch(account)}
                  >
                    <Ionicons name="swap-horizontal" size={14} color={C.white} />
                    <Text style={styles.accountSwitchText}>Switch</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={signOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
