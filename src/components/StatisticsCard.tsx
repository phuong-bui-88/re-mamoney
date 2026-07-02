import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@theme/index';
import { formatCurrency } from '@utils/currency';

interface StatisticsCardProps {
  netChange: number;
  expense: number;
  income: number;
  onInfoPress?: () => void;
}

export default function StatisticsCard({ netChange, expense, income, onInfoPress }: StatisticsCardProps): React.ReactElement {
  const isPositive = netChange >= 0;
  const total = income + expense || 1;
  const expenseRatio = expense / total;
  const incomeRatio = income / total;

  return (
    <View style={styles.card}>
      <View style={styles.gradientHeader}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Net Change</Text>
          {onInfoPress && (
            <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="information-circle-outline" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.netRow}>
          <Ionicons name={isPositive ? 'arrow-up' : 'arrow-down'} size={22} color={C.white} />
          <Text style={styles.netAmount}>{formatCurrency(Math.abs(netChange))}</Text>
        </View>
      </View>

      <View style={styles.breakdown}>
        <View style={styles.breakItem}>
          <View style={styles.breakHeader}>
            <View style={styles.breakLabelRow}>
              <View style={[styles.dot, { backgroundColor: C.expense }]} />
              <Text style={styles.breakLabel}>Expense</Text>
            </View>
            <Text style={[styles.breakAmount, { color: C.expense }]}>{formatCurrency(expense)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${expenseRatio * 100}%`, backgroundColor: C.expense }]} />
          </View>
        </View>

        <View style={styles.breakItem}>
          <View style={styles.breakHeader}>
            <View style={styles.breakLabelRow}>
              <View style={[styles.dot, { backgroundColor: C.income }]} />
              <Text style={styles.breakLabel}>Income</Text>
            </View>
            <Text style={[styles.breakAmount, { color: C.income }]}>{formatCurrency(income)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${incomeRatio * 100}%`, backgroundColor: C.income }]} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  breakAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  breakHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakItem: {
    gap: 6,
  },
  breakLabel: {
    color: C.textMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  breakLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  breakdown: {
    gap: 14,
    padding: 16,
  },
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  gradientHeader: {
    backgroundColor: C.primary,
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitle: {
      color: C.white,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  netAmount: {
    color: C.white,
    fontSize: 32,
    fontWeight: '700',
  },
  netRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  progressFill: {
    borderRadius: 2,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: C.border,
    borderRadius: 2,
    height: 4,
    overflow: 'hidden',
  },
});
