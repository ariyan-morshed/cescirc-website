export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // 'pending' or 'approved'

    try {
        let query = 'SELECT * FROM situation_room WHERE status = ? ORDER BY pinned DESC, created_at DESC';
        const { results } = await env.DB.prepare(query).bind(status || 'approved').all();
        return new Response(JSON.stringify(results), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
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
    if (userRole === 'unverified') return new Response("Forbidden", { status: 403 });

    try {
        const { action, author_name, headline, banner_url, body_markdown, postId } = await request.json();

        // ACTION: Create new post
        if (action === 'create') {
            await env.DB.prepare(
                'INSERT INTO situation_room (author_id, author_name, headline, banner_url, body_markdown, status) VALUES (?, ?, ?, ?, ?, ?)'
            ).bind(actingUserId, author_name, headline, banner_url || null, body_markdown, 'pending').run();
            return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
        }

        // ACTIONS: Approve, Delete, Pin (Top 5 Only)
        if (userRole !== 'top5') return new Response("Forbidden", { status: 403 });

        if (action === 'approve') {
            await env.DB.prepare('UPDATE situation_room SET status = ? WHERE id = ?').bind('approved', postId).run();
        } else if (action === 'delete') {
            await env.DB.prepare('DELETE FROM situation_room WHERE id = ?').bind(postId).run();
        } else if (action === 'pin') {
            // Toggle pin status
            const post = await env.DB.prepare('SELECT pinned FROM situation_room WHERE id = ?').bind(postId).first();
            const newPinStatus = post.pinned === 1 ? 0 : 1;
            await env.DB.prepare('UPDATE situation_room SET pinned = ? WHERE id = ?').bind(newPinStatus, postId).run();
        }

        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}