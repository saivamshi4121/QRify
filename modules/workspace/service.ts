import crypto from "crypto";
import mongoose from "mongoose";
import dbConnect from "@/config/dbConnect";
import User from "@/models/User";
import Workspace from "@/models/Workspace";
import WorkspaceMember, { WorkspaceRole } from "@/models/WorkspaceMember";

function slugifyBase(input: string): string {
    const base = input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40);
    return base || "workspace";
}

async function uniqueSlug(base: string): Promise<string> {
    let slug = slugifyBase(base);
    let attempt = 0;

    while (attempt < 10) {
        const existing = await Workspace.findOne({ slug }).select("_id").lean();
        if (!existing) return slug;
        const suffix = crypto.randomBytes(3).toString("hex");
        slug = `${slugifyBase(base)}-${suffix}`;
        attempt += 1;
    }

    return `${slugifyBase(base)}-${Date.now().toString(36)}`;
}

export type DefaultWorkspaceResult = {
    workspaceId: string;
    role: WorkspaceRole;
    name: string;
    slug: string;
};

/**
 * Backfill QRs missing workspaceId for this user.
 * Uses the native collection so stale Mongoose schemas cannot strip the field.
 */
async function backfillUserQrWorkspace(
    userId: string | mongoose.Types.ObjectId,
    workspaceId: mongoose.Types.ObjectId
) {
    await dbConnect();
    await mongoose.connection.collection("qrcodes").updateMany(
        {
            userId: new mongoose.Types.ObjectId(String(userId)),
            $or: [
                { workspaceId: { $exists: false } },
                { workspaceId: null },
            ],
        },
        { $set: { workspaceId } }
    );
}

/**
 * Idempotent: create a personal default workspace + owner membership,
 * backfill orphan QRs, and set User.defaultWorkspaceId.
 */
export async function ensureDefaultWorkspace(
    userId: string
): Promise<DefaultWorkspaceResult> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    if (user.defaultWorkspaceId) {
        const membership = await WorkspaceMember.findOne({
            workspaceId: user.defaultWorkspaceId,
            userId,
        });
        const workspace = await Workspace.findById(user.defaultWorkspaceId);

        if (membership && workspace) {
            await backfillUserQrWorkspace(userId, workspace._id as mongoose.Types.ObjectId);

            return {
                workspaceId: workspace._id.toString(),
                role: membership.role,
                name: workspace.name,
                slug: workspace.slug,
            };
        }
    }

    // Prefer an existing owner membership if defaultWorkspaceId is missing/stale
    const existingOwner = await WorkspaceMember.findOne({
        userId,
        role: "owner",
    }).sort({ createdAt: 1 });

    if (existingOwner) {
        const workspace = await Workspace.findById(existingOwner.workspaceId);
        if (workspace) {
            user.defaultWorkspaceId = workspace._id;
            await user.save();

            await backfillUserQrWorkspace(userId, workspace._id as mongoose.Types.ObjectId);

            return {
                workspaceId: workspace._id.toString(),
                role: existingOwner.role,
                name: workspace.name,
                slug: workspace.slug,
            };
        }
    }

    const displayName = user.name?.trim() || user.email.split("@")[0] || "My";
    const name = `${displayName}'s Workspace`;
    const slug = await uniqueSlug(displayName);

    const workspace = await Workspace.create({
        name,
        slug,
        ownerId: user._id,
        planTier: user.subscriptionPlan || "free",
    });

    await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: user._id,
        role: "owner",
    });

    user.defaultWorkspaceId = workspace._id;
    await user.save();

    await backfillUserQrWorkspace(userId, workspace._id as mongoose.Types.ObjectId);

    return {
        workspaceId: workspace._id.toString(),
        role: "owner",
        name: workspace.name,
        slug: workspace.slug,
    };
}

export async function listUserWorkspaces(userId: string) {
    await dbConnect();
    const defaults = await ensureDefaultWorkspace(userId);

    const memberships = await WorkspaceMember.find({ userId })
        .sort({ createdAt: 1 })
        .lean();

    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await Workspace.find({
        _id: { $in: workspaceIds },
    }).lean();

    const workspaceMap = new Map(
        workspaces.map((w) => [w._id.toString(), w])
    );

    return memberships
        .map((m) => {
            const workspace = workspaceMap.get(m.workspaceId.toString());
            if (!workspace) return null;
            const workspaceId = workspace._id.toString();
            return {
                workspaceId,
                name: workspace.name,
                slug: workspace.slug,
                role: m.role as WorkspaceRole,
                planTier: workspace.planTier,
                isDefault: workspaceId === defaults.workspaceId,
            };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
}
