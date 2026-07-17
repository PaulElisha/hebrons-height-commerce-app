/** @format */
import { catchError, filter, map, Observable, of, retry } from "rxjs";

import eventBus$, { EventContract, EventType } from "./config.ts";

export const onEvent = <T extends EventContract>(
 event: (typeof EventType)[keyof typeof EventType],
): Observable<T> => {
 return (eventBus$.asObservable() as Observable<EventContract>).pipe(
  filter((update) => update?.event_type === event),
  map(
   (update): T =>
    ({
     event_type: update.event_type,
     payload: update.payload,
    }) as T,
  ),
  retry(2),
  catchError((err) => {
   console.error("Communication Error:", err);
   return of({
    event_type: "error" as const,
    payload: { msg: "Communication failed" },
   } as T);
  }),
 );
};
