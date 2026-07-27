import { logger } from "@/lib/logger";
import {
    NotificationChannel,
    NotificationProviderId,
    type NotificationChannelValue,
} from "@/modules/notifications/constants";
import type {
    NotificationProvider,
    ProviderSendInput,
    SendResult,
} from "@/modules/notifications/types";

/**
 * Local/dev provider — logs to console, never calls external APIs.
 */
export class ConsoleProvider implements NotificationProvider {
    readonly id = NotificationProviderId.CONSOLE;

    supports(channel: NotificationChannelValue): boolean {
        return (
            channel === NotificationChannel.EMAIL ||
            channel === NotificationChannel.SMS ||
            channel === NotificationChannel.WHATSAPP
        );
    }

    async send(input: ProviderSendInput): Promise<SendResult> {
        const messageId = `console_${Date.now()}`;
        logger.info(
            `[ConsoleProvider] ${input.channel} → ${input.recipient}`,
            {
                subject: input.subject,
                contentPreview: input.content.slice(0, 200),
                messageId,
            }
        );
        // Also emit to stdout for local visibility
        console.info(
            `[Qrezo Notification:${input.channel}] to=${input.recipient} subject=${input.subject}`
        );
        console.info(input.content.slice(0, 500));
        return { success: true, providerMessageId: messageId };
    }
}

let activeProvider: NotificationProvider = new ConsoleProvider();

/** Swap providers without touching business logic. */
export function setNotificationProvider(provider: NotificationProvider) {
    activeProvider = provider;
}

export function getNotificationProvider(): NotificationProvider {
    return activeProvider;
}

export function resolveProviderForChannel(
    channel: NotificationChannelValue
): NotificationProvider {
    const provider = getNotificationProvider();
    if (!provider.supports(channel)) {
        throw new Error(
            `Provider ${provider.id} does not support channel ${channel}`
        );
    }
    return provider;
}
