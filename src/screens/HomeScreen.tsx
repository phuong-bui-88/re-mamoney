import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import { formatCurrency } from '@utils/currency';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#f44336',
  },
});

export default function HomeScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { transactions, loadTransactions, totalIncome, totalExpense, balance } = useTransactionStore();

  useEffect(() => {
    if (user) {
      loadTransactions({ userId: user.id });
    }
  }, [user, loadTransactions]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Balance</Text>
        <Text style={styles.amount}>{formatCurrency(balance)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Income</Text>
        <Text style={[styles.amount, styles.income]}>{formatCurrency(totalIncome)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Total Expenses</Text>
        <Text style={[styles.amount, styles.expense]}>{formatCurrency(totalExpense)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Transactions: {transactions.length}</Text>
      </View>
    </ScrollView>
  );
}
