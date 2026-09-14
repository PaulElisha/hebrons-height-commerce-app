/** @format */
import { filter, map, Observable, Subject } from "rxjs";

export interface BrokerEvent {
 userId: string;
 event_type: string;
 data: unknown;
}

class NotificationBroker {
 private notificationTopic$ = new Subject<BrokerEvent>();

 public publish(userId: string, data: unknown, event_type: string) {
  this.notificationTopic$.next({ userId, data, event_type });
 }

 public subscribe(userId: string): Observable<Omit<BrokerEvent, "userId">> {
  return this.notificationTopic$.pipe(
   filter((event) => event.userId === userId),
   map(
    (update): Omit<BrokerEvent, "userId"> => ({
     event_type: update.event_type,
     data: update.data,
    }),
   ),
  );
 }
}

export const notificationBroker = new NotificationBroker();
