import React from 'react';
import { render } from '@testing-library/react-native';
import ScrollToTopButton from '../ScrollToTopButton';

describe('ScrollToTopButton', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<ScrollToTopButton onPress={() => {}} />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders with absolute positioning', () => {
    const { toJSON } = render(<ScrollToTopButton onPress={() => {}} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    expect(tree.props.style).toEqual(
      expect.objectContaining({ position: 'absolute' })
    );
  });

  it('positions above the FAB with bottom: 134', () => {
    const { toJSON } = render(<ScrollToTopButton onPress={() => {}} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    expect(tree.props.style).toEqual(
      expect.objectContaining({ bottom: 134 })
    );
  });

  it('uses 44x44 size', () => {
    const { toJSON } = render(<ScrollToTopButton onPress={() => {}} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    expect(tree.props.style).toEqual(
      expect.objectContaining({ width: 44, height: 44 })
    );
  });

  it('renders chevron-up icon', () => {
    const { toJSON } = render(<ScrollToTopButton onPress={() => {}} />);
    const tree = JSON.parse(JSON.stringify(toJSON()));
    const jsonStr = JSON.stringify(tree);
    expect(jsonStr).toContain('chevron-up');
  });
});
