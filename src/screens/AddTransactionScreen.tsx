import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTransactionStore } from '@store/index';
import { useAuthStore } from '@store/index';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@utils/categories';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default function AddTransactionScreen(): React.ReactElement {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuthStore();
  const { addTransaction, isLoading } = useTransactionStore();

  const handleAdd = async () => {
    if (!amount || !category) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addTransaction({
        userId: user?.id || '',
        type,
        amount: parseFloat(amount),
        category,
        description,
        date: new Date(),
      });
      Alert.alert('Success', 'Transaction added successfully');
      setAmount('');
      setCategory('');
      setDescription('');
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.label}>Type</Text>
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
          <TouchableOpacity
            style={[styles.button, { flex: 1, marginRight: 10, backgroundColor: type === 'income' ? '#4CAF50' : '#ddd' }]}
            onPress={() => setType('income')}
          >
            <Text style={styles.buttonText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { flex: 1, backgroundColor: type === 'expense' ? '#f44336' : '#ddd' }]}
            onPress={() => setType('expense')}
          >
            <Text style={styles.buttonText}>Expense</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          placeholder="Select category"
          value={category}
          onChangeText={setCategory}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 100 }]}
          placeholder="Add a note..."
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TouchableOpacity
          style={[styles.button, isLoading && { opacity: 0.6 }]}
          onPress={handleAdd}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Add Transaction</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
