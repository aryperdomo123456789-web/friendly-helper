export type LongOperationState =
  "pending" | "running" | "succeeded" | "failed" | "cancel_requested";

export type LongOperationStage =
  | "queued"
  | "acquiring_lock"
  | "fetching_m3u"
  | "parsing_catalog"
  | "fetching_catalog"
  | "persisting_cache"
  | "completed"
  | "failed";

const STAGE_PROGRESS: Record<LongOperationStage, number | null> = {
  queued: 0,
  acquiring_lock: 10,
  fetching_m3u: 25,
  parsing_catalog: 40,
  fetching_catalog: 55,
  persisting_cache: 85,
  completed: 100,
  failed: null,
};

export type LongOperationMetadata = {
  operation_ref: string;
  operation_state: LongOperationState;
  operation_stage: LongOperationStage;
  progress_percent: number | null;
  elapsed_ms: number;
};

export function createLongOperationMetadata(
  operationRef: string,
  state: LongOperationState,
  stage: LongOperationStage,
  startedAt: number,
  now = Date.now(),
): LongOperationMetadata {
  return {
    operation_ref: operationRef,
    operation_state: state,
    operation_stage: stage,
    progress_percent: STAGE_PROGRESS[stage],
    elapsed_ms: Math.max(0, now - startedAt),
  };
}

export function getLongOperationProgress(stage: LongOperationStage) {
  return STAGE_PROGRESS[stage];
}
