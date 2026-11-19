import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { G, Line, Path, Circle, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { C } from '@theme/index';
import { useTransactionStore } from '@store/index';
import { getMonthlyTotals, formatCurrency } from '@utils/currency';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = 20;
const CHART_WIDTH = SCREEN_WIDTH - 32 - CARD_PADDING * 2;
const CHART_HEIGHT = 200;
const Y_LABEL_WIDTH = 36;
const X_LABEL_HEIGHT = 22;
const BOTTOM_PADDING = 8;
const PLOT_TOP = 28;
const PLOT_BOTTOM = CHART_HEIGHT - X_LABEL_HEIGHT - BOTTOM_PADDING;
const PLOT_HEIGHT = PLOT_BOTTOM - PLOT_TOP;
const PLOT_LEFT = Y_LABEL_WIDTH;
const PLOT_WIDTH = CHART_WIDTH - Y_LABEL_WIDTH;
const MONTHS_IN_YEAR = 12;
const SLOT_WIDTH = PLOT_WIDTH / MONTHS_IN_YEAR;
const DRAW_DURATION_MS = 900;
const EMPTY_SCALE_MAX = 5000;
const LABEL_HALF_WIDTH = 45;

export function niceStep(range: number): number {
  const rawStep = range / 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;
  if (residual <= 1.5) return magnitude;
  if (residual <= 3.5) return magnitude * 2;
  if (residual <= 7.5) return magnitude * 5;
  return magnitude * 10;
}

export function formatTick(value: number): string {
  if (value === 0) return '0';
  const sign = value < 0 ? '-' : '';
  const k = Math.abs(value) / 1000;
  if (k >= 1000) return `${sign}${(k / 1000).toFixed(k >= 10000 ? 0 : 1)}M`;
  return `${sign}${k.toFixed(0)}k`;
}

const xFor = (month: number): number => PLOT_LEFT + SLOT_WIDTH * (month + 0.5);

interface MonthlyLineChartProps {
  onMonthSelect?: (month: number) => void;
  onInfoPress?: () => void;
}

export default function MonthlyLineChart({
  onMonthSelect,
  onInfoPress,
}: MonthlyLineChartProps): React.ReactElement {
  const { allTransactions, selectedYear, selectedMonth } = useTransactionStore();

  const monthlyData = useMemo(
    () => getMonthlyTotals(allTransactions, selectedYear),
    [allTransactions, selectedYear]
  );

  const { minTick, maxTick, ticks } = useMemo(() => {
    const nets = monthlyData.map((d) => d.net);
    const lo = Math.min(0, ...nets);
    const hi = Math.max(0, ...nets);
    const step = niceStep(hi - lo > 0 ? hi - lo : EMPTY_SCALE_MAX);
    const min = Math.floor(lo / step) * step;
    const max = Math.max(Math.ceil(hi / step) * step, min + step);
    const out: number[] = [];
    for (let v = min; v <= max + step / 2; v += step) out.push(v);
    return { minTick: min, maxTick: max, ticks: out };
  }, [monthlyData]);

  const yFor = (value: number): number =>
    PLOT_BOTTOM - ((value - minTick) / (maxTick - minTick)) * PLOT_HEIGHT;

  const points = useMemo(
    () =>
      monthlyData.map((d) => ({
        month: d.month,
        net: d.net,
        x: xFor(d.month),
        y: PLOT_BOTTOM - ((d.net - minTick) / (maxTick - minTick)) * PLOT_HEIGHT,
      })),
    [monthlyData, minTick, maxTick]
  );

  const { path, length } = useMemo(() => {
    let total = 0;
    const segments = points.map((p, i) => {
      if (i > 0) total += Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    });
    return { path: segments.join(' '), length: Math.max(total, 1) };
  }, [points]);

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: DRAW_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [selectedYear, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  const hasYearData = monthlyData.some((d) => d.income > 0 || d.expense > 0);

  const header = (
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
  );

  if (!hasYearData) {
    return (
      <View style={styles.card} testID="monthly-line-chart">
        {header}
        <Text style={styles.emptyText}>No transactions in {selectedYear}</Text>
      </View>
    );
  }

  const active = points[selectedMonth];
  const labelX = Math.min(
    Math.max(active.x, PLOT_LEFT + LABEL_HALF_WIDTH),
    CHART_WIDTH - LABEL_HALF_WIDTH
  );

  return (
    <View style={styles.card} testID="monthly-line-chart">
      {header}
      <View>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          <G>
            {ticks.map((v) => (
              <G key={`tick-${v}`}>
                <Line
                  x1={PLOT_LEFT}
                  y1={yFor(v)}
                  x2={PLOT_LEFT + PLOT_WIDTH}
                  y2={yFor(v)}
                  stroke={v === 0 ? C.textLight : C.border}
                  strokeWidth={1}
                />
                <SvgText
                  x={PLOT_LEFT - 6}
                  y={yFor(v) + 4}
                  textAnchor="end"
                  fontSize={12}
                  fill={C.textDark}
                >
                  {formatTick(v)}
                </SvgText>
              </G>
            ))}

            <AnimatedPath
              testID="monthly-line-path"
              d={path}
              stroke={C.primary}
              strokeWidth={2.5}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={length}
              animatedProps={animatedProps}
            />

            {points.map((p) => {
              const isActive = p.month === selectedMonth;
              return (
                <G key={`point-${p.month}`}>
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={isActive ? 6 : 3.5}
                    fill={isActive ? C.primary : p.net >= 0 ? C.green : C.red}
                  />
                  <SvgText
                    x={p.x}
                    y={PLOT_BOTTOM + 16}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight="500"
                    fill={isActive ? C.primary : C.textLight}
                  >
                    {p.month + 1}
                  </SvgText>
                </G>
              );
            })}

            {active.net !== 0 && (
              <SvgText
                x={labelX}
                y={Math.max(active.y - 12, 12)}
                textAnchor="middle"
                fontSize={11}
                fontWeight="bold"
                fill={C.primary}
              >
                {formatCurrency(Math.abs(active.net))}
              </SvgText>
            )}
          </G>
        </Svg>

        {points.map((p) => (
          <Pressable
            key={`tap-${p.month}`}
            testID={`line-month-${p.month}`}
            style={[styles.tapOverlay, { left: xFor(p.month) - SLOT_WIDTH / 2, width: SLOT_WIDTH }]}
            onPress={() => onMonthSelect?.(p.month)}
            accessibilityRole="button"
          />
        ))}
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
    padding: CARD_PADDING,
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
});
