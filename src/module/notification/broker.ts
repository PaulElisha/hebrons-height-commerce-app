/** @format */
import { filter, Observable, Subject } from "rxjs";

export interface BrokerEvent {
 userId: string;
 eventType: string;
 data: unknown;
}

class NotificationBroker {
 private notificationTopic$ = new Subject<BrokerEvent>();

 public publish(userId: string, data: unknown, eventType: string) {
  this.notificationTopic$.next({ userId, data, eventType });
 }

 public subscribe(userId: string): Observable<Omit<BrokerEvent, "userId">> {
  return this.notificationTopic$.pipe(
   filter((event) => event.userId === userId),
  );
 }
}

export const notificationBroker = new NotificationBroker();
