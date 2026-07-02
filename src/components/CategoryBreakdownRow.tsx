import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '@utils/currency';

const C = {
  white: '#fff',
  textDark: '#1a1a2e',
  textLight: '#999',
  selectedBg: '#F8F6F3',
  barBg: '#F2EDE7',
  shadow: '#000',
};

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
      <View style={[styles.iconBg, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={20} color="#fff" />
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
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  barFill: {
    borderRadius: 999,
    height: '100%',
  },
  barTrack: {
    backgroundColor: C.barBg,
    borderRadius: 999,
    height: 4,
    overflow: 'hidden',
  },
  container: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 16,
  },
  iconBg: {
    alignItems: 'center',
    borderRadius: 10,
    height: 44,
    justifyContent: 'center',
    marginRight: 12,
    width: 44,
  },
  label: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  middle: {
    flex: 1,
    marginRight: 12,
  },
  percentage: {
    color: C.textLight,
    fontSize: 13,
  },
  right: {
    alignItems: 'flex-end',
  },
  selected: {
    backgroundColor: C.selectedBg,
    elevation: 2,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
