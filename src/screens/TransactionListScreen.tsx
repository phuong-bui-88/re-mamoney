import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';
import type { Transaction } from '@/types';
import { MonthCalendar, FilteredTransactionList, FloatingActionButton, ScrollToTopButton } from '@components/index';
import { getMonthStart, getMonthEnd, formatCurrency, formatDate } from '@utils/currency';
import { matchesSearch } from '@utils/search';
import { C } from '@theme/index';

export default function TransactionListScreen(): React.ReactElement {
  const { selectedUser } = useAuthStore();
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    transactions,
    allTransactions,
  } = useTransactionStore();
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as
    | { category?: string; type?: 'income' | 'expense' }
    | undefined;
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!selectedUser) return;

    const startDate = getMonthStart(new Date(selectedYear, selectedMonth));
    const endDate = getMonthEnd(new Date(selectedYear, selectedMonth));
    useTransactionStore.getState().setPeriod(startDate, endDate);

    const unsubscribe = firebaseService.subscribeToTransactions(
      { userId: selectedUser.id },
      (transactions) => {
        useTransactionStore.getState().setAllTransactions(transactions);
      }
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

  const clearDaySelection = useCallback(() => {
    setSelectedDayDate(null);
    setSearchQuery('');
  }, []);

  useFocusEffect(
    useCallback(() => {
      clearDaySelection();
    }, [clearDaySelection])
  );

  const handleDayPress = useCallback(
    (day: number | null) => {
      if (day === null) {
        clearDaySelection();
        return;
      }
      setSearchQuery('');
      setSelectedDayDate(new Date(selectedYear, selectedMonth, day));
    },
    [selectedMonth, selectedYear, clearDaySelection]
  );

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleSearchFocus = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleMonthChange = useCallback(
    (month: number) => {
      setSelectedMonth(month);
      clearDaySelection();
    },
    [setSelectedMonth, clearDaySelection]
  );

  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
      clearDaySelection();
    },
    [setSelectedYear, clearDaySelection]
  );

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      (navigation.getParent() as any)?.navigate('EditTransaction', {
        transactionId: transaction.id,
      });
    },
    [navigation]
  );

  const trimmedQuery = searchQuery.trim();
  const filterMode: 'month' | 'day' | 'search' = selectedDayDate
    ? 'day'
    : trimmedQuery
      ? 'search'
      : 'month';

  const netTotal = useMemo(() => {
    let list = transactions;
    if (selectedDayDate) {
      const startOfDay = new Date(selectedDayDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDayDate);
      endOfDay.setHours(23, 59, 59, 999);
      list = list.filter((t) => t.date >= startOfDay && t.date <= endOfDay);
    }
    if (trimmedQuery) {
      list = list.filter((t) => matchesSearch(t, searchQuery));
    }
    return list.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
  }, [transactions, selectedDayDate, searchQuery, trimmedQuery]);

  const matchingDays = useMemo(() => {
    if (!trimmedQuery) return [];
    const days = new Set<number>();
    allTransactions.forEach((t) => {
      const d = new Date(t.date);
      if (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) {
        if (matchesSearch(t, searchQuery)) {
          days.add(d.getDate());
        }
      }
    });
    return Array.from(days);
  }, [trimmedQuery, allTransactions, selectedMonth, selectedYear, searchQuery]);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const summaryLabel = selectedDayDate
    ? trimmedQuery
      ? `Net total · ${formatDate(selectedDayDate)} · "${trimmedQuery}":`
      : `Net total · ${formatDate(selectedDayDate)}:`
    : trimmedQuery
      ? `Net total · "${trimmedQuery}":`
      : `Net total · ${monthNames[selectedMonth]} ${selectedYear}:`;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        testID="transaction-list-scroll"
      >
        <MonthCalendar
          month={selectedMonth}
          year={selectedYear}
          transactions={allTransactions}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          selectedDay={selectedDayDate ? selectedDayDate.getDate() : null}
          onDayPress={handleDayPress}
          matchingDays={matchingDays}
        />

        <View style={styles.netTotalCard}>
          <View style={styles.summarySection}>
            <Text style={styles.summaryLabel}>{summaryLabel}</Text>
            <Text style={[styles.summaryAmount, netTotal >= 0 ? styles.income : styles.expense]}>
              {netTotal >= 0 ? '+' : ''}
              {formatCurrency(netTotal)}
            </Text>
          </View>
        </View>

        <FilteredTransactionList
          category={routeParams?.category}
          filterMode={filterMode}
          selectedDate={selectedDayDate}
          searchQuery={searchQuery}
          onTransactionPress={handleTransactionPress}
        />
      </ScrollView>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search e.g. banh trang cuon"
          placeholderTextColor={C.textMuted}
          value={searchQuery}
          onChangeText={handleSearchChange}
          onFocus={handleSearchFocus}
          returnKeyType="search"
          testID="search-input"
        />
      </View>

      <FloatingActionButton onPress={handleAddTransaction} bottom={66} />
      <ScrollToTopButton onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })} />
    </KeyboardAvoidingView>
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
  searchBar: {
    alignItems: 'center',
    backgroundColor: C.grayLight,
    borderRadius: 10,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    color: C.textDark,
    flex: 1,
    fontSize: 14,
    padding: 0,
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
