import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
    if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) throw new Error("Unauthorized");
        const url = Deno.env.get("SUPABASE_URL")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
        const adminClient = createClient(url, serviceKey);
        const { data: { user: actor } } = await userClient.auth.getUser();
        if (!actor) throw new Error("Unauthorized");
        const { data: actorProfile } = await adminClient.from("profiles").select("role, active").eq("id", actor.id).single();
        if (!actorProfile?.active || actorProfile.role !== "admin") throw new Error("Admin role required");
        const body = await request.json();
        if (!body.email || !body.password || !body.full_name || !["admin", "accountant", "sales_rep", "viewer"].includes(body.role)) throw new Error("Invalid user data");
        const { data, error } = await adminClient.auth.admin.createUser({ email: body.email, password: body.password, email_confirm: true });
        if (error || !data.user) throw error || new Error("User creation failed");
        const profile = await adminClient.from("profiles").insert({ id: data.user.id, full_name: body.full_name, phone: body.phone || null, role: body.role, active: true });
        if (profile.error) throw profile.error;
        return new Response(JSON.stringify({ ok: true, id: data.user.id }), { headers: { ...cors, "Content-Type": "application/json" } });
    } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Request failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
});
