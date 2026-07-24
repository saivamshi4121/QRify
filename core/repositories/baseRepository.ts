import type { Model, Document } from "mongoose";

/**
 * Enforces workspaceId on every tenant-scoped query.
 */
export class TenantScopedRepository<T extends Document> {
    constructor(private model: Model<T>) {}

    async findByWorkspace(
        workspaceId: string,
        filter: Record<string, unknown> = {}
    ): Promise<T[]> {
        return this.model
            .find({ ...filter, workspaceId })
            .lean()
            .exec() as Promise<T[]>;
    }

    async findOneByWorkspace(
        workspaceId: string,
        filter: Record<string, unknown> = {}
    ): Promise<T | null> {
        return this.model
            .findOne({ ...filter, workspaceId })
            .lean()
            .exec() as Promise<T | null>;
    }
}
