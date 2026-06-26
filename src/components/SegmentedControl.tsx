import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const C = {
  primary: '#00BFA5',
  white: '#fff',
  textMedium: '#666',
  border: '#E0E0E0',
  shadow: '#000',
};

interface SegmentedControlProps {
  segments: string[];
  selected: number;
  onSelect: (index: number) => void;
}

export default function SegmentedControl({ segments, selected, onSelect }: SegmentedControlProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {segments.map((segment, index) => {
        const isActive = index === selected;
        return (
          <TouchableOpacity
            key={segment}
            style={[styles.segment, isActive && styles.segmentActive]}
            onPress={() => onSelect(index)}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{segment}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.border,
    borderRadius: 10,
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 3,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
    paddingVertical: 9,
  },
  segmentActive: {
    backgroundColor: C.white,
    elevation: 2,
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentText: {
    color: C.textMedium,
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: C.primary,
    fontWeight: '600',
  },
});
