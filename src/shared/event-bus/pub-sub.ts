/** @format */
import logger from "@app/logger.ts";
import { catchError, filter, map, Observable, of, retry, Subject } from "rxjs";

import { EventType } from "./config.ts";
import type { EventContract, IEventBroker } from "./types.ts";

export class Broker implements IEventBroker<EventContract> {
 private eventTopic$ = new Subject<EventContract>();

 publish(event: EventContract) {
  this.eventTopic$.next(event);
 }

 subscribe(
  event: (typeof EventType)[keyof typeof EventType],
 ): Observable<EventContract> {
  return this.eventTopic$.asObservable().pipe(
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
    } satisfies EventContract);
   }),
  );
 }
}
