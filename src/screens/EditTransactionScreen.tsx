import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import { formatCurrency, formatDate } from '@utils/currency';
import { parseDate } from '@utils/dateParser';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  CATEGORY_COLORS,
  FALLBACK_COLORS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '@utils/categories';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@theme/index';

const LABEL_WIDTH = 90;

export default function EditTransactionScreen(): React.ReactElement | null {
  const route = useRoute();
  const navigation = useNavigation();
  const { transactionId } = route.params as { transactionId: string };
  const transaction = useTransactionStore((s) => s.transactions.find((t) => t.id === transactionId));
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!transaction) {
      navigation.goBack();
    }
  }, [transaction, navigation]);

  if (!transaction) return null;

  const initialMultiply = transaction.amount % 1000 === 0;
  const initialInput = initialMultiply
    ? (transaction.amount / 1000).toString()
    : transaction.amount.toString();

  const [description, setDescription] = useState(transaction.description);
  const [amountInput, setAmountInput] = useState(initialInput);
  const [multiplyBy1000, setMultiplyBy1000] = useState(initialMultiply);
  const [selectedCategory, setSelectedCategory] = useState(transaction.category);
  const [dateInput, setDateInput] = useState(formatDate(transaction.date));
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = transaction.date;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  });
  const [viewMonth, setViewMonth] = useState(transaction.date.getMonth());
  const [viewYear, setViewYear] = useState(transaction.date.getFullYear());

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const getDaysInMonth = (month: number, year: number): number =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number): number => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const calendarDays = useMemo(() => {
    const total = getDaysInMonth(viewMonth, viewYear);
    const start = getFirstDayOfMonth(viewMonth, viewYear);
    const cells: (number | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [viewMonth, viewYear]);

  const navigateMonth = (delta: number) => {
    let newMonth = viewMonth + delta;
    let newYear = viewYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear -= 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear += 1;
    }
    setViewMonth(newMonth);
    setViewYear(newYear);
  };

  const handleDayPress = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    setCalendarDate(selected);
  };

  const handleToday = () => {
    const now = new Date();
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
    setCalendarDate(new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  };

  const handleDateOk = () => {
    setDateInput(formatDate(calendarDate));
    setDateModalOpen(false);
  };

  const handleDateCancel = () => {
    const d = calendarDate;
    setCalendarDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
    setDateModalOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      amountRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const isExpense = transaction.type === 'expense';
  const categoryKeys = isExpense ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const categoryOptions = categoryKeys.map((key) => ({
    key,
    label: CATEGORY_LABELS[key] || key,
    icon: CATEGORY_ICONS[key] || 'ellipsis-horizontal-outline',
    color: CATEGORY_COLORS[key] || FALLBACK_COLORS[0],
  }));

  const computedAmount = useMemo(() => {
    const num = parseInt(amountInput.replace(/[.,\s]/g, ''), 10) || 0;
    return multiplyBy1000 ? num * 1000 : num;
  }, [amountInput, multiplyBy1000]);

  const preview = formatCurrency(computedAmount);

  const handleSave = async () => {
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      Alert.alert('Validation', 'Description is required');
      return;
    }

    const amountNum = parseInt(amountInput.replace(/[.,\s]/g, ''), 10);
    if (!amountNum || amountNum <= 0) {
      Alert.alert('Validation', 'Amount must be a positive number');
      return;
    }

    const finalAmount = multiplyBy1000 ? amountNum * 1000 : amountNum;

    const parsedDate = parseDate(dateInput.replace(/\//g, '-'));
    if (!parsedDate) {
      Alert.alert('Validation', 'Invalid date. Use dd/MM/yyyy format');
      return;
    }

    setIsSaving(true);
    try {
      await useTransactionStore.getState().updateTransaction(transaction.id, {
        description: trimmedDesc,
        amount: finalAmount,
        category: selectedCategory,
        date: parsedDate,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.fieldRow}>
          <Text style={styles.label}>Description:</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor={C.textLight}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Amount:</Text>
          <View style={styles.amountCol}>
            <View style={styles.amountRow}>
              <TextInput
                ref={amountRef}
                style={[styles.input, styles.amountInput]}
                value={amountInput}
                onChangeText={setAmountInput}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={C.textLight}
              />
              <View style={styles.checkboxRow}>
                <Switch
                  value={multiplyBy1000}
                  onValueChange={setMultiplyBy1000}
                  trackColor={{ false: C.border, true: C.blue }}
                  thumbColor={C.white}
                />
                <Text style={styles.checkboxLabel}>Add &apos;000</Text>
              </View>
            </View>
            <Text style={styles.preview}>Preview: {preview}</Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Type:</Text>
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isExpense ? C.expenseLight : C.incomeLight },
            ]}
          >
            <Ionicons
              name={isExpense ? 'arrow-down-outline' : 'arrow-up-outline'}
              size={14}
              color={isExpense ? C.expense : C.income}
            />
            <Text
              style={[
                styles.typeBadgeText,
                { color: isExpense ? C.expense : C.income },
              ]}
            >
              {isExpense ? 'Expense' : 'Income'}
            </Text>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Category:</Text>
          <TouchableOpacity
            style={styles.categoryTrigger}
            onPress={() => setCategoryOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.categoryTriggerInner}>
              <Ionicons
                name={CATEGORY_ICONS[selectedCategory] as any}
                size={16}
                color={CATEGORY_COLORS[selectedCategory] || C.textDark}
              />
              <Text style={styles.categoryTriggerText} numberOfLines={1}>
                {CATEGORY_LABELS[selectedCategory] || selectedCategory}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color={C.textMedium} />
          </TouchableOpacity>
        </View>

        <Modal visible={categoryOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.overlayBase}
            onPress={() => setCategoryOpen(false)}
            activeOpacity={1}
          >
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <ScrollView>
                {categoryOptions.map(({ key, label, icon, color }) => {
                  const isSelected = selectedCategory === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.pickerItem,
                        isSelected && styles.pickerItemActive,
                      ]}
                      onPress={() => {
                        setSelectedCategory(key);
                        setCategoryOpen(false);
                      }}
                    >
                      <View style={styles.pickerItemLeft}>
                        <Ionicons name={icon as any} size={18} color={color} />
                        <Text style={styles.pickerItemText}>{label}</Text>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color={C.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

        <View style={styles.fieldRow}>
          <Text style={styles.label}>Date:</Text>
          <TouchableOpacity
            style={styles.dateTrigger}
            onPress={() => setDateModalOpen(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dateTriggerInner}>
              <Ionicons name="calendar-outline" size={16} color={C.blue} />
              <Text style={styles.dateTriggerText}>{dateInput}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMedium} />
          </TouchableOpacity>
        </View>

        <Modal visible={dateModalOpen} transparent animationType="fade">
          <TouchableOpacity
            style={styles.overlayBase}
            onPress={() => setDateModalOpen(false)}
            activeOpacity={1}
          >
            <View style={styles.calendarContainer}>
              <Text style={styles.calendarTitle}>Select Date</Text>

              <View style={styles.calendarNav}>
                <TouchableOpacity
                  onPress={() => navigateMonth(-1)}
                  style={styles.calendarNavBtn}
                  activeOpacity={0.6}
                >
                  <Ionicons name="chevron-back" size={20} color={C.textDark} />
                </TouchableOpacity>
                <Text style={styles.calendarMonthYear}>
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity
                  onPress={() => navigateMonth(1)}
                  style={styles.calendarNavBtn}
                  activeOpacity={0.6}
                  testID="calendar-next-month"
                >
                  <Ionicons name="chevron-forward" size={20} color={C.textDark} />
                </TouchableOpacity>
              </View>

              <View style={styles.calendarWeekRow}>
                {DAY_LABELS.map((label) => (
                  <Text key={label} style={styles.calendarWeekLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {calendarDays.map((day, idx) => {
                  if (day === null) {
                    return <View key={`empty-${idx}`} style={styles.calendarDayCell} />;
                  }
                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    viewMonth === today.getMonth() &&
                    viewYear === today.getFullYear();
                  const isSelected =
                    day === calendarDate.getDate() &&
                    viewMonth === calendarDate.getMonth() &&
                    viewYear === calendarDate.getFullYear();
                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      style={[
                        styles.calendarDayCell,
                        isToday && !isSelected && styles.calendarDayToday,
                        isSelected && styles.calendarDaySelected,
                      ]}
                      onPress={() => handleDayPress(day)}
                      activeOpacity={0.6}
                    >
                      <Text
                        style={[
                          styles.calendarDayText,
                          isToday && !isSelected && styles.calendarDayTodayText,
                          isSelected && styles.calendarDaySelectedText,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.calendarFooter}>
                <TouchableOpacity
                  style={styles.calendarTodayBtn}
                  onPress={handleToday}
                  activeOpacity={0.7}
                >
                  <Text style={styles.calendarTodayText}>Today</Text>
                </TouchableOpacity>
                <View style={styles.calendarFooterRight}>
                  <TouchableOpacity
                    style={styles.calendarCancelBtn}
                    onPress={handleDateCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.calendarCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.calendarOkBtn}
                    onPress={handleDateOk}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.calendarOkText}>OK</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  amountCol: {
    flex: 1,
  },
  amountInput: {
    flex: 1,
    marginRight: 12,
  },
  amountRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  calendarCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  calendarCancelText: {
    color: C.textMedium,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarContainer: {
    backgroundColor: C.white,
    borderRadius: 14,
    padding: 16,
    width: '88%',
  },
  calendarDayCell: {
    alignItems: 'center',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: `${100 / 7}%`,
  },
  calendarDaySelected: {
    backgroundColor: C.blue,
  },
  calendarDaySelectedText: {
    color: C.white,
    fontWeight: '700',
  },
  calendarDayText: {
    color: C.textDark,
    fontSize: 14,
  },
  calendarDayToday: {
    borderColor: C.blue,
    borderWidth: 1.5,
  },
  calendarDayTodayText: {
    color: C.blue,
    fontWeight: '700',
  },
  calendarFooter: {
    alignItems: 'center',
    borderTopColor: C.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
  },
  calendarFooterRight: {
    flexDirection: 'row',
    gap: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarMonthYear: {
    color: C.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  calendarNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calendarNavBtn: {
    padding: 6,
  },
  calendarOkBtn: {
    backgroundColor: C.blue,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  calendarOkText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  calendarTitle: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  calendarTodayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  calendarTodayText: {
    color: C.blue,
    fontSize: 14,
    fontWeight: '600',
  },
  calendarWeekLabel: {
    color: C.textLight,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  calendarWeekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryTrigger: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryTriggerInner: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  categoryTriggerText: {
    color: C.textDark,
    flex: 1,
    fontSize: 15,
  },
  checkboxLabel: {
    color: C.textDark,
    fontSize: 13,
    marginLeft: 6,
  },
  checkboxRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  container: {
    backgroundColor: C.bg,
    flex: 1,
  },
  dateTrigger: {
    alignItems: 'center',
    backgroundColor: C.white,
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateTriggerInner: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  dateTriggerText: {
    color: C.textDark,
    flex: 1,
    fontSize: 15,
  },
  fieldRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    marginBottom: 20,
  },
  footer: {
    backgroundColor: C.white,
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  input: {
    backgroundColor: C.white,
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    color: C.textDark,
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  label: {
    color: C.textDark,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 46,
    marginRight: 8,
    width: LABEL_WIDTH,
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
  pickerItemLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 10,
  },
  pickerItemText: {
    color: C.textDark,
    flex: 1,
    fontSize: 15,
  },
  pickerTitle: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  preview: {
    color: C.blue,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: C.blue,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  typeBadge: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  typeBadgeText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
