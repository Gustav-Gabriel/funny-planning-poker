import type { IconProps } from "./icon.types";

export function TrashIcon({
  className,
  height = 20,
  width = 20,
  color,
  fill,
}: IconProps) {
  const iconColor = color ?? fill ?? "currentColor";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={width}
      height={height}
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", background: "transparent" }}
    >
      <path
        d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
        stroke={iconColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke={iconColor}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
