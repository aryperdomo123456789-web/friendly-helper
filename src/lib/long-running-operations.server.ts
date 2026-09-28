import { createObservationId } from "./worker-observability.server";
import {
  getLongOperationPollDelay,
  isTerminalLongOperationState,
  type LongOperationStage,
  type LongOperationState,
} from "./long-operation";

export const REFRESH_OPERATION_TYPE = "refresh_server_catalog" as const;
export const REFRESH_OPERATION_RETENTION_DAYS = 30;

export type RefreshOperationRow = {
  id: string;
  operation_ref: string;
  operation_type: typeof REFRESH_OPERATION_TYPE;
  server_id: string;
  requested_by: string | null;
  status: LongOperationState;
  stage: LongOperationStage;
  progress_percent: number | null;
  request_payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error: Record<string, unknown>;
  worker_ref: string | null;
  attempt_count: number;
  started_at: string;
  last_heartbeat_at: string | null;
  cancel_requested_at: string | null;
  completed_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export type RefreshOperationResult = {
  source?: "m3u" | "xtream";
  kinds?: Partial<Record<"live" | "movie" | "series", { categories: number; streams: number }>>;
};

export type RefreshOperationStatus = {
  operation_ref: string;
  operation_state: LongOperationState;
  operation_stage: LongOperationStage;
  progress_percent: number | null;
  elapsed_ms: number;
  done: boolean;
  result: RefreshOperationResult;
  error: { code: string; message: string } | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  cancel_requested_at: string | null;
};

type DynamicOperationQuery = {
  select: (columns: string) => DynamicOperationQuery;
  eq: (column: string, value: unknown) => DynamicOperationQuery;
  in: (column: string, values: unknown[]) => DynamicOperationQuery;
  order: (column: string, options: { ascending: boolean }) => DynamicOperationQuery;
  limit: (count: number) => DynamicOperationQuery;
  insert: (values: Record<string, unknown>) => any;
  update: (values: Record<string, unknown>) => any;
  maybeSingle: () => Promise<{ data?: unknown; error: unknown | null }>;
};

type DynamicOperationClient = {
  from: (table: string) => DynamicOperationQuery;
  rpc: (
    functionName: string,
    params: Record<string, unknown>,
  ) => Promise<{ data?: unknown; error: unknown | null }>;
};

function isConflictError(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asOperationRow(value: unknown): RefreshOperationRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (
    typeof row["id"] !== "string" ||
    typeof row["operation_ref"] !== "string" ||
    typeof row["server_id"] !== "string" ||
    typeof row["status"] !== "string" ||
    typeof row["stage"] !== "string"
  ) {
    return null;
  }
  return {
    id: row["id"],
    operation_ref: row["operation_ref"],
    operation_type: REFRESH_OPERATION_TYPE,
    server_id: row["server_id"],
    requested_by: typeof row["requested_by"] === "string" ? row["requested_by"] : null,
    status: row["status"] as LongOperationState,
    stage: row["stage"] as LongOperationStage,
    progress_percent: typeof row["progress_percent"] === "number" ? row["progress_percent"] : null,
    request_payload: asRecord(row["request_payload"]),
    result: asRecord(row["result"]),
    error: asRecord(row["error"]),
    worker_ref: typeof row["worker_ref"] === "string" ? row["worker_ref"] : null,
    attempt_count: typeof row["attempt_count"] === "number" ? row["attempt_count"] : 0,
    started_at:
      typeof row["started_at"] === "string" ? row["started_at"] : new Date().toISOString(),
    last_heartbeat_at:
      typeof row["last_heartbeat_at"] === "string" ? row["last_heartbeat_at"] : null,
    cancel_requested_at:
      typeof row["cancel_requested_at"] === "string" ? row["cancel_requested_at"] : null,
    completed_at: typeof row["completed_at"] === "string" ? row["completed_at"] : null,
    expires_at:
      typeof row["expires_at"] === "string" ? row["expires_at"] : new Date().toISOString(),
    created_at:
      typeof row["created_at"] === "string" ? row["created_at"] : new Date().toISOString(),
    updated_at:
      typeof row["updated_at"] === "string" ? row["updated_at"] : new Date().toISOString(),
  };
}

async function getSupabaseAdmin(): Promise<DynamicOperationClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as DynamicOperationClient;
}

