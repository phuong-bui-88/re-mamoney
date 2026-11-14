import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';
import type { Transaction } from '@/types';
import { MonthCalendar, DayTransactionsModal } from '@components/index';
import { getMonthStart, getMonthEnd, formatCurrency } from '@utils/currency';
import { C } from '@theme/index';

const MONTH_NAMES = [
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
  const [popupDate, setPopupDate] = useState<Date | null>(null);

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

  const closePopup = useCallback(() => {
    setPopupDate(null);
  }, []);

  useFocusEffect(
    useCallback(() => {
      closePopup();
    }, [closePopup])
  );

  const handleDayPress = useCallback(
    (day: number | null) => {
      if (day === null) {
        setPopupDate(null);
        return;
      }
      setPopupDate(new Date(selectedYear, selectedMonth, day));
    },
    [selectedMonth, selectedYear]
  );

  const handleMonthChange = useCallback(
    (month: number) => {
      setSelectedMonth(month);
      closePopup();
    },
    [setSelectedMonth, closePopup]
  );

  const handleYearChange = useCallback(
    (year: number) => {
      setSelectedYear(year);
      closePopup();
    },
    [setSelectedYear, closePopup]
  );

  const handlePopupTransactionPress = useCallback(
    (transaction: Transaction) => {
      setPopupDate(null);
      (navigation.getParent() as any)?.navigate('EditTransaction', {
        transactionId: transaction.id,
      });
    },
    [navigation]
  );

  const netTotal = useMemo(
    () => transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
    [transactions]
  );

  const summaryLabel = `Net total · ${MONTH_NAMES[selectedMonth]} ${selectedYear}:`;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        testID="transaction-list-scroll"
      >
        <MonthCalendar
          month={selectedMonth}
          year={selectedYear}
          transactions={allTransactions}
          onMonthChange={handleMonthChange}
          onYearChange={handleYearChange}
          selectedDay={popupDate ? popupDate.getDate() : null}
          onDayPress={handleDayPress}
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
      </ScrollView>

      <DayTransactionsModal
        date={popupDate}
        onClose={closePopup}
        onTransactionPress={handlePopupTransactionPress}
      />
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
  income: {
    color: C.green,
  },
  netTotalCard: {
    backgroundColor: C.cardBg,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 24,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 20,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  scroll: {
    flex: 1,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: C.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
  summarySection: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
