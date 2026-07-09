import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
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
  const { selectedUser } = useAuthStore();
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear } = useTransactionStore();
  const navigation = useNavigation();
  const route = useRoute();
  const routeParams = route.params as
    | { category?: string; type?: 'income' | 'expense' }
    | undefined;
  const initialTab = routeParams?.type === 'income' ? 1 : 0;
  const [reportTab, setReportTab] = useState(initialTab);

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

        <FilteredTransactionList
          type={reportTab === 0 ? 'expense' : 'income'}
          category={routeParams?.category}
        />
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
