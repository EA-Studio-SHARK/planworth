import { CaretDown, Check, MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export type BrandOption = {
  id: string;
  label: string;
  /** Second line under the label, e.g. a price. */
  detail?: string;
  /** Right-aligned extra on menu rows. */
  aside?: string;
  icon?: ReactNode;
  group?: string;
  tag?: string;
};

/** Dropdown with brand icons, groups, and an optional search box for long lists. */
export function BrandSelect({
  label,
  value,
  options,
  onChange,
  searchPlaceholder,
  emptyText,
}: {
  label: string;
  value: string;
  options: BrandOption[];
  onChange: (id: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = options.find((o) => o.id === value);
  const searchable = Boolean(searchPlaceholder) && options.length > 8;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.id} ${o.group ?? ""}`.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, visible.findIndex((o) => o.id === value)));
    if (searchable) searchRef.current?.focus({ preventScroll: true });
    function onPointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
    // Reset the highlight only when the menu opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function onKey(event: KeyboardEvent) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[active];
      if (option) choose(option.id);
    }
  }

  let lastGroup: string | undefined;

  return (
    <div className={`bsel ${open ? "is-open" : ""}`} ref={rootRef} onKeyDown={onKey}>
      <span className="bsel-label">{label}</span>
      <button
        type="button"
        className="bsel-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        disabled={!options.length}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.icon ? <span className="bsel-icon">{current.icon}</span> : null}
        <span className="bsel-text">
          <strong>{current?.label ?? emptyText ?? "—"}</strong>
          {current?.detail ? <small>{current.detail}</small> : null}
        </span>
        <CaretDown size={16} weight="bold" className="bsel-caret" />
      </button>

      {open ? (
        <div className="bsel-menu">
          {searchable ? (
            <label className="bsel-search">
              <MagnifyingGlass size={16} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
            </label>
          ) : null}
          <div className="bsel-list" id={menuId} role="listbox" aria-label={label} ref={listRef}>
            {visible.map((option, index) => {
              const header = option.group && option.group !== lastGroup ? option.group : null;
              lastGroup = option.group;
              return (
                <div key={option.id}>
                  {header ? <div className="bsel-group">{header}</div> : null}
                  <button
                    type="button"
                    role="option"
                    data-index={index}
                    aria-selected={option.id === value}
                    className={`bsel-option ${index === active ? "is-active" : ""} ${option.id === value ? "is-on" : ""}`}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => choose(option.id)}
                  >
                    {option.icon ? <span className="bsel-icon">{option.icon}</span> : null}
                    <span className="bsel-text">
                      <strong>
                        {option.label}
                        {option.tag ? <em>{option.tag}</em> : null}
                      </strong>
                      {option.detail ? <small>{option.detail}</small> : null}
                    </span>
                    {option.aside ? <span className="bsel-aside">{option.aside}</span> : null}
                    <Check size={16} weight="bold" className="bsel-check" />
                  </button>
                </div>
              );
            })}
            {!visible.length ? <p className="bsel-empty">—</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
