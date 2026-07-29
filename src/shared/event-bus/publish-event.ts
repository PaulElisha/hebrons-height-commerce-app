/** @format */

import OutboxService from "@module/outbox/outbox.service.ts";
import { EventBus } from "@shared/event-bus/index.ts";
import type { EventContract } from "@shared/event-bus/types.ts";

export async function publishEvent(event: EventContract) {
 await Promise.all([await OutboxService.save(event), EventBus.publish(event)]);
}
