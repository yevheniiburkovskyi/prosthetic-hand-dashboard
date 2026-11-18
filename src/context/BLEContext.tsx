/* eslint-disable react-refresh/only-export-components */
import {
  BLE_DEVICE_NAME,
  SENSOR_CHARACTERISTICS,
  SERVICE_UUID,
} from '@/lib/ble';
import { EMPTY_READINGS } from '@/lib/constants';
import { DEMO_INTERVAL_MS, getDemoReadings } from '@/lib/demo';
import type { HandReadings, SensorKind } from '@/types/sensorType';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

type AllReadings = Record<SensorKind, HandReadings>;
type ReadingsListener = (readings: HandReadings) => void;

interface BLEContextType {
  status: ConnectionStatus;
  /** Latest reading per sensor kind and finger. */
  readings: AllReadings;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Called once per BLE notification; returns an unsubscribe function. */
  subscribe: (kind: SensorKind, listener: ReadingsListener) => () => void;
  /** When on, readings come from replayed mock data instead of a device. */
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
}

const DEMO_MODE_STORAGE_KEY = 'demoMode';

const EMPTY_ALL_READINGS: AllReadings = {
  temperature: EMPTY_READINGS,
  fsr: EMPTY_READINGS,
};

const BLEContext = createContext<BLEContextType | undefined>(undefined);

const BLEProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [readings, setReadings] = useState<AllReadings>(EMPTY_ALL_READINGS);
  const [isDemoMode, setIsDemoMode] = useState(
    () => localStorage.getItem(DEMO_MODE_STORAGE_KEY) === 'true'
  );

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const isManualDisconnectRef = useRef(false);
  const latestReadingsRef = useRef<AllReadings>(EMPTY_ALL_READINGS);
  const listenersRef = useRef<Record<SensorKind, Set<ReadingsListener>>>({
    temperature: new Set(),
    fsr: new Set(),
  });

  const publish = useCallback(
    (kind: SensorKind, update: Partial<HandReadings>) => {
      const current = latestReadingsRef.current;
      const next = { ...current, [kind]: { ...current[kind], ...update } };

      latestReadingsRef.current = next;
      setReadings(next);
      listenersRef.current[kind].forEach((listener) => listener(next[kind]));
    },
    []
  );

  const resetReadings = useCallback(() => {
    latestReadingsRef.current = EMPTY_ALL_READINGS;
    setReadings(EMPTY_ALL_READINGS);
  }, []);

  const setDemoMode = useCallback(
    (enabled: boolean) => {
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled));
      resetReadings();
      setIsDemoMode(enabled);
    },
    [resetReadings]
  );

  // Demo mode replays mock data through the same publish path as real BLE.
  useEffect(() => {
    if (!isDemoMode) return;

    const startedAt = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      publish('temperature', getDemoReadings('temperature', elapsed));
      publish('fsr', getDemoReadings('fsr', elapsed));
    }, DEMO_INTERVAL_MS);

    return () => clearInterval(id);
  }, [isDemoMode, publish]);

  const handleDisconnected = useCallback(() => {
    deviceRef.current = null;
    resetReadings();
    setStatus('disconnected');

    if (isManualDisconnectRef.current) {
      toast.info('Disconnected from BLE device.');
    } else {
      toast.error('Connection to BLE device lost.');
    }
    isManualDisconnectRef.current = false;
  }, [resetReadings]);

  const connect = useCallback(async () => {
    if (!navigator.bluetooth) {
      toast.error(
        'Web Bluetooth is not supported in this browser. Use Chrome or Edge.'
      );
      return;
    }

    setStatus('connecting');
    toast.info('Searching for BLE device...');

    let device: BluetoothDevice | undefined;

    try {
      device = await navigator.bluetooth.requestDevice({
        filters: [{ name: BLE_DEVICE_NAME }],
        optionalServices: [SERVICE_UUID],
      });

      if (!device.gatt) {
        throw new Error('Device does not support GATT.');
      }

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      // A missing characteristic should not take the whole connection down.
      const results = await Promise.allSettled(
        SENSOR_CHARACTERISTICS.map(async ({ uuid, kind, finger, parse }) => {
          const characteristic = await service.getCharacteristic(uuid);
          characteristic.addEventListener('characteristicvaluechanged', () => {
            if (characteristic.value) {
              publish(kind, { [finger]: parse(characteristic.value) });
            }
          });
          await characteristic.startNotifications();
        })
      );

      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          const { kind, uuid } = SENSOR_CHARACTERISTICS[i];
          console.error(
            `Subscription error (${kind}, ${uuid}):`,
            result.reason
          );
          toast.error(
            `Failed to subscribe to ${kind} sensor: ${result.reason}`
          );
        }
      });

      device.addEventListener('gattserverdisconnected', handleDisconnected, {
        once: true,
      });
      deviceRef.current = device;
      setStatus('connected');
      toast.success(`Connected to BLE device: "${device.name}"`);
    } catch (error) {
      device?.gatt?.disconnect();
      setStatus('disconnected');

      // Thrown when the user closes the device picker.
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        toast.info(error.message);
        return;
      }

      console.error('BLE connection error:', error);
      toast.error(`Failed to connect to BLE device: ${error}`);
    }
  }, [handleDisconnected, publish]);

  const disconnect = useCallback(() => {
    if (!deviceRef.current?.gatt) return;

    isManualDisconnectRef.current = true;
    // Fires 'gattserverdisconnected', which resets state in handleDisconnected.
    deviceRef.current.gatt.disconnect();
  }, []);

  const subscribe = useCallback(
    (kind: SensorKind, listener: ReadingsListener) => {
      const listeners = listenersRef.current[kind];
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    []
  );

  const value = useMemo<BLEContextType>(
    () => ({
      status,
      readings,
      connect,
      disconnect,
      subscribe,
      isDemoMode,
      setDemoMode,
    }),
    [status, readings, connect, disconnect, subscribe, isDemoMode, setDemoMode]
  );

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

const useBLEContext = (): BLEContextType => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error('useBLEContext must be used within a BLEProvider');
  }

  return context;
};

export { BLEProvider, useBLEContext };
