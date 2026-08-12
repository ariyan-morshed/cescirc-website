export async function onRequestGet(context) {
    const { env } = context;
    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM articles ORDER BY created_at DESC'
        ).all();
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    // Security Check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new Response("Forbidden", { status: 403 });
    const token = authHeader.replace('Bearer ', '');
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return new Response("Forbidden", { status: 403 });
    let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) { base64 += '='; }
    let payload;
    try { payload = JSON.parse(atob(base64)); } catch (e) { return new Response("Forbidden", { status: 403 }); }
    const actingUserId = payload.sub;
    const verifyRes = await fetch(`https://api.clerk.com/v1/users/${actingUserId}`, { headers: { "Authorization": `Bearer ${env.CLERK_SECRET_KEY}` } });
    const verifyData = await verifyRes.json();
    
    const userRole = verifyData.public_metadata?.role;
    const userDept = verifyData.public_metadata?.department;

    // ALLOW: Top 5 OR (Academics Dept AND (Director OR Member))
    const isAuthorized = userRole === "top5" || (userDept === "academics_dept" && (userRole === "director" || userRole === "member"));
    if (!isAuthorized) {
        return new Response("Forbidden", { status: 403 });
    }

    try {
        const { title, source, summary, url } = await request.json();
        if (!title || !source || !summary || !url) {
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
        }
        await env.DB.prepare(
            'INSERT INTO articles (title, source, summary, url) VALUES (?, ?, ?, ?)'
        ).bind(title, source, summary, url).run();
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}