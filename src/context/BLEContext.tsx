/* eslint-disable react-refresh/only-export-components */
import {
  BLE_DEVICE_NAME,
  CALIBRATION_UUID,
  CONTROL_UUID,
  encodeCommand,
  encodeCorrectionPacket,
  NO_CORRECTION,
  parseMotorStatus,
  parseSensorPacket,
  SENSOR_DATA_UUIDS,
  SERVICE_UUID,
  type Command,
  type CorrectionParams,
  type MotorState,
} from '@/lib/ble';
import {
  CALIBRATION_DURATION_MS,
  computeCalibration,
  createCorrectionFilter,
  MIN_CALIBRATION_SAMPLES,
  type Calibration,
  type CorrectionTarget,
} from '@/lib/calibration';
import { EMPTY_READINGS, SENSORS } from '@/lib/constants';
import { DEFAULT_DEMO_SETTINGS, type DemoSettings } from '@/lib/demo';
import { createDemoDevice } from '@/lib/demoDevice';
import type { HandReadings, SensorId, SensorKind } from '@/types/sensorType';
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
/** Motor state reported by the device, or 'unavailable' without support. */
export type MotorStatus = MotorState | 'unavailable';

/** What the connected device (real or demo) can do beyond streaming data. */
export interface DeviceCapabilities {
  calibration: boolean;
  motor: boolean;
}

type AllReadings = Record<SensorKind, HandReadings>;
type ReadingsListener = (readings: HandReadings) => void;

interface BLEContextType {
  status: ConnectionStatus;
  /** Latest reading per sensor kind and sensor. */
  readings: AllReadings;
  connect: () => Promise<void>;
  disconnect: () => void;
  /** Called once per BLE notification; returns an unsubscribe function. */
  subscribe: (kind: SensorKind, listener: ReadingsListener) => () => void;
  /** When on, data comes from a simulated device instead of BLE. */
  isDemoMode: boolean;
  setDemoMode: (enabled: boolean) => void;
  /** Demo scenario and noise simulation; persisted across reloads. */
  demoSettings: DemoSettings;
  updateDemoSettings: (patch: Partial<DemoSettings>) => void;
  capabilities: DeviceCapabilities;
  /** Active FSR correction (offset, filter, dead band), if any. */
  fsrCalibration: Calibration | null;
  isCalibratingFsr: boolean;
  /**
   * Runs the motor (if supported), measures FSR noise at rest, computes a
   * per-sensor correction and sends it to the device (or applies it in the
   * app if the firmware can't take it).
   */
  calibrateFsr: () => Promise<void>;
  resetFsrCalibration: () => void;
  motorStatus: MotorStatus;
  isMotorCommandPending: boolean;
  /** Sends a motor command and resolves once the device confirms it. */
  sendMotorCommand: (command: Command) => Promise<boolean>;
}

/** Writes to the connected device; a missing method = not supported. */
interface DeviceLink {
  writeCalibration?: (packet: ArrayBuffer) => Promise<void>;
  writeControl?: (packet: ArrayBuffer) => Promise<void>;
}

const DEMO_MODE_STORAGE_KEY = 'demoMode';
const DEMO_SETTINGS_STORAGE_KEY = 'demoSettings';
/** How long to wait for the device to confirm a motor command. */
const MOTOR_CONFIRM_TIMEOUT_MS = 2000;

const NO_CAPABILITIES: DeviceCapabilities = {
  calibration: false,
  motor: false,
};
const DEMO_CAPABILITIES: DeviceCapabilities = {
  calibration: true,
  motor: true,
};

const loadDemoSettings = (): DemoSettings => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(DEMO_SETTINGS_STORAGE_KEY) ?? '{}'
    );
    return {
      scenario: stored.scenario === 'states' ? 'states' : 'normal',
      noise: stored.noise === true,
    };
  } catch {
    return DEFAULT_DEMO_SETTINGS;
  }
};

const NO_CORRECTIONS = Object.fromEntries(
  SENSORS.map((sensor) => [sensor, NO_CORRECTION])
) as Record<SensorId, CorrectionParams>;

