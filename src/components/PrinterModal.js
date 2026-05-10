import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { C, R, S, serif, label, eyebrow } from '../theme';
import Icon, { faPrint, faXmark } from '../components/Icon';

/**
 * PrinterModal
 *
 * Props:
 *   visible       bool
 *   onClose       () => void
 *   onPrint       () => void   — called when user taps Print after connecting
 *   usePrinter    hook result from usePrinter()
 */
export default function PrinterModal({ visible, onClose, onPrint, printer }) {
  const {
    devices, connected, scanning, connecting, printing,
    scan, connect, disconnect,
  } = printer;

  const [scanned, setScanned] = useState(false);

  const handleScan = async () => {
    setScanned(false);
    await scan();
    setScanned(true);
  };

  const handleConnect = async (device) => {
    if (connected?.address === device.address) {
      await disconnect();
      return;
    }
    await connect(device);
  };

  const handlePrint = async () => {
    await onPrint();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.pill} />

          {/* Header */}
          <View style={s.headerRow}>
            <View>
              <Text style={s.eyebrow}>Bluetooth</Text>
              <Text style={s.title}>Print Receipt</Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={onClose}>
              <Icon icon={faXmark} size={14} color={C.muted} />
            </TouchableOpacity>
          </View>

          {/* Connected status */}
          {connected && (
            <View style={s.connectedBanner}>
              <Text style={s.connectedDot}>●</Text>
              <Text style={s.connectedText}>Connected to {connected.name}</Text>
              <TouchableOpacity onPress={disconnect}>
                <Text style={s.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scan button */}
          <TouchableOpacity
            style={[s.scanBtn, scanning && { opacity: 0.6 }]}
            onPress={handleScan}
            disabled={scanning}
            activeOpacity={0.8}
          >
            {scanning
              ? <ActivityIndicator color={C.ink} size="small" />
              : <Text style={s.scanBtnText}>
                  {scanned ? '↻ Scan Again' : '🔍 Scan for Printers'}
                </Text>
            }
          </TouchableOpacity>

          {/* Device list */}
          {scanned && devices.length === 0 && (
            <View style={s.emptyWrap}>
              <Text style={s.emptyText}>No paired devices found.</Text>
              <Text style={s.emptyHint}>Pair your printer in Android Bluetooth settings first.</Text>
            </View>
          )}

          {devices.length > 0 && (
            <>
              <Text style={s.listLabel}>Paired Devices</Text>
              <FlatList
                data={devices}
                keyExtractor={d => d.address}
                style={{ maxHeight: 200 }}
                renderItem={({ item }) => {
                  const isConnected = connected?.address === item.address;
                  const isConnecting = connecting;
                  return (
                    <TouchableOpacity
                      style={[s.deviceRow, isConnected && s.deviceRowActive]}
                      onPress={() => handleConnect(item)}
                      disabled={isConnecting}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[s.deviceName, isConnected && s.deviceNameActive]}>
                          {item.name}
                        </Text>
                        <Text style={s.deviceAddress}>{item.address}</Text>
                      </View>
                      {isConnecting && !isConnected
                        ? <ActivityIndicator size="small" color={C.ink} />
                        : <Text style={[s.deviceStatus, isConnected && s.deviceStatusActive]}>
                            {isConnected ? '● Connected' : 'Tap to connect'}
                          </Text>
                      }
                    </TouchableOpacity>
                  );
                }}
              />
            </>
          )}

          {/* Print button */}
          <TouchableOpacity
            style={[s.printBtn, (!connected || printing) && s.printBtnDisabled]}
            onPress={handlePrint}
            disabled={!connected || printing}
            activeOpacity={0.85}
          >
            {printing
              ? <ActivityIndicator color={C.cream} />
              : <><Icon icon={faPrint} size={15} color={C.cream} style={{ marginRight: 8 }} /><Text style={s.printBtnText}>Print Receipt</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:            { flex: 1, backgroundColor: 'rgba(26,26,24,0.55)', justifyContent: 'flex-end' },
  sheet:              { backgroundColor: C.white, borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 },
  pill:               { width: 32, height: 3, backgroundColor: C.line, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },

  headerRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  eyebrow:            { ...eyebrow(9), marginBottom: 4 },
  title:              { ...serif(20, '300'), color: C.ink },
  closeBtn:           { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:       { fontSize: 13, color: C.muted },

  connectedBanner:    { flexDirection: 'row', alignItems: 'center', backgroundColor: C.successBg, borderRadius: R.md, padding: 12, marginBottom: 14, gap: 8 },
  connectedDot:       { color: C.success, fontSize: 10 },
  connectedText:      { flex: 1, fontSize: 13, fontWeight: '500', color: C.success },
  disconnectText:     { fontSize: 12, color: C.muted, fontWeight: '500' },

  scanBtn:            { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 13, alignItems: 'center', marginBottom: 16, backgroundColor: C.surface },
  scanBtnText:        { fontSize: 14, fontWeight: '600', color: C.ink },

  emptyWrap:          { alignItems: 'center', paddingVertical: 16 },
  emptyText:          { fontSize: 14, color: C.muted, fontWeight: '500' },
  emptyHint:          { fontSize: 12, color: C.muted, marginTop: 4, textAlign: 'center' },

  listLabel:          { ...label(9), marginBottom: 8 },
  deviceRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: C.line },
  deviceRowActive:    { backgroundColor: C.surface, borderRadius: R.sm, paddingHorizontal: 10, marginHorizontal: -10 },
  deviceName:         { fontSize: 14, fontWeight: '600', color: C.ink },
  deviceNameActive:   { color: C.ink },
  deviceAddress:      { fontSize: 11, color: C.muted, marginTop: 1 },
  deviceStatus:       { fontSize: 11, color: C.muted },
  deviceStatusActive: { color: C.success, fontWeight: '600' },

  printBtn:           { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  printBtnDisabled:   { opacity: 0.4 },
  printBtnText:       { ...label(11), color: C.cream, letterSpacing: 2 },
});
