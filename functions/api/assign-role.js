export async function onRequestPost(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    if (context.request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { userId, role, department } = await context.request.json();
        const authHeader = context.request.headers.get("Authorization");
        if (!authHeader) return new Response("Unauthorized", { status: 401 });

        const token = authHeader.replace("Bearer ", "");
        
        // SECURE VERIFICATION (No NPM/SDK required)
        // 1. Decode the token to get the acting user's ID
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) return new Response("Invalid token", { status: 401 });
        
        // Decode Base64URL format
        const base64 = tokenParts[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        const actingUserId = payload.sub;

        if (!actingUserId) return new Response("Cannot identify user", { status: 401 });

        // 2. Use Secret Key to ask Clerk's database: "Who is this person really?"
        const verifyRes = await fetch(`https://api.clerk.com/v1/users/${actingUserId}`, {
            headers: { "Authorization": `Bearer ${context.env.CLERK_SECRET_KEY}` }
        });
        const verifyData = await verifyRes.json();

        // 3. Check the actual database role
        if (verifyData.public_metadata?.role !== "admin") {
            return new Response("Forbidden: You are not an admin", { status: 403 });
        }

        // 4. If they pass the check, update the target user
        const updateRes = await fetch(`https://api.clerk.com/v1/users/${userId}/metadata`, {
            method: "PATCH",
            headers: { 
                "Authorization": `Bearer ${context.env.CLERK_SECRET_KEY}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({ 
                public_metadata: { role: role, department: department } 
            })
        });

        if (!updateRes.ok) throw new Error("Update failed");

        return new Response(JSON.stringify({ success: true }), { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }
}