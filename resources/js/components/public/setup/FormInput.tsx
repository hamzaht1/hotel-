import React from "react";

type Props = {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  required?: boolean;
  error?: string | null;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>["inputMode"];
  type?: "text" | "email" | "password";
  // Optional fixed prefix shown to the left of the field (e.g. "+966").
  prefix?: string;
};

export default function FormInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  required,
  error,
  inputMode,
  type = "text",
  prefix,
}: Props) {
  const inputBase =
    "h-12 w-full bg-gray-100 px-4 text-start text-gray-900 placeholder:text-gray-500 outline-none ring-0 focus:bg-white focus:ring-2 focus:ring-public-primary/30 placeholder:transition-opacity focus:placeholder:opacity-0";

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="mb-2 text-start text-sm font-semibold text-gray-900"
      >
        {label}
      </label>

      {prefix ? (
        <div
          dir="ltr"
          className="flex h-12 overflow-hidden rounded-xl bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-public-primary/30"
        >
          <span className="flex select-none items-center bg-gray-200 px-4 font-semibold text-gray-700">
            {prefix}
          </span>
          <input
            id={id}
            type={type}
            inputMode={inputMode}
            required={required}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            className="h-12 w-full flex-1 bg-transparent px-4 text-start text-gray-900 placeholder:text-gray-500 outline-none ring-0"
          />
        </div>
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`${inputBase} rounded-xl`}
        />
      )}

      {error ? (
        <div className="mt-1 text-[12px] font-semibold text-red-600">{error}</div>
      ) : null}
    </div>
  );
}
