// functions/gas.js
// Cloudflare Pages Function — เป็น endpoint /gas อัตโนมัติ
// Browser → POST/GET /gas → ฟังก์ชันนี้ → GAS → ส่งกลับ

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwLpt_6j0LGx98yRpgEnWRu_8PbZg0hc0g0HN-59tFyHxLIN7JKrihmkqWvYO1JLbI3bA/exec';

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json'
};

export async function onRequest(context) {
  const { request } = context;

  // Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    let action, params;

    if (request.method === 'POST') {
      const body = await request.json();
      action = body.action || '';
      params = body.params || {};
    } else {
      const url = new URL(request.url);
      action = url.searchParams.get('action') || '';
      try { params = JSON.parse(url.searchParams.get('params') || '{}'); } catch(_) { params = {}; }
    }

    // Forward ไป GAS ด้วย GET เสมอ
    const qs  = new URLSearchParams({ action, params: JSON.stringify(params) });
    const res = await fetch(`${GAS_URL}?${qs}`, { method: 'GET', redirect: 'follow' });
    const text = await res.text();

    // ถ้า GAS คืน HTML = deploy ผิด
    if (text.trim().startsWith('<')) {
      return new Response(JSON.stringify({
        status:  'error',
        message: 'GAS returned HTML — ตรวจสอบ: Execute as Me, Access Anyone',
        preview: text.substring(0, 300)
      }), { status: 502, headers: CORS });
    }

    return new Response(text, { status: 200, headers: CORS });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'error', message: err.message
    }), { status: 500, headers: CORS });
  }
}
