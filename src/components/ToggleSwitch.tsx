import type { FC } from 'react';

type ToggleSwitchProps = {
  label: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  icon?: React.ReactNode;
};

const ToggleSwitch: FC<ToggleSwitchProps> = ({ label, enabled, onChange, icon }) => {
  return (
    <label className="flex items-center justify-between cursor-pointer bg-gray-800/20 hover:bg-gray-800/30 border border-gray-600/20 p-4 rounded-xl">
      <div className="flex items-center gap-3">
        {icon && <span className="text-gray-400">{icon}</span>}
        <span className="font-semibold text-white">{label}</span>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={enabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`block w-12 h-7 rounded-full ${enabled ? 'bg-gray-600' : 'bg-gray-800'}`}></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full ${
            enabled ? 'transform translate-x-full' : ''
          }`}
        ></div>
      </div>
    </label>
  );
};

export default ToggleSwitch;