function sanitizeEventDetails(details: Record<string, unknown>) {
  const allowedKeys = new Set([
    "kind",
    "source",
    "duration_ms",
    "item_count",
    "categories",
    "streams",
    "clear_local_before_fetch",
    "reason",
  ]);
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!allowedKeys.has(key)) continue;
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      safe[key] = typeof value === "string" ? value.slice(0, 120) : value;
    }
  }
  return safe;
}

async function recordOperationEvent(
  operationId: string,
  status: LongOperationState,
  stage: LongOperationStage,
  progressPercent: number | null,
  details: Record<string, unknown> = {},
) {
  try {
    const supabaseAdmin = await getSupabaseAdmin();
    const { error } = await supabaseAdmin.from("long_running_operation_events").insert({
      operation_id: operationId,
      status,
      stage,
      progress_percent: progressPercent,
      details: sanitizeEventDetails(details),
    });
    if (error) console.warn("Falha ao registrar evento de operação longa", { error });
  } catch (error) {
    console.warn("Falha ao registrar evento de operação longa", { error });
  }
}

function elapsedMs(row: RefreshOperationRow, now = Date.now()) {
  const startedAt = new Date(row.started_at).getTime();
  return Number.isFinite(startedAt) ? Math.max(0, now - startedAt) : 0;
}

function sanitizeOperationResult(value: Record<string, unknown>): RefreshOperationResult {
  const safe: RefreshOperationResult = {};
  if (value["source"] === "m3u" || value["source"] === "xtream") safe.source = value["source"];
  if (value["kinds"] && typeof value["kinds"] === "object" && !Array.isArray(value["kinds"])) {
    const safeKinds: Partial<RefreshOperationResult["kinds"]> = {};
    for (const kind of ["live", "movie", "series"] as const) {
      const item = (value["kinds"] as Record<string, unknown>)[kind];
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const categories = (item as Record<string, unknown>)["categories"];
      const streams = (item as Record<string, unknown>)["streams"];
      if (typeof categories === "number" && typeof streams === "number") {
        safeKinds[kind] = {
          categories: Math.max(0, Math.floor(categories)),
          streams: Math.max(0, Math.floor(streams)),
        };
      }
    }
    if (Object.keys(safeKinds).length > 0) safe.kinds = safeKinds;
  }
  return safe;
}

function toStatus(row: RefreshOperationRow): RefreshOperationStatus {
  const errorCode =
    typeof row.error["code"] === "string" ? row.error["code"].slice(0, 60) : "OPERATION_FAILED";
  const errorMessage =
    typeof row.error["message"] === "string"
      ? row.error["message"].slice(0, 240)
      : "A operação não foi concluída.";
  const result = sanitizeOperationResult(row.result);
  return {
    operation_ref: row.operation_ref,
    operation_state: row.status,
    operation_stage: row.stage,
    progress_percent: row.progress_percent,
    elapsed_ms: elapsedMs(row),
    done: isTerminalLongOperationState(row.status),
    result,
    error: Object.keys(row.error).length > 0 ? { code: errorCode, message: errorMessage } : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    completed_at: row.completed_at,
    cancel_requested_at: row.cancel_requested_at,
  };
}

export function getRefreshOperationPollDelayForAttempt(attempt: number) {
  return getLongOperationPollDelay(attempt);
}

export async function createRefreshOperation(
  serverId: string,
  requestedBy: string | null,
  options: { clearLocalBeforeFetch?: boolean; initialStatus?: "pending" | "running" } = {},
) {
  const supabaseAdmin = await getSupabaseAdmin();
  const now = new Date();
  const operationRef = createObservationId();
  const { data, error } = await supabaseAdmin
    .from("long_running_operations")
    .insert({
      operation_ref: operationRef,
      operation_type: REFRESH_OPERATION_TYPE,
      server_id: serverId,
      requested_by: requestedBy,
      status: options.initialStatus ?? "running",
      stage: "queued",
      progress_percent: 0,
      request_payload: { clear_local_before_fetch: options.clearLocalBeforeFetch === true },
      result: {},
      error: {},
      started_at: now.toISOString(),
      expires_at: new Date(
        now.getTime() + REFRESH_OPERATION_RETENTION_DAYS * 86_400_000,
      ).toISOString(),
    })
    .select("*")
    .maybeSingle();

  if (error && !isConflictError(error)) throw error;
  if (error && isConflictError(error)) {
    const existing = await getActiveRefreshOperation(serverId);
    if (existing) return { row: existing, coalesced: true };
    throw error;
  }

  const row = asOperationRow(data);
  if (!row) throw new Error("Não foi possível criar o snapshot da operação de refresh.");
  await recordOperationEvent(row.id, row.status, row.stage, row.progress_percent, {
    clear_local_before_fetch: options.clearLocalBeforeFetch === true,
  });
  return { row, coalesced: false };
}

