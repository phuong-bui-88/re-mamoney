import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { C } from '@theme/index';

interface PeriodFilterProps {
  year: number;
  onYearChange: (year: number) => void;
}

export default function PeriodFilter({ year, onYearChange }: PeriodFilterProps): React.ReactElement {
  const [yearOpen, setYearOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.yearBtn} onPress={() => setYearOpen(true)} activeOpacity={0.7}>
        <Text style={styles.yearText}>{String(year)}</Text>
        <Ionicons name="chevron-down" size={14} color={C.textMedium} />
      </TouchableOpacity>

      <Modal visible={yearOpen} transparent animationType="fade">
        <TouchableOpacity style={styles.overlayBase} onPress={() => setYearOpen(false)} activeOpacity={1}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Year</Text>
            <ScrollView>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pickerItem, y === year && styles.pickerItemActive]}
                  onPress={() => { onYearChange(y); setYearOpen(false); }}
                >
                  <Text style={[styles.pickerItemText, y === year && styles.pickerItemTextActive]}>{String(y)}</Text>
                  {y === year && <Ionicons name="checkmark" size={20} color={C.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    justifyContent: 'flex-end',
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
