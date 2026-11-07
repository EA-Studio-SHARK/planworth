import { Desktop, Moon, Sun, Translate } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { usePrefs } from "../context/Prefs";
import type { LangPref, ThemePref } from "../i18n";
import { blurStyle, useFaceSwitch } from "../lib/switch-motion";

const LANG_ORDER: LangPref[] = ["auto", "zh", "en"];
const THEME_ORDER: ThemePref[] = ["auto", "light", "dark"];

function CycleChip<T extends string>({
  value,
  order,
  label,
  render,
  onCycle,
}: {
  value: T;
  order: readonly T[];
  label: string;
  render: (value: T) => ReactNode;
  onCycle: (next: T) => void;
}) {
  const { from, p, fromBlur, toBlur } = useFaceSwitch(value);

  return (
    <button
      className="chip-btn"
      type="button"
      title={label}
      aria-label={label}
      onClick={() => {
        const i = order.indexOf(value);
        onCycle(order[(i + 1) % order.length]);
      }}
    >
      {from ? (
        <span className="chip-face" style={blurStyle(fromBlur, 1 - p)}>
          {render(from as T)}
        </span>
      ) : null}
      <span className="chip-face" style={blurStyle(toBlur)}>
        {render(value)}
      </span>
    </button>
  );
}

export function LanguageToggle() {
  const { t, langPref, setLangPref } = usePrefs();

  function optionLabel(value: LangPref) {
    if (value === "auto") return t.langAuto;
    if (value === "zh") return t.langZh;
    return t.langEn;
  }

  return (
    <CycleChip
      value={langPref}
      order={LANG_ORDER}
      label={`${t.language} · ${optionLabel(langPref)}`}
      onCycle={setLangPref}
      render={(value) =>
        value === "zh" ? (
          <span className="chip-letter" aria-hidden>
            中
          </span>
        ) : value === "en" ? (
          <span className="chip-letter" aria-hidden>
            EN
          </span>
        ) : (
          <Translate size={16} weight="regular" />
        )
      }
    />
  );
}

export function ThemeToggle() {
  const { t, themePref, setThemePref } = usePrefs();

  function optionLabel(value: ThemePref) {
    if (value === "auto") return t.themeAuto;
    if (value === "light") return t.themeLight;
    return t.themeDark;
  }

  return (
    <CycleChip
      value={themePref}
      order={THEME_ORDER}
      label={`${t.theme} · ${optionLabel(themePref)}`}
      onCycle={setThemePref}
      render={(value) =>
        value === "auto" ? (
          <Desktop size={16} weight="regular" />
        ) : value === "dark" ? (
          <Moon size={16} weight="regular" />
        ) : (
          <Sun size={16} weight="regular" />
        )
      }
    />
  );
}
