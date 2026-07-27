import { NextResponse } from "next/server";
import { resolveWorkspace } from "@/core/workspace/resolveWorkspace";
import { handleApiError } from "@/core/errors/handleApiError";
import { assertCanManageEvents } from "@/modules/event/service";
import { updateDeviceGateSchema } from "@/modules/scanner-device/validation";
import { updateScannerDeviceGate } from "@/modules/scanner-device/service";

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
        const input = updateDeviceGateSchema.parse(body);
        const data = await updateScannerDeviceGate({
            workspaceId,
            eventId,
            devicePublicId: deviceId,
            gate: input.gate,
        });
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return handleApiError(error, "Update Scanner Gate Error");
    }
}
