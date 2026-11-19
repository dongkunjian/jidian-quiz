/**
 * 题目纠错反馈 —— Pages Function，挂在刷题站同域 /api/feedback
 * POST   /api/feedback?k=TOKEN          提交一条纠错（body 为 JSON）
 * GET    /api/feedback?k=TOKEN          列出全部待处理纠错（按时间升序）
 * DELETE /api/feedback?k=TOKEN&id=xxx   删除已处理的一条
 *
 * 与 /api/sync 共用同一个 KV（绑定名 PROGRESS），但用独立前缀 fb: 存，
 * 互不影响刷题进度。纠错记录留给维护者（AI 或本人）核教材后逐条更正题库。
 */
const PREFIX = "fb:";
const TOKEN = "jidian2027";
const MAX_BYTES = 20000;

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
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
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (!env || !env.PROGRESS) return json({ ok: false, error: "KV not bound" }, 500);

  const url = new URL(request.url);
  if (url.searchParams.get("k") !== TOKEN) return json({ ok: false, error: "bad token" }, 403);

  if (request.method === "GET") {
    // 列出全部待处理纠错（前缀扫描；单用户场景量小，逐条取）
    const items = [];
    let cursor;
    do {
      const page = await env.PROGRESS.list({ prefix: PREFIX, limit: 200, cursor });
      for (const k of page.keys) {
        const v = await env.PROGRESS.get(k.name, "text");
        if (!v) continue;
        try {
          const o = JSON.parse(v);
          items.push({ id: k.name, ...o });
        } catch (e) {
          // 坏数据跳过，不影响其它
        }
      }
      cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    items.sort((a, b) => (a.ts || 0) - (b.ts || 0));
    return json({ ok: true, count: items.length, items });
  }

  if (request.method === "POST") {
    let text;
    try { text = await request.text(); } catch (e) { return json({ ok: false, error: "bad body" }, 400); }
    if (text.length > MAX_BYTES) return json({ ok: false, error: "too large" }, 413);

    let obj;
    try { obj = JSON.parse(text); } catch (e) { return json({ ok: false, error: "not json" }, 400); }
    if (!obj || typeof obj !== "object") return json({ ok: false, error: "bad payload" }, 400);
    if (!obj.qid || !obj.note) return json({ ok: false, error: "missing qid/note" }, 400);

    // 关键字段做长度与类型收敛，防止被写入超长垃圾
    const rec = {
      section: String(obj.section || "").slice(0, 16),
      qid: String(obj.qid || "").slice(0, 40),
      idx: Number(obj.idx) || 0,
      stem: String(obj.stem || "").slice(0, 500),
      source: String(obj.source || "").slice(0, 40),
      type: String(obj.type || "").slice(0, 16),
      note: String(obj.note || "").slice(0, 2000),
      ts: Number(obj.ts) || Date.now(),
      ua: String(obj.ua || "").slice(0, 160),
    };

    const id = PREFIX + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
    await env.PROGRESS.put(id, JSON.stringify(rec));
    return json({ ok: true, id });
  }

  if (request.method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id || id.indexOf(PREFIX) !== 0) return json({ ok: false, error: "bad id" }, 400);
    await env.PROGRESS.delete(id);
    return json({ ok: true });
  }

  return json({ ok: false, error: "method not allowed" }, 405);
}
