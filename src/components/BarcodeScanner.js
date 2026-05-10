import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  ActivityIndicator, Alert, Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { C, R, label, eyebrow } from '../theme';
import Icon, { faXmark, faBolt } from '../components/Icon';

/**
 * BarcodeScanner
 *
 * Props:
 *   visible     bool
 *   onClose     () => void
 *   onScanned   (barcode: string) => void
 */
export default function BarcodeScanner({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned,    setScanned]        = useState(false);
  const [torch,      setTorch]          = useState(false);
  const cooldown = useRef(false);

  // Reset scan state each time modal opens
  useEffect(() => {
    if (visible) {
      setScanned(false);
      setTorch(false);
      cooldown.current = false;
    }
  }, [visible]);

  const handleBarcode = ({ data, type }) => {
    if (cooldown.current) return;
    cooldown.current = true;
    setScanned(true);
    Vibration.vibrate(80);
    onScanned(data);
    // Allow re-scan after 2s if modal stays open
    setTimeout(() => {
      cooldown.current = false;
      setScanned(false);
    }, 2000);
  };

  if (!visible) return null;

  // Permission not yet determined
  if (!permission) {
    return (
      <Modal visible transparent animationType="fade">
        <View style={s.center}>
          <ActivityIndicator color={C.cream} size="large" />
        </View>
      </Modal>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <Modal visible transparent animationType="slide" onRequestClose={onClose}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.pill} />
            <Text style={s.eyebrow}>Camera Access</Text>
            <Text style={s.title}>Permission Required</Text>
            <Text style={s.permText}>
              Camera access is needed to scan barcodes. Please grant permission to continue.
            </Text>
            <TouchableOpacity style={s.primaryBtn} onPress={requestPermission} activeOpacity={0.85}>
              <Text style={s.primaryBtnText}>Grant Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ghostBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={s.ghostBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={s.root}>
        {/* Camera */}
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: [
              'ean13', 'ean8', 'upc_a', 'upc_e',
              'code128', 'code39', 'code93',
              'qr', 'pdf417', 'itf14',
            ],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarcode}
        />

        {/* Dark overlay with cutout */}
        <View style={s.overlayTop} />
        <View style={s.overlayMiddle}>
          <View style={s.overlaySide} />
          <View style={s.scanWindow}>
            {/* Corner marks */}
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
            {/* Scan line */}
            {!scanned && <View style={s.scanLine} />}
            {/* Scanned flash */}
            {scanned && <View style={s.scannedFlash} />}
          </View>
          <View style={s.overlaySide} />
        </View>
        <View style={s.overlayBottom} />

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Icon icon={faXmark} size={16} color={C.cream} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={s.headerTitle}>Scan Barcode</Text>
            <Text style={s.headerSub}>Point camera at product barcode</Text>
          </View>
          <TouchableOpacity
            style={[s.torchBtn, torch && s.torchBtnActive]}
            onPress={() => setTorch(t => !t)}
            activeOpacity={0.8}
          >
            <Icon icon={faBolt} size={16} color={torch ? C.ink : C.cream} />
          </TouchableOpacity>
        </View>

        {/* Bottom hint */}
        <View style={s.footer}>
          {scanned
            ? <View style={s.scannedBadge}>
                <Text style={s.scannedBadgeText}>✓ Barcode detected</Text>
              </View>
            : <Text style={s.hint}>Align barcode within the frame</Text>
          }
        </View>
      </View>
    </Modal>
  );
}

const WINDOW_SIZE = 260;

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#000' },
  center:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', alignItems: 'center', justifyContent: 'center' },

  // Overlay layers
  overlayTop:     { position: 'absolute', top: 0, left: 0, right: 0, height: '25%', backgroundColor: 'rgba(26,26,24,0.72)' },
  overlayMiddle:  { position: 'absolute', top: '25%', left: 0, right: 0, flexDirection: 'row', height: WINDOW_SIZE },
  overlaySide:    { flex: 1, backgroundColor: 'rgba(26,26,24,0.72)' },
  overlayBottom:  { position: 'absolute', bottom: 0, left: 0, right: 0, top: `calc(25% + ${WINDOW_SIZE}px)`, backgroundColor: 'rgba(26,26,24,0.72)' },

  // Scan window
  scanWindow:     { width: WINDOW_SIZE, height: WINDOW_SIZE, position: 'relative' },
  corner:         { position: 'absolute', width: 24, height: 24, borderColor: C.warm },
  cornerTL:       { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cornerTR:       { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cornerBL:       { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cornerBR:       { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  scanLine:       { position: 'absolute', left: 8, right: 8, top: '50%', height: 1.5, backgroundColor: C.warm, opacity: 0.8 },
  scannedFlash:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(200,169,122,0.25)', borderRadius: 2 },

  // Header
  header:         { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  closeBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(26,26,24,0.6)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText:   { color: C.cream, fontSize: 16 },
  headerTitle:    { color: C.cream, fontSize: 16, fontWeight: '600', letterSpacing: 0.3 },
  headerSub:      { color: 'rgba(245,242,238,0.5)', fontSize: 11, marginTop: 2, letterSpacing: 0.3 },
  torchBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(26,26,24,0.6)', alignItems: 'center', justifyContent: 'center' },
  torchBtnActive: { backgroundColor: C.warm },
  torchIcon:      { fontSize: 18 },

  // Footer
  footer:         { position: 'absolute', bottom: 60, left: 0, right: 0, alignItems: 'center' },
  hint:           { color: 'rgba(245,242,238,0.55)', fontSize: 13, letterSpacing: 0.3 },
  scannedBadge:   { backgroundColor: C.warm, borderRadius: R.pill, paddingHorizontal: 20, paddingVertical: 8 },
  scannedBadgeText: { color: C.ink, fontSize: 13, fontWeight: '700' },

  // Permission sheet
  overlay:        { flex: 1, backgroundColor: 'rgba(26,26,24,0.55)', justifyContent: 'flex-end' },
  sheet:          { backgroundColor: C.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 36 },
  pill:           { width: 32, height: 3, backgroundColor: C.line, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  eyebrow:        { ...eyebrow(9), marginBottom: 4 },
  title:          { fontSize: 20, fontFamily: 'Georgia', fontWeight: '300', color: C.ink, marginBottom: 12 },
  permText:       { fontSize: 14, color: C.muted, lineHeight: 22, marginBottom: 24 },
  primaryBtn:     { backgroundColor: C.ink, borderRadius: R.md, paddingVertical: 15, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { ...label(11), color: C.cream, letterSpacing: 2 },
  ghostBtn:       { borderWidth: 1, borderColor: C.line, borderRadius: R.md, paddingVertical: 13, alignItems: 'center' },
  ghostBtnText:   { ...label(10), letterSpacing: 1.5 },
});
