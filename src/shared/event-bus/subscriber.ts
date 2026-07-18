/** @format */
import { catchError, filter, map, Observable, of, retry } from "rxjs";

import eventBus$, { EventContract } from "./config.ts";

export const onSubscribe = (
 userId: string,
): Observable<EventContract> => {
 return eventBus$.asObservable().pipe(
  filter((update) => update?.payload?.userId === userId),
  map((update): EventContract => ({
   event_type: update.event_type,
   payload: update.payload,
  })),
  retry(2),
  catchError((err) => {
   console.error("SSE Stream Error:", err);
   return of({
    event_type: "error",
    payload: { msg: "Stream disconnected" },
   });
  }),
 );
};
