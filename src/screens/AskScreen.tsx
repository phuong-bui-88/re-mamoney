import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  assistantMessage: {
    backgroundColor: '#e0e0e0',
    marginRight: 50,
  },
  assistantText: {
    color: '#333',
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  container: {
    backgroundColor: '#f5f5f5',
    flex: 1,
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 40,
  },
  input: {
    borderColor: '#ddd',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    marginRight: 10,
    padding: 12,
  },
  inputContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 15,
  },
  message: {
    borderRadius: 8,
    marginVertical: 8,
    padding: 12,
  },
  sendButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    padding: 12,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userMessage: {
    backgroundColor: '#2196F3',
    marginLeft: 50,
  },
  userText: {
    color: '#fff',
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
