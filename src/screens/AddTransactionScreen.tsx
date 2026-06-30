import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTransactionStore, useAuthStore } from '@store/index';
import { parseTransactionMessage } from '@services/aiTransactionParser';
import { parseDate } from '@utils/dateParser';
import { formatCurrency, formatDate } from '@utils/currency';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@utils/categories';

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

const C = {
  white: '#fff',
  textDark: '#333',
  textLight: '#999',
  textMuted: '#bbb',
  blue: '#2196F3',
  border: '#e0e0e0',
  bg: '#f5f5f5',
  green: '#4CAF50',
  greenLight: '#E8F5E9',
  red: '#f44336',
  redLight: '#FFEBEE',
  cardBg: '#fff',
  grayLight: '#f0f0f0',
  grayBorder: '#e0e0e0',
  divider: '#ddd',
};

export default function AddTransactionScreen(): React.ReactElement {
  const [inputText, setInputText] = useState('');
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const feedIdCounter = useRef(0);

  const { user } = useAuthStore();
  const { transactions, addTransaction } = useTransactionStore();

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

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !user?.id || isLoading) return;

    setInputText('');
    setIsLoading(true);

    try {
      const result = await parseTransactionMessage(text, []);

      if (result.transactions.length > 0) {
        const aiTx = result.transactions[0];
        const txDate = parseDate(aiTx.date) || new Date();

        try {
          await addTransaction({
            userId: user.id,
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
        <View key={item.id} style={styles.errorBubble}>
          <Text style={styles.errorBubbleText}>
            {'⚠️ '}
            {item.errorMessage}
          </Text>
        </View>
      );
    }

    const icon = CATEGORY_ICONS[item.category || ''] || '📌';
    const label = CATEGORY_LABELS[item.category || ''] || item.category;
    const sign = item.type === 'income' ? '+' : '-';
    const amountColor =
      item.type === 'income' ? styles.incomeColor : styles.expenseColor;

    return (
      <View key={item.id} style={styles.itemBubble}>
        <View style={styles.itemRow}>
          <View style={styles.itemLeft}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemIcon}>{icon}</Text>
              <View style={styles.itemInfo}>
                <Text style={styles.itemDescription}>
                  {item.description}
                </Text>
                <Text style={styles.itemMeta}>
                  {label}
                  {' | '}
                  {item.date ? formatDate(item.date) : ''}
                </Text>
              </View>
            </View>
            <Text style={[styles.itemAmount, amountColor]}>
              {sign}
              {formatCurrency(item.amount || 0)}
            </Text>
          </View>

          {item.userText && (
            <>
              <View style={styles.itemDivider} />
              <View style={styles.itemRight}>
                <Text style={styles.userText}>{item.userText}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} style={styles.scrollArea}>
        {feed.map(renderItem)}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={C.blue} />
            <Text style={styles.loadingText}>Saving...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="What did you spend?"
            placeholderTextColor={C.textLight}
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
            multiline
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    flex: 1,
  },
  errorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: C.redLight,
    borderRadius: 10,
    marginBottom: 8,
    marginRight: 50,
    padding: 12,
  },
  errorBubbleText: {
    color: C.red,
    fontSize: 13,
  },
  expenseColor: {
    color: C.red,
  },
  incomeColor: {
    color: C.green,
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
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  itemBubble: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  itemDescription: {
    color: C.textDark,
    fontSize: 15,
    fontWeight: '600',
  },
  itemDivider: {
    borderLeftColor: C.divider,
    borderLeftWidth: 1,
    marginHorizontal: 12,
  },
  itemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 1,
  },
  itemInfo: {
    flex: 1,
  },
  itemLeft: {
    flex: 1,
  },
  itemMeta: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    justifyContent: 'center',
    maxWidth: 120,
    paddingLeft: 4,
  },
  itemRow: {
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginRight: 10,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  userLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  userText: {
    color: C.textDark,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
