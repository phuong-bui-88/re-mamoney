import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import Svg, { G, Rect, Line, Text as SvgText } from 'react-native-svg';
import { C } from '@theme/index';
import { useTransactionStore } from '@store/index';
import { getMonthlyTotals, formatCurrency } from '@utils/currency';
import { Ionicons } from '@expo/vector-icons';

const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const ITEM_WIDTH = 55;
const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDE_PADDING = (SCREEN_WIDTH - ITEM_WIDTH) / 2;
const BAR_WIDTH = 36;
const CHART_HEIGHT = 200;
const Y_LABEL_WIDTH = 36;
const X_LABEL_HEIGHT = 22;
const BOTTOM_PADDING = 8;

interface MonthlyChartProps {
  onMonthSelect?: (month: number) => void;
  onInfoPress?: () => void;
}

export default function MonthlyChart({ onMonthSelect, onInfoPress }: MonthlyChartProps): React.ReactElement {
  const { allTransactions, selectedYear, selectedMonth } = useTransactionStore();
  const [activeMonth, setActiveMonth] = useState<number | null>(selectedMonth);

  useEffect(() => {
    setActiveMonth(selectedMonth);
  }, [selectedMonth]);

  const monthlyData = useMemo(
    () => getMonthlyTotals(allTransactions, selectedYear),
    [allTransactions, selectedYear],
  );

  const windowStart = Math.max(0, Math.min(selectedMonth - 2, 7));
  const windowEnd = windowStart + 4;

  const windowMonths = useMemo(
    () => monthlyData.slice(windowStart, windowEnd + 1),
    [monthlyData, windowStart],
  );

  const maxAbs = useMemo(
    () => Math.max(...windowMonths.map((d) => Math.abs(d.net)), 1),
    [windowMonths],
  );

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

  const cardWidth = SCREEN_WIDTH - 32;
  const plotLeft = Y_LABEL_WIDTH;
  const plotWidth = cardWidth - plotLeft - 8;
  const plotTop = 12;
  const plotBottom = CHART_HEIGHT - X_LABEL_HEIGHT - BOTTOM_PADDING;
  const plotHeight = plotBottom - plotTop;

  const yScale = useCallback(
    (value: number) => {
      return plotBottom - (value / maxTick) * plotHeight;
    },
    [plotBottom, maxTick, plotHeight],
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

  const hasYearData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  if (!hasYearData) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Monthly Net</Text>
            {onInfoPress && (
              <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} testID="monthly-chart-info-btn">
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
            <TouchableOpacity onPress={onInfoPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} testID="monthly-chart-info-btn">
              <Ionicons name="information-circle-outline" size={18} color={C.textLight} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.chartWrapper}>
        <Svg width={cardWidth - 32} height={CHART_HEIGHT}>
          <G>
            {tickValues.map((v) => (
              <Line
                key={`grid-${v}`}
                x1={plotLeft}
                y1={yScale(v)}
                x2={plotLeft + plotWidth}
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
            {windowMonths.map((d) => {
              const net = d.net;
              const monthIndex = d.month;
              const zeroY = yScale(0);
              const barHeight = Math.abs((net / maxTick) * plotHeight);
              const barY = zeroY - barHeight;
              const centerX = SIDE_PADDING + ITEM_WIDTH / 2 - 20 + (monthIndex - selectedMonth) * ITEM_WIDTH;
              const barX = centerX - BAR_WIDTH / 2;
              const isActive = activeMonth === monthIndex;
              const color = isActive ? C.primary : net >= 0 ? C.green : C.red;

              return (
                <G key={`bar-${monthIndex}`}>
                  {isActive && (
                    <SvgText
                      x={barX + BAR_WIDTH / 2}
                      y={barY - 8}
                      textAnchor="middle"
                      fontSize={11}
                fontWeight="bold"
                      fill={color}
                    >
                      {formatCurrency(Math.abs(net))}
                    </SvgText>
                  )}
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
                  <SvgText
                    x={barX + BAR_WIDTH / 2}
                    y={plotBottom + 16}
                    textAnchor="middle"
                fontSize={11}
                    fill={isActive ? C.primary : C.textLight}
                    fontWeight="500"
                  >
                    {MONTHS_SHORT[monthIndex]}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>

        {windowMonths.map((d) => {
          const monthIndex = d.month;
          const centerX = SIDE_PADDING + ITEM_WIDTH / 2 - 20 + (monthIndex - selectedMonth) * ITEM_WIDTH;
          return (
            <Pressable
              key={`tap-${monthIndex}`}
              style={[styles.tapOverlay, { left: centerX - ITEM_WIDTH / 2 }]}
              onPress={() => { handleBarPress(monthIndex); }}
              accessibilityRole="button"
            />
          );
        })}
      </View>
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
    padding: 20,
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
    width: ITEM_WIDTH,
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
});
