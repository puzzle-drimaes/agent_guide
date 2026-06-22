// Apply-time conflict policy.
// Target adapters describe desired writes; this helper decides what to do when
// those writes meet existing files. It stays target-agnostic so lifecycle
// behavior is consistent across Claude/Codex/Gemini/Cursor.
import fs from 'node:fs';

export const CONFLICT_POLICIES = [
  'managed-overwrite',
  'skip',
  'append',
  'merge-json',
  'merge-toml',
  'conflict-error',
];

const POLICY_SET = new Set(CONFLICT_POLICIES);

function assertKnownPolicy(policy) {
  if (!POLICY_SET.has(policy)) {
    throw new Error(`conflict policy must be one of ${CONFLICT_POLICIES.join(', ')} (got ${policy})`);
  }
}

function skipConflictOp(op, reason) {
  return {
    ...op,
    kind: 'skip',
    dest: null,
    strategy: `${op.strategy}+conflict-skip`,
    reason,
  };
}

function allowMatchingKind(policy, op) {
  if (policy === 'append') return op.kind === 'append-markdown';
  if (policy === 'merge-json') return op.kind === 'merge-json';
  if (policy === 'merge-toml') return op.kind === 'merge-toml';
  return false;
}

function decisionForConflict(op, policy) {
  const base = {
    moduleId: op.moduleId,
    kind: op.kind,
    dest: op.dest,
  };

  if (policy === 'managed-overwrite') {
    return {
      operation: op,
      decision: {
        ...base,
        decision: 'write',
        reason: 'managed-overwrite policy allows the planned operation for an existing destination',
      },
    };
  }

  if (policy === 'skip') {
    const reason = `Skipped by conflict policy 'skip': destination already exists (${op.dest})`;
    return {
      operation: skipConflictOp(op, reason),
      decision: {
        ...base,
        decision: 'skip',
        reason,
      },
    };
  }

  if (allowMatchingKind(policy, op)) {
    return {
      operation: op,
      decision: {
        ...base,
        decision: 'write',
        reason: `${policy} policy allows ${op.kind} for an existing destination`,
      },
    };
  }

  const reason = policy === 'conflict-error'
    ? `conflict-error policy rejects existing destination (${op.dest})`
    : `${policy} policy does not allow ${op.kind} for existing destination (${op.dest})`;
  return {
    operation: op,
    decision: {
      ...base,
      decision: 'error',
      reason,
    },
  };
}

export function resolveConflictPolicy(operations, { policy = 'managed-overwrite' } = {}) {
  assertKnownPolicy(policy);

  const resolved = [];
  const decisions = [];
  const errors = [];

  for (const op of operations) {
    if (!op || op.kind === 'skip' || !op.dest || !fs.existsSync(op.dest)) {
      resolved.push(op);
      continue;
    }

    const result = decisionForConflict(op, policy);
    decisions.push(result.decision);
    if (result.decision.decision === 'error') {
      errors.push(result.decision.reason);
    } else {
      resolved.push(result.operation);
    }
  }

  if (errors.length) {
    throw new Error(`conflict policy '${policy}' rejected existing destination(s): ${errors.join('; ')}`);
  }

  return {
    operations: resolved,
    record: {
      policy,
      decisions,
    },
  };
}
