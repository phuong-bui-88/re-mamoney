import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import firebaseService from '@services/firebase';
import {
  PeriodFilter,
  SegmentedControl,
  FilteredTransactionList,
  FloatingActionButton,
} from '@components/index';
import { getMonthStart, getMonthEnd } from '@utils/currency';

const C = {
  background: '#F5F5F5',
};

export default function TransactionListScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportTab, setReportTab] = useState(0);

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <PeriodFilter
          month={selectedMonth}
          year={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />

        <SegmentedControl
          segments={['Expense', 'Income']}
          selected={reportTab}
          onSelect={setReportTab}
        />

        <FilteredTransactionList type={reportTab === 0 ? 'expense' : 'income'} />
      </ScrollView>

      <FloatingActionButton onPress={handleAddTransaction} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.background,
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
});
