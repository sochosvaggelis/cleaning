export const DESIGNS = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'classic', label: '3D island' },
];

/** Floating toggle that swaps the whole home page between the two designs. */
export function DesignSwitch({ design, onChange }) {
  return (
    <div className="design-switch" role="group" aria-label="Website design">
      <span className="design-switch__label">Design</span>
      {DESIGNS.map((d) => (
        <button
          key={d.id}
          type="button"
          className={design === d.id ? 'is-active' : ''}
          aria-pressed={design === d.id}
          onClick={() => onChange(d.id)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
