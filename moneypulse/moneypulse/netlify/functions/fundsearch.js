exports.handler = async (event) => {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const q = event.queryStringParameters?.q || '';
  if (!q || q.length < 2) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Query too short' }) };

  try {
    // Search mutual funds via mfapi.in — free, no auth needed
    const mfResp = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(q)}`);
    const mfData = await mfResp.json();

    // mfapi returns array of { schemeCode, schemeName }
    const results = (Array.isArray(mfData) ? mfData : []).slice(0, 15).map(f => ({
      id: 'mf_' + f.schemeCode,
      name: f.schemeName,
      sub: 'AMFI · ' + f.schemeCode,
      type: detectType(f.schemeName)
    }));

    return { statusCode: 200, headers, body: JSON.stringify(results) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

function detectType(name) {
  const n = name.toLowerCase();
  if (n.includes('etf') || n.includes('exchange traded')) return 'etf';
  return 'sip';
}
