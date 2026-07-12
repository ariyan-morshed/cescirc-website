export async function onRequestGet(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    try {
        const response = await fetch("https://api.clerk.com/v1/users?limit=100&order_by=created_at", {
            headers: { "Authorization": `Bearer ${context.env.CLERK_SECRET_KEY}` }
        });
        const data = await response.json();
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: "Failed to fetch users" }), { status: 500, headers: corsHeaders });
    }
}