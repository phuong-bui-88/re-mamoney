import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTransactionStore, useAuthStore } from '@store/index';
import { parseTransactionText } from '@utils/parseTransactionText';
import type { Transaction } from '@/types';
import { formatCurrency } from '@utils/currency';
import { C } from '@theme/index';
import FilteredTransactionList from './FilteredTransactionList';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface DayTransactionsModalProps {
  date: Date | null;
  onClose: () => void;
  onTransactionPress?: (transaction: Transaction) => void;
}

export function formatDayTitle(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export default function DayTransactionsModal({
  date,
  onClose,
  onTransactionPress,
}: DayTransactionsModalProps): React.ReactElement {
  const { transactions } = useTransactionStore();
  const { selectedUser } = useAuthStore();
  const { height: windowHeight } = useWindowDimensions();
  const minHeight = Math.round(windowHeight * 0.6);
  const [adding, setAdding] = useState(false);
  const [inputText, setInputText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const sendingRef = useRef(false);
  const listRef = useRef<ScrollView>(null);
  const scrollToEndPending = useRef(false);

  const dayKey = date ? date.getTime() : null;
  useEffect(() => {
    setAdding(false);
    setInputText('');
    setError(null);
  }, [dayKey]);

  useEffect(() => {
    if (!adding) return;
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [adding]);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setInputText(text);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !date || !selectedUser?.id || sendingRef.current) return;
    sendingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const result = await parseTransactionText(text);
      if (result.transactions.length === 0) {
        setError(result.errorMessage ?? 'Could not parse.');
        return;
      }
      const now = new Date();
      scrollToEndPending.current = true;
      for (const [i, tx] of result.transactions.entries()) {
        const txDate = new Date(date);
        txDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds() + i, 0);
        await useTransactionStore
          .getState()
          .addTransaction({ userId: selectedUser.id, ...tx, date: txDate });
      }
      setInputText('');
    } catch (e) {
      scrollToEndPending.current = false;
      setError(`Error: ${(e as Error).message}`);
    } finally {
      sendingRef.current = false;
      setSaving(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleContentSizeChange = () => {
    if (!scrollToEndPending.current) return;
    scrollToEndPending.current = false;
    listRef.current?.scrollToEnd({ animated: true });
  };

  const netTotal = useMemo(() => {
    if (!date) return 0;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return transactions
      .filter((t) => t.date >= startOfDay && t.date <= endOfDay)
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
  }, [transactions, date]);

  return (
    <Modal visible={date !== null} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={[styles.overlay, adding && styles.overlayTop]}
          onPress={onClose}
          testID="day-modal-overlay"
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.kav}
          >
            <Pressable
              style={[styles.card, { minHeight }]}
              onPress={() => {}}
              testID="day-transactions-modal"
            >
              {date && (
                <>
                  <View style={styles.header}>
                    <Text style={styles.title}>{formatDayTitle(date)}</Text>
                    <View style={styles.headerActions}>
                      <TouchableOpacity
                        onPress={() => setAdding(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        testID="day-modal-add"
                        accessibilityLabel="Add transaction"
                      >
                        <Ionicons name="add" size={24} color={C.textMedium} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        testID="day-modal-close"
                      >
                        <Ionicons name="close" size={22} color={C.textMedium} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.summary}>
                    <Text style={styles.summaryLabel}>Net total</Text>
                    <Text
                      testID="day-modal-net-total"
                      style={[styles.summaryAmount, netTotal >= 0 ? styles.income : styles.expense]}
                    >
                      {netTotal >= 0 ? '+' : ''}
                      {formatCurrency(netTotal)}
                    </Text>
                  </View>
                  <ScrollView
                    ref={listRef}
                    onContentSizeChange={handleContentSizeChange}
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    <FilteredTransactionList
                      filterMode="day"
                      selectedDate={date}
                      onTransactionPress={onTransactionPress}
                    />
                  </ScrollView>
                  {adding && (
                    <View style={styles.inputArea}>
                      {error && <Text style={styles.errorText}>{error}</Text>}
                      <View style={styles.inputRow}>
                        <TextInput
                          ref={inputRef}
                          testID="day-modal-input"
                          style={styles.input}
                          placeholder="What did you spend?"
                          placeholderTextColor={C.textLight}
                          value={inputText}
                          onChangeText={setInputText}
                          editable={!saving}
                          multiline
                          autoFocus
                        />
                        {!inputText.trim() && !saving && (
                          <TouchableOpacity
                            onPress={handlePaste}
                            testID="day-modal-paste"
                            accessibilityLabel="Paste from clipboard"
                            style={styles.iconBtn}
                          >
                            <Ionicons name="clipboard-outline" size={20} color={C.textLight} />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          onPressIn={handleSend}
                          disabled={!inputText.trim() || saving}
                          testID="day-modal-send"
                          accessibilityLabel="Send"
                          style={[styles.iconBtn, (!inputText.trim() || saving) && styles.disabled]}
                        >
                          <Ionicons name="send" size={20} color={C.blue} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              )}
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
        {saving && (
          <View style={styles.loadingOverlay} testID="day-modal-loading">
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={C.blue} />
            </View>
          </View>
        )}
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.bg,
    borderRadius: 16,
    maxHeight: '75%',
    overflow: 'hidden',
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  errorText: {
    color: C.red,
    fontSize: 12,
    paddingBottom: 6,
  },
  expense: {
    color: C.red,
  },
  header: {
    alignItems: 'center',
    backgroundColor: C.cardBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
  },
  iconBtn: {
    padding: 6,
  },
  income: {
    color: C.green,
  },
  input: {
    color: C.textDark,
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 36,
    paddingHorizontal: 8,
  },
  inputArea: {
    backgroundColor: C.cardBg,
    borderTopColor: C.divider,
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  kav: {
    width: '100%',
  },
  list: {
    flexGrow: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingBox: {
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderRadius: 16,
    elevation: 6,
    justifyContent: 'center',
    padding: 24,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: C.overlay,
    justifyContent: 'center',
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: C.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  overlayTop: {
    justifyContent: 'flex-start',
    paddingTop: 48,
  },
  root: {
    flex: 1,
  },
  summary: {
    alignItems: 'center',
    backgroundColor: C.cardBg,
    borderTopColor: C.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: C.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  title: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
