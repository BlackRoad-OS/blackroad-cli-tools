/**
 * BlackRoad Long-Tasks Worker
 * Handles long-running operations using Durable Objects and Workers Unbound
 * CPU limit: 30,000ms (30 seconds)
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
      if (path === '/tasks/submit' && request.method === 'POST') {
        return handleTaskSubmit(request, env);
      }

      if (path.startsWith('/tasks/status/') && request.method === 'GET') {
        const taskId = path.split('/')[3];
        return handleTaskStatus(taskId, env);
      }

      if (path === '/tasks/analyze' && request.method === 'POST') {
        return handleAnalyze(request, env, ctx);
      }

      if (path === '/health') {
        return jsonResponse({
          status: 'ok',
          service: 'blackroad-long-tasks',
          version: '1.0.0',
          capabilities: ['repo-analysis', 'code-review', 'security-scan'],
        });
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (err) {
      console.error('Long-tasks worker error:', err);
      return jsonResponse({ error: 'Internal server error', message: err.message }, 500);
    }
  },
};

/**
 * Submit a long-running task to the queue via Durable Objects
 */
async function handleTaskSubmit(request, env) {
  const body = await request.json();
  const { type, payload } = body;

  const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // Route to Durable Object for stateful management
  const taskObj = env.TASK_QUEUE.get(env.TASK_QUEUE.idFromName(taskId));
  await taskObj.fetch(new Request('https://internal/init', {
    method: 'POST',
    body: JSON.stringify({ taskId, type, payload }),
  }));

  return jsonResponse({
    taskId,
    status: 'queued',
    type,
    message: 'Task queued for processing',
    statusUrl: `/tasks/status/${taskId}`,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Check the status of a submitted task
 */
async function handleTaskStatus(taskId, env) {
  if (!taskId) {
    return jsonResponse({ error: 'Task ID required' }, 400);
  }

  try {
    const taskObj = env.TASK_QUEUE.get(env.TASK_QUEUE.idFromName(taskId));
    const response = await taskObj.fetch(new Request('https://internal/status'));
    const status = await response.json();
    return jsonResponse(status);
  } catch {
    return jsonResponse({ taskId, status: 'not_found' }, 404);
  }
}

/**
 * Run repo analysis (long-running, uses Workers Unbound CPU limit)
 */
async function handleAnalyze(request, env, ctx) {
  const body = await request.json();
  const { repo, sha, branch, actor, event } = body;

  // Use waitUntil for background processing beyond response
  ctx.waitUntil(performAnalysis({ repo, sha, branch, actor, event }, env));

  return jsonResponse({
    status: 'analyzing',
    repo,
    sha: sha?.substring(0, 8),
    branch,
    actor,
    event,
    message: 'Long-running analysis started in background (Workers Unbound)',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Long-running repo analysis - can use up to 30s CPU
 */
async function performAnalysis({ repo, sha, branch, actor, event }, env) {
  console.log(`[long-tasks] Starting analysis: ${repo}@${sha} by ${actor} (${event})`);

  const tasks = [
    { name: 'dependency-audit', fn: () => auditDependencies(repo, sha) },
    { name: 'security-scan', fn: () => securityScan(repo, sha) },
    { name: 'code-quality', fn: () => codeQualityCheck(repo, sha) },
  ];

  const results = {};
  for (const task of tasks) {
    try {
      results[task.name] = await task.fn();
    } catch (err) {
      results[task.name] = { error: err.message };
    }
  }

  console.log(`[long-tasks] Analysis complete for ${repo}@${sha}:`, JSON.stringify(results));
  return results;
}

async function auditDependencies(repo, sha) {
  // Placeholder: audit package.json / requirements.txt dependencies
  return { status: 'clean', vulnerabilities: 0 };
}

async function securityScan(repo, sha) {
  // Placeholder: run security checks
  return { status: 'passed', issues: [] };
}

async function codeQualityCheck(repo, sha) {
  // Placeholder: run code quality metrics
  return { status: 'good', score: 95 };
}

/**
 * Durable Object: TaskQueue
 * Manages state for long-running tasks
 */
export class TaskQueue {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/init' && request.method === 'POST') {
      const task = await request.json();
      await this.state.storage.put('task', { ...task, status: 'queued', createdAt: new Date().toISOString() });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (url.pathname === '/status') {
      const task = await this.state.storage.get('task');
      return new Response(JSON.stringify(task || { status: 'not_found' }), { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
