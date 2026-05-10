import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkout as apiCheckout } from '../api/pos';
import { C, R, S, serif, label, eyebrow } from '../theme';
import { usePrinter } from '../hooks/usePrinter';
import PrinterModal from '../components/PrinterModal';
import Icon, { faArrowLeft } from '../components/Icon';

export default function CheckoutScreen({ route, navigation }) {
  const { cart, customer, settings } = route.params;
  const currency = settings?.currency_symbol ?? '₱';

  const subtotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const [discount,      setDiscount]      = useState('0');
  const [amountPaid,    setAmountPaid]    = useState('');
  const [loading,       setLoading]       = useState(false);
  const [printerModal,  setPrinterModal]  = useState(false);
  const [lastTxn,       setLastTxn]       = useState(null);

  const printer = usePrinter();

  const taxEnabled = settings?.tax_enabled && !settings?.tax_inclusive;
  const taxRate    = settings?.tax_rate ?? 0;
  const tax        = taxEnabled ? (subtotal - parseFloat(discount || 0)) * (taxRate / 100) : 0;
  const total      = subtotal - parseFloat(discount || 0) + tax;
  const paid       = parseFloat(amountPaid || 0);
  const change     = paid - total;
  const canPay     = paid >= total && paid > 0;

  const quickAmounts = [100, 200, 500, 1000];

  const handleCheckout = async () => {
    if (!canPay) { Alert.alert('Insufficient', 'Amount paid is less than total.'); return; }
    setLoading(true);
    try {
      const res = await apiCheckout({
        items:          cart.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })),
        discount:       parseFloat(discount || 0),
        tax:            parseFloat(tax.toFixed(2)),
        amount_paid:    paid,
        customer_id:    customer?.id ?? null,
        customer_name:  customer?.name ?? null,
        customer_phone: customer?.phone ?? null,
      });

      const raffleMsg = res.data.raffle_entries > 0
        ? `\n\n🎟 ${res.data.raffle_entries} raffle ${res.data.raffle_entries === 1 ? 'entry' : 'entries'} earned`
        : '';

      // Store txn for printing
      setLastTxn({
        ...res.data,
        cashier:    customer?.cashier ?? '',
        customer:   customer?.name ?? 'Walk-in',
        items:      cart.map(i => ({
          product_name: i.product_name,
          variant_info: i.variant_info,
          quantity:     i.quantity,
          unit_price:   i.unit_price,
          subtotal:     i.subtotal,
        })),
        subtotal,
        discount:    parseFloat(discount || 0),
        tax:         parseFloat(tax.toFixed(2)),
        amount_paid: paid,
      });

      Alert.alert(
        'Payment Complete',
        `${res.data.transaction_number}\nChange: ${currency}${parseFloat(res.data.change).toFixed(2)}${raffleMsg}`,
        [
          { text: 'Print Receipt', onPress: () => setPrinterModal(true) },
          { text: 'New Sale', onPress: () => navigation.navigate('POSMain') },
        ]
      );
    } catch (e) {
      Alert.alert('Checkout Failed', e.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn} activeOpacity={0.7}>
            <Icon icon={faArrowLeft} size={16} color={C.inkFgMuted} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.headerTitle}>Checkout</Text>
            <Text style={s.headerSub}>{cart.length} {cart.length === 1 ? 'item' : 'items'}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >

          {/* Customer */}
          {customer && (
            <View style={s.card}>
              <Text style={s.eyebrow}>Customer</Text>
              <Text style={s.customerName}>{customer.name}</Text>
              {customer.phone && <Text style={s.customerSub}>{customer.phone}</Text>}
            </View>
          )}

          {/* Items */}
          <View style={s.card}>
            <Text style={s.eyebrow}>Items</Text>
            {cart.map((item, idx) => (
              <View key={idx} style={s.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{item.product_name}</Text>
                  <Text style={s.itemVariant}>{item.variant_info} × {item.quantity}</Text>
                </View>
                <Text style={s.itemPrice}>{currency}{item.subtotal.toFixed(2)}</Text>
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={s.card}>
            <Text style={s.eyebrow}>Summary</Text>

            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Subtotal</Text>
              <Text style={s.summaryValue}>{currency}{subtotal.toFixed(2)}</Text>
            </View>

            {settings?.discount_enabled && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Discount</Text>
                <View style={s.discountBox}>
                  <Text style={s.discountCurrency}>{currency}</Text>
                  <TextInput
                    style={s.discountInput}
                    keyboardType="decimal-pad"
                    value={discount}
                    onChangeText={setDiscount}
                    placeholder="0"
                    placeholderTextColor={C.muted}
                  />
                </View>
              </View>
            )}

            {taxEnabled && (
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>{settings.tax_label} ({taxRate}%)</Text>
                <Text style={s.summaryValue}>{currency}{tax.toFixed(2)}</Text>
              </View>
            )}

            <View style={s.goldRule} />

            <View style={[s.summaryRow, { marginTop: 2 }]}>
              <Text style={s.totalLabel}>Total</Text>
              <Text style={s.totalAmount}>{currency}{total.toFixed(2)}</Text>
            </View>
          </View>

          {/* Payment */}
          <View style={s.card}>
            <Text style={s.eyebrow}>Cash Tendered</Text>
            <TextInput
              style={s.amountInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={C.muted}
              value={amountPaid}
              onChangeText={setAmountPaid}
            />

            {/* Quick amounts */}
            <View style={s.quickRow}>
              {quickAmounts.map(a => (
                <TouchableOpacity
                  key={a}
                  style={[s.quickBtn, paid === a && s.quickBtnActive]}
                  onPress={() => setAmountPaid(String(a))}
                  activeOpacity={0.75}
                >
                  <Text style={[s.quickBtnText, paid === a && s.quickBtnTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Change */}
            <View style={[s.changeRow, canPay && s.changeRowPositive]}>
              <Text style={s.changeLabel}>Change</Text>
              <Text style={[s.changeAmount, canPay && s.changeAmountPositive]}>
                {currency}{Math.max(0, change).toFixed(2)}
              </Text>
            </View>
          </View>

        </ScrollView>

        {/* ── Pay button ── */}
        <View style={s.footer}>
          <TouchableOpacity
            style={[s.payBtn, !canPay && s.payBtnDisabled]}
            onPress={handleCheckout}
            disabled={loading || !canPay}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={C.cream} />
              : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.payBtnText}>Process Payment</Text>
                  {canPay && <Text style={s.payBtnSub}>{currency}{total.toFixed(2)}</Text>}
                </View>
              )
            }
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>

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
          transaction:    lastTxn,
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
  headerSub:          { ...label(8), color: C.inkFgMuted, marginTop: 2 },

  content:            { padding: 16, gap: 12, paddingBottom: 32 },

  // Cards
  card:               { backgroundColor: C.white, borderRadius: R.lg, padding: 18, ...S.card },
  eyebrow:            { ...eyebrow(9), marginBottom: 12 },

  // Customer
  customerName:       { ...serif(17, '300'), color: C.ink, letterSpacing: 0.3 },
  customerSub:        { fontSize: 12, color: C.muted, marginTop: 3 },

  // Items
  itemRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: C.line },
  itemName:           { fontSize: 14, fontWeight: '500', color: C.ink },
  itemVariant:        { fontSize: 11, color: C.muted, marginTop: 2 },
  itemPrice:          { ...serif(14, '300'), color: C.ink },

  // Summary
  summaryRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: C.line },
  summaryLabel:       { fontSize: 14, color: C.muted },
  summaryValue:       { fontSize: 14, fontWeight: '500', color: C.ink },
  goldRule:           { height: 0.5, backgroundColor: C.gold, opacity: 0.45, marginVertical: 10 },
  totalLabel:         { ...label(12), letterSpacing: 1.5 },
  totalAmount:        { ...serif(24, '300'), color: C.ink },

  // Discount
  discountBox:        { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.line, borderRadius: R.sm, paddingHorizontal: 8, backgroundColor: C.surface },
  discountCurrency:   { fontSize: 13, color: C.muted, marginRight: 2 },
  discountInput:      { fontSize: 14, color: C.ink, width: 72, paddingVertical: 5, padding: 0 },

  // Payment
  amountInput:        { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 16, paddingVertical: 16, ...serif(36, '300'), color: C.ink, textAlign: 'center', backgroundColor: C.surface, marginBottom: 14 },
  quickRow:           { flexDirection: 'row', gap: 8, marginBottom: 14 },
  quickBtn:           { flex: 1, backgroundColor: C.surface, borderRadius: R.sm, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.line },
  quickBtnActive:     { backgroundColor: C.ink, borderColor: C.ink },
  quickBtnText:       { fontSize: 13, fontWeight: '600', color: C.ink },
  quickBtnTextActive: { color: C.cream },

  // Change
  changeRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, padding: 14, borderWidth: 1, borderColor: C.line },
  changeRowPositive:  { backgroundColor: C.successBg, borderColor: 'rgba(45,122,79,0.2)' },
  changeLabel:        { ...label(10), letterSpacing: 1.5 },
  changeAmount:       { ...serif(24, '300'), color: C.muted },
  changeAmountPositive: { color: C.success },

  // Footer
  footer:             { padding: 16, paddingBottom: Platform.OS === 'ios' ? 8 : 16, backgroundColor: C.white, borderTopWidth: 0.5, borderTopColor: C.line },
  payBtn:             { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 16, alignItems: 'center' },
  payBtnDisabled:     { opacity: 0.4 },
  payBtnText:         { ...label(11), color: C.cream, letterSpacing: 2 },
  payBtnSub:          { fontSize: 12, color: C.inkFgMuted, marginTop: 2, fontWeight: '300' },
});
