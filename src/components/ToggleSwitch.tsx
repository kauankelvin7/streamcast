import type { FC } from 'react';

type ToggleSwitchProps = {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  icon?: React.ReactNode;
};

const ToggleSwitch: FC<ToggleSwitchProps> = ({ label, enabled, onChange, icon }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer bg-secondary/20 hover:bg-secondary/30 border border-primary/20 p-4 rounded-xl transition-all duration-200">
      <div className="flex items-center gap-3">
        {icon && <span className="text-primary">{icon}</span>}
        <span className="font-semibold text-white">{label}</span>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-secondary'}`}></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${
            enabled ? 'transform translate-x-full' : ''
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
