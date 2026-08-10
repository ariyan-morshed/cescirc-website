export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const dept = url.searchParams.get('dept');

    try {
        let query = 'SELECT * FROM tasks ORDER BY created_at DESC';
        let params = [];
        if (dept) {
            query = 'SELECT * FROM tasks WHERE dept = ? ORDER BY created_at DESC';
            params.push(dept);
        }

        const { results } = await env.DB.prepare(query).bind(...params).all();
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
        const { text, dept } = await request.json();
        if (!text || !dept) {
            return new Response(JSON.stringify({ error: 'Missing text or dept' }), { status: 400 });
        }

        const result = await env.DB.prepare(
            'INSERT INTO tasks (text, dept, status) VALUES (?, ?, ?)'
        ).bind(text, dept, 'pending').run();

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
