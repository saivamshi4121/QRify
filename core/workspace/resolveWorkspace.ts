import { cookies } from "next/headers";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/config/dbConnect";
import Workspace from "@/models/Workspace";
import WorkspaceMember, { WorkspaceRole } from "@/models/WorkspaceMember";
import { ACTIVE_WORKSPACE_COOKIE } from "@/modules/workspace/constants";
import { ensureDefaultWorkspace } from "@/modules/workspace/service";
import { UnauthorizedError, ForbiddenError } from "@/core/errors/AppError";

export type ResolvedWorkspace = {
    userId: string;
    workspaceId: string;
    role: WorkspaceRole;
    workspaceName: string;
};

/**
 * Resolve active workspace from session + activeWorkspaceId cookie.
 * Cookie is the single client source of truth; falls back to default workspace.
 */
export async function resolveWorkspace(): Promise<ResolvedWorkspace> {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        throw new UnauthorizedError("Unauthorized");
    }

    const userId = session.user.id;
    await dbConnect();

    const defaults = await ensureDefaultWorkspace(userId);

    const cookieStore = await cookies();
    const cookieWorkspaceId = cookieStore.get(ACTIVE_WORKSPACE_COOKIE)?.value;

    let workspaceId = defaults.workspaceId;

    if (
        cookieWorkspaceId &&
        mongoose.Types.ObjectId.isValid(cookieWorkspaceId)
    ) {
        const membership = await WorkspaceMember.findOne({
            workspaceId: cookieWorkspaceId,
            userId,
        });

        if (membership) {
            const workspace = await Workspace.findById(cookieWorkspaceId);
            if (workspace) {
                return {
                    userId,
                    workspaceId: workspace._id.toString(),
                    role: membership.role,
                    workspaceName: workspace.name,
                };
            }
        }
        // Invalid/stale cookie â†’ fall through to default
    }

    const membership = await WorkspaceMember.findOne({
        workspaceId,
        userId,
    });

    if (!membership) {
        throw new ForbiddenError("You do not have access to this workspace");
    }

    return {
        userId,
        workspaceId,
        role: membership.role,
        workspaceName: defaults.name,
    };
}
