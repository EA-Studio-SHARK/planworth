import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useId, useRef, useState } from "react";

export type SelectOption<T extends string> = {
  id: T;
  label: string;
  detail?: string;
};

export function SelectMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  empty,
}: {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (id: T) => void;
  empty?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="select-field" ref={rootRef}>
      <span className="select-label">{label}</span>
      <button
        type="button"
        className={`select-trigger ${open ? "is-open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={options.length === 0}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <strong>{current?.label ?? empty ?? "-"}</strong>
          {current?.detail ? <small>{current.detail}</small> : null}
        </span>
        <CaretDown size={14} weight="bold" />
      </button>
      {open && options.length ? (
        <div className="select-menu" id={menuId} role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === value}
              className={option.id === value ? "is-active" : undefined}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
            >
              <strong>{option.label}</strong>
              {option.detail ? <small>{option.detail}</small> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
