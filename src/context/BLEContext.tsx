/* eslint-disable react-refresh/only-export-components */
import { SERVICE_UUID, TEMPERATURE_THUMB_UUID } from '@/lib/constants';
import type { TemperatureBLEData } from '@/types/bleType';
import { TemperatureName } from '@/types/temperatureType';
import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

interface BLEContextType {
  temperatureData: TemperatureBLEData;
  connectBluetooth: () => Promise<void>;
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

  const connectBluetooth = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'Prosthetic-Hand' }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt!.connect();

      const service = await server.getPrimaryService(SERVICE_UUID);

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
      console.error('Connection error:', error);
    }
  };

  const value: BLEContextType = {
    temperatureData,
    connectBluetooth,
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
