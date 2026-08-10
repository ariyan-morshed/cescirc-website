export async function onRequestGet(context) {
    const { request, env } = context;
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new Response("Forbidden", { status: 403 });
    
    const token = authHeader.replace('Bearer ', '');
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return new Response("Forbidden", { status: 403 });
    
    // MANDATORY BASE64 PADDING FIX
    let base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) { base64 += '='; }
    
    let payload;
    try {
        payload = JSON.parse(atob(base64));
    } catch (e) {
        return new Response("Forbidden", { status: 403 });
    }
    
    const actingUserId = payload.sub;
    
    // MANDATORY DATABASE CHECK
    const verifyRes = await fetch(`https://api.clerk.com/v1/users/${actingUserId}`, {
        headers: { "Authorization": `Bearer ${env.CLERK_SECRET_KEY}` }
    });
    const verifyData = await verifyRes.json();
    
    if (verifyData.public_metadata?.role !== "top5") {
        return new Response("Forbidden", { status: 403 });
    }
    
    // Fetch all users if verified
    try {
        const usersRes = await fetch(`https://api.clerk.com/v1/users?limit=100`, {
            headers: { "Authorization": `Bearer ${env.CLERK_SECRET_KEY}` }
        });
        const usersData = await usersRes.json();
        
        return new Response(JSON.stringify(usersData), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}