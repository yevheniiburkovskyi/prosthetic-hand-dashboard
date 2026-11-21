import type { ReactNode } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useBLEContext } from '@/context/BLEContext';
import type { DemoScenario } from '@/lib/demo';

const SCENARIOS: { value: DemoScenario; label: string; hint: string }[] = [
  { value: 'normal', label: 'Normal', hint: 'Realistic everyday values' },
  { value: 'states', label: 'All states', hint: 'Full range, every level' },
];

interface ToggleRowProps {
  id: string;
  label: string;
  description: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  title?: string;
}

const ToggleRow = ({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  title,
}: ToggleRowProps) => (
  <label
    htmlFor={id}
    className="flex cursor-pointer items-center justify-between gap-2"
    title={title}
  >
    <span>
      <span className="block text-sm font-medium">{label}</span>
      <span className="block text-xs text-neutral-500">{description}</span>
    </span>
    <Switch
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
    />
  </label>
);

/** Demo mode switch plus scenario and noise options shown while it's on. */
const DemoControls = () => {
  const { isDemoMode, setDemoMode, demoSettings, updateDemoSettings, status } =
    useBLEContext();
  // Avoid mixing demo data with a live device stream.
  const isDemoToggleDisabled = status !== 'disconnected';
  const activeScenario = SCENARIOS.find(
    (s) => s.value === demoSettings.scenario
  );

  return (
    <div className="flex flex-col gap-4 border-t border-neutral-200 px-4 pt-4">
      <ToggleRow
        id="demo-mode"
        label="Demo mode"
        description="Stream mock sensor data"
        checked={isDemoMode}
        onCheckedChange={setDemoMode}
        disabled={isDemoToggleDisabled}
        title={
          isDemoToggleDisabled
            ? 'Disconnect the device to use demo mode'
            : undefined
        }
      />

      {isDemoMode && (
        <>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Scenario</span>
            <div className="flex gap-1">
              {SCENARIOS.map(({ value, label }) => (
                <Button
                  key={value}
                  size="sm"
                  className="flex-1"
                  variant={
                    demoSettings.scenario === value ? 'default' : 'outline'
                  }
                  aria-pressed={demoSettings.scenario === value}
                  onClick={() => updateDemoSettings({ scenario: value })}
                >
                  {label}
                </Button>
              ))}
            </div>
            <span className="text-xs text-neutral-500">
              {activeScenario?.hint}
            </span>
          </div>

          <ToggleRow
            id="demo-noise"
            label="Sensor noise"
            description="Noisy sensors (above ±2% tolerance) and FSR resting offset"
            checked={demoSettings.noise}
            onCheckedChange={(noise) => updateDemoSettings({ noise })}
          />
        </>
      )}
    </div>
  );
};

export default DemoControls;
