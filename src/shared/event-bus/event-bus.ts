/** @format */
import logger from "@app/logger.ts";
import { catchError, filter, map, Observable, of, retry, Subject } from "rxjs";

import { EventType } from "./config.ts";
import type { EventContract, IEventBus } from "./types.ts";

export class Bus implements IEventBus<EventContract> {
 private eventBus$ = new Subject<EventContract>();

 publish(event: EventContract) {
  this.eventBus$.next(event);
 }

 on(
  event: (typeof EventType)[keyof typeof EventType],
 ): Observable<EventContract> {
  return this.eventBus$.asObservable().pipe(
   filter((update) => update?.event_type === event),
   map(
    (update): EventContract => ({
     event_type: update.event_type,
     payload: update.payload,
    }),
   ),
   retry(2),
   catchError((err) => {
    logger.error({ err }, "Communication Error");
    return of({
     event_type: "error",
     payload: { msg: "Communication failed" },
    });
   }),
  );
 }

 subscribe(): Observable<EventContract> {
  return this.eventBus$.asObservable().pipe(
   map(
    (update): EventContract => ({
     event_type: update.event_type,
     payload: update.payload,
    }),
   ),
   retry(2),
   catchError((err) => {
    logger.error({ err }, "SSE Stream Error");
    return of({
     event_type: "error",
     payload: { msg: "Stream disconnected" },
    });
   }),
  );
 }
}
