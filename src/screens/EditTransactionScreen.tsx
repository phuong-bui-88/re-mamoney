import React, { useState, useMemo } from 'react';
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
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import type { Transaction } from '@/types';
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

export default function EditTransactionScreen(): React.ReactElement {
  const route = useRoute();
  const navigation = useNavigation();
  const { transaction } = route.params as { transaction: Transaction };

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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
          <TextInput
            style={styles.input}
            value={dateInput}
            onChangeText={setDateInput}
            placeholder="dd/MM/yyyy"
            placeholderTextColor={C.textLight}
            keyboardType="numbers-and-punctuation"
          />
        </View>
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
    flexDirection: 'row',
    flex: 1,
    gap: 8,
    marginRight: 8,
  },
  categoryTriggerText: {
    color: C.textDark,
    fontSize: 15,
    flex: 1,
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
    fontSize: 15,
    flex: 1,
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