const writeCorrections = async (
  write: (packet: ArrayBuffer) => Promise<void>,
  corrections: Record<SensorId, CorrectionParams>
) => {
  // One small write per sensor keeps packets within the default BLE MTU.
  for (const [index, sensor] of SENSORS.entries()) {
    await write(encodeCorrectionPacket(index, corrections[sensor]));
  }
};

const APPLIED_MESSAGES: Record<CorrectionTarget, string> = {
  device: 'Calibration sent to the device.',
  'demo-device': 'Calibration sent to the demo device.',
  app: 'Calibration applied in the app (firmware does not support remote calibration yet).',
};

const MOTOR_MESSAGES: Record<MotorState, string> = {
  running: 'Motor started',
  stopped: 'Motor stopped',
  fault: 'Motor fault reported by the device',
};

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
  const [demoSettings, setDemoSettings] = useState(loadDemoSettings);
  const demoSettingsRef = useRef(demoSettings);

  const [bleCapabilities, setBleCapabilities] =
    useState<DeviceCapabilities>(NO_CAPABILITIES);
  const [fsrCalibration, setFsrCalibration] = useState<Calibration | null>(
    null
  );
  const [isCalibratingFsr, setIsCalibratingFsr] = useState(false);
  const [reportedMotor, setReportedMotor] = useState<MotorState | null>(null);
  const [isMotorCommandPending, setIsMotorCommandPending] = useState(false);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const linkRef = useRef<DeviceLink | null>(null);
  const isManualDisconnectRef = useRef(false);
  /** Uncalibrated readings as received from the device. */
  const rawReadingsRef = useRef<AllReadings>(EMPTY_ALL_READINGS);
  /** Fallback when the firmware can't apply corrections itself. */
  const appFilterRef = useRef<
    ((readings: HandReadings) => HandReadings) | null
  >(null);
  /** Collects raw FSR samples while a calibration is running. */
  const calibrationSamplesRef = useRef<HandReadings[] | null>(null);
  /** Pending motor command waiting for the device's status confirmation. */
  const motorWaiterRef = useRef<{
    target: MotorState;
    resolve: (state: MotorState | null) => void;
  } | null>(null);
  const listenersRef = useRef<Record<SensorKind, Set<ReadingsListener>>>({
    temperature: new Set(),
    fsr: new Set(),
  });

  const capabilities = isDemoMode ? DEMO_CAPABILITIES : bleCapabilities;
  const motorStatus: MotorStatus = capabilities.motor
    ? (reportedMotor ?? 'stopped')
    : 'unavailable';

  const publish = useCallback(
    (kind: SensorKind, update: Partial<HandReadings>) => {
      const raw = { ...rawReadingsRef.current[kind], ...update };
      rawReadingsRef.current = { ...rawReadingsRef.current, [kind]: raw };

      let output = raw;
      if (kind === 'fsr') {
        calibrationSamplesRef.current?.push(raw);
        if (appFilterRef.current) output = appFilterRef.current(raw);
      }

      setReadings((prev) => ({ ...prev, [kind]: output }));
      listenersRef.current[kind].forEach((listener) => listener(output));
    },
    []
  );

  const handleSensorPacket = useCallback(
    (kind: SensorKind, data: DataView) => {
      const update = parseSensorPacket(kind, data);
      if (update) publish(kind, update);
    },
    [publish]
  );

  const handleStatusPacket = useCallback((data: DataView) => {
    const state = parseMotorStatus(data);
    if (!state) return;
    setReportedMotor(state);

    const waiter = motorWaiterRef.current;
    if (waiter && (state === waiter.target || state === 'fault')) {
      motorWaiterRef.current = null;
      waiter.resolve(state);
    } else if (state === 'fault') {
      toast.error(MOTOR_MESSAGES.fault);
    }
  }, []);

  const cancelMotorWaiter = () => {
    motorWaiterRef.current?.resolve(null);
    motorWaiterRef.current = null;
  };

  const sendMotorCommand = useCallback(async (command: Command) => {
    const writeControl = linkRef.current?.writeControl;
    if (!writeControl) return false;

    const target: MotorState = command === 'motorStart' ? 'running' : 'stopped';
    setIsMotorCommandPending(true);

    // Register before writing so a fast confirmation isn't missed.
    motorWaiterRef.current?.resolve(null);
    const confirmation = new Promise<MotorState | null>((resolve) => {
      const timer = setTimeout(() => {
        motorWaiterRef.current = null;
        resolve(null);
      }, MOTOR_CONFIRM_TIMEOUT_MS);
      motorWaiterRef.current = {
        target,
        resolve: (state) => {
          clearTimeout(timer);
          resolve(state);
        },
      };
    });

    try {
      await writeControl(encodeCommand(command));
      const state = await confirmation;

      if (state === target) {
        toast.info(MOTOR_MESSAGES[target]);
        return true;
      }
      if (state === 'fault') {
        toast.error(MOTOR_MESSAGES.fault);
      } else {
        toast.warning(
          `The device did not confirm motor ${target === 'running' ? 'start' : 'stop'}.`
        );
      }
      return false;
    } catch (error) {
      motorWaiterRef.current?.resolve(null);
      motorWaiterRef.current = null;
      console.error('Motor command failed:', error);
      toast.error('Failed to send the motor command.');
      return false;
    } finally {
      setIsMotorCommandPending(false);
    }
  }, []);

  const resetReadings = useCallback(() => {
    rawReadingsRef.current = EMPTY_ALL_READINGS;
    setReadings(EMPTY_ALL_READINGS);
  }, []);

  /** Removes any active correction from the app and the device. */
  const clearCorrection = useCallback(async () => {
    appFilterRef.current = null;
    setFsrCalibration(null);

    const writeCalibration = linkRef.current?.writeCalibration;
    if (writeCalibration) {
      try {
        await writeCorrections(writeCalibration, NO_CORRECTIONS);
      } catch (error) {
        console.error('Failed to reset device calibration:', error);
      }
    }
  }, []);

  const resetFsrCalibration = useCallback(() => {
    void clearCorrection();
  }, [clearCorrection]);

  const calibrateFsr = useCallback(async () => {
    if (calibrationSamplesRef.current) return;

    // Measure the sensors' own noise, not an earlier correction's output.
    await clearCorrection();

    const hasMotor = Boolean(linkRef.current?.writeControl);
    const samples: HandReadings[] = [];
    calibrationSamplesRef.current = samples;
    setIsCalibratingFsr(true);

    try {
      if (hasMotor) await sendMotorCommand('motorStart');
      await new Promise((resolve) =>
        setTimeout(resolve, CALIBRATION_DURATION_MS)
      );
    } finally {
      calibrationSamplesRef.current = null;
      if (hasMotor) await sendMotorCommand('motorStop');
      setIsCalibratingFsr(false);
    }

    if (samples.length < MIN_CALIBRATION_SAMPLES) {
      toast.error(
        'Not enough sensor data to calibrate. Connect the device or enable demo mode.'
      );
      return;
    }

    const calibration = computeCalibration(samples);
    const writeCalibration = linkRef.current?.writeCalibration;
    let appliedOn: CorrectionTarget = 'app';

    if (writeCalibration) {
      try {
        await writeCorrections(writeCalibration, calibration.sensors);
        appliedOn = isDemoMode ? 'demo-device' : 'device';
      } catch (error) {
        console.error('Failed to send calibration:', error);
        toast.warning('Could not send calibration to the device.');
      }
    }

    if (appliedOn === 'app') {
      appFilterRef.current = createCorrectionFilter(calibration.sensors);
    }

    setFsrCalibration({ ...calibration, appliedOn });
    toast.success(APPLIED_MESSAGES[appliedOn]);
  }, [clearCorrection, isDemoMode, sendMotorCommand]);

  const setDemoMode = useCallback(
    (enabled: boolean) => {
      localStorage.setItem(DEMO_MODE_STORAGE_KEY, String(enabled));
      resetReadings();
      // A calibration belongs to the source it was measured on.
      resetFsrCalibration();
      cancelMotorWaiter();
      setReportedMotor(null);
      setIsDemoMode(enabled);
    },
    [resetReadings, resetFsrCalibration]
  );

  const updateDemoSettings = useCallback(
    (patch: Partial<DemoSettings>) => {
      const prev = demoSettingsRef.current;
      const next = { ...prev, ...patch };

      // Noise changes the sensors' resting offset, so the old calibration
      // no longer matches.
      if (next.noise !== prev.noise) resetFsrCalibration();

      demoSettingsRef.current = next;
      localStorage.setItem(DEMO_SETTINGS_STORAGE_KEY, JSON.stringify(next));
      setDemoSettings(next);
    },
    [resetFsrCalibration]
  );

  // Demo mode runs a virtual ESP that speaks the real byte-level protocol,
  // so the same parsing, calibration and motor code paths are exercised.
  useEffect(() => {
    if (!isDemoMode) return;

    const device = createDemoDevice({
      getSettings: () => demoSettingsRef.current,
      isResting: () => calibrationSamplesRef.current !== null,
      onSensorPacket: handleSensorPacket,
      onStatusPacket: handleStatusPacket,
    });
    const link: DeviceLink = {
      writeCalibration: device.writeCalibration,
      writeControl: device.writeControl,
    };
    linkRef.current = link;

    return () => {
      device.dispose();
      if (linkRef.current === link) linkRef.current = null;
    };
  }, [isDemoMode, handleSensorPacket, handleStatusPacket]);

  const handleDisconnected = useCallback(() => {
    deviceRef.current = null;
    linkRef.current = null;
    appFilterRef.current = null;
    cancelMotorWaiter();
    setFsrCalibration(null);
    setBleCapabilities(NO_CAPABILITIES);
    setReportedMotor(null);
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
      const kinds = Object.keys(SENSOR_DATA_UUIDS) as SensorKind[];
      const results = await Promise.allSettled(
        kinds.map(async (kind) => {
          const characteristic = await service.getCharacteristic(
            SENSOR_DATA_UUIDS[kind]
          );
          characteristic.addEventListener('characteristicvaluechanged', () => {
            if (characteristic.value) {
              handleSensorPacket(kind, characteristic.value);
            }
          });
          await characteristic.startNotifications();
        })
      );

      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`Subscription error (${kinds[i]}):`, result.reason);
          toast.error(
            `Failed to subscribe to ${kinds[i]} sensors: ${result.reason}`
          );
        }
      });

      // Optional characteristics: older firmware may not have them.
      const calibrationChar = await service
        .getCharacteristic(CALIBRATION_UUID)
        .catch(() => null);
      const controlChar = await service
        .getCharacteristic(CONTROL_UUID)
        .catch(() => null);

      if (controlChar) {
        controlChar.addEventListener('characteristicvaluechanged', () => {
          if (controlChar.value) handleStatusPacket(controlChar.value);
        });
        try {
          await controlChar.startNotifications();
          handleStatusPacket(await controlChar.readValue());
        } catch (error) {
          console.error('Failed to read device status:', error);
        }
      }

      const link: DeviceLink = {
        writeCalibration: calibrationChar
          ? (packet) => calibrationChar.writeValueWithResponse(packet)
          : undefined,
        writeControl: controlChar
          ? (packet) => controlChar.writeValueWithResponse(packet)
          : undefined,
      };
      linkRef.current = link;

      if (link.writeCalibration) {
        // Start from a known state: no correction on the device.
        await writeCorrections(link.writeCalibration, NO_CORRECTIONS).catch(
          (error) => console.error('Failed to reset device calibration:', error)
        );
      }
      setBleCapabilities({
        calibration: Boolean(calibrationChar),
        motor: Boolean(controlChar),
      });

      device.addEventListener('gattserverdisconnected', handleDisconnected, {
        once: true,
      });
      deviceRef.current = device;
      setStatus('connected');
      toast.success(`Connected to BLE device: "${device.name}"`);
    } catch (error) {
      linkRef.current = null;
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
  }, [handleDisconnected, handleSensorPacket, handleStatusPacket]);

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
      demoSettings,
      updateDemoSettings,
      capabilities,
      fsrCalibration,
      isCalibratingFsr,
      calibrateFsr,
      resetFsrCalibration,
      motorStatus,
      isMotorCommandPending,
      sendMotorCommand,
    }),
    [
      status,
      readings,
      connect,
      disconnect,
      subscribe,
      isDemoMode,
      setDemoMode,
      demoSettings,
      updateDemoSettings,
      capabilities,
      fsrCalibration,
      isCalibratingFsr,
      calibrateFsr,
      resetFsrCalibration,
      motorStatus,
      isMotorCommandPending,
      sendMotorCommand,
    ]
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
