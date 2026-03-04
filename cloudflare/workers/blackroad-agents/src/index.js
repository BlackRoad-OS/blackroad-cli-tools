/**
 * BlackRoad AI Agents Worker
 * Handles AI agent requests, auto-fix dispatching, and repo analysis
 *
 * © 2025-2026 BlackRoad OS, Inc. All Rights Reserved.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/agent' && request.method === 'POST') {
        return handleAgentRequest(request, env);
      }

      if (path === '/autofix' && request.method === 'POST') {
        return handleAutofix(request, env, ctx);
      }

      if (path === '/tasks/analyze' && request.method === 'POST') {
        return handleRepoAnalysis(request, env, ctx);
      }

      if (path === '/health') {
        return jsonResponse({ status: 'ok', service: 'blackroad-agents', version: '1.0.0' });
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal server error', message: err.message }, 500);
    }
  },
};

/**
 * Handle AI agent mentions in issues/PRs
 */
async function handleAgentRequest(request, env) {
  const body = await request.json();
  const { request: agentRequest, repo, context } = body;

  const response = {
    status: 'received',
    message: `BlackRoad Agent acknowledged request from @${context?.user || 'unknown'} in ${repo}`,
    request: agentRequest?.substring(0, 200),
    timestamp: new Date().toISOString(),
    powered_by: 'BlackRoad OS Cloudflare Workers',
  };

  return jsonResponse(response);
}

/**
 * Handle auto-fix requests for changed files
 */
async function handleAutofix(request, env, ctx) {
  const body = await request.json();
  const { file, repo } = body;

  // Offload heavy analysis using waitUntil (non-blocking)
  ctx.waitUntil(analyzeFileAsync(file, repo, env));

  return jsonResponse({
    status: 'queued',
    file,
    repo,
    message: 'Auto-fix analysis queued for processing',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handle repository analysis (longer task - up to 30s CPU)
 */
async function handleRepoAnalysis(request, env, ctx) {
  const body = await request.json();
  const { repo, sha, branch, actor, event } = body;

  // Offload the heavy analysis using waitUntil
  ctx.waitUntil(runRepoAnalysis({ repo, sha, branch, actor, event }, env));

  return jsonResponse({
    status: 'dispatched',
    repo,
    sha: sha?.substring(0, 8),
    branch,
    message: 'Repository analysis dispatched to background processing',
    timestamp: new Date().toISOString(),
    powered_by: 'BlackRoad OS Cloudflare Workers (Workers Unbound)',
  });
}

/**
 * Background: analyze a single file
 */
async function analyzeFileAsync(file, repo, env) {
  console.log(`Analyzing file: ${file} in ${repo}`);
  // Placeholder for actual AI-powered analysis
  // In production: call AI APIs (OpenAI/Anthropic/Google) here
}

/**
 * Background: run full repo analysis
 */
async function runRepoAnalysis({ repo, sha, branch, actor, event }, env) {
  console.log(`Running repo analysis: ${repo} @ ${sha} (${branch}) triggered by ${actor} via ${event}`);
  // Placeholder for heavy analysis tasks:
  // - Code quality checks
  // - Security scanning
  // - Dependency analysis
  // - Performance profiling
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
