export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const dept = url.searchParams.get('dept');

    try {
        let query = 'SELECT * FROM tasks ORDER BY status ASC, created_at DESC';
        let params = [];
        if (dept) {
            query = 'SELECT * FROM tasks WHERE dept = ? ORDER BY status ASC, created_at DESC';
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
        const { text, description, dept } = await request.json();
        if (!text || !dept) {
            return new Response(JSON.stringify({ error: 'Missing text or dept' }), { status: 400 });
        }

        const result = await env.DB.prepare(
            'INSERT INTO tasks (text, description, dept, status) VALUES (?, ?, ?, ?)'
        ).bind(text, description || null, dept, 'pending').run();

        return new Response(JSON.stringify({ success: true, id: result.meta.last_row_id }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// Handle updating task status (Complete / Undo)
export async function onRequestPatch(context) {
    const { request, env } = context;
    try {
        const { id, status } = await request.json();
        if (!id || !status) {
            return new Response(JSON.stringify({ error: 'Missing task ID or status' }), { status: 400 });
        }

        await env.DB.prepare(
            'UPDATE tasks SET status = ? WHERE id = ?'
        ).bind(status, id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}

// Handle deleting a task
export async function onRequestDelete(context) {
    const { request, env } = context;
    try {
        const { id } = await request.json();
        if (!id) {
            return new Response(JSON.stringify({ error: 'Missing task ID' }), { status: 400 });
        }

        await env.DB.prepare(
            'DELETE FROM tasks WHERE id = ?'
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}