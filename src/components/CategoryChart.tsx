import React, { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';
import { useTransactionStore } from '@store/index';
import SegmentedControl from './SegmentedControl';
import CategoryBreakdownRow from './CategoryBreakdownRow';
import { CATEGORY_LABELS, CATEGORY_ICONS, CATEGORY_COLORS, FALLBACK_COLORS } from '@utils/categories';
import { formatCurrency } from '@utils/currency';

const C = {
  white: '#fff',
  textDark: '#1a1a2e',
  textMedium: '#555',
  textLight: '#999',
  shadow: '#000',
  cardBg: '#fff',
  background: '#F5F5F5',
};

const segments = ['Expense', 'Income'];
const DONUT_RADIUS = 80;
const DONUT_WIDTH = 36;
const DONUT_GAP = 3;

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
  const chartSize = Math.min(screenWidth - 80, 220);
  const cx = chartSize / 2;
  const cy = chartSize / 2;

  const handleSliceTap = (key: string) => {
    setSelectedCategory((prev) => (prev === key ? null : key));
  };

  const ratios = useMemo(
    () => categories.map((c) => c.amount / total),
    [categories, total],
  );

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
              <Svg width={chartSize} height={chartSize}>
                {categories.map((cat, i) => {
                  const rawStart = ratios.slice(0, i).reduce((s, r) => s + r * 360, 0);
                  const rawEnd = rawStart + ratios[i] * 360;
                  const gapAdjust = DONUT_GAP / 2;
                  const startAngle = rawStart + gapAdjust;
                  const endAngle = rawEnd - gapAdjust;
                  if (endAngle <= startAngle) return null;
                  const isSelected = cat.key === selectedCategory;
                  const arcRadius = isSelected ? DONUT_RADIUS + 6 : DONUT_RADIUS;
                  return (
                    <G key={cat.key}>
                      <Path
                        d={describeArc(cx, cy, arcRadius, startAngle, endAngle)}
                        stroke={isSelected ? darkenColor(cat.color, 0.25) : cat.color}
                        strokeWidth={isSelected ? DONUT_WIDTH + 2 : DONUT_WIDTH}
                        fill="none"
                        strokeLinecap="round"
                      />
                      <Path
                        d={describeArc(cx, cy, arcRadius, startAngle - 2, endAngle + 2)}
                        stroke="transparent"
                        strokeWidth={DONUT_WIDTH + 18}
                        fill="none"
                        onPress={() => handleSliceTap(cat.key)}
                      />
                    </G>
                  );
                })}
                <Circle cx={cx} cy={cy} r={32} fill={C.white} opacity={0.95} />
                <SvgText
                  x={cx}
                  y={cy - 10}
                  textAnchor="middle"
                  fontSize={20}
                  fontWeight="bold"
                  fill={centerEntry ? centerEntry.color : C.textDark}
                >
                  {formatCurrency(centerEntry ? centerEntry.amount : total)}
                </SvgText>
                <SvgText
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  fontSize={11}
                  fill={centerEntry ? C.textMedium : C.textLight}
                >
                  {centerEntry ? centerEntry.label : 'Total'}
                </SvgText>
              </Svg>
            </TouchableOpacity>
          </View>

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
                    setSelectedCategory((prev) => (prev === key ? null : key));
                    (navigation.navigate as any)('Transactions', {
                      category: key,
                      type,
                    });
                  }}
                />
              );
            })}
          </View>
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
    shadowColor: C.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  donutContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  emptyText: {
    color: C.textLight,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: 'center',
  },
  legend: {
    marginTop: 8,
  },
  title: {
    color: C.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
});
