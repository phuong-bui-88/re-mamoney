import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction } from '@/types';
import { formatCompactNet } from '@utils/currency';
import { C } from '@theme/index';

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

interface MonthCalendarProps {
  month: number;
  year: number;
  transactions: Transaction[];
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  selectedDay: number | null;
  onDayPress: (day: number | null) => void;
  matchingDays?: number[];
}

export default function MonthCalendar({
  month,
  year,
  transactions,
  onMonthChange,
  onYearChange,
  selectedDay,
  onDayPress,
  matchingDays = [],
}: MonthCalendarProps): React.ReactElement {
  const [pickerOpen, setPickerOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }

  const cells = useMemo<(number | null)[]>(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7;
    const result: (number | null)[] = Array.from({ length: leadingBlanks }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(d);
    }
    while (result.length % 7 !== 0) {
      result.push(null);
    }
    return result;
  }, [month, year]);

  const dailyNet = useMemo(() => {
    const map = new Map<number, number>();
    for (const t of transactions) {
      const d = t.date instanceof Date ? t.date : new Date(t.date);
      if (d.getFullYear() !== year || d.getMonth() !== month) continue;
      const day = d.getDate();
      map.set(day, (map.get(day) ?? 0) + (t.type === 'income' ? t.amount : -t.amount));
    }
    return map;
  }, [transactions, month, year]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = isCurrentMonth ? today.getDate() : null;

  const rows = useMemo(() => {
    const out: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      out.push(cells.slice(i, i + 7));
    }
    return out;
  }, [cells]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setPickerOpen(true)}
        activeOpacity={0.7}
        testID="calendar-header"
      >
        <Ionicons name="calendar-outline" size={18} color={C.primary} />
        <Text style={styles.headerText}>
          {MONTHS_SHORT[month]} {year}
        </Text>
        <Ionicons name="chevron-down" size={14} color={C.textMedium} />
      </TouchableOpacity>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={styles.weekdayText}>
            {w}
          </Text>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={`week-${rowIndex}`} style={styles.weekRow}>
          {row.map((day, colIndex) => {
            if (day === null) {
              return <View key={`blank-${rowIndex}-${colIndex}`} style={styles.cell} />;
            }
            const isSelected = day === selectedDay;
            const isToday = day === todayDay;
            const net = dailyNet.get(day);
            return (
              <View key={day} style={styles.cell}>
                <TouchableOpacity
                  style={styles.dayButton}
                  activeOpacity={0.7}
                  onPress={() => onDayPress(isSelected ? null : day)}
                  testID={`day-${day}`}
                >
                  <View
                    style={[
                      styles.dayNumberWrap,
                      isToday && styles.todayWrap,
                      isSelected && styles.selectedWrap,
                    ]}
                    testID={isToday ? 'today-circle' : isSelected ? 'selected-circle' : undefined}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        isToday && styles.todayText,
                        isSelected && styles.selectedText,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {matchingDays.includes(day) && (
                    <View style={styles.matchingDotWrap}>
                      <View style={styles.matchingDot} testID="matching-dot" />
                    </View>
                  )}
                  <View style={styles.amountSlot}>
                    {net !== undefined && (
                      <Text
                        style={[
                          styles.amountText,
                          net > 0 && styles.incomeText,
                          net < 0 && styles.expenseText,
                        ]}
                      >
                        {formatCompactNet(net)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}

      <Text style={styles.legend}>green = net income · red = net expense</Text>

      <Modal visible={pickerOpen} transparent animationType="fade">
        <TouchableOpacity
          style={styles.overlay}
          onPress={() => setPickerOpen(false)}
          activeOpacity={1}
        >
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Month & Year</Text>
            <View style={styles.monthGrid}>
              {MONTHS_SHORT.map((label, i) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.monthItem, i === month && styles.monthItemActive]}
                  onPress={() => {
                    onMonthChange(i);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.monthItemText, i === month && styles.monthItemTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView style={styles.yearList}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearItem, y === year && styles.yearItemActive]}
                  onPress={() => {
                    onYearChange(y);
                    setPickerOpen(false);
                  }}
                >
                  <Text style={[styles.yearItemText, y === year && styles.yearItemTextActive]}>
                    {String(y)}
                  </Text>
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
  amountSlot: {
    height: 13,
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cell: {
    alignItems: 'center',
    flex: 1,
  },
  container: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  dayButton: {
    alignItems: 'center',
    paddingVertical: 2,
    width: '100%',
  },
  dayNumberWrap: {
    alignItems: 'center',
    borderRadius: 13,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  dayText: {
    color: C.textDark,
    fontSize: 13,
  },
  expenseText: {
    color: C.red,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  headerText: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
  incomeText: {
    color: C.green,
  },
  legend: {
    color: C.textLight,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  matchingDot: {
    backgroundColor: C.primary,
    borderRadius: 2,
    height: 4,
    width: 4,
  },
  matchingDotWrap: {
    alignItems: 'center',
    height: 6,
    justifyContent: 'center',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  monthItem: {
    alignItems: 'center',
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    paddingVertical: 8,
    width: '32%',
  },
  monthItemActive: {
    backgroundColor: C.primaryLight,
    borderColor: C.primary,
  },
  monthItemText: {
    color: C.textDark,
    fontSize: 14,
  },
  monthItemTextActive: {
    color: C.primary,
    fontWeight: '700',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: C.textDark + '66',
    flex: 1,
    justifyContent: 'center',
  },
  pickerContainer: {
    backgroundColor: C.white,
    borderRadius: 14,
    maxHeight: '70%',
    padding: 16,
    width: '85%',
  },
  pickerTitle: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  selectedText: {
    color: C.white,
    fontWeight: '700',
  },
  selectedWrap: {
    backgroundColor: C.primary,
  },
  todayText: {
    color: C.primary,
    fontWeight: '700',
  },
  todayWrap: {
    borderColor: C.primary,
    borderWidth: 1.5,
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  weekdayText: {
    color: C.textMuted,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  yearItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  yearItemActive: {
    backgroundColor: C.primaryLight,
  },
  yearItemText: {
    color: C.textDark,
    fontSize: 15,
  },
  yearItemTextActive: {
    color: C.primary,
    fontWeight: '600',
  },
  yearList: {
    borderTopColor: C.divider,
    borderTopWidth: 1,
    marginTop: 4,
  },
});
