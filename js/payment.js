(function () {
    const config = window.SUPABASE_CONFIG;
    const client = window.supabase.createClient(config.url, config.publishableKey);
    const form = document.getElementById("paymentForm");
    const status = document.getElementById("paymentStatus");
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(form));
        const file = values.receipt;
        if (!file || !file.size) { status.textContent = "اختر صورة الإيصال أولًا."; return; }
        if (file.size > 5 * 1024 * 1024) { status.textContent = "حجم الإيصال يجب ألا يتجاوز 5 ميغابايت."; return; }
        status.textContent = "جار رفع الإيصال...";
        const safeName = file.name.replace(/[^a-z0-9._-]/gi, "-");
        const path = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
        const upload = await client.storage.from("payment-receipts").upload(path, file, { upsert: false });
        if (upload.error) { status.textContent = "تعذر رفع الإيصال. حاول مجددًا."; return; }
        const submission = await client.from("payment_submissions").insert({ invoice_reference: values.invoice_reference, payer_name: values.payer_name, payer_phone: values.payer_phone, amount: Number(values.amount), currency: values.currency, receipt_path: path });
        if (submission.error) { status.textContent = "تم رفع الملف لكن تعذر تسجيل الطلب. تواصل معنا مباشرة."; return; }
        form.reset();
        status.textContent = "تم استلام الإيصال، وسيتم التواصل معكم بعد التحقق من التحويل.";
    });
})();
