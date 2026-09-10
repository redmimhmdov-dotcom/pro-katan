(function () {
    const config = window.SUPABASE_CONFIG;
    const client = window.supabase.createClient(config.url, config.publishableKey);
    const status = document.getElementById("controlStatus");
    async function getProfile(userId) { const result = await client.from("profiles").select("role, active").eq("id", userId).single(); if (result.error) throw result.error; return result.data; }
    async function update(nextStatus) {
        status.textContent = "جار حفظ الحالة...";
        const session = await client.auth.getSession();
        const user = session.data.session?.user;
        if (!user) { status.textContent = "يجب تسجيل الدخول من لوحة الإدارة أولًا."; return; }
        const account = await getProfile(user.id);
        if (!account.active || !["admin", "accountant"].includes(account.role)) { status.textContent = "لا تملك صلاحية تعديل حالة الموقع."; return; }
        const payload = { status: nextStatus, updated_by: user.id, updated_at: new Date().toISOString(), notice_enabled: nextStatus !== "paid" };
        const result = await client.from("site_access_state").update(payload).eq("id", true);
        status.textContent = result.error ? result.error.message : `تم حفظ الحالة: ${nextStatus === "paid" ? "الموقع يعمل" : nextStatus === "hidden" ? "الموقع مخفي" : "إشعار الدفع ظاهر"}.`;
    }
    document.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => update(button.dataset.status)));
})();
