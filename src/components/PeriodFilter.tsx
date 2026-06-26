import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary: '#00BFA5',
  primaryLight: '#E0F2F1',
  white: '#fff',
  textDark: '#333',
  textMedium: '#666',
  shadow: '#000',
  overlay: 'rgba(0,0,0,0.4)',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface PeriodFilterProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export default function PeriodFilter({ month, year, onMonthChange, onYearChange }: PeriodFilterProps): React.ReactElement {
  const [monthOpen, setMonthOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const years: number[] = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.dropdown} onPress={() => setMonthOpen(true)}>
        <Text style={styles.dropdownText}>{MONTHS[month]}</Text>
        <Ionicons name="chevron-down" size={16} color={C.textMedium} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.dropdown} onPress={() => setYearOpen(true)}>
        <Text style={styles.dropdownText}>{String(year)}</Text>
        <Ionicons name="chevron-down" size={16} color={C.textMedium} />
      </TouchableOpacity>

      <Modal visible={monthOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setMonthOpen(false)} activeOpacity={1}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Month</Text>
            <FlatList
              data={MONTHS}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.pickerItem, index === month && styles.pickerItemActive]}
                  onPress={() => { onMonthChange(index); setMonthOpen(false); }}
                >
                  <Text style={[styles.pickerItemText, index === month && styles.pickerItemTextActive]}>{item}</Text>
                  {index === month && <Ionicons name="checkmark" size={20} color={C.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={yearOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} onPress={() => setYearOpen(false)} activeOpacity={1}>
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
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdown: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderRadius: 8,
    elevation: 2,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  dropdownText: {
    color: C.textDark,
    fontSize: 14,
    fontWeight: '500',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: C.overlay,
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
});
