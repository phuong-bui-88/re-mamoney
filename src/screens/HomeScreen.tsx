import React, { useCallback, useEffect, useRef } from 'react';
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
  MonthlyChart,
} from '@components/index';
import { getMonthStart, getMonthEnd } from '@utils/currency';

export default function HomeScreen(): React.ReactElement {
  const scrollRef = useRef<ScrollView>(null);
  const categoryChartY = useRef(0);
  const { selectedUser } = useAuthStore();
  const { selectedMonth, selectedYear, totalIncome, totalExpense, setSelectedMonth, setSelectedYear } = useTransactionStore();
  const navigation = useNavigation();

  const netChange = totalIncome - totalExpense;

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

  const handleExpensePress = useCallback(() => {
    scrollRef.current?.scrollTo({ y: categoryChartY.current, animated: true });
  }, []);

  const handleCategoryLayout = useCallback((e: { nativeEvent: { layout: { y: number } } }) => {
    categoryChartY.current = e.nativeEvent.layout.y;
  }, []);

  const handleAddTransaction = useCallback(() => {
    navigation.getParent()?.navigate('AddTransaction' as never);
  }, [navigation]);

  const handleInfo = useCallback(() => {
    Alert.alert(
      'Net Change',
      'Net Change is the difference between your total income and total expenses for the selected period.',
    );
  }, []);

  const handleMonthlyInfo = useCallback(() => {
    Alert.alert(
      'Monthly Net',
      'Net amount per month is calculated as income minus expenses for that month in the selected year.',
    );
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        <PeriodFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <MonthlyChart onMonthSelect={setSelectedMonth} onInfoPress={handleMonthlyInfo} />

        <StatisticsCard
          netChange={netChange}
          expense={totalExpense}
          income={totalIncome}
          onInfoPress={handleInfo}
          onExpensePress={handleExpensePress}
        />
        <View onLayout={handleCategoryLayout}>
          <CategoryChart />
        </View>
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
