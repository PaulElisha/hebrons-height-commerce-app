/** @format */
import { catchError, filter, map, Observable, of, retry } from "rxjs";

import eventBus$, { EventContract, EventType } from "./config.ts";

export const onEvent = (
 event: (typeof EventType)[keyof typeof EventType],
): Observable<EventContract> => {
 return eventBus$.asObservable().pipe(
  filter((update) => update?.event_type === event),
  map((update): EventContract => ({
   event_type: update.event_type,
   payload: update.payload,
  })),
  retry(2),
  catchError((err) => {
   console.error("Communication Error:", err);
   return of({
    event_type: "error",
    payload: { msg: "Communication failed" },
   });
  }),
 );
};
