import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { renameDeviceSchema } from "@/modules/scanner-device/validation";
import {
    renameScannerDevice,
    revokeScannerDevice,
} from "@/modules/scanner-device/service";

type RouteParams = {
    params:
        | Promise<{ eventId: string; deviceId: string }>
        | { eventId: string; deviceId: string };
};

async function resolveIds(params: RouteParams["params"]) {
    const resolved = params instanceof Promise ? await params : params;
    return {
        eventId: resolved.eventId,
        deviceId: resolved.deviceId,
    };
}

export async function PATCH(request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, deviceId } = await resolveIds(params);
        const body = await request.json();
        const input = renameDeviceSchema.parse(body);
        const data = await renameScannerDevice({
            workspaceId,
            eventId,
            devicePublicId: deviceId,
            name: input.name,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Rename Scanner Device Error");
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    try {
        const { workspaceId, role } = await resolveWorkspace();
        assertCanManageEvents(role);
        const { eventId, deviceId } = await resolveIds(params);
        const data = await revokeScannerDevice({
            workspaceId,
            eventId,
            devicePublicId: deviceId,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Revoke Scanner Device Error");
    }
}
