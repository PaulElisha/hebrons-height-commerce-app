/** @format */
import logger from "@app/logger.ts";
import { catchError, filter, map, Observable, of, retry, Subject } from "rxjs";

import { EventType } from "./config.ts";
import type {
 EventContract,
 IEventBroker,
 OutboxEventContract,
} from "./types.ts";

export class Broker implements IEventBroker<EventContract> {
 private eventTopic$ = new Subject<EventContract>();

 publish(event: EventContract) {
  this.eventTopic$.next(event);
 }

 subscribe(
  event: (typeof EventType)[keyof typeof EventType],
 ): Observable<OutboxEventContract> {
  return this.eventTopic$.asObservable().pipe(
   filter((update) => update?.event_type === event),
   map(
    (update): OutboxEventContract => ({
     event_type: update.event_type,
     payload: update.payload as OutboxEventContract["payload"],
    }),
   ),
   retry(2),
   catchError((err) => {
    logger.error({ err }, "Communication Error");
    return of({
     event_type: "error",
     payload: { msg: "Communication failed", outboxId: "" },
    } satisfies OutboxEventContract);
   }),
  );
 }

 listen(): Observable<OutboxEventContract> {
  return this.eventTopic$.asObservable().pipe(
   map(
    (update): OutboxEventContract => ({
     event_type: update.event_type,
     payload: update.payload as OutboxEventContract["payload"],
    }),
   ),
   retry(2),
   catchError((err) => {
    logger.error({ err }, "SSE Stream Error");
    return of({
     event_type: "error",
     payload: { msg: "Stream disconnected", outboxId: "" },
    } satisfies OutboxEventContract);
   }),
  );
 }
}
