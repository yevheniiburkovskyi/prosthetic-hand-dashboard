/* eslint-disable react-refresh/only-export-components */
import {
  INITIAL_TEMPERATURE_DATA,
  SERVICE_UUID,
  TEMPERATURE_THUMB_UUID,
} from '@/lib/constants';
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
import { toast } from 'sonner';

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
  const [temperatureData, setTemperatureData] = useState<TemperatureBLEData>(
    INITIAL_TEMPERATURE_DATA
  );

  const [server, setServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [service, setService] = useState<BluetoothRemoteGATTService | null>(
    null
  );

  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isServerConnecting, setIsServerConnecting] = useState(false);
  const [isServiceConnecting, setIsServiceConnecting] = useState(false);

  const connectServer = useCallback(async () => {
    try {
      toast.info('Start connecting to BLE device');
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
      toast.error(`Failed to connect to BLE device: ${error}}`);
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
      toast.error('Failed to connect to BLE service.');
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
      toast.error(`Failed to disconnect from BLE device: ${error}`);
    }
  }, [server]);

  const subscribeForCharacteristic = useCallback(async () => {
    if (!service) {
      return;
    }

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
          console.log('Received temperature:', temp);

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
      toast.error(`Failed to subscribe to BLE characteristic: ${error}`);
    }
  }, [service]);

  const isBLEConnecting = isServerConnecting || isServiceConnecting;
  const isBLEConnected = isServerConnected;

  useEffect(() => {
    if (server && server.connected) {
      setIsServerConnected(true);

      connectService().then(() => {
        toast.success(`Connected to BLE device: "${server.device.name}"`);
        subscribeForCharacteristic();
      });
    } else {
      setTemperatureData(INITIAL_TEMPERATURE_DATA);
      setIsServerConnected((prev) => {
        if (prev) {
          toast.error('Disconnected from BLE device.');
        }

        return false;
      });
    }
  }, [connectServer, connectService, server, subscribeForCharacteristic]);

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
