import type { CSSProperties } from "react";
import type { DeviceType } from "@office/shared";
import { ICONS } from "../assets";

/**
 * Renders the real fan / lightbulb art as a CSS mask so a single monochrome PNG
 * can be tinted (amber when on, slate when off). A separate fill layer sits
 * behind the outline so the body of the bulb / fan lights up too — not just its
 * stroke — since the source art is line-only.
 */
export function DeviceIcon({
  type,
  on,
  size = 22,
  className = "",
}: {
  type: DeviceType;
  on: boolean;
  size?: number;
  className?: string;
}) {
  const wrapStyle = { width: size, height: size } as CSSProperties;
  const iconStyle = { "--ic": `url(${ICONS[type]})` } as CSSProperties;

  return (
    <span
      className={`devwrap devwrap--${type} ${on ? "is-on" : "is-off"} ${className}`}
      style={wrapStyle}
      aria-hidden="true"
    >
      <span className="devwrap__fill" style={iconStyle} />
      <span className="devic" style={iconStyle} />
    </span>
  );
}
