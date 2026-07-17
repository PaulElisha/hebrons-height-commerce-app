/** @format */
import { catchError, filter, map, Observable, of, retry } from "rxjs";

import eventBus$, { EventContract } from "./config.ts";
export const onSubscribe = <T extends EventContract>(
 userId: string,
): Observable<T> => {
 return (eventBus$.asObservable() as Observable<EventContract>).pipe(
  filter((update) => update?.payload?.userId === Number(userId)),
  map(
   (update): T =>
    ({
     event_type: update.event_type,
     payload: update.payload,
    }) as T,
  ),
  retry(2),
  catchError((err) => {
   console.error("SSE Stream Error:", err);
   return of({
    event_type: "error" as const,
    payload: { msg: "Stream disconnected" },
   } as T);
  }),
 );
};
