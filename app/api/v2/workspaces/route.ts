import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    ensureDefaultWorkspace,
    listUserWorkspaces,
} from "@/modules/workspace/service";
import { createWorkspaceSchema } from "@/modules/workspace/validation";
import { handleApiError } from "@/core/errors/handleApiError";
import { UnauthorizedError } from "@/core/errors/AppError";
import dbConnect from "@/config/dbConnect";
import Workspace from "@/models/Workspace";
import WorkspaceMember from "@/models/WorkspaceMember";
import crypto from "crypto";

function slugifyBase(input: string): string {
    const base = input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
    return base || "workspace";
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const workspaces = await listUserWorkspaces(session.user.id);
        const defaults = await ensureDefaultWorkspace(session.user.id);

        return NextResponse.json({
            success: true,
            data: {
                workspaces,
                defaultWorkspaceId: defaults.workspaceId,
            },
        });
    } catch (error) {
        return handleApiError(error, "List Workspaces Error");
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            throw new UnauthorizedError("Unauthorized");
        }

        const body = await request.json();
        const { name } = createWorkspaceSchema.parse(body);

        await dbConnect();
        await ensureDefaultWorkspace(session.user.id);

        let slug = slugifyBase(name);
        const existing = await Workspace.findOne({ slug }).select("_id").lean();
        if (existing) {
            slug = `${slug}-${crypto.randomBytes(3).toString("hex")}`;
        }

        const workspace = await Workspace.create({
            name,
            slug,
            ownerId: session.user.id,
            planTier: "free",
        });

        await WorkspaceMember.create({
            workspaceId: workspace._id,
            userId: session.user.id,
            role: "owner",
        });

        return NextResponse.json(
            {
                success: true,
                data: {
                    workspaceId: workspace._id.toString(),
                    name: workspace.name,
                    slug: workspace.slug,
                    role: "owner" as const,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        return handleApiError(error, "Create Workspace Error");
    }
}
