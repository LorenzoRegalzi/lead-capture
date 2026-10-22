import { useId, type InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export default function TextField({ label, className = "", ...props }: TextFieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={id}
        placeholder={label}
        className={`min-h-12 rounded-lg border border-line px-3 text-lg text-ink focus:outline-none focus:ring-2 focus:ring-primary ${className}`}
        {...props}
      />
    </div>
  );
}
