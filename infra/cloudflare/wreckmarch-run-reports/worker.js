/* WRECKMARCH — Cloudflare Worker for D1-backed run reports */
const ALLOWED_ORIGINS = new Set([
  'https://aseel90.github.io',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
]);
const MAX_BODY_BYTES = 128 * 1024;
const BRIDGE_AUDIENCE = 'wreckmarch-run-reports';
const BRIDGE_REPOSITORY = 'aseel90/wreckmarch';
const BRIDGE_WORKFLOW = 'balance-run-report-bridge.yml';
const MAX_BRIDGE_BATCH = 5;
const GITHUB_COMMENT_CHUNK_CHARS = 48000;
let oidcConfigCache = null;
let jwksCache = null;
let jwksExpiresAt = 0;

function corsHeaders(origin) {
  return {
    'access-control-allow-origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://aseel90.github.io',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    vary: 'Origin'
  };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...corsHeaders(origin) }
  });
}

function byteLength(value) {
  return new TextEncoder().encode(String(value)).byteLength;
}

function safeError(error) {
  return String(error?.message || error || 'unknown error').slice(0, 1000);
}

function validateReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) return 'body must be an object';
  if (report.schemaVersion !== 1) return 'unsupported schemaVersion';
  if (typeof report.reportId !== 'string' || report.reportId.length < 8 || report.reportId.length > 128) return 'invalid reportId';
  if (!report.run || typeof report.run !== 'object') return 'missing run summary';
  return null;
}

function runLabel(id) {
  return `RUN-${String(id).padStart(4, '0')}`;
}

function issueTitle(label, report) {
  const wave = Number(report?.run?.finalWave) || 1;
  const reason = String(report?.finishReason || 'RUN ENDED').slice(0, 40);
  return `[BALANCE RUN] ${label} — Wave ${wave} — ${reason}`;
}

function issueBody(label, report) {
  const combat = report.combat || {};
  const performance = report.performance || {};
  const projectiles = report.projectiles || {};
  const reportBytes = byteLength(JSON.stringify(report));
  return [
    `## ${label}`,
    '',
    `- Duration: ${Number(report?.run?.durationSeconds || 0).toFixed(1)}s`,
    `- Final wave: ${report?.run?.finalWave ?? 1}`,
    `- Finish reason: ${report?.finishReason || 'RUN ENDED'}`,
    `- Level: ${report?.run?.level ?? 1}`,
    `- Kills: ${combat.kills ?? 0}`,
    `- Damage dealt: ${Number(combat.damageDealt || 0).toFixed(1)}`,
    `- Damage taken: ${Number(combat.damageTaken || 0).toFixed(1)}`,
    `- Hero projectiles: ${projectiles.heroSpawned ?? 0}`,
    `- Shrapnel fragments: ${projectiles.shrapnelSpawned ?? 0}`,
    `- Peak active enemies: ${performance.peakActiveEnemies ?? 0}`,
    `- Peak active projectiles: ${performance.peakActiveProjectiles ?? 0}`,
    `- Avg projectile spawns: ${Number(performance.averageProjectileSpawnsPerSecond || 0).toFixed(2)}/s`,
    `- Peak projectile spawns (1s): ${performance.peakProjectileSpawns1s ?? 0}`,
    `- Peak active hero projectiles: ${performance.peakActiveHeroProjectiles ?? 0}`,
    `- Peak active Shrapnel: ${performance.peakActiveShrapnel ?? 0}`,
    `- Peak active support projectiles: ${performance.peakActiveSupportProjectiles ?? 0}`,
    `- Long frames (>=33.34ms): ${performance.longFrames ?? 0}`,
    `- Max frame time: ${Number(performance.maxFrameMs || 0).toFixed(2)}ms`,
    `- Full telemetry bytes: ${reportBytes}`,
    '',
    'The complete telemetry JSON is preserved below in numbered issue comments. No report fields are truncated.'
  ].join('\n');
}

function issueComments(reportId, report) {
  const pretty = JSON.stringify(report, null, 2);
  const chunks = [];
  for (let offset = 0; offset < pretty.length; offset += GITHUB_COMMENT_CHUNK_CHARS) {
    chunks.push(pretty.slice(offset, offset + GITHUB_COMMENT_CHUNK_CHARS));
  }
  return chunks.map((chunk, index) => {
    const part = index + 1;
    const total = chunks.length;
    return [
      `<!-- wm-report:${reportId}:chunk:${part}/${total} -->`,
      `### Full telemetry JSON — part ${part}/${total}`,
      '',
      '```json',
      chunk,
      '```'
    ].join('\n');
  });
}

