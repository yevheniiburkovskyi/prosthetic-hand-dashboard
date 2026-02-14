/* eslint-disable react-refresh/only-export-components */
import { SERVICE_UUID, TEMPERATURE_THUMB_UUID } from '@/lib/constants';
import type { TemperatureBLEData } from '@/types/bleType';
import { TemperatureName } from '@/types/temperatureType';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

interface BLEContextType {
  server: BluetoothRemoteGATTServer | null;
  service: BluetoothRemoteGATTService | null;
  temperatureData: TemperatureBLEData;
  isBLEConnecting: boolean;
  isBLEConnected: boolean;
  connectService: () => Promise<void>;
  disconnectServer: () => Promise<void>;
  connectServer: () => Promise<void>;
  subscribeForCharacteristic: () => Promise<void>;
}

const BLEContext = createContext<BLEContextType | undefined>(undefined);

const BLEProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [temperatureData, setTemperatureData] = useState<TemperatureBLEData>({
    [TEMPERATURE_THUMB_UUID]: {
      name: TemperatureName.THUMB,
      value: 0,
    },
    index: {
      name: TemperatureName.INDEX,
      value: 0,
    },
    middle: {
      name: TemperatureName.MIDDLE,
      value: 0,
    },
    ring: {
      name: TemperatureName.RING,
      value: 0,
    },
    pinky: {
      name: TemperatureName.PINKY,
      value: 0,
    },
  });

  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [service, setService] = useState<BluetoothRemoteGATTService | null>(
    null
  );

  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isServerConnecting, setIsServerConnecting] = useState(false);
  const [isServiceConnecting, setIsServiceConnecting] = useState(false);

  const connectServer = useCallback(async () => {
    try {
      setIsServerConnecting(true);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'Prosthetic-Hand' }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt?.connect();

      if (server) {
        setServer(server);
      }
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      setIsServerConnecting(false);
    }
  }, []);

  const connectService = useCallback(async () => {
    if (!server) return;

    try {
      setIsServiceConnecting(true);
      const service = await server.getPrimaryService(SERVICE_UUID);
      setService(service);
    } catch (error) {
      console.error('Service error:', error);
    } finally {
      setIsServiceConnecting(false);
    }
  }, [server]);

  const disconnectServer = useCallback(async () => {
    if (!server) return;

    try {
      server.disconnect();
      setServer(null);
      setService(null);
    } catch (error) {
      console.error('Disconnection error:', error);
    }
  }, [server]);

  const subscribeForCharacteristic = useCallback(async () => {
    if (!service) return;

    try {
      const temperatureChar = await service.getCharacteristic(
        TEMPERATURE_THUMB_UUID
      );

      await temperatureChar.startNotifications();

      temperatureChar.addEventListener(
        'characteristicvaluechanged',
        (event) => {
          const target = event.target as BluetoothRemoteGATTCharacteristic;
          const value = target.value;
          const decoder = new TextDecoder('utf-8');
          const tempString = decoder.decode(value!);
          const temp = parseFloat(tempString);

          setTemperatureData((prev) => ({
            ...prev,
            [TEMPERATURE_THUMB_UUID]: {
              name: TemperatureName.THUMB,
              value: temp,
            },
          }));
        }
      );
    } catch (error) {
      console.error('Subscription error:', error);
    }
  }, [service]);

  const isBLEConnecting = isServerConnecting || isServiceConnecting;
  const isBLEConnected = isServerConnected;

  useEffect(() => {
    if (server && server.connected) {
      setIsServerConnected(true);
    } else {
      setIsServerConnected(false);
    }
  }, [server]);

  const value: BLEContextType = {
    isBLEConnected,
    isBLEConnecting,
    temperatureData,
    server,
    service,
    connectServer,
    connectService,
    disconnectServer,
    subscribeForCharacteristic,
  };

  return <BLEContext.Provider value={value}>{children}</BLEContext.Provider>;
};

const useBLEContext = (): BLEContextType => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error('useBLE must be used within a BLEProvider');
  }

  return context;
};

export { BLEProvider, useBLEContext };
