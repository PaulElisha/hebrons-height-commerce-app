/** @format */
import type { Observable } from "rxjs";

import { EventType } from "./config.ts";

export interface EventContract {
 event_type: string;
 payload: any;
}

export interface IEventBus<EventContract> {
 publish(event: EventContract): void;
 on(
  event: (typeof EventType)[keyof typeof EventType],
 ): Observable<EventContract>;
 subscribe(userId: string): Observable<EventContract>;
}
