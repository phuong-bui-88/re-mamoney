import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import {
  WalletCard,
  NewWalletCard,
  PeriodFilter,
  StatisticsCard,
  SegmentedControl,
  FloatingActionButton,
} from '@components/index';
import { getMonthStart, getMonthEnd } from '@utils/currency';

const C = {
  background: '#F5F5F5',
  primaryLight: '#E0F2F1',
  textLight: '#999',
};

export default function HomeScreen(): React.ReactElement {
  const { user } = useAuthStore();
  const { loadTransactions, totalIncome, totalExpense, balance } = useTransactionStore();
  const navigation = useNavigation();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [reportTab, setReportTab] = useState(0);

  const walletName = user?.displayName || 'Main Wallet';
  const netChange = totalIncome - totalExpense;

  useEffect(() => {
    if (user) {
      const startDate = getMonthStart(new Date(selectedYear, selectedMonth));
      const endDate = getMonthEnd(new Date(selectedYear, selectedMonth));
      loadTransactions({ userId: user.id, startDate, endDate });
    }
  }, [user, selectedMonth, selectedYear, loadTransactions]);

  const handleAddTransaction = useCallback(() => {
    navigation.getParent()?.navigate('AddTransaction' as never);
  }, [navigation]);

  const handleWalletEdit = useCallback(() => {
    Alert.alert('Edit Wallet', 'Wallet editing coming soon');
  }, []);

  const handleNewWallet = useCallback(() => {
    Alert.alert('New Wallet', 'Wallet creation coming soon');
  }, []);

  const handleInfo = useCallback(() => {
    Alert.alert(
      'Net Change',
      'Net Change is the difference between your total income and total expenses for the selected period.',
    );
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.walletSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletRow}>
            <WalletCard
              name={walletName}
              balance={balance}
              onEdit={handleWalletEdit}
            />
            <NewWalletCard onPress={handleNewWallet} />
          </ScrollView>
        </View>

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

        <SegmentedControl
          segments={['Expense', 'Income']}
          selected={reportTab}
          onSelect={setReportTab}
        />

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{reportTab === 0 ? 'Expense' : 'Income'} report will appear here</Text>
        </View>
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
  placeholder: {
    alignItems: 'center',
    padding: 32,
  },
  placeholderText: {
    color: C.textLight,
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  walletRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  walletSection: {
    backgroundColor: C.primaryLight,
    paddingBottom: 8,
    paddingTop: 12,
  },
});
