import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Rect, Line, Text as SvgText } from 'react-native-svg';
import { C } from '@theme/index';
import { useTransactionStore } from '@store/index';
import { getMonthlyTotals, formatCurrency } from '@utils/currency';
import { Ionicons } from '@react-native-vector-icons/ionicons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 20;
const BAR_WIDTH = 36;
const CHART_HEIGHT = 200;
const Y_LABEL_WIDTH = 36;
const X_LABEL_HEIGHT = 22;
const BOTTOM_PADDING = 8;
const DRAG_ACTIVATION_X = 8;
const DRAG_FAIL_Y = 12;
const MONTHS_IN_YEAR = 12;
const VISIBLE_MONTHS = 5;
const CENTER_SLOT = 2;
const CHART_WIDTH = SCREEN_WIDTH - 32 - CARD_PADDING * 2;
const PLOT_WIDTH = CHART_WIDTH - Y_LABEL_WIDTH;
const SLOT_WIDTH = PLOT_WIDTH / VISIBLE_MONTHS;
const TRACK_WIDTH = SLOT_WIDTH * MONTHS_IN_YEAR;
const SNAP_DURATION_MS = 220;
const FLING_PROJECTION_S = 0.12;
const EMPTY_SCALE_MAX = 5000;

// Track offset that puts a month in the centre slot.
const offsetForMonth = (month: number): number => {
  'worklet';
  return (CENTER_SLOT - month) * SLOT_WIDTH;
};

const clampOffset = (offset: number): number => {
  'worklet';
  return Math.min(offsetForMonth(0), Math.max(offsetForMonth(MONTHS_IN_YEAR - 1), offset));
};

const monthAtOffset = (offset: number): number => {
  'worklet';
  return Math.round(CENTER_SLOT - clampOffset(offset) / SLOT_WIDTH);
};

interface MonthlyChartProps {
  onMonthSelect?: (month: number) => void;
  onInfoPress?: () => void;
}

