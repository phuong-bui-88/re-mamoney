import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { C } from '@theme/index';

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
    borderRadius: 8,
    flexDirection: 'row',
    padding: 2,
  },
  segment: {
    alignItems: 'center',
    borderRadius: 7,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  segmentActive: {
    backgroundColor: C.primary,
  },
  segmentText: {
    color: C.textMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: C.white,
    fontWeight: '600',
  },
});
