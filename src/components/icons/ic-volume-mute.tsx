import type { IconProps } from "./icon.types";

export function VolumeMuteIcon({
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
        d="M11 5 6 9H2v6h4l5 4V5Z"
        stroke={iconColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m23 9-6 6M17 9l6 6"
        stroke={iconColor}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
