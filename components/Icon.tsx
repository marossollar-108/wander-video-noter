"use client";

export default function Icon({
  name,
  size = 20,
  className = "",
  style = {},
}: {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, lineHeight: 1, ...style }}
    >
      {name}
    </span>
  );
}
