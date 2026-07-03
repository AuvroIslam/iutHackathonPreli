/**
 * Central asset registry. The room renders, device glyphs and the city
 * backdrop are real image assets shipped in `dashboard/assets/` and imported
 * here so every component references one resolved URL. Vite fingerprints and
 * serves them.
 */
import checked from "../assets/checked.png";
import fan from "../assets/fan.png";
import lightbulb from "../assets/lightbulb.png";
import officeHourBg from "../assets/OfficeHourBg.png";
import lighting from "../assets/lighting.png";
import powerPlug from "../assets/power-plug.png";
import room1 from "../assets/room1.png";
import room2 from "../assets/room2.png";
import room3 from "../assets/room3.png";
import type { DeviceType, RoomId } from "@office/shared";

/** Device glyph keyed by the shared DeviceType ("fan" | "light"). */
export const ICONS: Record<DeviceType, string> = { fan, light: lightbulb };
export const OFFICE_HOUR_BG = officeHourBg;

/** Brand art: the power plug is the app's main logo; lightning marks energy. */
export const LOGO = { plug: powerPlug, lightning: lighting } as const;

/** Black check disc (transparent tick) used for the all-clear state. */
export const CHECK_MARK = checked;

/** Top-view render behind each room on the floorplan. */
export const ROOM_IMAGES: Record<RoomId, string> = {
  drawing: room1,
  work1: room2,
  work2: room3,
};