export async function getActiveRefreshOperation(serverId: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("long_running_operations")
    .select("*")
    .eq("operation_type", REFRESH_OPERATION_TYPE)
    .eq("server_id", serverId)
    .in("status", ["pending", "running", "cancel_requested"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return asOperationRow(data);
}

export async function getRefreshOperationByRef(operationRef: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("long_running_operations")
    .select("*")
    .eq("operation_ref", operationRef)
    .eq("operation_type", REFRESH_OPERATION_TYPE)
    .maybeSingle();
  if (error) throw error;
  const row = asOperationRow(data);
  return row ? toStatus(row) : null;
}

export async function requestRefreshOperationCancel(operationRef: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  const requestedAt = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from("long_running_operations")
    .update({
      status: "cancel_requested",
      cancel_requested_at: requestedAt,
      updated_at: requestedAt,
    })
    .eq("operation_ref", operationRef)
    .eq("operation_type", REFRESH_OPERATION_TYPE)
    .in("status", ["pending", "running"])
    .select("*")
    .maybeSingle();
  if (error) throw error;
  const row = asOperationRow(data);
  if (row) {
    await recordOperationEvent(row.id, row.status, row.stage, row.progress_percent, {
      reason: "user_requested",
    });
    return toStatus(row);
  }
  return getRefreshOperationByRef(operationRef);
}

export async function isRefreshOperationCancellationRequested(operationRef: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin
    .from("long_running_operations")
    .select("status")
    .eq("operation_ref", operationRef)
    .eq("operation_type", REFRESH_OPERATION_TYPE)
    .maybeSingle();
  if (error) throw error;
  const status = asRecord(data)["status"];
  return status === "cancel_requested" || status === "cancelled";
}

export async function claimNextRefreshOperation(workerRef: string) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc("claim_next_long_running_operation", {
    p_operation_type: REFRESH_OPERATION_TYPE,
    p_worker_ref: workerRef,
  });
  if (error) throw error;
  const rows = Array.isArray(data) ? data : [];
  return asOperationRow(rows[0]);
}

export async function updateRefreshOperation(
  operationRef: string,
  patch: {
    status: LongOperationState;
    stage: LongOperationStage;
    progressPercent: number | null;
    result?: Record<string, unknown>;
    error?: Record<string, unknown>;
    details?: Record<string, unknown>;
    workerRef?: string;
  },
) {
  const supabaseAdmin = await getSupabaseAdmin();
  const now = new Date().toISOString();
  const terminal = isTerminalLongOperationState(patch.status);
  const values: Record<string, unknown> = {
    status: patch.status,
    stage: patch.stage,
    progress_percent: patch.progressPercent,
    last_heartbeat_at: now,
    updated_at: now,
  };
  if (patch.result) values["result"] = patch.result;
  if (patch.error) values["error"] = patch.error;
  if (terminal) values["completed_at"] = now;

  let query = supabaseAdmin
    .from("long_running_operations")
    .update(values)
    .eq("operation_ref", operationRef)
    .eq("operation_type", REFRESH_OPERATION_TYPE);
  if (patch.workerRef) query = query.eq("worker_ref", patch.workerRef);
  if (patch.status === "running") {
    query = query.eq("status", "running");
  } else if (patch.status === "cancelled") {
    query = query.in("status", ["pending", "running", "cancel_requested"]);
  } else if (terminal) {
    query = query.in("status", ["running", "cancel_requested"]);
  }
  const { data, error } = await query.select("*").maybeSingle();
  if (error) throw error;
  const row = asOperationRow(data);
  if (row) {
    await recordOperationEvent(row.id, row.status, row.stage, row.progress_percent, patch.details);
    return toStatus(row);
  }
  return getRefreshOperationByRef(operationRef);
}

export async function pruneRefreshOperations(retentionDays = REFRESH_OPERATION_RETENTION_DAYS) {
  const supabaseAdmin = await getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.rpc("prune_long_running_operations", {
    p_retention_days: retentionDays,
  });
  if (error) throw error;
  return typeof data === "number" ? data : 0;
}
