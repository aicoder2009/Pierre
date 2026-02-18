import {
  queryGeneric,
  mutationGeneric,
  actionGeneric,
  internalQueryGeneric,
  internalMutationGeneric,
  internalActionGeneric,
  httpActionGeneric,
  type QueryBuilder,
  type MutationBuilder,
  type ActionBuilder,
  type HttpActionBuilder,
} from "convex/server";
import type { DataModel } from "./dataModel";

export const query = queryGeneric as QueryBuilder<DataModel, "public">;
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
export const action = actionGeneric as ActionBuilder<DataModel, "public">;
export const internalQuery = internalQueryGeneric as QueryBuilder<DataModel, "internal">;
export const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, "internal">;
export const internalAction = internalActionGeneric as ActionBuilder<DataModel, "internal">;
export const httpAction = httpActionGeneric as HttpActionBuilder;
