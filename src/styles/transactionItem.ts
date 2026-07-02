import { StyleSheet } from 'react-native';
import { C } from '@theme/colors';

export const transItemStyles = StyleSheet.create({
  errorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: C.redLight,
    borderRadius: 10,
    marginBottom: 8,
    marginRight: 50,
    padding: 12,
  },
  errorBubbleText: {
    color: C.red,
    fontSize: 13,
  },
  expenseColor: {
    color: C.red,
  },
  incomeColor: {
    color: C.green,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  itemBubble: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    marginBottom: 8,
    padding: 12,
  },
  itemDescription: {
    color: C.textDark,
    fontSize: 15,
    fontWeight: '600',
  },
  itemDivider: {
    borderLeftColor: C.divider,
    borderLeftWidth: 1,
    marginHorizontal: 12,
  },
  itemHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 1,
  },
  itemIconBg: {
    alignItems: 'center',
    borderRadius: 18,
    height: 28,
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 1,
    width: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemLeft: {
    flex: 1,
  },
  itemMeta: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  itemRight: {
    justifyContent: 'center',
    maxWidth: 120,
    paddingLeft: 4,
  },
  itemRow: {
    borderColor: C.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginRight: 10,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  userText: {
    color: C.textDark,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
