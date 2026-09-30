import type { IconProps } from "./icon.types";

export function CopyIcon({
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
      <rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke={iconColor}
        strokeWidth="1.75"
      />
      <path
        d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
        stroke={iconColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
