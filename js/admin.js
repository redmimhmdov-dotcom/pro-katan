(function () {
    const config = window.SUPABASE_CONFIG;
    const root = document.getElementById("adminRoot");
    const client = window.supabase.createClient(config.url, config.publishableKey);
    let currentUser;

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
    }

    function renderLogin(message = "") {
        root.innerHTML = `
      <main class="admin-login">
        <div class="admin-panel-card">
          <div class="eyebrow">KATANBUILD ACCOUNTING</div>
          <h1>دخول لوحة المحاسبة</h1>
          <p class="admin-user">يتم التحقق من الحساب والصلاحيات عبر Supabase.</p>
          <form id="loginForm">
            <label class="admin-field">البريد الإلكتروني<input id="email" type="email" autocomplete="username" required /></label>
            <label class="admin-field">كلمة المرور<input id="password" type="password" autocomplete="current-password" required /></label>
            <button class="btn btn-primary" type="submit">دخول آمن</button>
            <p id="loginMessage" class="admin-message" role="alert">${escapeHtml(message)}</p>
          </form>
        </div>
      </main>`;
        document.getElementById("loginForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const message = document.getElementById("loginMessage");
            message.textContent = "جار تسجيل الدخول...";
            const { error } = await client.auth.signInWithPassword({
                email: document.getElementById("email").value.trim(),
                password: document.getElementById("password").value
            });
            if (error) message.textContent = error.message;
            else await loadApp();
        });
    }

    async function getProfile(userId) {
        const { data, error } = await client.from("profiles").select("full_name, role, active").eq("id", userId).maybeSingle();
        if (error) throw error;
        return data;
    }

    function renderApp(profile) {
        root.innerHTML = `
      <div class="admin-shell">
        <aside class="admin-sidebar">
          <a class="admin-brand" href="index.html"><img src="assets/katanbuild-logo.png" alt="katanbuild" /><span>لوحة المحاسبة</span></a>
          <nav class="admin-nav" aria-label="أقسام لوحة المحاسبة">
            <button class="active" data-view="dashboard">نظرة عامة</button>
            <button data-view="orders">الطلبات</button>
            <button data-view="products">المنتجات والأسعار</button>
            <button data-view="invoices">الفواتير</button>
            <button data-view="inventory">المستودع</button>
            <button data-view="users">المستخدمون</button>
          </nav>
        </aside>
        <main class="admin-main">
          <header class="admin-topbar">
            <div><div class="eyebrow">CONTROL CENTER</div><h1 id="viewTitle">نظرة عامة</h1></div>
            <div><span class="admin-user">${escapeHtml(profile.full_name || currentUser.email)} · ${escapeHtml(profile.role)}</span> <button id="logout" class="btn btn-outline" type="button">خروج</button></div>
          </header>
          <section id="viewContent"></section>
        </main>
      </div>`;
        document.getElementById("logout").addEventListener("click", async () => { await client.auth.signOut(); renderLogin(); });
        document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.view)));
        switchView("dashboard");
    }

    async function count(table) {
        const { count: total, error } = await client.from(table).select("id", { count: "exact", head: true });
        if (error) throw error;
        return total || 0;
    }

    async function switchView(view) {
        const titles = { dashboard: "نظرة عامة", orders: "الطلبات", products: "المنتجات والأسعار", invoices: "الفواتير", inventory: "المستودع", users: "المستخدمون" };
        document.getElementById("viewTitle").textContent = titles[view];
        document.querySelectorAll("[data-view]").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
        const content = document.getElementById("viewContent");
        content.innerHTML = `<div class="admin-panel-card"><p>جار تحميل البيانات...</p></div>`;
        try {
            if (view === "dashboard") await renderDashboard(content);
            else if (view === "orders") await renderOrders(content);
            else if (view === "products") await renderProducts(content);
            else content.innerHTML = `<div class="admin-panel-card"><h2>${titles[view]}</h2><p>هذا القسم جاهز للربط بالعمليات التالية بعد اعتماد الجداول والبيانات.</p></div>`;
        } catch (error) {
            content.innerHTML = `<div class="admin-panel-card"><p class="admin-message">تعذر تحميل البيانات: ${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function renderDashboard(content) {
        const [products, customers, orders, invoices] = await Promise.all([count("products"), count("customers"), count("orders"), count("invoices")]);
        content.innerHTML = `<div class="admin-grid"><div class="admin-stat"><span>المنتجات</span><strong>${products}</strong></div><div class="admin-stat"><span>الزبائن</span><strong>${customers}</strong></div><div class="admin-stat"><span>الطلبات</span><strong>${orders}</strong></div><div class="admin-stat"><span>الفواتير</span><strong>${invoices}</strong></div></div><div class="admin-panel-card"><h2>حالة النظام</h2><p>تم تسجيل الدخول عبر Supabase، وتُحمى بيانات الإدارة بسياسات RLS.</p></div>`;
    }

    async function renderOrders(content) {
        const { data, error } = await client.from("orders").select("id, customer_name, customer_phone, status, submitted_at").order("submitted_at", { ascending: false }).limit(30);
        if (error) throw error;
        content.innerHTML = `<div class="admin-panel-card"><h2>آخر الطلبات</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>العميل</th><th>الهاتف</th><th>الحالة</th><th>التاريخ</th></tr></thead><tbody>${(data || []).map((order) => `<tr><td>${escapeHtml(order.customer_name)}</td><td>${escapeHtml(order.customer_phone)}</td><td>${escapeHtml(order.status)}</td><td>${new Date(order.submitted_at).toLocaleString("ar-SY")}</td></tr>`).join("") || "<tr><td colspan=\"4\">لا توجد طلبات بعد.</td></tr>"}</tbody></table></div></div>`;
    }

    async function renderProducts(content) {
        const { data, error } = await client.from("products").select("name_ar, sku, price, currency, stock_quantity, active").order("created_at", { ascending: false }).limit(50);
        if (error) throw error;
        content.innerHTML = `<div class="admin-panel-card"><h2>قائمة المنتجات</h2><div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>المادة</th><th>الرمز</th><th>السعر</th><th>المخزون</th><th>نشط</th></tr></thead><tbody>${(data || []).map((product) => `<tr><td>${escapeHtml(product.name_ar)}</td><td>${escapeHtml(product.sku || "-")}</td><td>${product.price} ${escapeHtml(product.currency)}</td><td>${product.stock_quantity}</td><td>${product.active ? "نعم" : "لا"}</td></tr>`).join("") || "<tr><td colspan=\"5\">أضف المنتجات من قاعدة البيانات أولًا.</td></tr>"}</tbody></table></div></div>`;
    }

    async function loadApp() {
        const { data: sessionData } = await client.auth.getSession();
        currentUser = sessionData.session?.user;
        if (!currentUser) return renderLogin();
        const profile = await getProfile(currentUser.id);
        if (!profile || !profile.active || !["admin", "accountant", "sales_rep", "viewer"].includes(profile.role)) {
            await client.auth.signOut();
            return renderLogin("الحساب غير مخول للوصول إلى لوحة المحاسبة.");
        }
        renderApp(profile);
    }

    loadApp().catch((error) => renderLogin(`تعذر الاتصال بقاعدة البيانات: ${error.message}`));
})();
