/** @format */
import { filter, Observable, Subject } from "rxjs";

export interface BrokerEvent {
 userId: string;
 eventType: string;
 data: unknown;
}

class NotificationBroker {
 private notification$ = new Subject<BrokerEvent>();

 public connectToUserEvents(userId: string, data: unknown, eventType: string) {
  this.notification$.next({ userId, data, eventType });
 }

 public listenToUserEvents(
  userId: string,
 ): Observable<Omit<BrokerEvent, "userId">> {
  return this.notification$.pipe(filter((event) => event.userId === userId));
 }
}

export const notificationBroker = new NotificationBroker();
