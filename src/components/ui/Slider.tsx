import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      showValue = true,
      formatValue = (v) => String(v),
      ...props
    },
    ref
  ) => {
    // Calculate percentage for the gradient fill
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className={cn('w-full', className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && (
              <span className="text-sm font-medium text-text">{label}</span>
            )}
            {showValue && (
              <span className="text-sm font-semibold text-coral">
                {formatValue(value)}
              </span>
            )}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            type="range"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            max={max}
            step={step}
            className={cn(
              'w-full h-2 rounded-full appearance-none cursor-pointer',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-coral/30',
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-5',
              '[&::-webkit-slider-thumb]:h-5',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-white',
              '[&::-webkit-slider-thumb]:shadow-md',
              '[&::-webkit-slider-thumb]:border-2',
              '[&::-webkit-slider-thumb]:border-coral',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:transition-transform',
              '[&::-webkit-slider-thumb]:hover:scale-110',
              '[&::-moz-range-thumb]:w-5',
              '[&::-moz-range-thumb]:h-5',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-white',
              '[&::-moz-range-thumb]:shadow-md',
              '[&::-moz-range-thumb]:border-2',
              '[&::-moz-range-thumb]:border-coral',
              '[&::-moz-range-thumb]:cursor-pointer'
            )}
            style={{
              background: `linear-gradient(to right, #FF6B6B 0%, #845EF7 ${percentage}%, #E5E7EB ${percentage}%, #E5E7EB 100%)`,
            }}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
