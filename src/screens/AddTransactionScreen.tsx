import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTransactionStore, useAuthStore } from '@store/index';
import { parseTransactionMessage } from '@services/aiTransactionParser';
import { parseDate } from '@utils/dateParser';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatDate } from '@utils/currency';
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORY_COLORS, FALLBACK_COLORS } from '@utils/categories';
import { C } from '@theme/colors';
import { transItemStyles } from '@styles/index';

interface FeedItem {
  id: string;
  kind: 'stored' | 'error';
  description?: string;
  amount?: number;
  type?: 'income' | 'expense';
  category?: string;
  date?: Date;
  userText?: string;
  errorMessage?: string;
}

export default function AddTransactionScreen(): React.ReactElement {
  const [inputText, setInputText] = useState('');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const prevLoading = useRef(isLoading);
  const feedIdCounter = useRef(0);

  const { selectedUser } = useAuthStore();
  const { transactions, addTransaction, allTransactions } = useTransactionStore();

  useEffect(() => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);

    const items: FeedItem[] = [...transactions]
      .filter((tx) => tx.date >= threeDaysAgo)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((tx) => ({
        id: tx.id,
        kind: 'stored' as const,
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        userText: tx.userText,
      }));
    setFeed(items);
  }, [transactions]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [feed, isLoading]);

  useEffect(() => {
    if (prevLoading.current && !isLoading) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
    prevLoading.current = isLoading;
  }, [isLoading]);

  const todaySpent = useMemo(() => {
    const now = new Date();
    return allTransactions
      .filter(
        (tx) =>
          tx.date.getDate() === now.getDate() &&
          tx.date.getMonth() === now.getMonth() &&
          tx.date.getFullYear() === now.getFullYear(),
      )
      .reduce((sum, tx) => {
        return tx.type === 'expense' ? sum + tx.amount : sum - tx.amount;
      }, 0);
  }, [allTransactions]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !selectedUser?.id || isLoading) return;

    setInputText('');
    setIsLoading(true);

    try {
      const result = await parseTransactionMessage(text, []);

      if (result.transactions.length > 0) {
        const aiTx = result.transactions[0];
        const txDate = parseDate(aiTx.date) || new Date();

        try {
          await addTransaction({
            userId: selectedUser.id,
            type: aiTx.type,
            amount: aiTx.amount,
            category: aiTx.category,
            description: aiTx.description,
            date: txDate,
            userText: text,
          });
        } catch {
          const errItem: FeedItem = {
            id: (++feedIdCounter.current).toString(),
            kind: 'error',
            errorMessage: 'Failed to save transaction',
            userText: text,
          };
          setFeed((prev) => [...prev, errItem]);
        }
      } else {
        const errItem: FeedItem = {
          id: (++feedIdCounter.current).toString(),
          kind: 'error',
          errorMessage:
            result.followUpQuestion ||
            "Could not parse. Try 'Coffee 30k' or 'Grab 120k yesterday'",
          userText: text,
        };
        setFeed((prev) => [...prev, errItem]);
      }
    } catch (error) {
      const errItem: FeedItem = {
        id: (++feedIdCounter.current).toString(),
        kind: 'error',
        errorMessage: `Error: ${(error as Error).message}`,
        userText: text,
      };
      setFeed((prev) => [...prev, errItem]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = (item: FeedItem) => {
    if (item.kind === 'error') {
      return (
        <View key={item.id} style={transItemStyles.errorBubble}>
          <Text style={transItemStyles.errorBubbleText}>
            {'⚠️ '}
            {item.errorMessage}
          </Text>
        </View>
      );
    }

    const icon = CATEGORY_ICONS[item.category || ''] || 'ellipsis-horizontal-outline';
    const catColor = CATEGORY_COLORS[item.category || ''] || FALLBACK_COLORS[0];
    const label = CATEGORY_LABELS[item.category || ''] || item.category;
    const sign = item.type === 'income' ? '+' : '-';
    const amountColor =
      item.type === 'income' ? transItemStyles.incomeColor : transItemStyles.expenseColor;

    return (
      <View key={item.id} style={transItemStyles.itemBubble}>
        <View style={transItemStyles.itemRow}>
          <View style={transItemStyles.itemLeft}>
            <View style={transItemStyles.itemHeader}>
              <View style={[transItemStyles.itemIconBg, { backgroundColor: catColor }]}>
                <Ionicons name={icon as any} size={16} color="#fff" />
              </View>
              <View style={transItemStyles.itemInfo}>
                <Text style={transItemStyles.itemDescription}>
                  {item.description}
                </Text>
                <Text style={transItemStyles.itemMeta}>
                  {label}
                  {' | '}
                  {item.date ? formatDate(item.date) : ''}
                </Text>
              </View>
            </View>
            <Text style={[transItemStyles.itemAmount, amountColor]}>
              {sign}
              {formatCurrency(item.amount || 0)}
            </Text>
          </View>

          {item.userText && (
            <>
              <View style={transItemStyles.itemDivider} />
              <View style={transItemStyles.itemRight}>
                <Text style={transItemStyles.userText}>{item.userText}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollArea}
        keyboardShouldPersistTaps="handled"
      >
        {feed.map(renderItem)}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={C.blue} />
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.todayRow}>
          <Text style={[styles.todayText, todaySpent > 0 ? styles.todayRed : styles.todayGreen]}>
            Spent today: {formatCurrency(todaySpent)}
          </Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="What did you spend?"
            placeholderTextColor={C.textLight}
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
            multiline
            autoFocus
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    flex: 1,
  },
  input: {
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputContainer: {
    backgroundColor: C.white,
    borderTopColor: C.border,
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  inputRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 8,
  },
  loadingText: {
    color: C.textLight,
    fontSize: 13,
    marginLeft: 8,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  sendButton: {
    backgroundColor: C.blue,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: C.white,
    fontWeight: 'bold',
  },
  todayGreen: {
    color: C.green,
  },
  todayRed: {
    color: C.red,
  },
  todayRow: {
    alignItems: 'center',
    borderBottomColor: C.border,
    borderBottomWidth: 1,
    marginBottom: 4,
    paddingBottom: 8,
  },
  todayText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
});
