import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';
import {
  PeriodFilter,
  FilteredTransactionList,
  FloatingActionButton,
} from '@components/index';
import { getMonthStart, getMonthEnd, formatCurrency } from '@utils/currency';
import { C } from '@theme/index';

export default function TransactionListScreen(): React.ReactElement {
  const { selectedUser } = useAuthStore();
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, transactions } = useTransactionStore();
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as
    | { category?: string; type?: 'income' | 'expense' }
    | undefined;
  const [filterMode, setFilterMode] = useState<'month' | 'today'>('month');

  useEffect(() => {
    if (!selectedUser) return;

    const startDate = getMonthStart(new Date(selectedYear, selectedMonth));
    const endDate = getMonthEnd(new Date(selectedYear, selectedMonth));
    useTransactionStore.getState().setPeriod(startDate, endDate);

    const unsubscribe = firebaseService.subscribeToTransactions(
      { userId: selectedUser.id },
      (transactions) => {
        useTransactionStore.getState().setAllTransactions(transactions);
      },
    );
    return unsubscribe;
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const startDate = getMonthStart(new Date(selectedYear, selectedMonth));
    const endDate = getMonthEnd(new Date(selectedYear, selectedMonth));
    useTransactionStore.getState().setPeriod(startDate, endDate);
  }, [selectedUser, selectedMonth, selectedYear]);

  const handleAddTransaction = useCallback(() => {
    navigation.getParent()?.navigate('AddTransaction' as never);
  }, [navigation]);

  const netTotal = useMemo(() => {
    let list = transactions;
    if (filterMode === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      list = transactions.filter((t) => t.date >= today && t.date <= endOfDay);
    }
    return list.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }, [transactions, filterMode]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const summaryLabel = filterMode === 'today'
    ? `Net total · Today:`
    : `Net total · ${monthNames[selectedMonth]} ${selectedYear}:`;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <PeriodFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <View style={styles.netTotalCard}>
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>{summaryLabel}</Text>
            <Text style={[styles.summaryAmount, netTotal >= 0 ? styles.income : styles.expense]}>
              {netTotal >= 0 ? '+' : ''}{formatCurrency(netTotal)} đ
            </Text>
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterMode === 'month' && styles.filterButtonActive]}
              onPress={() => setFilterMode('month')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterButtonText, filterMode === 'month' && styles.filterButtonTextActive]}>
                This Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterMode === 'today' && styles.filterButtonActive]}
              onPress={() => setFilterMode('today')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterButtonText, filterMode === 'today' && styles.filterButtonTextActive]}>
                Today
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <FilteredTransactionList
          category={routeParams?.category}
          filterMode={filterMode}
        />
      </ScrollView>

      <FloatingActionButton onPress={handleAddTransaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    flex: 1,
  },
  expense: {
    color: C.red,
  },
  filterButton: {
    alignItems: 'center',
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12,
  },
  filterButtonActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  filterButtonText: {
    color: C.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: C.white,
    fontWeight: '600',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  income: {
    color: C.green,
  },
  netTotalCard: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 29,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  scroll: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: C.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  summarySection: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
