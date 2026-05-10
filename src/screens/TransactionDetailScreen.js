import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getTransaction } from '../api/pos';
import { C, R, S, serif, label, eyebrow } from '../theme';
import { usePrinter } from '../hooks/usePrinter';
import PrinterModal from '../components/PrinterModal';
import Icon, { faPrint, faArrowLeft } from '../components/Icon';

export default function TransactionDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { settings } = useAuth();
  const currency = settings?.currency_symbol ?? '₱';

  const [txn,          setTxn]          = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [printerModal, setPrinterModal] = useState(false);

  const printer = usePrinter();

  useEffect(() => {
    (async () => {
      try { const r = await getTransaction(id); setTxn(r.data); } catch {}
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon icon={faArrowLeft} size={16} color={C.inkFgMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Transaction</Text>
        <View style={{ width: 40 }} />
      </View>
      <ActivityIndicator style={{ flex: 1 }} size="large" color={C.ink} />
    </SafeAreaView>
  );

  if (!txn) return (
    <SafeAreaView style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Icon icon={faArrowLeft} size={16} color={C.inkFgMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Transaction</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.emptyWrap}>
        <Text style={s.emptyIcon}>🔍</Text>
        <Text style={s.emptyText}>Transaction not found</Text>
      </View>
    </SafeAreaView>
  );

  const isVoided = txn.status === 'voided';

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
      + ' at ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
          <Icon icon={faArrowLeft} size={16} color={C.inkFgMuted} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Transaction</Text>
        <TouchableOpacity style={s.printBtn} onPress={() => setPrinterModal(true)} activeOpacity={0.8}>
          <Icon icon={faPrint} size={18} color={C.cream} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── TXN Identity card ── */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.heroEyebrow}>Transaction</Text>
              <Text style={s.heroTxnNum}>{txn.transaction_number}</Text>
            </View>
            <View style={[s.badge, isVoided ? s.badgeVoided : s.badgeCompleted]}>
              <Text style={[s.badgeText, isVoided ? s.badgeTextVoided : s.badgeTextCompleted]}>
                {txn.status}
              </Text>
            </View>
          </View>

          <Text style={s.heroDate}>{formatDate(txn.created_at)}</Text>

          {isVoided && (
            <View style={s.voidBanner}>
              <Text style={s.voidBannerText}>⚠ Voided — {txn.void_reason}</Text>
            </View>
          )}

          <View style={s.goldRule} />

          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Cashier</Text>
              <Text style={s.metaValue}>{txn.cashier}</Text>
            </View>
            <View style={s.metaDivider} />
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Customer</Text>
              <Text style={s.metaValue}>{txn.customer || '—'}</Text>
            </View>
          </View>
        </View>

        {/* ── Items ── */}
        <View style={s.card}>
          <Text style={s.sectionEyebrow}>Items Purchased</Text>
          {txn.items.map((item, idx) => (
            <View key={idx} style={[s.itemRow, idx === txn.items.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemName}>{item.product_name}</Text>
                <Text style={s.itemVariant}>{item.variant_info}</Text>
                <Text style={s.itemUnit}>{currency}{parseFloat(item.unit_price).toFixed(2)} × {item.quantity}</Text>
              </View>
              <Text style={s.itemTotal}>{currency}{parseFloat(item.subtotal).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* ── Summary ── */}
        <View style={s.card}>
          <Text style={s.sectionEyebrow}>Payment Summary</Text>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>{currency}{parseFloat(txn.subtotal).toFixed(2)}</Text>
          </View>
          {parseFloat(txn.discount) > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Discount</Text>
              <Text style={[s.summaryValue, { color: C.success }]}>−{currency}{parseFloat(txn.discount).toFixed(2)}</Text>
            </View>
          )}
          {parseFloat(txn.tax) > 0 && (
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Tax</Text>
              <Text style={s.summaryValue}>{currency}{parseFloat(txn.tax).toFixed(2)}</Text>
            </View>
          )}

          <View style={s.goldRule} />

          <View style={[s.summaryRow, { marginBottom: 14 }]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalAmount}>{currency}{parseFloat(txn.total).toFixed(2)}</Text>
          </View>

          <View style={s.paymentBox}>
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel}>Cash Paid</Text>
              <Text style={s.paymentValue}>{currency}{parseFloat(txn.amount_paid).toFixed(2)}</Text>
            </View>
            <View style={[s.paymentRow, { borderBottomWidth: 0 }]}>
              <Text style={s.paymentLabel}>Change</Text>
              <Text style={[s.paymentValue, { color: C.success }]}>{currency}{parseFloat(txn.change).toFixed(2)}</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Printer modal */}
      <PrinterModal
        visible={printerModal}
        onClose={() => setPrinterModal(false)}
        printer={printer}
        onPrint={() => printer.printReceipt({
          storeName:      settings?.store_name ?? 'StyleBlend',
          storeAddress:   settings?.store_address ?? '',
          storePhone:     settings?.store_phone ?? '',
          storeFooter:    settings?.store_footer ?? 'Thank you for shopping with us!',
          taxLabel:       settings?.tax_label ?? 'VAT',
          currencySymbol: currency,
          transaction:    txn,
        })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: C.cream },

  // Header
  header:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: C.ink },
  backBtn:            { width: 60 },
  backText:           { fontSize: 16, color: C.inkFgMuted, fontWeight: '300' },
  headerTitle:        { ...serif(17, '300'), color: C.cream, letterSpacing: 0.5 },
  printBtn:           { width: 40, height: 40, borderRadius: R.sm, backgroundColor: 'rgba(245,242,238,0.08)', alignItems: 'center', justifyContent: 'center' },
  printBtnText:       { fontSize: 20 },

  content:            { padding: 16, gap: 12, paddingBottom: 32 },

  // Hero card
  heroCard:           { backgroundColor: C.white, borderRadius: R.lg, padding: 20, ...S.card },
  heroTop:            { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  heroEyebrow:        { ...eyebrow(8), marginBottom: 4 },
  heroTxnNum:         { fontSize: 15, fontWeight: '700', color: C.ink, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.5 },
  heroDate:           { fontSize: 12, color: C.muted, marginBottom: 14 },

  // Void banner
  voidBanner:         { backgroundColor: C.dangerBg, borderRadius: R.sm, padding: 10, marginBottom: 14 },
  voidBannerText:     { fontSize: 13, color: C.danger, fontWeight: '500' },

  goldRule:           { height: 0.5, backgroundColor: C.gold, opacity: 0.4, marginVertical: 14 },

  // Meta
  metaRow:            { flexDirection: 'row', gap: 0 },
  metaItem:           { flex: 1 },
  metaDivider:        { width: 0.5, backgroundColor: C.line, marginHorizontal: 16, alignSelf: 'stretch' },
  metaLabel:          { ...label(9), marginBottom: 4 },
  metaValue:          { fontSize: 14, fontWeight: '500', color: C.ink },

  // Badge
  badge:              { borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCompleted:     { backgroundColor: C.successBg },
  badgeVoided:        { backgroundColor: C.dangerBg },
  badgeText:          { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  badgeTextCompleted: { color: C.success },
  badgeTextVoided:    { color: C.danger },

  // Card
  card:               { backgroundColor: C.white, borderRadius: R.lg, padding: 18, ...S.card },
  sectionEyebrow:     { ...eyebrow(9), marginBottom: 14 },

  // Items
  itemRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.line },
  itemName:           { fontSize: 14, fontWeight: '500', color: C.ink },
  itemVariant:        { fontSize: 12, color: C.muted, marginTop: 2 },
  itemUnit:           { fontSize: 11, color: C.muted, marginTop: 1, opacity: 0.7 },
  itemTotal:          { ...serif(14, '300'), color: C.ink },

  // Summary
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: C.line },
  summaryLabel:       { fontSize: 14, color: C.muted },
  summaryValue:       { fontSize: 14, fontWeight: '500', color: C.ink },
  totalLabel:         { ...label(12), letterSpacing: 1.5 },
  totalAmount:        { ...serif(24, '300'), color: C.ink },

  // Payment box
  paymentBox:         { backgroundColor: C.surface, borderRadius: R.md, padding: 14, borderWidth: 1, borderColor: C.line },
  paymentRow:         { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: C.line },
  paymentLabel:       { fontSize: 13, color: C.muted },
  paymentValue:       { fontSize: 14, fontWeight: '600', color: C.ink },

  // Empty
  emptyWrap:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon:          { fontSize: 32, marginBottom: 10 },
  emptyText:          { ...label(11), letterSpacing: 1 },
});
