import { PRIORITY_THEMES } from "../theme";

// Priority badge colored by level (High / Medium / Low).
export function PriorityPill({ priority, suffix = "" }) {
  const colors = PRIORITY_THEMES[priority] || {};
  return (
    <span
      className="p-pill"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {priority}
      {suffix}
    </span>
  );
}

// Toggle-button group used for picking priority or category.
export function ChoiceGroup({ options, value, onChange, colorFor }) {
  return (
    <div className="choice-group">
      {options.map((option) => {
        const active = value === option;
        const custom = active && colorFor ? colorFor(option) : null;
        return (
          <button
            key={option}
            type="button"
            className={`choice-btn ${active && !custom ? "active" : ""}`}
            style={
              custom
                ? {
                    backgroundColor: custom.bg,
                    borderColor: custom.text,
                    color: custom.text,
                    fontWeight: 700,
                  }
                : undefined
            }
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
