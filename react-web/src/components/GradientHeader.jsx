// Reusable premium header block with the ink gradient.
export default function GradientHeader({ title, subtitle, Icon }) {
  return (
    <div className="gradient-header">
      <div className="flex-1">
        <h1 className="gradient-title">{title}</h1>
        {subtitle ? <p className="gradient-subtitle">{subtitle}</p> : null}
      </div>
      {Icon ? (
        <div className="gradient-icon-wrap">
          <Icon size={26} color="#FFFFFF" />
        </div>
      ) : null}
    </div>
  );
}
