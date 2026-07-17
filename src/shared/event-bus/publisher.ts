/** @format */
import eventBus$, { EventContract } from "./config.ts";
export const PublishEvent = (payload: EventContract) => {
 eventBus$.next(payload);
};
