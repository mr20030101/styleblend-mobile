import { useState, useCallback } from 'react';
import { Alert, Platform, PermissionsAndroid } from 'react-native';

async function requestBluetoothPermissions() {
  if (Platform.OS !== 'android' || Platform.Version < 31) return true;
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);
  return (
    granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN]   === PermissionsAndroid.RESULTS.GRANTED &&
    granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
  );
}

// Lazy-import so the module doesn't crash on Expo Go / web
let BluetoothManager = null;
let BluetoothEscposPrinter = null;
try {
  const lib = require('@vardrz/react-native-bluetooth-escpos-printer');
  BluetoothManager       = lib.BluetoothManager;
  BluetoothEscposPrinter = lib.BluetoothEscposPrinter;
} catch (_) {}

export function usePrinter() {
  const [devices,     setDevices]     = useState([]);
  const [connected,   setConnected]   = useState(null); // { address, name }
  const [scanning,    setScanning]    = useState(false);
  const [connecting,  setConnecting]  = useState(false);
  const [printing,    setPrinting]    = useState(false);

  const isAvailable = !!BluetoothManager;

  // ── Scan for paired Bluetooth devices ──────────────────────────────────────
  const scan = useCallback(async () => {
    if (!isAvailable) {
      Alert.alert('Not Available', 'Bluetooth printing is not available in this environment.');
      return;
    }
    setScanning(true);
    try {
      const hasPermission = await requestBluetoothPermissions();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Bluetooth permissions are required to scan for printers. Please allow them in Settings.');
        return [];
      }
      await BluetoothManager.enableBluetooth();
      const paired = await BluetoothManager.scanDevices();
      const list = JSON.parse(paired);
      // paired.found contains already-paired devices
      const found = (list.paired || list.found || []).map(d => ({
        name:    d.name || 'Unknown Device',
        address: d.address,
      }));
      setDevices(found);
      return found;
    } catch (e) {
      Alert.alert('Scan Failed', e.message || 'Could not scan for devices.');
      return [];
    } finally {
      setScanning(false);
    }
  }, [isAvailable]);

  // ── Connect to a device ────────────────────────────────────────────────────
  const connect = useCallback(async (device) => {
    if (!isAvailable) return;
    setConnecting(true);
    try {
      await BluetoothManager.connect(device.address);
      setConnected(device);
      return true;
    } catch (e) {
      Alert.alert('Connection Failed', `Could not connect to ${device.name}.\n${e.message || ''}`);
      return false;
    } finally {
      setConnecting(false);
    }
  }, [isAvailable]);

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (!isAvailable || !connected) return;
    try {
      await BluetoothManager.disconnect(connected.address);
    } catch (_) {}
    setConnected(null);
  }, [isAvailable, connected]);

  // ── Print a receipt ────────────────────────────────────────────────────────
  const printReceipt = useCallback(async (receiptData) => {
    if (!isAvailable) {
      Alert.alert('Not Available', 'Bluetooth printing requires a native build.');
      return false;
    }
    if (!connected) {
      Alert.alert('No Printer', 'Please connect to a printer first.');
      return false;
    }
    setPrinting(true);
    try {
      await buildAndPrint(receiptData);
      return true;
    } catch (e) {
      Alert.alert('Print Failed', e.message || 'Could not print receipt.');
      return false;
    } finally {
      setPrinting(false);
    }
  }, [isAvailable, connected]);

  return {
    isAvailable,
    devices,
    connected,
    scanning,
    connecting,
    printing,
    scan,
    connect,
    disconnect,
    printReceipt,
  };
}

// ── ESC/POS receipt builder ────────────────────────────────────────────────────
async function buildAndPrint(data) {
  const {
    storeName, storeAddress, storePhone, storeFooter,
    taxLabel, currencySymbol,
    transaction,
  } = data;

  const P = BluetoothEscposPrinter;
  const ALIGN = BluetoothEscposPrinter.ALIGN;

  const currency = currencySymbol || '₱';
  const fmt = (n) => currency + parseFloat(n).toFixed(2);
  const pad = (left, right, width = 32) => {
    const gap = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, gap)) + right;
  };
  const divider = (char = '-', len = 32) => char.repeat(len);

  // ── Header ──
  await P.printerAlign(ALIGN.CENTER);
  await P.printText(storeName + '\n', { widthtimes: 1, heigthtimes: 1, fonttype: 1 });
  if (storeAddress) await P.printText(storeAddress + '\n', {});
  if (storePhone)   await P.printText(storePhone + '\n', {});

  await P.printerAlign(ALIGN.CENTER);
  await P.printText(divider() + '\n', {});

  // ── Transaction info ──
  await P.printerAlign(ALIGN.LEFT);
  const date = new Date(transaction.created_at);
  const dateStr = date.toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' })
    + ' ' + date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  await P.printText(pad('Date:', dateStr) + '\n', {});
  await P.printText(pad('TXN #:', transaction.transaction_number) + '\n', {});
  await P.printText(pad('Cashier:', transaction.cashier) + '\n', {});
  await P.printText(pad('Customer:', transaction.customer || 'Walk-in') + '\n', {});

  await P.printerAlign(ALIGN.CENTER);
  await P.printText(divider() + '\n', {});

  // ── Items header ──
  await P.printerAlign(ALIGN.LEFT);
  await P.printText('Item                    Qty  Price\n', { fonttype: 1 });
  await P.printText(divider() + '\n', {});

  // ── Items ──
  for (const item of transaction.items) {
    // Product name line
    await P.printText(item.product_name + '\n', {});
    // Variant + qty + subtotal
    const variantLine = pad(
      '  ' + item.variant_info,
      'x' + item.quantity + '  ' + fmt(item.subtotal),
      32
    );
    await P.printText(variantLine + '\n', {});
    // Unit price
    await P.printText('  @ ' + fmt(item.unit_price) + ' each\n', {});
  }

  await P.printerAlign(ALIGN.CENTER);
  await P.printText(divider() + '\n', {});

  // ── Totals ──
  await P.printerAlign(ALIGN.LEFT);
  await P.printText(pad('Subtotal:', fmt(transaction.subtotal)) + '\n', {});

  if (parseFloat(transaction.discount) > 0) {
    await P.printText(pad('Discount:', '-' + fmt(transaction.discount)) + '\n', {});
  }
  if (parseFloat(transaction.tax) > 0) {
    await P.printText(pad((taxLabel || 'Tax') + ':', fmt(transaction.tax)) + '\n', {});
  }

  await P.printText(divider() + '\n', {});

  // Total — larger text
  await P.printerAlign(ALIGN.LEFT);
  await P.printText(pad('TOTAL:', fmt(transaction.total)) + '\n', { widthtimes: 1, heigthtimes: 1, fonttype: 1 });
  await P.printText(pad('Cash Paid:', fmt(transaction.amount_paid)) + '\n', {});
  await P.printText(pad('Change:', fmt(transaction.change)) + '\n', {});

  await P.printerAlign(ALIGN.CENTER);
  await P.printText(divider() + '\n', {});

  // ── Footer ──
  await P.printText((storeFooter || 'Thank you for shopping with us!') + '\n', {});
  await P.printText('Please come again\n', {});

  // Feed and cut
  await P.printText('\n\n\n', {});
  await P.cutOnePoint();
}
