import React, { useMemo, useState, useCallback } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useTransactionStore } from '@store/index';
import type { Transaction } from '@/types';
import SegmentedControl from './SegmentedControl';
import CategoryBreakdownRow from './CategoryBreakdownRow';
import FilteredTransactionList from './FilteredTransactionList';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS, FALLBACK_COLORS } from '@utils/categories';
import { formatCurrency } from '@utils/currency';
import { Ionicons } from '@expo/vector-icons';
import { C } from '@theme/index';

const segments = ['Expense', 'Income'];
const DONUT_RADIUS = 96;
const DONUT_WIDTH = 42;
const ICON_SIZE = 24;
const MIN_ARC_DEGREES = 25;
const ICON_BG = 'rgba(255,255,255,0.88)';

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = polarToCartesian(cx, cy, r, startDeg);
  const end = polarToCartesian(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? '1' : '0';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function darkenColor(hex: string, factor: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.floor(((num >> 16) & 0xff) * (1 - factor));
  const g = Math.floor(((num >> 8) & 0xff) * (1 - factor));
  const b = Math.floor((num & 0xff) * (1 - factor));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

interface CategoryEntry {
  key: string;
  label: string;
  amount: number;
  color: string;
  icon: string;
}

export default function CategoryChart(): React.ReactElement {
  const { transactions } = useTransactionStore();
  const navigation = useNavigation();
  const [typeIndex, setTypeIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const type = typeIndex === 0 ? 'expense' : 'income';

  const handleTransactionPress = useCallback(
    (transaction: Transaction) => {
      (navigation.getParent() as any)?.navigate('EditTransaction', { transaction });
    },
    [navigation],
  );

  const categories = useMemo<CategoryEntry[]>(() => {
    const filtered = transactions.filter((t) => t.type === type);
    if (filtered.length === 0) return [];

    const grouped: Record<string, number> = {};
    for (const t of filtered) {
      grouped[t.category] = (grouped[t.category] || 0) + t.amount;
    }

    const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
    let colorIndex = 0;
    return entries.map(([key, amount]) => {
      const color = CATEGORY_COLORS[key] || FALLBACK_COLORS[colorIndex++ % FALLBACK_COLORS.length];
      return {
        key,
        label: CATEGORY_LABELS[key] || key,
        amount,
        color,
        icon: CATEGORY_ICONS[key] || 'ellipsis-horizontal-outline',
      };
    });
  }, [transactions, type]);

  const total = useMemo(
    () => categories.reduce((sum, item) => sum + item.amount, 0),
    [categories],
  );

  const screenWidth = Dimensions.get('window').width;
  const chartSize = Math.min(screenWidth - 80, 280);
  const cx = chartSize / 2;
  const cy = chartSize / 2;

  const handleSliceTap = (key: string) => {
    setSelectedCategory(key);
  };

  const ratios = useMemo(
    () => categories.map((c) => c.amount / total),
    [categories, total],
  );

  const iconPositions = useMemo(() => {
    if (categories.length === 0) return [];
    if (categories.length === 1) {
      return [
        {
          key: categories[0].key,
          icon: categories[0].icon,
          color: categories[0].color,
          x: cx,
          y: cy - DONUT_RADIUS,
        },
      ];
    }
    return categories
      .map((cat, i) => {
        const startDeg = ratios.slice(0, i).reduce((s, r) => s + r * 360, 0);
        const endDeg = startDeg + ratios[i] * 360;
        const arcDeg = endDeg - startDeg;
        if (arcDeg < MIN_ARC_DEGREES) return null;
        const midDeg = startDeg + arcDeg / 2;
        const pos = polarToCartesian(cx, cy, DONUT_RADIUS, midDeg);
        return { key: cat.key, icon: cat.icon, color: cat.color, x: pos.x, y: pos.y };
      })
      .filter(Boolean) as { key: string; icon: string; color: string; x: number; y: number }[];
  }, [categories, ratios, cx, cy]);

  const centerEntry = selectedCategory
    ? categories.find((c) => c.key === selectedCategory)
    : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Category Breakdown</Text>
      <SegmentedControl
        segments={segments}
        selected={typeIndex}
        onSelect={(i) => {
          setTypeIndex(i);
          setSelectedCategory(null);
        }}
      />
      {categories.length === 0 ? (
        <Text style={styles.emptyText}>No {type}s this period</Text>
      ) : (
        <View>
          <View style={styles.donutContainer}>
            <TouchableOpacity activeOpacity={1} onPress={() => setSelectedCategory(null)}>
              <View style={{ width: chartSize, height: chartSize }}>
              <Svg width={chartSize} height={chartSize}>
                {(() => {
                  if (categories.length === 1) {
                    const cat = categories[0];
                    const isSelected = cat.key === selectedCategory;
                    return (
                      <G key={cat.key}>
                        {isSelected && (
                          <Circle
                            cx={cx} cy={cy}
                            r={DONUT_RADIUS + 12}
                            stroke={cat.color}
                            strokeWidth={DONUT_WIDTH + 16}
                            fill="none"
                            opacity={0.15}
                          />
                        )}
                        <Circle
                          cx={cx} cy={cy}
                          r={isSelected ? DONUT_RADIUS + 6 : DONUT_RADIUS}
                          stroke={isSelected ? darkenColor(cat.color, 0.25) : cat.color}
                          strokeWidth={DONUT_WIDTH}
                          fill="none"
                        />
                        <Circle
                          cx={cx} cy={cy}
                          r={isSelected ? DONUT_RADIUS + 6 : DONUT_RADIUS}
                          stroke="transparent"
                          strokeWidth={DONUT_WIDTH + 20}
                          fill="none"
                          onPress={() => handleSliceTap(cat.key)}
                        />
                      </G>
                    );
                  }
                  return categories.map((cat, i) => {
                    const rawStart = ratios.slice(0, i).reduce((s, r) => s + r * 360, 0);
                    const rawEnd = rawStart + ratios[i] * 360;
                    const startAngle = rawStart;
                    const endAngle = rawEnd;
                    if (endAngle <= startAngle) return null;
                    const isSelected = cat.key === selectedCategory;
                    const arcRadius = isSelected ? DONUT_RADIUS + 6 : DONUT_RADIUS;
                    return (
                      <G key={cat.key}>
                        {isSelected && (
                          <Path
                            d={describeArc(cx, cy, DONUT_RADIUS + 12, startAngle, endAngle)}
                            stroke={cat.color}
                            strokeWidth={DONUT_WIDTH + 16}
                            fill="none"
                            strokeLinecap="butt"
                            opacity={0.15}
                          />
                        )}
                        <Path
                          d={describeArc(cx, cy, arcRadius, startAngle, endAngle)}
                          stroke={isSelected ? darkenColor(cat.color, 0.25) : cat.color}
                          strokeWidth={DONUT_WIDTH}
                          fill="none"
                          strokeLinecap="butt"
                        />
                        <Path
                          d={describeArc(cx, cy, arcRadius, startAngle, endAngle)}
                          stroke="transparent"
                          strokeWidth={DONUT_WIDTH + 20}
                          fill="none"
                          onPress={() => handleSliceTap(cat.key)}
                        />
                      </G>
                    );
                  });
                })()}
                <Circle cx={cx} cy={cy} r={38} fill={C.white} opacity={0.95} />
                <SvgText
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fontSize={24}
                  fontWeight="bold"
                  fill={centerEntry ? centerEntry.color : C.textDark}
                >
                  {formatCurrency(centerEntry ? centerEntry.amount : total)}
                </SvgText>
                <SvgText
                  x={cx}
                  y={cy + 14}
                  textAnchor="middle"
                  fontSize={12}
                  fill={C.chartLabel}
                  letterSpacing={0.5}
                >
                  {centerEntry ? centerEntry.label : 'Total'}
                </SvgText>
              </Svg>
              <View style={[StyleSheet.absoluteFill, styles.iconOverlay]}>
                {iconPositions.map((icon) => (
                  <View
                    key={icon.key}
                    testID={`donut-icon-${icon.key}`}
                    style={[styles.iconBadge, {
                      left: icon.x - ICON_SIZE / 2,
                      top: icon.y - ICON_SIZE / 2,
                    }]}
                  >
                    <Ionicons name={icon.icon as any} size={14} color={icon.color} />
                  </View>
                ))}
              </View>
              </View>
            </TouchableOpacity>
          </View>

          {selectedCategory && centerEntry ? (
            <View>
              <TouchableOpacity
                style={styles.selectedHeader}
                onPress={() => setSelectedCategory(null)}
                activeOpacity={0.7}
                testID="chart-back"
              >
                <Ionicons name="arrow-back" size={20} color={C.textDark} />
                <View style={[styles.headerIconBg, { backgroundColor: centerEntry.color + '20' }]}>
                  <Ionicons name={centerEntry.icon as any} size={18} color={centerEntry.color} />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.headerLabel}>{centerEntry.label}</Text>
                  <Text style={styles.headerTotal}>Total: {formatCurrency(centerEntry.amount)}</Text>
                </View>
              </TouchableOpacity>
              <FilteredTransactionList
                type={type}
                category={selectedCategory}
                onTransactionPress={handleTransactionPress}
              />
            </View>
          ) : (
            <View style={styles.legend}>
              {categories.map((cat) => {
                const pct = total > 0 ? (cat.amount / total) * 100 : 0;
                return (
                  <CategoryBreakdownRow
                    key={cat.key}
                    categoryKey={cat.key}
                    label={cat.label}
                    icon={cat.icon}
                    color={cat.color}
                    amount={cat.amount}
                    percentage={pct}
                    isSelected={selectedCategory === cat.key}
                    onPress={(key) => {
                      setSelectedCategory(key);
                    }}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}
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
  donutContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  emptyText: {
    color: C.textLight,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
  },
  headerIconBg: {
    alignItems: 'center',
    borderRadius: 10,
    height: 38,
    justifyContent: 'center',
    marginLeft: 10,
    marginRight: 10,
    width: 38,
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    color: C.textDark,
    fontSize: 15,
    fontWeight: '600',
  },
  headerTotal: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  iconBadge: {
    alignItems: 'center',
    backgroundColor: ICON_BG,
    borderRadius: ICON_SIZE / 2,
    elevation: 2,
    height: ICON_SIZE,
    justifyContent: 'center',
    position: 'absolute',
    shadowColor: C.textDark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    width: ICON_SIZE,
  },
  iconOverlay: {
    pointerEvents: 'none',
  },
  legend: {
    marginTop: 4,
  },
  selectedHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  title: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
});
