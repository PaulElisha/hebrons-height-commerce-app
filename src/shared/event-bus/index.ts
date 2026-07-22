/** @format */

import { Bus } from "./event-bus.ts";

export type { IEventBus, EventContract } from "./types.ts";
export { Bus } from "./event-bus.ts";
export { EventType } from "./config.ts";
export const EventBus = new Bus();
