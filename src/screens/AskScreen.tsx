import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '@store/index';
import { useChatStore } from '@store/chatStore';

const C = {
  white: '#fff',
  textDark: '#333',
  textLight: '#999',
  blue: '#2196F3',
  border: '#ddd',
  bg: '#f5f5f5',
  assistantBg: '#e0e0e0',
};

export default function AskScreen(): React.ReactElement {
  const [text, setText] = React.useState('');
  const scrollRef = useRef<ScrollView>(null);

  const user = useAuthStore((s) => s.user);
  const { messages, isLoading, subscribe, sendMessage } = useChatStore();

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribe(user.id);
    return () => unsub();
  }, [user?.id, subscribe]);

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || !user?.id || isLoading) return;
    sendMessage(text, user.id);
    setText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ask AI</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>Financial Q&A</Text>
            <Text style={styles.emptyHint}>Ask about your spending:</Text>
            <Text style={styles.example}>
              {`"How much did I spend on food last month?"`}
            </Text>
            <Text style={styles.example}>
              {`"What is my largest expense category?"`}
            </Text>
            <Text style={styles.example}>
              {`"How much did I spend on Grab?"`}
            </Text>
            <Text style={styles.example}>
              {`"What's my average daily spending?"`}
            </Text>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.message,
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text
              style={
                msg.role === 'user' ? styles.userText : styles.assistantText
              }
            >
              {msg.content}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={C.blue} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Ask about your finances..."
            value={text}
            onChangeText={setText}
            multiline
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading}
          >
            <Text style={styles.sendButtonText}>Ask</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantMessage: {
    backgroundColor: C.assistantBg,
    marginRight: 50,
  },
  assistantText: {
    color: C.textDark,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 15,
    paddingBottom: 30,
  },
  container: {
    backgroundColor: C.bg,
    flex: 1,
  },
  emptyHint: {
    color: C.textLight,
    fontSize: 13,
    marginBottom: 8,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: C.textLight,
    fontSize: 16,
    marginBottom: 20,
  },
  example: {
    color: C.blue,
    fontSize: 14,
    fontWeight: '500',
    marginVertical: 2,
  },
  header: {
    backgroundColor: C.blue,
    padding: 20,
    paddingTop: 40,
  },
  input: {
    borderColor: C.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
    padding: 12,
  },
  inputContainer: {
    backgroundColor: C.white,
    paddingBottom: 20,
    paddingHorizontal: 15,
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
  message: {
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
  },
  sendButton: {
    backgroundColor: C.blue,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: C.white,
    fontWeight: 'bold',
  },
  title: {
    color: C.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  userMessage: {
    backgroundColor: C.blue,
    marginLeft: 50,
  },
  userText: {
    color: C.white,
  },
});
