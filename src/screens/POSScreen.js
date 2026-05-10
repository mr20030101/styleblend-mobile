import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Modal, ScrollView, Alert,
  KeyboardAvoidingView, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getCategories, getProducts, searchCustomers, createCustomer } from '../api/pos';
import { C, R, S, serif, sans, label, eyebrow } from '../theme';
import BarcodeScanner from '../components/BarcodeScanner';
import NavDrawer from '../components/NavDrawer';
import AppHeader from '../components/AppHeader';
import Icon, {
  faBarcode, faCartShopping, faXmark, faMagnifyingGlass,
  faChevronRight, faUser, faUserPlus, faRightFromBracket,
  faPlus, faMinus, faTrash, faArrowLeft, faBars,
} from '../components/Icon';

export default function POSScreen({ navigation }) {
  const { settings, logout, user } = useAuth();
  const currency = settings?.currency_symbol ?? '₱';

  const [categories,   setCategories]   = useState([]);
  const [products,     setProducts]     = useState([]);
  const [search,       setSearch]       = useState('');
  const [catId,        setCatId]        = useState('');
  const [loadingProds, setLoadingProds] = useState(false);

  const [cart,     setCart]     = useState([]);
  const [customer, setCustomer] = useState(null);

  const [variantModal,  setVariantModal]  = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [cartOpen,      setCartOpen]      = useState(false);
  const [scannerOpen,   setScannerOpen]   = useState(false);
  const [custPanel,     setCustPanel]     = useState(false);
  const [custSearch,  setCustSearch]  = useState('');
  const [custResults, setCustResults] = useState([]);
  const [custLoading, setCustLoading] = useState(false);
  const [addCustModal, setAddCustModal] = useState(false);
  const [newCustName,  setNewCustName]  = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  const searchTimer = useRef(null);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [search, catId]);

  const loadCategories = async () => {
    try { const r = await getCategories(); setCategories(r.data); } catch {}
  };

  const loadProducts = useCallback(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setLoadingProds(true);
      try {
        const r = await getProducts({ search, category_id: catId });
        setProducts(r.data);
      } catch {}
      setLoadingProds(false);
    }, 300);
  }, [search, catId]);

  // ── Barcode scan handler ──────────────────────────────────────────────────
  const handleBarcodeScan = useCallback(async (barcode) => {
    setScannerOpen(false);
    try {
      const r = await getProducts({ search: barcode });
      const results = r.data;
      if (results.length === 0) {
        Alert.alert('Not Found', `No product found for barcode: ${barcode}`);
        return;
      }
      if (results.length === 1) {
        selectProduct(results[0]);
      } else {
        setSearch(barcode);
      }
      // Open cart so the user sees what was added
      setCartOpen(true);
    } catch {
      Alert.alert('Error', 'Could not look up barcode.');
    }
  }, []);

  const addToCart = (product, variant) => {    setCart(prev => {
      const idx = prev.findIndex(i => i.variant_id === variant.id);
      if (idx >= 0) {
        if (prev[idx].quantity >= variant.stock_quantity) {
          Alert.alert('Out of stock', 'Not enough stock available.');
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1, subtotal: (updated[idx].quantity + 1) * updated[idx].unit_price };
        return updated;
      }
      return [...prev, {
        variant_id: variant.id, product_name: product.name,
        variant_info: variant.variant_info, unit_price: parseFloat(variant.price),
        quantity: 1, subtotal: parseFloat(variant.price), max_stock: variant.stock_quantity,
      }];
    });
    setVariantModal(false);
  };

  const updateQty = (idx, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const item = { ...updated[idx] };
      item.quantity += delta;
      if (item.quantity <= 0) { updated.splice(idx, 1); return updated; }
      if (item.quantity > item.max_stock) { Alert.alert('Max stock reached'); return prev; }
      item.subtotal = item.quantity * item.unit_price;
      updated[idx] = item;
      return updated;
    });
  };

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));
  const clearCart  = () => { setCart([]); setCustomer(null); };

  const cartTotal = cart.reduce((s, i) => s + i.subtotal, 0);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const selectProduct = (product) => {
    if (product.variants.length === 1) { addToCart(product, product.variants[0]); return; }
    setActiveProduct(product);
    setVariantModal(true);
  };

  const onCustSearch = useCallback(async (q) => {
    setCustSearch(q);
    if (q.length < 2) { setCustResults([]); return; }
    setCustLoading(true);
    try { const r = await searchCustomers(q); setCustResults(r.data); } catch {}
    setCustLoading(false);
  }, []);

  const saveNewCustomer = async () => {
    if (!newCustName.trim()) { Alert.alert('Required', 'Name is required.'); return; }
    try {
      const r = await createCustomer({ name: newCustName, phone: newCustPhone, email: newCustEmail });
      setCustomer(r.data.customer);
      setAddCustModal(false);
      setCartOpen(true); // reopen cart drawer after saving
      setNewCustName(''); setNewCustPhone(''); setNewCustEmail('');
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Could not save customer.');
    }
  };

  const goCheckout = () => {
    if (!cart.length) return;
    setCartOpen(false);
    navigation.navigate('Checkout', { cart, customer, settings });
  };

  const minPrice = (variants) => Math.min(...variants.map(v => parseFloat(v.price)));

  const renderProduct = ({ item }) => (
    <TouchableOpacity style={s.productCard} onPress={() => selectProduct(item)} activeOpacity={0.8}>
      <View style={s.productImg}>
        <Icon icon={faCartShopping} size={28} color={C.muted} />
      </View>
      <View style={s.productBody}>
        <Text style={s.productCat}>{item.category}</Text>
        <Text style={s.productName} numberOfLines={2}>{item.name}</Text>
        <View style={s.productFooter}>
          <Text style={s.productPrice}>{currency}{minPrice(item.variants).toFixed(2)}</Text>
          {item.variants.length > 1 && (
            <Text style={s.productVariantCount}>{item.variants.length} variants</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />

      {/* ── Header ── */}
      <AppHeader
        right={
          <TouchableOpacity style={s.cartBtn} onPress={() => setCartOpen(true)} activeOpacity={0.8}>
            <Icon icon={faCartShopping} size={18} color={C.cream} />
            {cartCount > 0 && (
              <View style={s.cartBadge}>
                <Text style={s.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      {/* ── Search + Barcode ── */}
      <View style={s.searchWrap}>
        <View style={[s.searchBox, { flex: 1 }]}>
          <Icon icon={faMagnifyingGlass} size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search products..."
            placeholderTextColor={C.muted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon icon={faXmark} size={14} color={C.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.scanBtn} onPress={() => setScannerOpen(true)} activeOpacity={0.8}>
          <Icon icon={faBarcode} size={20} color={C.ink} />
        </TouchableOpacity>
      </View>

      {/* ── Categories ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.catRow}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        {[{ id: '', name: 'All' }, ...categories].map(c => (
          <TouchableOpacity
            key={c.id}
            style={[s.catChip, catId == c.id && s.catChipActive]}
            onPress={() => setCatId(c.id)}
            activeOpacity={0.8}
          >
            <Text style={[s.catChipText, catId == c.id && s.catChipTextActive]}>{c.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Products ── */}
      {loadingProds
        ? <ActivityIndicator style={{ flex: 1 }} size="large" color={C.ink} />
        : <FlatList
            data={products}
            keyExtractor={i => String(i.id)}
            renderItem={renderProduct}
            numColumns={2}
            columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 24, gap: 12 }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
              <Icon icon={faMagnifyingGlass} size={32} color={C.muted} style={{ marginBottom: 10 }} />
              <Text style={s.emptyText}>No products found</Text>
            </View>
            }
          />
      }

      {/* ── Variant Sheet ── */}
      <Modal visible={variantModal} transparent animationType="slide" onRequestClose={() => setVariantModal(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setVariantModal(false)}>
          <View style={s.sheet}>
            <View style={s.sheetPill} />
            <Text style={s.sheetEyebrow}>Select Variant</Text>
            <Text style={s.sheetTitle}>{activeProduct?.name}</Text>
            <View style={s.goldRule} />
            {activeProduct?.variants.map(v => (
              <TouchableOpacity
                key={v.id}
                style={[s.variantRow, v.stock_quantity === 0 && s.variantDisabled]}
                onPress={() => v.stock_quantity > 0 && addToCart(activeProduct, v)}
                disabled={v.stock_quantity === 0}
                activeOpacity={0.75}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.variantName}>{v.size} / {v.color}</Text>
                  <Text style={s.variantStock}>
                    {v.stock_quantity === 0 ? 'Out of stock' : `${v.stock_quantity} available`}
                  </Text>
                </View>
                <Text style={[s.variantPrice, v.stock_quantity === 0 && { color: C.muted }]}>
                  {currency}{parseFloat(v.price).toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Cart Sheet ── */}
      <Modal visible={cartOpen} transparent animationType="slide" onRequestClose={() => { setCartOpen(false); setCustPanel(false); }}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[s.sheet, { maxHeight: custPanel ? '75%' : '92%' }]}>
            <View style={s.sheetPill} />

            {/* ── Customer panel (inline, no nested modal) ── */}
            {custPanel ? (
              <>
                <View style={s.sheetHeaderRow}>
                  <TouchableOpacity onPress={() => { setCustPanel(false); setCustSearch(''); setCustResults([]); }} style={s.closeBtn}>
                    <Icon icon={faArrowLeft} size={14} color={C.muted} />
                  </TouchableOpacity>
                  <Text style={s.sheetTitle}>Select Customer</Text>
                  <TouchableOpacity onPress={() => { setCartOpen(false); setCustPanel(false); }} style={s.closeBtn}>
                    <Icon icon={faXmark} size={14} color={C.muted} />
                  </TouchableOpacity>
                </View>
                <View style={s.searchBox}>
                  <Icon icon={faMagnifyingGlass} size={16} color={C.muted} />
                  <TextInput
                    style={s.searchInput}
                    placeholder="Name, phone or email..."
                    placeholderTextColor={C.muted}
                    value={custSearch}
                    onChangeText={onCustSearch}
                  />
                  {custSearch.length > 0 && (
                    <TouchableOpacity onPress={() => { setCustSearch(''); setCustResults([]); }}>
                      <Icon icon={faXmark} size={13} color={C.muted} />
                    </TouchableOpacity>
                  )}
                </View>
                {custLoading && <ActivityIndicator style={{ marginVertical: 12 }} color={C.ink} />}
                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, minHeight: 120 }}>
                  {custResults.map(c => (
                    <TouchableOpacity
                      key={c.id}
                      style={s.custResult}
                      onPress={() => {
                        setCustomer(c);
                        setCustPanel(false);
                        setCustSearch('');
                        setCustResults([]);
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={s.custResultAvatar}>
                        <Text style={s.custResultAvatarText}>{c.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.custResultName}>{c.name}</Text>
                        {(c.phone || c.email) && <Text style={s.custResultSub}>{c.phone || c.email}</Text>}
                      </View>
                      <Icon icon={faChevronRight} size={12} color={C.muted} />
                    </TouchableOpacity>
                  ))}
                  {custSearch.length >= 2 && !custLoading && custResults.length === 0 && (
                    <Text style={[s.emptyText, { marginTop: 20 }]}>No customers found</Text>
                  )}
                </ScrollView>
                <TouchableOpacity
                  style={s.addCustBtn}
                  onPress={() => { setCustPanel(false); setAddCustModal(true); }}
                  activeOpacity={0.8}
                >
                  <Icon icon={faUserPlus} size={13} color={C.ink} style={{ marginRight: 6 }} />
                  <Text style={s.addCustBtnText}>New Customer</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* ── Cart view ── */}
                <View style={s.sheetHeaderRow}>
                  <View>
                    <Text style={s.sheetEyebrow}>Your Cart</Text>
                    <Text style={s.sheetTitle}>{cartCount} {cartCount === 1 ? 'item' : 'items'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setCartOpen(false)} style={s.closeBtn}>
                    <Icon icon={faXmark} size={14} color={C.muted} />
                  </TouchableOpacity>
                </View>

                {/* Customer selector */}
                <TouchableOpacity style={s.custPill} onPress={() => setCustPanel(true)} activeOpacity={0.8}>
                  <Icon icon={faUser} size={14} color={customer ? C.ink : C.muted} />
                  <Text style={[s.custPillText, !customer && { color: C.muted }]}>
                    {customer ? customer.name : 'Add customer (optional)'}
                  </Text>
                  {customer
                    ? <TouchableOpacity onPress={() => setCustomer(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <Icon icon={faXmark} size={12} color={C.muted} />
                      </TouchableOpacity>
                    : <Icon icon={faChevronRight} size={12} color={C.muted} />
                  }
                </TouchableOpacity>

                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  {cart.length === 0
                    ? <View style={s.emptyWrap}><Icon icon={faCartShopping} size={32} color={C.muted} style={{ marginBottom: 10 }} /><Text style={s.emptyText}>Cart is empty</Text></View>
                    : cart.map((item, idx) => (
                      <View key={idx} style={s.cartRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={s.cartItemName}>{item.product_name}</Text>
                          <Text style={s.cartItemVariant}>{item.variant_info}</Text>
                        </View>
                        <View style={s.qtyControl}>
                          <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(idx, -1)}>
                            <Icon icon={faMinus} size={12} color={C.ink} />
                          </TouchableOpacity>
                          <Text style={s.qtyVal}>{item.quantity}</Text>
                          <TouchableOpacity style={s.qtyBtn} onPress={() => updateQty(idx, 1)}>
                            <Icon icon={faPlus} size={12} color={C.ink} />
                          </TouchableOpacity>
                        </View>
                        <Text style={s.cartItemPrice}>{currency}{item.subtotal.toFixed(2)}</Text>
                        <TouchableOpacity onPress={() => removeItem(idx)} style={s.removeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Icon icon={faTrash} size={13} color={C.danger} />
                        </TouchableOpacity>
                      </View>
                    ))
                  }
                </ScrollView>

                {cart.length > 0 && (
                  <View style={s.cartFooter}>
                    <View style={s.goldRule} />
                    <View style={s.totalRow}>
                      <Text style={s.totalLabel}>Total</Text>
                      <Text style={s.totalAmount}>{currency}{cartTotal.toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={s.primaryBtn} onPress={goCheckout} activeOpacity={0.85}>
                      <Text style={s.primaryBtnText}>Proceed to Checkout</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ghostBtn} onPress={clearCart} activeOpacity={0.8}>
                      <Text style={s.ghostBtnText}>Clear Cart</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sign out moved to nav drawer (hamburger menu) */}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add Customer Sheet (standalone modal, opened from cart) ── */}
      <Modal visible={addCustModal} transparent animationType="slide" onRequestClose={() => setAddCustModal(false)}>
        <KeyboardAvoidingView style={s.overlay} behavior="padding">
          <View style={s.sheet}>
            <View style={s.sheetPill} />
            <Text style={s.sheetEyebrow}>New Customer</Text>
            <Text style={s.sheetTitle}>Add Details</Text>
            <View style={s.goldRule} />
            <TextInput style={s.fieldInput} placeholder="Full name *" placeholderTextColor={C.muted} value={newCustName} onChangeText={setNewCustName} />
            <TextInput style={s.fieldInput} placeholder="Phone number" placeholderTextColor={C.muted} value={newCustPhone} onChangeText={setNewCustPhone} keyboardType="phone-pad" />
            <TextInput style={s.fieldInput} placeholder="Email address" placeholderTextColor={C.muted} value={newCustEmail} onChangeText={setNewCustEmail} keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={s.primaryBtn} onPress={saveNewCustomer} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Save & Select</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={() => setAddCustModal(false)} activeOpacity={0.8}>
              <Text style={s.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Barcode Scanner ── */}
      <BarcodeScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanned={handleBarcodeScan}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: C.cream },

  // Header
  header:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, backgroundColor: C.ink },
  headerWordmark:     { ...serif(20, '300'), color: C.cream, letterSpacing: 0.8 },
  headerWordmarkBold: { fontWeight: '600' },
  headerSub:          { ...label(8), color: C.inkFgMuted, marginTop: 3 },
  headerActions:      { flexDirection: 'row', alignItems: 'center', gap: 10 },  cartBtn:            { width: 40, height: 40, borderRadius: R.sm, backgroundColor: 'rgba(245,242,238,0.08)', alignItems: 'center', justifyContent: 'center' },
  cartIcon:           { fontSize: 18 },  cartBadge:          { position: 'absolute', top: 2, right: 2, backgroundColor: C.warm, borderRadius: R.pill, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  cartBadgeText:      { fontSize: 9, fontWeight: '700', color: C.ink },
  signOutBtn:         { paddingHorizontal: 12, paddingVertical: 7, borderRadius: R.sm, borderWidth: 0.5, borderColor: 'rgba(245,242,238,0.15)' },
  signOutText:        { ...label(9), color: C.inkFgMuted, letterSpacing: 1 },

  // Sign out row in cart drawer
  signOutRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: C.line },
  signOutRowText:     { fontSize: 13, color: C.muted, fontWeight: '500' },
  signOutRowUser:     { fontSize: 12, color: C.muted, opacity: 0.6 },
  // Search
  searchWrap:         { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.line, gap: 8 },
  scanBtn:            { width: 44, height: 44, borderRadius: R.md, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line },
  searchIcon:         { fontSize: 24, color: C.muted },  searchInput:        { flex: 1, fontSize: 14, color: C.ink, padding: 0 },

  // Categories
  catRow:             { flexGrow: 0, paddingVertical: 8 },
  catChip:            { paddingHorizontal: 16, paddingVertical: 7, borderRadius: R.pill, backgroundColor: C.white, borderWidth: 1, borderColor: C.line },
  catChipActive:      { backgroundColor: C.ink, borderColor: C.ink },
  catChipText:        { fontSize: 12, color: C.ink, fontWeight: '500' },
  catChipTextActive:  { color: C.cream },

  // Product card
  productCard:        { flex: 1, backgroundColor: C.white, borderRadius: R.lg, overflow: 'hidden', ...S.card },
  productImg:         { height: 100, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  productBody:        { padding: 12 },
  productCat:         { ...eyebrow(8), marginBottom: 3 },
  productName:        { fontSize: 13, fontWeight: '600', color: C.ink, lineHeight: 18, marginBottom: 8 },
  productFooter:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  productPrice:       { ...serif(15, '300'), color: C.ink },
  productVariantCount:{ fontSize: 10, color: C.muted, fontWeight: '500' },

  // Empty
  emptyWrap:          { alignItems: 'center', paddingTop: 48 },
  emptyIcon:          { fontSize: 32, marginBottom: 10 },
  emptyText:          { ...label(11), letterSpacing: 1 },

  // Sheet / overlay
  overlay:            { flex: 1, backgroundColor: 'rgba(26,26,24,0.55)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  sheetPill:          { width: 32, height: 3, backgroundColor: C.line, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeaderRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sheetEyebrow:       { ...eyebrow(9), marginBottom: 4 },
  sheetTitle:         { ...serif(20, '300'), color: C.ink, letterSpacing: 0.3 },
  closeBtn:           { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:       { fontSize: 13, color: C.muted },
  goldRule:           { height: 0.5, backgroundColor: C.gold, opacity: 0.45, marginVertical: 14 },

  // Variant rows
  variantRow:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.line },
  variantDisabled:    { opacity: 0.35 },
  variantName:        { fontSize: 15, fontWeight: '500', color: C.ink },
  variantStock:       { fontSize: 11, color: C.muted, marginTop: 2 },
  variantPrice:       { ...serif(16, '300'), color: C.ink },

  // Customer pill
  custPill:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: R.md, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.line, gap: 8 },
  custPillIcon:       { fontSize: 15 },
  custPillText:       { flex: 1, fontSize: 14, fontWeight: '500', color: C.ink },
  custPillChevron:    { fontSize: 20, color: C.muted },

  // Cart rows
  cartRow:            { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.line, gap: 8 },
  cartItemName:       { fontSize: 13, fontWeight: '600', color: C.ink },
  cartItemVariant:    { fontSize: 11, color: C.muted, marginTop: 1 },
  cartItemPrice:      { ...serif(13, '300'), color: C.ink, minWidth: 60, textAlign: 'right' },
  qtyControl:         { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qtyBtn:             { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: C.line },
  qtyBtnText:         { fontSize: 16, fontWeight: '500', color: C.ink, lineHeight: 20 },
  qtyVal:             { fontSize: 14, fontWeight: '600', minWidth: 20, textAlign: 'center', color: C.ink },
  removeBtn:          { padding: 4 },
  removeBtnText:      { fontSize: 12, color: C.muted },

  // Cart footer
  cartFooter:         { paddingTop: 4 },
  totalRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  totalLabel:         { ...label(11), letterSpacing: 1.5 },
  totalAmount:        { ...serif(26, '300'), color: C.ink },

  // Buttons
  primaryBtn:         { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryBtnText:     { ...label(11), color: C.cream, letterSpacing: 2 },
  ghostBtn:           { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 13, alignItems: 'center' },
  ghostBtnText:       { ...label(10), letterSpacing: 1.5 },

  // Customer search
  custResult:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: C.line, gap: 12 },
  custResultAvatar:   { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  custResultAvatarText: { ...serif(14, '500'), color: C.ink },
  custResultName:     { fontSize: 14, fontWeight: '600', color: C.ink },
  custResultSub:      { fontSize: 12, color: C.muted, marginTop: 1 },
  addCustBtn:         { backgroundColor: C.surface, borderRadius: R.md, paddingVertical: 13, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: C.line },
  addCustBtnText:     { ...label(10), color: C.ink, letterSpacing: 1.5 },

  // Field input
  fieldInput:         { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: C.ink, marginBottom: 10, backgroundColor: C.surface },
});
