export default function Button({ children, onClick, disabled, variant = "primary", style = {} }) {
  const variants = {
    primary: {
      background: "#ca992c", color: "#fff", border: "none",
    },
    danger: {
      background: "#941e1e", color: "#fff", border: "none",
    },
    ghost: {
      background: "#f2f6fa", color: "#4a5568", border: "1px solid #e6eef5",
    },
    cancel: {
      background: "#fff", color: "#8fa3b1", border: "1px solid #e6eef5",
    },
  };

  const hover = {
    primary: "#b8881f",
    danger: "#7a1818",
    ghost: "#e6eef5",
    cancel: "#f2f6fa",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.background = hover[variant];
          e.target.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.background = variants[variant].background;
        e.target.style.transform = "translateY(0)";
      }}
      style={{
        ...variants[variant],
        display: "inline-flex", alignItems: "center", gap: "8px",
        padding: "10px 18px", borderRadius: "10px",
        fontSize: "14px", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1, transition: "all 0.15s",
        ...style,
      }}>
      {children}
    </button>
  );
}