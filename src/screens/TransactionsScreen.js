import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getTransactions } from '../api/pos';
import { C, R, S, serif, label, eyebrow } from '../theme';
import Icon, { faMagnifyingGlass, faXmark } from '../components/Icon';
import AppHeader from '../components/AppHeader';

export default function TransactionsScreen({ navigation }) {
  const { settings } = useAuth();
  const currency = settings?.currency_symbol ?? '₱';

  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [page,         setPage]         = useState(1);
  const [lastPage,     setLastPage]     = useState(1);

  const load = useCallback(async (p = 1, q = search) => {
    if (p === 1) setLoading(true);
    try {
      const res = await getTransactions({ search: q, page: p });
      setTransactions(prev => p === 1 ? res.data.data : [...prev, ...res.data.data]);
      setLastPage(res.data.meta.last_page);
      setPage(p);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, [search]);

  useEffect(() => { load(1, search); }, [search]);

  const onRefresh = () => { setRefreshing(true); load(1); };
  const loadMore  = () => { if (page < lastPage) load(page + 1); };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const voided = item.status === 'voided';
    return (
      <TouchableOpacity
        style={s.card}
        onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
        activeOpacity={0.8}
      >
        {/* Left accent */}
        <View style={[s.cardAccent, voided && s.cardAccentVoided]} />

        <View style={{ flex: 1 }}>
          <View style={s.cardTop}>
            <Text style={s.txnNum}>{item.transaction_number}</Text>
            <View style={[s.badge, voided ? s.badgeVoided : s.badgeCompleted]}>
              <Text style={[s.badgeText, voided ? s.badgeTextVoided : s.badgeTextCompleted]}>
                {item.status}
              </Text>
            </View>
          </View>
          <View style={s.cardMid}>
            <Text style={s.txnMeta}>
              {item.customer !== 'Walk-in' ? item.customer : 'Walk-in'} · {item.cashier}
            </Text>
            <Text style={s.txnTotal}>{currency}{parseFloat(item.total).toFixed(2)}</Text>
          </View>
          <Text style={s.txnDate}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={C.ink} />

      {/* Header */}
      <AppHeader />

      {/* Search */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Icon icon={faMagnifyingGlass} size={16} color={C.muted} />
          <TextInput
            style={s.searchInput}
            placeholder="Search by transaction #..."
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
      </View>

      {loading && page === 1
        ? <ActivityIndicator style={{ flex: 1 }} size="large" color={C.ink} />
        : <FlatList
            data={transactions}
            keyExtractor={i => String(i.id)}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
              <Icon icon={faMagnifyingGlass} size={32} color={C.muted} style={{ marginBottom: 10 }} />
              <Text style={s.emptyText}>No transactions found</Text>
            </View>
            }
            ListFooterComponent={
              page < lastPage
                ? <ActivityIndicator color={C.ink} style={{ marginVertical: 16 }} />
                : null
            }
          />
      }
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: C.cream },

  // Header
  header:             { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16, backgroundColor: C.ink },
  headerTitle:        { ...serif(22, '300'), color: C.cream, letterSpacing: 0.5 },
  headerSub:          { ...label(8), color: C.inkFgMuted, marginTop: 3 },

  // Search
  searchWrap:         { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 },
  searchBox:          { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: C.line, gap: 8 },
  searchIcon:         { fontSize: 24, color: C.muted },
  searchInput:        { flex: 1, fontSize: 14, color: C.ink, padding: 0 },

  // Card
  card:               { backgroundColor: C.white, borderRadius: R.lg, padding: 16, flexDirection: 'row', ...S.card, overflow: 'hidden' },
  cardAccent:         { width: 3, borderRadius: 2, backgroundColor: C.warm, marginRight: 14, alignSelf: 'stretch' },
  cardAccentVoided:   { backgroundColor: C.danger },
  cardTop:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardMid:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },

  txnNum:             { fontSize: 13, fontWeight: '700', color: C.ink, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', letterSpacing: 0.3 },
  txnMeta:            { fontSize: 12, color: C.muted },
  txnTotal:           { ...serif(16, '300'), color: C.ink },
  txnDate:            { fontSize: 11, color: C.muted, opacity: 0.7 },

  // Badge
  badge:              { borderRadius: R.pill, paddingHorizontal: 9, paddingVertical: 3 },
  badgeCompleted:     { backgroundColor: C.successBg },
  badgeVoided:        { backgroundColor: C.dangerBg },
  badgeText:          { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  badgeTextCompleted: { color: C.success },
  badgeTextVoided:    { color: C.danger },

  // Empty
  emptyWrap:          { alignItems: 'center', paddingTop: 48 },
  emptyIcon:          { fontSize: 32, marginBottom: 10 },
  emptyText:          { ...label(11), letterSpacing: 1 },
});
