import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@theme/index';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const MONTHS_FULL: string[] = [];

interface PeriodFilterProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export default function PeriodFilter({ month, year, onMonthChange, onYearChange }: PeriodFilterProps): React.ReactElement {
  const [yearOpen, setYearOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pills}
      >
        {MONTHS_SHORT.map((label, i) => {
          const isActive = i === month;
          return (
            <TouchableOpacity
              key={label}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onMonthChange(i)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.yearBtn} onPress={() => setYearOpen(true)} activeOpacity={0.7}>
        <Text style={styles.yearText}>{String(year)}</Text>
        <Ionicons name="chevron-down" size={14} color={C.textMedium} />
      </TouchableOpacity>

      <Modal visible={yearOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.overlayBase} onPress={() => setYearOpen(false)} activeOpacity={1}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Year</Text>
            <FlatList
              data={years}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, item === year && styles.pickerItemActive]}
                  onPress={() => { onYearChange(item); setYearOpen(false); }}
                >
                  <Text style={[styles.pickerItemText, item === year && styles.pickerItemTextActive]}>{String(item)}</Text>
                  {item === year && <Ionicons name="checkmark" size={20} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  overlayBase: {
    alignItems: 'center',
    backgroundColor: C.textDark + '66',
    flex: 1,
    justifyContent: 'center',
  },
  pickerContainer: {
    backgroundColor: C.white,
    borderRadius: 14,
    maxHeight: '60%',
    paddingVertical: 16,
    width: '80%',
  },
  pickerItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  pickerItemActive: {
    backgroundColor: C.primaryLight,
  },
  pickerItemText: {
    color: C.textDark,
    fontSize: 15,
  },
  pickerItemTextActive: {
    color: C.primary,
    fontWeight: '600',
  },
  pickerTitle: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  pill: {
    backgroundColor: C.white,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  pillActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  pillText: {
    color: C.textMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: C.white,
    fontWeight: '600',
  },
  pills: {
    alignItems: 'center',
    gap: 8,
  },
  yearBtn: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderColor: C.border,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  yearText: {
    color: C.textDark,
    fontSize: 13,
    fontWeight: '500',
  },
});
