import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTransactionStore } from '@store/index';
import type { Transaction } from '@/types';
import { formatCurrency } from '@utils/currency';
import TransactionRow from './TransactionRow';

const C = {
  textLight: '#999',
  textMedium: '#555',
  primary: '#00BFA5',
  primaryLight: '#E0F2F1',
};

interface FilteredTransactionListProps {
  category?: string;
  filterMode: 'month' | 'today';
  onTransactionPress?: (transaction: Transaction) => void;
}

interface ListSegment {
  kind: 'single' | 'group';
  items: Transaction[];
  userText: string;
  totalAmount: number;
}

export default function FilteredTransactionList({ category, filterMode, onTransactionPress }: FilteredTransactionListProps): React.ReactElement {
  const { transactions } = useTransactionStore();

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (category) {
      result = result.filter((t) => t.category === category);
    }

    if (filterMode === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      result = result.filter((t) => t.date >= today && t.date <= endOfDay);
    }

    result.sort((a, b) => {
      const dateA = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
      const dateB = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
      return dateA - dateB;
    });

    return result;
  }, [transactions, category, filterMode]);

  const segments = useMemo(() => {
    const segs: ListSegment[] = [];
    let group: Transaction[] = [];
    let groupKey = '';

    const flush = (): void => {
      if (group.length === 0) return;
      const rawLines = groupKey.split('\n').filter((l) => l.trim());
      const totalAmount = group.reduce((sum, t) => {
        return t.type === 'expense' ? sum + t.amount : sum - t.amount;
      }, 0);
      segs.push({
        kind: group.length >= 2 && rawLines.length >= 2 ? 'group' : 'single',
        items: group,
        userText: groupKey,
        totalAmount,
      });
      group = [];
    };

    for (const tx of filtered) {
      const text = tx.userText || '';
      if (text && text === groupKey) {
        group.push(tx);
      } else {
        flush();
        groupKey = text;
        group = [tx];
      }
    }
    flush();
    return segs;
  }, [filtered]);

  const handleDelete = (id: string) => {
    useTransactionStore.getState().deleteTransaction(id);
  };

  const renderRow = (transaction: Transaction, insideGroup: boolean): React.ReactElement => (
    <TransactionRow
      key={transaction.id}
      transaction={transaction}
      onDelete={handleDelete}
      onPress={onTransactionPress}
      insideGroup={insideGroup}
    />
  );

  const renderSegment = (segment: ListSegment): React.ReactElement => {
    if (segment.kind === 'group') {
      const net = segment.totalAmount;
      const sign = net < 0 ? '+' : '-';
      return (
        <View
          key={segment.items[0].id}
          style={styles.groupContainer}
          testID={`group-${segment.items[0].id}`}
        >
          <View style={styles.groupHeader}>
            <Text style={styles.groupHeaderLabel}>GROUP</Text>
            <Text style={styles.groupHeaderMeta}>
              {segment.items.length} transactions · {sign}
              {formatCurrency(Math.abs(net))}
            </Text>
          </View>
          {segment.items.map((t) => renderRow(t, true))}
        </View>
      );
    }
    return <React.Fragment key={segment.items[0].id}>{segment.items.map((t) => renderRow(t, false))}</React.Fragment>;
  };

  if (filtered.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {segments.map(renderSegment)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 8,
  },
  empty: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: C.textLight,
    fontSize: 14,
  },
  groupContainer: {
    backgroundColor: C.primaryLight,
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 8,
  },
  groupHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  groupHeaderLabel: {
    color: C.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  groupHeaderMeta: {
    color: C.textMedium,
    fontSize: 11,
    fontWeight: '600',
  },
});
