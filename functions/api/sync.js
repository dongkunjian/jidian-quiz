/**
 * 进度云同步 —— Pages Function，挂在刷题站同域 /api/sync
 * GET  /api/sync          读取进度 JSON
 * POST /api/sync          写入进度 JSON（body 为 JSON 文本）
 * 单用户项目：所有记录共用一个 KV key；用固定同步码做简单鉴权（避免被人乱写）。
 */
const SYNC_KEY = "jd-progress-main-v1";
const TOKEN = "jidian2027";
const MAX_BYTES = 2_000_000;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (!env || !env.PROGRESS) return json({ ok: false, error: "KV not bound" }, 500);

  const url = new URL(request.url);
  if (url.searchParams.get("k") !== TOKEN) return json({ ok: false, error: "bad token" }, 403);

  if (request.method === "GET") {
    const raw = await env.PROGRESS.get(SYNC_KEY, "text");
    if (!raw) return json({ ok: true, data: null });
    try {
      return json({ ok: true, data: JSON.parse(raw) });
    } catch (e) {
      return json({ ok: true, data: null });
    }
  }

  if (request.method === "POST") {
    let text;
    try { text = await request.text(); } catch (e) { return json({ ok: false, error: "bad body" }, 400); }
    if (text.length > MAX_BYTES) return json({ ok: false, error: "too large" }, 413);
    try { JSON.parse(text); } catch (e) { return json({ ok: false, error: "not json" }, 400); }
    await env.PROGRESS.put(SYNC_KEY, text);
    return json({ ok: true, bytes: text.length });
  }

  return json({ ok: false, error: "method not allowed" }, 405);
}