function decodeBase64Url(input) {
  const value = String(input || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

function decodeJsonPart(input) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(input)));
}

async function getOidcConfig() {
  if (oidcConfigCache) return oidcConfigCache;
  const response = await fetch('https://token.actions.githubusercontent.com/.well-known/openid-configuration', { cache: 'no-store' });
  if (!response.ok) throw new Error(`OIDC config ${response.status}`);
  oidcConfigCache = await response.json();
  return oidcConfigCache;
}

async function getJwks() {
  if (jwksCache && Date.now() < jwksExpiresAt) return jwksCache;
  const config = await getOidcConfig();
  const response = await fetch(config.jwks_uri, { cache: 'no-store' });
  if (!response.ok) throw new Error(`JWKS ${response.status}`);
  jwksCache = await response.json();
  jwksExpiresAt = Date.now() + 5 * 60 * 1000;
  return jwksCache;
}

function pemFromJwk(jwk) {
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
}

async function verifyGithubOidc(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) throw new Error('invalid token');
  const [headerPart, payloadPart, signaturePart] = parts;
  const header = decodeJsonPart(headerPart);
  const payload = decodeJsonPart(payloadPart);
  if (header.alg !== 'RS256') throw new Error('unsupported alg');
  if (payload.iss !== 'https://token.actions.githubusercontent.com') throw new Error('invalid issuer');
  const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audience.includes(BRIDGE_AUDIENCE)) throw new Error('invalid audience');
  if (payload.repository !== BRIDGE_REPOSITORY) throw new Error('invalid repository');
  if (payload.workflow_ref && !String(payload.workflow_ref).includes(`/.github/workflows/${BRIDGE_WORKFLOW}@`)) throw new Error('invalid workflow');
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now || (payload.nbf && payload.nbf > now + 30)) throw new Error('expired token');
  const jwks = await getJwks();
  const jwk = (jwks.keys || []).find(key => key.kid === header.kid);
  if (!jwk) throw new Error('unknown key');
  const key = await pemFromJwk(jwk);
  const data = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const signature = decodeBase64Url(signaturePart);
  const ok = await crypto.subtle.verify({ name: 'RSASSA-PKCS1-v1_5' }, key, signature, data);
  if (!ok) throw new Error('invalid signature');
  return payload;
}

async function requireBridgeAuth(request, origin, handler) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  try {
    const claims = await verifyGithubOidc(token);
    return await handler(claims);
  } catch (error) {
    return json({ error: 'unauthorized', detail: safeError(error) }, 401, origin);
  }
}

async function handleReport(request, env, origin) {
  let raw;
  try {
    raw = await request.text();
  } catch (error) {
    return json({ error: 'request_read_failed', stage: 'request_body' }, 400, origin);
  }
  const rawBytes = byteLength(raw);
  if (rawBytes > MAX_BODY_BYTES) return json({ error: 'report too large', bytes: rawBytes, maxBytes: MAX_BODY_BYTES }, 413, origin);

  let report;
  try {
    report = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_json' }, 400, origin);
  }
  const validationError = validateReport(report);
  if (validationError) return json({ error: validationError }, 400, origin);

  const serialized = JSON.stringify(report);
  const serializedBytes = byteLength(serialized);
  if (serializedBytes > MAX_BODY_BYTES) return json({ error: 'report too large', bytes: serializedBytes, maxBytes: MAX_BODY_BYTES }, 413, origin);

  try {
    await env.RUN_REPORTS.prepare(
      `INSERT OR IGNORE INTO run_reports (report_id, report_json, status) VALUES (?, ?, 'received')`
    ).bind(report.reportId, serialized).run();
  } catch (error) {
    const detail = safeError(error);
    console.error('run_report_d1_insert_failed', { reportId: report.reportId, detail });
    return json({ error: 'storage_failed', stage: 'd1_insert', detail }, 500, origin);
  }

  let row;
  try {
    row = await env.RUN_REPORTS.prepare(
      `SELECT id, report_id, github_issue_number, github_issue_url, status FROM run_reports WHERE report_id = ? LIMIT 1`
    ).bind(report.reportId).first();
  } catch (error) {
    const detail = safeError(error);
    console.error('run_report_d1_readback_failed', { reportId: report.reportId, detail });
    return json({ error: 'storage_readback_failed', stage: 'd1_readback', detail }, 500, origin);
  }
  if (!row) return json({ error: 'failed to persist report', stage: 'd1_readback' }, 500, origin);

  const label = runLabel(row.id);
  if (row.github_issue_number && row.github_issue_url) {
    return json({ submitted: true, duplicate: true, runId: label, issueNumber: row.github_issue_number, issueUrl: row.github_issue_url }, 200, origin);
  }

  try {
    await env.RUN_REPORTS.prepare(
      `UPDATE run_reports SET status = 'pending_github', last_error = NULL WHERE report_id = ? AND github_issue_number IS NULL`
    ).bind(report.reportId).run();
  } catch (error) {
    const detail = safeError(error);
    console.error('run_report_status_update_failed', { reportId: report.reportId, detail });
    return json({ error: 'status_update_failed', stage: 'd1_status', detail, runId: label }, 500, origin);
  }

  return json({ submitted: false, runId: label, queued: true, bridge: 'github-actions-oidc' }, 202, origin);
}

