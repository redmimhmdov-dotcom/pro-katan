(function () {
    const config = window.SUPABASE_CONFIG;
    if (!config) return;
    const key = "kb-cart";
    const getCart = () => JSON.parse(localStorage.getItem(key) || "[]");
    const saveCart = (cart) => { localStorage.setItem(key, JSON.stringify(cart)); render(); };
    const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

    function add(slug, title) {
        const cart = getCart();
        const item = cart.find((entry) => entry.slug === slug);
        if (item) item.quantity += 1;
        else cart.push({ slug, title, quantity: 1 });
        saveCart(cart);
    }

    function render() {
        const cart = getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);
        let button = document.getElementById("floatingCart");
        if (!button) {
            button = document.createElement("button");
            button.id = "floatingCart";
            button.className = "floating-cart";
            button.type = "button";
            button.addEventListener("click", open);
            document.body.appendChild(button);
        }
        button.textContent = `سلة الطلبات (${count})`;
        button.hidden = count === 0;
    }

    function open() {
        let panel = document.getElementById("cartPanel");
        if (!panel) {
            panel = document.createElement("div");
            panel.id = "cartPanel";
            panel.className = "cart-panel";
            document.body.appendChild(panel);
        }
        const cart = getCart();
        panel.innerHTML = `<div class="cart-dialog" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
      <button class="cart-close" type="button" aria-label="إغلاق">×</button>
      <h2 id="cartTitle">سلة الطلبات</h2>
      <div class="cart-items">${cart.map((item, index) => `<div class="cart-row"><span>${esc(item.title)}</span><label>الكمية <input data-cart-index="${index}" type="number" min="1" value="${item.quantity}"></label><button data-remove-index="${index}" type="button">حذف</button></div>`).join("") || "<p>السلة فارغة.</p>"}</div>
      ${cart.length ? `<form id="cartForm" class="cart-form"><input name="name" placeholder="الاسم الكامل" required><input name="phone" placeholder="رقم الهاتف" required><input name="address" placeholder="العنوان" required><input name="code" placeholder="كود الزبون (اختياري)"><textarea name="notes" placeholder="ملاحظات إضافية"></textarea><button class="btn btn-primary" type="button" id="locationButton">تحديد موقعي المباشر</button><p id="locationStatus" class="cart-status">يجب تحديد الموقع قبل الإرسال.</p><input type="hidden" name="latitude"><input type="hidden" name="longitude"><button class="btn btn-primary" type="submit">إرسال الطلبية</button><p id="cartStatus" class="cart-status"></p></form>` : ""}
    </div>`;
        panel.classList.add("open");
        panel.querySelector(".cart-close").addEventListener("click", () => panel.classList.remove("open"));
        panel.addEventListener("click", (event) => { if (event.target === panel) panel.classList.remove("open"); }, { once: true });
        panel.querySelectorAll("[data-cart-index]").forEach((input) => input.addEventListener("change", () => { const next = getCart(); next[input.dataset.cartIndex].quantity = Math.max(1, Number(input.value) || 1); saveCart(next); open(); }));
        panel.querySelectorAll("[data-remove-index]").forEach((button) => button.addEventListener("click", () => { const next = getCart(); next.splice(Number(button.dataset.removeIndex), 1); saveCart(next); open(); }));
        const locationButton = panel.querySelector("#locationButton");
        if (locationButton) locationButton.addEventListener("click", () => navigator.geolocation.getCurrentPosition((position) => { panel.querySelector('[name="latitude"]').value = position.coords.latitude; panel.querySelector('[name="longitude"]').value = position.coords.longitude; panel.querySelector("#locationStatus").textContent = "تم تحديد الموقع بنجاح."; }, () => { panel.querySelector("#locationStatus").textContent = "تعذر تحديد الموقع. اسمح بالوصول للموقع ثم حاول مجددًا." }));
        const form = panel.querySelector("#cartForm");
        if (form) form.addEventListener("submit", submit);
    }

    async function submit(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form));
        const status = form.querySelector("#cartStatus");
        if (!values.latitude || !values.longitude) { status.textContent = "لا يمكن إرسال الطلب قبل تحديد الموقع المباشر."; return; }
        status.textContent = "جار إرسال الطلب...";
        const cart = getCart();
        const base = `${config.url}/rest/v1`;
        const headers = { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, "Content-Type": "application/json", Prefer: "return=representation" };
        const orderResponse = await fetch(`${base}/orders`, { method: "POST", headers, body: JSON.stringify({ customer_name: values.name, customer_phone: values.phone, customer_address: values.address, customer_code: values.code || null, latitude: Number(values.latitude), longitude: Number(values.longitude), notes: values.notes || null }) });
        if (!orderResponse.ok) { status.textContent = "تعذر إرسال الطلب. حاول لاحقًا."; return; }
        const [order] = await orderResponse.json();
        const itemsResponse = await fetch(`${base}/order_items`, { method: "POST", headers, body: JSON.stringify(cart.map((item) => ({ order_id: order.id, product_slug: item.slug, quantity: item.quantity, unit_price: 0 }))) });
        if (!itemsResponse.ok) { status.textContent = "تم تسجيل الطلب لكن تعذر حفظ تفاصيل المواد."; return; }
        localStorage.removeItem(key);
        status.textContent = "تم إرسال الطلبية، سيتم التواصل معكم على واتساب من أجلها.";
        setTimeout(() => { location.href = "index.html"; }, 2200);
    }

    document.addEventListener("click", (event) => { const trigger = event.target.closest("[data-cart-slug]"); if (trigger) add(trigger.dataset.cartSlug, trigger.dataset.cartTitle); });
    document.addEventListener("DOMContentLoaded", render);
    document.addEventListener("site:ready", render);
    document.addEventListener("site:refresh", render);
})();
