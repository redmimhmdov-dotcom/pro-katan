(function () {
    const config = window.SUPABASE_CONFIG;
    if (!config || location.pathname.endsWith("payment.html") || location.pathname.endsWith("payment-control.html")) return;
    const client = window.supabase.createClient(config.url, config.publishableKey);
    const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
    const formatTime = (seconds) => `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    let timer;

    function removeGate() { document.getElementById("siteAccessGate")?.remove(); document.body.classList.remove("site-access-blocked"); clearInterval(timer); }
    function showGate(state) {
        document.body.classList.add("site-access-blocked");
        const gate = document.createElement("div");
        gate.id = "siteAccessGate";
        gate.className = "site-access-gate";
        gate.innerHTML = `<div class="site-access-dialog"><div class="eyebrow">TAHWAL DIGITAL</div><h1>الموقع في وضع التجربة</h1><p>${escapeHtml(state.notice_message)}</p><p class="site-access-countdown" id="siteAccessCountdown"></p><a class="btn btn-primary" href="payment.html">معلومات الدفع وإرفاق الإيصال</a></div>`;
        document.body.appendChild(gate);
        const countdown = document.getElementById("siteAccessCountdown");
        const expires = new Date(state.trial_expires_at).getTime();
        const tick = () => { const left = Math.max(0, Math.floor((expires - Date.now()) / 1000)); countdown.textContent = left ? `ينتهي العرض التجريبي خلال ${formatTime(left)}` : "انتهت مدة التجربة. يرجى إتمام الدفع."; };
        tick(); timer = setInterval(tick, 1000);
    }
    function showBanner(state) {
        const banner = document.createElement("div");
        banner.className = "site-access-banner";
        banner.innerHTML = `<span>تجريبي لمدة 24 ساعة: يرجى تأكيد الدفع لتفعيل النسخة النهائية.</span><a href="payment.html">معلومات الدفع</a>`;
        document.body.prepend(banner);
    }
    async function load() {
        const result = await client.from("site_access_state").select("status, trial_expires_at, notice_enabled, notice_message").eq("id", true).single();
        if (result.error || !result.data) return;
        const state = result.data;
        if (state.status === "paid") { removeGate(); return; }
        if (state.notice_enabled) showBanner(state);
        if (state.status === "hidden" || (state.status === "trial" && new Date(state.trial_expires_at) <= new Date())) showGate(state);
    }
    document.addEventListener("DOMContentLoaded", load);
})();
