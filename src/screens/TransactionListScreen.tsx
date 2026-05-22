import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import { formatCurrency, formatDate } from '@utils/currency';

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
  },
  transactionItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionInfo: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  description: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#f44336',
  },
});

export default function TransactionListScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { transactions, loadTransactions } = useTransactionStore();

  useEffect(() => {
    if (user) {
      loadTransactions({ userId: user.id });
    }
  }, [user, loadTransactions]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text>No transactions yet</Text>
        </View>
      ) : (
        transactions.map((transaction) => (
          <View key={transaction.id} style={styles.transactionItem}>
            <View style={styles.transactionInfo}>
              <Text style={styles.category}>{transaction.category}</Text>
              <Text style={styles.description}>{transaction.description}</Text>
              <Text style={styles.date}>{formatDate(transaction.date)}</Text>
            </View>
            <Text style={[styles.amount, transaction.type === 'income' ? styles.income : styles.expense]}>
              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}
