/** @format */
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
    console.error("Communication Error:", err);
    return of({
     event_type: "error",
     payload: { msg: "Communication failed" },
    });
   }),
  );
 }

 subscribe(userId: string): Observable<EventContract> {
  return this.eventBus$.asObservable().pipe(
   filter(
    (update) =>
     update?.payload?.userId === userId ||
     update?.payload?.merchantId === userId,
   ),
   map(
    (update): EventContract => ({
     event_type: update.event_type,
     payload: update.payload,
    }),
   ),
   retry(2),
   catchError((err) => {
    console.error("SSE Stream Error:", err);
    return of({
     event_type: "error",
     payload: { msg: "Stream disconnected" },
    });
   }),
  );
 }
}
