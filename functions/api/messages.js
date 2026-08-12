export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const dept = url.searchParams.get('dept');

    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM messages WHERE target_dept = ? ORDER BY created_at DESC LIMIT 20'
        ).bind(dept).all();
        
        return new Response(JSON.stringify(results), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { target_dept, sender_name, sender_dept, subject, body } = await request.json();
        if (!target_dept || !subject || !body) {
            return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
        }

        await env.DB.prepare(
            'INSERT INTO messages (target_dept, sender_name, sender_dept, subject, body) VALUES (?, ?, ?, ?, ?)'
        ).bind(target_dept, sender_name, sender_dept, subject, body).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// NEW: Handle deleting a message
export async function onRequestDelete(context) {
    const { request, env } = context;
    try {
        const { id } = await request.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing message ID' }), { status: 400 });
        }

        await env.DB.prepare(
            'DELETE FROM messages WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}