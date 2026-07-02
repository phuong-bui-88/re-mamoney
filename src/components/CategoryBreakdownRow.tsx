import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@theme/index';
import { formatCurrency } from '@utils/currency';

interface CategoryBreakdownRowProps {
  categoryKey: string;
  label: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  isSelected?: boolean;
  onPress?: (key: string) => void;
}

export default function CategoryBreakdownRow({
  categoryKey,
  label,
  icon,
  color,
  amount,
  percentage,
  isSelected,
  onPress,
}: CategoryBreakdownRowProps): React.ReactElement {
  const pctFormatted = `${percentage.toFixed(1)}%`;

  const content = (
    <View style={[styles.container, isSelected && styles.selected]}>
      <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[styles.barFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: color }]}
          />
        </View>
      </View>
      <View style={styles.right}>
        <Text style={styles.amount}>{formatCurrency(amount)}</Text>
        <Text style={styles.percentage}>{pctFormatted}</Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(categoryKey)}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  amount: {
    color: C.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
  barFill: {
    borderRadius: 999,
    height: '100%',
  },
  barTrack: {
    backgroundColor: C.border,
    borderRadius: 999,
    height: 3,
    overflow: 'hidden',
  },
  container: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 12,
  },
  iconBg: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginRight: 10,
    width: 38,
  },
  label: {
    color: C.textDark,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  middle: {
    flex: 1,
    marginRight: 10,
  },
  percentage: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  selected: {
    backgroundColor: C.grayLight,
  },
});
