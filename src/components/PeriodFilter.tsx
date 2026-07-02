import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@theme/index';

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const ITEM_WIDTH = 80;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;

interface PeriodFilterProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

export default function PeriodFilter({ month, year, onMonthChange, onYearChange }: PeriodFilterProps): React.ReactElement {
  const [yearOpen, setYearOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const monthRef = useRef(month);
  monthRef.current = month;

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 5; y <= currentYear + 1; y++) {
    years.push(y);
  }

  const isFirstScroll = useRef(true);

  useEffect(() => {
    const targetX = month * ITEM_WIDTH;
    if (isFirstScroll.current) {
      scrollRef.current?.scrollTo({ x: targetX, animated: false });
      isFirstScroll.current = false;
    } else {
      scrollRef.current?.scrollTo({ x: targetX, animated: true });
    }
  }, [month]);

  const onScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const snappedIndex = Math.round(e.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const clamped = Math.min(11, Math.max(0, snappedIndex));
    if (clamped !== monthRef.current) {
      onMonthChange(clamped);
    }
  }, [onMonthChange]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        onMomentumScrollEnd={onScrollEnd}
        testID="month-scroll"
      >
        {MONTHS_SHORT.map((label, i) => {
          const isActive = i === monthRef.current;
          return (
            <View key={label} style={styles.itemWrapper}>
              <TouchableOpacity
                style={[styles.item, isActive && styles.itemActive]}
                onPress={() => onMonthChange(i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.itemText, isActive && styles.itemTextActive]}>
                  {label}
                </Text>
                {isActive && <Text style={styles.indicator}>•</Text>}
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  indicator: {
    color: C.primary,
    fontSize: 8,
    lineHeight: 6,
    marginTop: 2,
  },
  item: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemActive: {},
  itemText: {
    color: C.textMuted,
    fontSize: 15,
    fontWeight: '500',
  },
  itemTextActive: {
    color: C.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  itemWrapper: {
    alignItems: 'center',
    width: ITEM_WIDTH,
  },
  listContent: {
    alignItems: 'center',
    paddingHorizontal: SIDE_PADDING,
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