async function handleBridgePending(request, env, origin) {
  return requireBridgeAuth(request, origin, async () => {
    try {
      const result = await env.RUN_REPORTS.prepare(
        `SELECT id, report_id, report_json FROM run_reports WHERE github_issue_number IS NULL AND status IN ('received', 'pending_github') ORDER BY id ASC LIMIT ?`
      ).bind(MAX_BRIDGE_BATCH).all();
      const reports = (result.results || []).map(row => {
        const report = JSON.parse(row.report_json);
        const label = runLabel(row.id);
        return {
          id: row.id,
          reportId: row.report_id,
          runId: label,
          title: issueTitle(label, report),
          body: issueBody(label, report),
          comments: issueComments(row.report_id, report)
        };
      });
      return json({ reports }, 200, origin);
    } catch (error) {
      return json({ error: 'bridge_read_failed', detail: safeError(error) }, 500, origin);
    }
  });
}

async function handleBridgeComplete(request, env, origin) {
  return requireBridgeAuth(request, origin, async () => {
    let payload;
    try { payload = await request.json(); }
    catch { return json({ error: 'invalid_json' }, 400, origin); }
    const reportId = String(payload?.reportId || '');
    const issueNumber = Number(payload?.issueNumber || 0);
    const issueUrl = String(payload?.issueUrl || '');
    if (!reportId || !Number.isFinite(issueNumber) || issueNumber <= 0 || !issueUrl) return json({ error: 'invalid completion payload' }, 400, origin);
    try {
      await env.RUN_REPORTS.prepare(
        `UPDATE run_reports SET github_issue_number = ?, github_issue_url = ?, status = 'github_created', last_error = NULL WHERE report_id = ?`
      ).bind(issueNumber, issueUrl, reportId).run();
      return json({ ok: true }, 200, origin);
    } catch (error) {
      return json({ error: 'bridge_update_failed', detail: safeError(error) }, 500, origin);
    }
  });
}

async function handleBridgeFail(request, env, origin) {
  return requireBridgeAuth(request, origin, async () => {
    let payload;
    try { payload = await request.json(); }
    catch { return json({ error: 'invalid_json' }, 400, origin); }
    const reportId = String(payload?.reportId || '');
    const detail = String(payload?.error || 'github bridge failed').slice(0, 2000);
    if (!reportId) return json({ error: 'missing reportId' }, 400, origin);
    try {
      await env.RUN_REPORTS.prepare(
        `UPDATE run_reports SET status = 'github_failed', last_error = ? WHERE report_id = ?`
      ).bind(detail, reportId).run();
      return json({ ok: true }, 200, origin);
    } catch (error) {
      return json({ error: 'bridge_fail_update_failed', detail: safeError(error) }, 500, origin);
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === 'POST' && url.pathname === '/report') return handleReport(request, env, origin);
    if (request.method === 'POST' && url.pathname === '/bridge/pending') return handleBridgePending(request, env, origin);
    if (request.method === 'POST' && url.pathname === '/bridge/complete') return handleBridgeComplete(request, env, origin);
    if (request.method === 'POST' && url.pathname === '/bridge/fail') return handleBridgeFail(request, env, origin);
    return json({ error: 'not_found' }, 404, origin);
  }
};
