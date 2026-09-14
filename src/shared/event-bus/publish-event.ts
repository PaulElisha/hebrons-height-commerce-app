/** @format */

import OutboxService from "@module/outbox/outbox.service.ts";
import { EventBroker } from "@shared/event-bus/index.ts";
import type { EventContract } from "@shared/event-bus/types.ts";

export async function publishEvent(event: EventContract) {
 const outboxEvent = await OutboxService.save(event);

 EventBroker.publish({
  event_type: event.event_type,
  payload: { ...event.payload, outboxId: outboxEvent.id },
 });
}
