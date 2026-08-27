import React from 'react';
import { render } from '@testing-library/react-native';
import FloatingActionButton from '../FloatingActionButton';

describe('FloatingActionButton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<FloatingActionButton onPress={() => {}} />);
    expect(toJSON()).toBeTruthy();
  });

  it('uses default bottom of 24 when no bottom prop is provided', () => {
    const { toJSON } = render(<FloatingActionButton onPress={() => {}} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    expect(tree.props.style).toEqual(
      expect.objectContaining({ bottom: 24 })
    );
  });

  it('applies custom bottom value when provided', () => {
    const { toJSON } = render(<FloatingActionButton onPress={() => {}} bottom={66} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    expect(tree.props.style).toEqual(
      expect.objectContaining({ bottom: 66 })
    );
  });

  it('does not override bottom when bottom prop is undefined', () => {
    const { toJSON } = render(<FloatingActionButton onPress={() => {}} bottom={undefined} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    expect(tree.props.style).toEqual(
      expect.objectContaining({ bottom: 24 })
    );
  });
});