export default function MonthlyChart({
  onMonthSelect,
  onInfoPress,
}: MonthlyChartProps): React.ReactElement {
  const { allTransactions, selectedYear, selectedMonth } = useTransactionStore();
  const [activeMonth, setActiveMonth] = useState<number | null>(selectedMonth);
  const scrollX = useSharedValue(offsetForMonth(selectedMonth));
  const dragStartX = useSharedValue(0);
  const dragMonth = useSharedValue(selectedMonth);

  useEffect(() => {
    setActiveMonth(selectedMonth);
    scrollX.value = withTiming(offsetForMonth(selectedMonth), { duration: SNAP_DURATION_MS });
  }, [selectedMonth, scrollX]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  const monthlyData = useMemo(
    () => getMonthlyTotals(allTransactions, selectedYear),
    [allTransactions, selectedYear]
  );

  const scaleCenter = activeMonth ?? selectedMonth;

  // The left axis follows the months on screen, so it updates as the strip scrolls.
  const maxAbs = useMemo(() => {
    const visibleMonths = monthlyData.slice(
      Math.max(0, scaleCenter - CENTER_SLOT),
      scaleCenter + CENTER_SLOT + 1
    );
    const largest = Math.max(...visibleMonths.map((d) => Math.abs(d.net)));
    return largest > 0 ? largest : EMPTY_SCALE_MAX;
  }, [monthlyData, scaleCenter]);

  const tickStep = useMemo(() => {
    const rawStep = maxAbs / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    if (residual <= 1.5) return magnitude * 1;
    if (residual <= 3.5) return magnitude * 2;
    if (residual <= 7.5) return magnitude * 5;
    return magnitude * 10;
  }, [maxAbs]);

  const maxTick = useMemo(() => {
    const ticks = Math.ceil(maxAbs / tickStep);
    return ticks * tickStep;
  }, [maxAbs, tickStep]);

  const tickValues = useMemo(() => {
    const values: number[] = [];
    for (let v = 0; v <= maxTick; v += tickStep) {
      values.push(v);
    }
    return values;
  }, [maxTick, tickStep]);

  const plotLeft = Y_LABEL_WIDTH;
  const getCenterX = (month: number): number => SLOT_WIDTH * (month + 0.5);
  const plotTop = 28;
  const plotBottom = CHART_HEIGHT - X_LABEL_HEIGHT - BOTTOM_PADDING;
  const plotHeight = plotBottom - plotTop;

  const yScale = useCallback(
    (value: number) => {
      return plotBottom - (value / maxTick) * plotHeight;
    },
    [plotBottom, maxTick, plotHeight]
  );

  const formatTick = (value: number): string => {
    if (value === 0) return '0';
    const k = value / 1000;
    if (k >= 1000) return `${(k / 1000).toFixed(k >= 10000 ? 0 : 1)}M`;
    return `${k.toFixed(0)}k`;
  };

  const handleBarPress = (month: number) => {
    if (activeMonth === month) {
      setActiveMonth(null);
    } else {
      setActiveMonth(month);
      onMonthSelect?.(month);
    }
  };

  const dragGesture = useMemo(() => {
    const commitMonth = (month: number): void => {
      setActiveMonth(month);
      if (month !== selectedMonth) {
        onMonthSelect?.(month);
      }
    };

    return Gesture.Pan()
      .activeOffsetX([-DRAG_ACTIVATION_X, DRAG_ACTIVATION_X])
      .failOffsetY([-DRAG_FAIL_Y, DRAG_FAIL_Y])
      .onStart(() => {
        cancelAnimation(scrollX);
        dragStartX.value = scrollX.value;
        dragMonth.value = monthAtOffset(scrollX.value);
        runOnJS(setActiveMonth)(dragMonth.value);
      })
      .onUpdate((event) => {
        scrollX.value = clampOffset(dragStartX.value + event.translationX);
        const month = monthAtOffset(scrollX.value);
        if (month !== dragMonth.value) {
          dragMonth.value = month;
          runOnJS(setActiveMonth)(month);
        }
      })
      .onEnd((event, success) => {
        if (!success) {
          scrollX.value = withTiming(offsetForMonth(selectedMonth), {
            duration: SNAP_DURATION_MS,
          });
          runOnJS(setActiveMonth)(selectedMonth);
          return;
        }
        const month = monthAtOffset(scrollX.value + event.velocityX * FLING_PROJECTION_S);
        scrollX.value = withTiming(offsetForMonth(month), { duration: SNAP_DURATION_MS });
        runOnJS(commitMonth)(month);
      });
  }, [scrollX, dragStartX, dragMonth, selectedMonth, onMonthSelect]);

  const hasYearData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  if (!hasYearData) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Monthly Net</Text>
            {onInfoPress && (
              <TouchableOpacity
                onPress={onInfoPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                testID="monthly-chart-info-btn"
              >
                <Ionicons name="information-circle-outline" size={18} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <Text style={styles.emptyText}>No transactions in {selectedYear}</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Monthly Net</Text>
          {onInfoPress && (
            <TouchableOpacity
              onPress={onInfoPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="monthly-chart-info-btn"
            >
              <Ionicons name="information-circle-outline" size={18} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <GestureDetector gesture={dragGesture} touchAction="pan-y" userSelect="none">
        <View style={styles.chartWrapper} testID="monthly-chart-drag-area">
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <G>
              {tickValues.map((v) => (
                <Line
                  key={`grid-${v}`}
                  x1={plotLeft}
                  y1={yScale(v)}
                  x2={plotLeft + PLOT_WIDTH}
                  y2={yScale(v)}
                  stroke={C.border}
                  strokeWidth={1}
                />
              ))}
              {tickValues.map((v) => (
                <SvgText
                  key={`tick-${v}`}
                  x={plotLeft - 6}
                  y={yScale(v) + 4}
                  textAnchor="end"
                  fontSize={12}
                  fill={C.textDark}
                >
                  {formatTick(v)}
                </SvgText>
              ))}
            </G>
          </Svg>

          <View style={styles.trackClip}>
            <Animated.View style={[styles.track, trackStyle]} testID="monthly-chart-track">
              <Svg width={TRACK_WIDTH} height={CHART_HEIGHT}>
                <G>
                  {monthlyData.map((d) => {
                    const net = d.net;
                    const monthIndex = d.month;
                    const zeroY = yScale(0);
                    // Months just off screen can exceed the scale, so keep them inside the plot.
                    const barHeight = Math.min(Math.abs(net) / maxTick, 1) * plotHeight;
                    const barY = zeroY - barHeight;
                    const centerX = getCenterX(monthIndex);
                    const barX = centerX - BAR_WIDTH / 2;
                    const isActive = activeMonth === monthIndex;
                    const color = isActive ? C.primary : net >= 0 ? C.green : C.red;

                    return (
                      <G key={`bar-${monthIndex}`}>
                        {isActive && net !== 0 && (
                          <SvgText
                            x={centerX}
                            y={barY - 8}
                            textAnchor="middle"
                            fontSize={11}
                            fontWeight="bold"
                            fill={color}
                          >
                            {formatCurrency(Math.abs(net))}
                          </SvgText>
                        )}
                        {net !== 0 && (
                          <Rect
                            x={barX}
                            y={barY}
                            width={BAR_WIDTH}
                            height={Math.max(barHeight, 2)}
                            fill={color}
                            rx={3}
                            ry={3}
                            opacity={isActive ? 1 : 0.75}
                          />
                        )}
                        <SvgText
                          x={centerX}
                          y={plotBottom + 16}
                          textAnchor="middle"
                          fontSize={11}
                          fill={isActive ? C.primary : C.textLight}
                          fontWeight="500"
                        >
                          {monthIndex + 1}
                        </SvgText>
                      </G>
                    );
                  })}
                </G>
              </Svg>

              {monthlyData.map((d) => {
                const monthIndex = d.month;
                return (
                  <Pressable
                    key={`tap-${monthIndex}`}
                    style={[
                      styles.tapOverlay,
                      { left: getCenterX(monthIndex) - SLOT_WIDTH / 2, width: SLOT_WIDTH },
                    ]}
                    onPress={() => {
                      handleBarPress(monthIndex);
                    }}
                    accessibilityRole="button"
                  />
                );
              })}
            </Animated.View>
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 16,
    elevation: 3,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: CARD_PADDING,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  chartWrapper: {
    position: 'relative',
  },
  emptyText: {
    color: C.textLight,
    fontSize: 14,
    paddingVertical: 32,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tapOverlay: {
    height: CHART_HEIGHT,
    position: 'absolute',
    top: 0,
  },
  title: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  track: {
    height: CHART_HEIGHT,
    width: TRACK_WIDTH,
  },
  trackClip: {
    height: CHART_HEIGHT,
    left: Y_LABEL_WIDTH,
    overflow: 'hidden',
    position: 'absolute',
    top: 0,
    width: PLOT_WIDTH,
  },
});
