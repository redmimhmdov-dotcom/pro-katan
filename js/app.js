/* katanbuild — app shell: theme, language, header/footer, i18n */
(function () {
  const S = window.SITE;
  const DEFAULT_MEDIA = JSON.parse(JSON.stringify(S.media));

  function getLang() { return localStorage.getItem("em-lang") || "ar"; }
  function getTheme() { return localStorage.getItem("em-theme") || "dark"; }

  function t(key) {
    const lang = getLang();
    return (S.translations[lang] && S.translations[lang][key]) || key;
  }
  window.t = t;
  window.currentLang = getLang;

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("em-theme", theme);
  }

  function applyLang(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("em-lang", lang);
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const [attr, key] = el.getAttribute("data-i18n-attr").split(":");
      el.setAttribute(attr, t(key));
    });
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      const theme = getTheme();
      themeBtn.querySelector(".icon-btn-label").textContent =
        theme === "dark" ? t("theme_light") : t("theme_dark");
    }
  }

  function activeNavKey() {
    const file = (location.pathname.split("/").pop() || "index.html").split("?")[0];
    if (file.startsWith("product") && file !== "products.html") return "products";
    if (file === "products.html") return "products";
    if (file === "projects.html") return "projects";
    if (file === "about.html") return "about";
    return "home";
  }

  function buildHeader() {
    const active = activeNavKey();
    const navHtml = S.nav
      .map(
        (n) =>
          `<a href="${n.href}" class="${n.key === active ? "active" : ""}" data-i18n="nav_${n.key}"></a>`
      )
      .join("");
    return `
    <div class="container">
      <a href="index.html" class="brand" id="brandTrigger" title="katanbuild">
        <img src="${S.logo}" alt="${S.brand}" />
        <span>${S.brand}</span>
      </a>
      <nav class="main-nav" id="mainNav">${navHtml}</nav>
      <div class="header-actions">
        <button class="icon-btn" id="langToggle" type="button">
          <span data-i18n="lang_switch"></span>
        </button>
        <button class="icon-btn" id="themeToggle" type="button">
          <span class="icon-btn-label"></span>
        </button>
        <button class="nav-toggle" id="navToggle" type="button" aria-label="menu">☰</button>
      </div>
    </div>`;
  }

  function buildFooter() {
    const catLinks = S.products
      .map((p) => `<li><a href="product.html?slug=${p.slug}" class="prod-name" data-slug="${p.slug}"></a></li>`)
      .join("");
    return `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="brand" style="margin-bottom:14px;">
            <img src="${S.logo}" alt="${S.brand}" />
            <span>${S.brand}</span>
          </div>
          <p data-i18n="footer_about_d" style="color:var(--text-muted);font-size:.92rem;max-width:38ch;"></p>
        </div>
        <div>
          <h4 data-i18n="footer_links"></h4>
          <ul>
            <li><a href="index.html" data-i18n="nav_home"></a></li>
            <li><a href="products.html" data-i18n="nav_products"></a></li>
            <li><a href="projects.html" data-i18n="nav_projects"></a></li>
            <li><a href="about.html" data-i18n="nav_about"></a></li>
          </ul>
        </div>
        <div>
          <h4 data-i18n="footer_categories"></h4>
          <ul>${catLinks}</ul>
        </div>
        <div>
          <h4 data-i18n="footer_contact"></h4>
          <ul class="mono" style="font-size:.86rem;color:var(--text-muted);">
            <li><a href="tel:${S.site.phone}">${S.site.phone}</a></li>
            <li>${S.site.email}</li>
            <li class="addr"></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span id="year"></span> ${S.brand} — <span data-i18n="rights"></span></span>
        <span class="footer-credit">تصميم وبرمجة من قبل محمد الحسين <a href="tel:+9630952725590">0952725590</a></span>
      </div>
    </div>`;
  }

  function fillFooterDynamic() {
    const lang = getLang();
    document.querySelectorAll(".prod-name").forEach((el) => {
      const p = S.products.find((x) => x.slug === el.dataset.slug);
      if (p) el.textContent = p.category[lang];
    });
    const addr = document.querySelector(".addr");
    if (addr) addr.textContent = S.site.address[lang];
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function wireControls() {
    const langBtn = document.getElementById("langToggle");
    if (langBtn) {
      langBtn.addEventListener("click", () => {
        applyLang(getLang() === "ar" ? "en" : "ar");
        refresh();
      });
    }
    const themeBtn = document.getElementById("themeToggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        applyTheme(getTheme() === "dark" ? "light" : "dark");
        applyI18n();
      });
    }
    const navToggle = document.getElementById("navToggle");
    if (navToggle) {
      navToggle.addEventListener("click", () => {
        document.getElementById("mainNav").classList.toggle("open");
      });
    }
    wireAdminTrigger();
  }

  function getMedia() {
    try {
      const saved = JSON.parse(localStorage.getItem("kb-media") || "null");
      if (saved && Array.isArray(saved.heroSlides)) return {
        ...S.media,
        ...saved,
        productImages: saved.productImages || S.media.productImages,
        projectImages: saved.projectImages || S.media.projectImages
      };
    } catch (error) { }
    return S.media;
  }

  function setMedia(media) {
    S.media = media;
    localStorage.setItem("kb-media", JSON.stringify(media));
    document.documentElement.style.setProperty("--site-bg-image", `url("${mediaUrl(media.background)}")`);
    document.dispatchEvent(new CustomEvent("site:media", { detail: media }));
  }

  function mediaUrl(path) {
    try { return new URL(path, document.baseURI).href; } catch (error) { return path; }
  }

  function wireAdminTrigger() {
    const trigger = document.getElementById("brandTrigger");
    if (!trigger || trigger.dataset.adminReady) return;
    trigger.dataset.adminReady = "true";
    let clicks = 0;
    let timer;
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 1800);
      if (clicks < 5) return;
      event.preventDefault();
      clicks = 0;
      openAdminPanel();
    });
  }

  function openAdminPanel() {
    if (!document.getElementById("adminPanel")) buildAdminPanel();
    document.getElementById("adminPanel").classList.add("open");
  }

  function buildAdminPanel() {
    const panel = document.createElement("div");
    panel.id = "adminPanel";
    panel.className = "admin-panel";
    panel.innerHTML = `
      <div class="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="adminTitle">
        <button class="admin-close" id="adminClose" type="button" aria-label="close">×</button>
        <div class="eyebrow">KATANBUILD CONTROL</div>
        <h2 id="adminTitle">لوحة التحكم</h2>
        <div id="adminLogin">
          <p class="admin-hint">أدخل كلمة المرور للوصول إلى إعدادات الصور والمحتوى.</p>
          <label>كلمة المرور<input id="adminPassword" type="password" inputmode="numeric" autocomplete="off" /></label>
          <button class="btn btn-primary" id="adminUnlock" type="button">دخول</button>
          <p class="admin-error" id="adminError" role="alert"></p>
        </div>
        <form id="adminForm" class="admin-form" hidden>
          <p class="admin-hint">يمكنك تغيير صورة كل شريحة برفع ملف أو وضع رابط مباشر، ثم تعديل العنوان والتلميح.</p>
          <div id="adminSlides"></div>
          <label>صورة خلفية الموقع<input id="adminBackground" type="text" placeholder="https://example.com/background.jpg" /></label>
          <div class="admin-actions"><button class="btn btn-primary" type="submit">حفظ التغييرات</button><button class="btn btn-outline" id="adminReset" type="button">إعادة الافتراضي</button></div>
          <p class="admin-status" id="adminStatus" role="status"></p>
        </form>
      </div>`;
    document.body.appendChild(panel);
    document.getElementById("adminClose").addEventListener("click", closeAdminPanel);
    panel.addEventListener("click", (event) => { if (event.target === panel) closeAdminPanel(); });
    document.getElementById("adminUnlock").addEventListener("click", unlockAdmin);
    document.getElementById("adminPassword").addEventListener("keydown", (event) => { if (event.key === "Enter") unlockAdmin(); });
    document.getElementById("adminForm").addEventListener("submit", saveAdmin);
    document.getElementById("adminReset").addEventListener("click", () => { localStorage.removeItem("kb-media"); setMedia(JSON.parse(JSON.stringify(DEFAULT_MEDIA))); renderAdminForm(S.media); setAdminStatus("تمت استعادة الإعدادات الافتراضية."); });
  }

  function closeAdminPanel() { document.getElementById("adminPanel")?.classList.remove("open"); }

  function unlockAdmin() {
    const password = document.getElementById("adminPassword").value;
    if (password !== "1992") { document.getElementById("adminError").textContent = "كلمة المرور غير صحيحة."; return; }
    document.getElementById("adminLogin").hidden = true;
    document.getElementById("adminForm").hidden = false;
    renderAdminForm(getMedia());
  }

  function renderAdminForm(media) {
    const host = document.getElementById("adminSlides");
    host.innerHTML = media.heroSlides.map((slide, index) => `
      <fieldset class="admin-slide" data-slide="${index}">
        <legend>الشريحة ${index + 1}</legend>
        <label>رابط الصورة أو المسار المحلي<input class="slide-image" type="text" value="${slide.image}" /></label>
        <label>رفع صورة<input class="slide-file" type="file" accept="image/*" /></label>
        <label>العنوان<input class="slide-title-ar" value="${slide.title.ar}" /></label>
        <label>Title<input class="slide-title-en" value="${slide.title.en}" /></label>
        <label>التلميح<textarea class="slide-hint-ar" rows="2">${slide.hint.ar}</textarea></label>
        <label>Hint<textarea class="slide-hint-en" rows="2">${slide.hint.en}</textarea></label>
      </fieldset>`).join("");
    document.getElementById("adminBackground").value = media.background;
    host.querySelectorAll(".slide-file").forEach((input) => input.addEventListener("change", () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.addEventListener("load", () => { input.closest("fieldset").querySelector(".slide-image").value = reader.result; });
      reader.readAsDataURL(file);
    }));
  }

  function saveAdmin(event) {
    event.preventDefault();
    const media = {
      heroSlides: [...document.querySelectorAll(".admin-slide")].map((fieldset) => ({
        image: fieldset.querySelector(".slide-image").value.trim(),
        eyebrow: { ar: "مواد بناء متخصصة", en: "Specialized building chemicals" },
        title: { ar: fieldset.querySelector(".slide-title-ar").value, en: fieldset.querySelector(".slide-title-en").value },
        hint: { ar: fieldset.querySelector(".slide-hint-ar").value, en: fieldset.querySelector(".slide-hint-en").value },
        primaryLabel: { ar: "استعرض المنتجات", en: "Browse products" }, primaryHref: "products.html",
        secondaryLabel: { ar: "شاهد المشاريع", en: "See projects" }, secondaryHref: "projects.html"
      })), background: document.getElementById("adminBackground").value.trim() || S.media.background
    };
    setMedia(media);
    setAdminStatus("تم حفظ التغييرات.");
  }

  function setAdminStatus(message) { document.getElementById("adminStatus").textContent = message; }

  function refresh() {
    applyI18n();
    fillFooterDynamic();
    document.dispatchEvent(new CustomEvent("site:refresh", { detail: { lang: getLang() } }));
  }

  function mount() {
    S.media = getMedia();
    document.documentElement.style.setProperty("--site-bg-image", `url("${mediaUrl(S.media.background)}")`);
    applyTheme(getTheme());
    applyLang(getLang());

    const headerEl = document.getElementById("site-header");
    const footerEl = document.getElementById("site-footer");
    if (headerEl) headerEl.innerHTML = buildHeader();
    if (footerEl) footerEl.innerHTML = buildFooter();

    wireControls();
    refresh();
    document.dispatchEvent(new CustomEvent("site:ready", { detail: { lang: getLang() } }));
  }

  document.addEventListener("DOMContentLoaded", mount);
})();
