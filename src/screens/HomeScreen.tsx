import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { C } from '@theme/index';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';
import {
  CategoryChart,
  PeriodFilter,
  StatisticsCard,
  FloatingActionButton,
} from '@components/index';
import { getMonthStart, getMonthEnd } from '@utils/currency';

export default function HomeScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { totalIncome, totalExpense } = useTransactionStore();
  const navigation = useNavigation();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const netChange = totalIncome - totalExpense;

  useEffect(() => {
    if (!user) return;

    const startDate = getMonthStart(new Date(selectedYear, selectedMonth));
    const endDate = getMonthEnd(new Date(selectedYear, selectedMonth));
    useTransactionStore.getState().setPeriod(startDate, endDate);

    const unsubscribe = firebaseService.subscribeToTransactions(
      { userId: user.id },
      (transactions) => {
        useTransactionStore.getState().setAllTransactions(transactions);
      },
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const startDate = getMonthStart(new Date(selectedYear, selectedMonth));
    const endDate = getMonthEnd(new Date(selectedYear, selectedMonth));
    useTransactionStore.getState().setPeriod(startDate, endDate);
  }, [user, selectedMonth, selectedYear]);

  const handleAddTransaction = useCallback(() => {
    navigation.getParent()?.navigate('AddTransaction' as never);
  }, [navigation]);

  const handleInfo = useCallback(() => {
    Alert.alert(
      'Net Change',
      'Net Change is the difference between your total income and total expenses for the selected period.',
    );
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <PeriodFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <StatisticsCard
          netChange={netChange}
          expense={totalExpense}
          income={totalIncome}
          onInfoPress={handleInfo}
        />
        <CategoryChart />
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
  scroll: {
    flex: 1,
    paddingBottom: 80,
  },
});
