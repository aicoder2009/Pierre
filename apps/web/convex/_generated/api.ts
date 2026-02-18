/* eslint-disable */
/**
 * Generated Convex API stub.
 *
 * THIS FILE IS A STUB. It provides type-safe API references
 * for use during development without a connected Convex backend.
 */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as conversations from "../conversations";
import type * as messages from "../messages";
import type * as memories from "../memories";
import type * as settings from "../settings";
import type * as agent from "../agent";
import type * as crons from "../crons";
import type * as scheduledActions from "../scheduledActions";

import { anyApi } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 */
declare const fullApi: ApiFromModules<{
  conversations: typeof conversations;
  messages: typeof messages;
  memories: typeof memories;
  settings: typeof settings;
  agent: typeof agent;
  crons: typeof crons;
  scheduledActions: typeof scheduledActions;
}>;

export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as unknown as typeof api;

export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as unknown as typeof internal;
