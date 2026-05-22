import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  message: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#2196F3',
    marginLeft: 50,
  },
  userText: {
    color: '#fff',
  },
  assistantMessage: {
    backgroundColor: '#e0e0e0',
    marginRight: 50,
  },
  assistantText: {
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default function AskScreen(): React.ReactElement {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string }>>([]);

  const handleSend = () => {
    if (message.trim()) {
      setMessages([
        ...messages,
        { id: Date.now().toString(), role: 'user', content: message },
      ]);
      setMessage('');
      // TODO: Send to AI service
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ask AI</Text>
      </View>

      <ScrollView style={styles.chatContainer}>
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.message, msg.role === 'user' ? styles.userMessage : styles.assistantMessage]}>
            <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          value={message}
          onChangeText={setMessage}
          multiline
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
