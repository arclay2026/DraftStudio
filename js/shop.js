/* Shop pages (preview): sign in, checkout, order confirmed, account.
   Only the interface: nothing here talks to a server yet. Forms show a
   "preview" note instead of submitting. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Small note at the bottom of the screen
  let toastT = 0;
  const toast = msg => {
    let t = $(".sp-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "sp-toast";
      t.setAttribute("role", "status");
      document.body.append(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 2600);
  };
  const PREVIEW = "Preview only. Nothing is sent, saved or charged yet.";

  // Show / hide password
  $$("[data-eye]").forEach(b => b.addEventListener("click", () => {
    const i = b.parentElement.querySelector("input");
    const show = i.type === "password";
    i.type = show ? "text" : "password";
    b.setAttribute("aria-label", show ? "Hide password" : "Show password");
  }));

  // Forms and actions don't do anything in the preview
  $$("form[data-preview]").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); toast(PREVIEW); }));
  $$("[data-preview-click]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); toast(PREVIEW); }));

  // Copy buttons
  $$("[data-copy]").forEach(b => b.addEventListener("click", () => {
    const done = () => toast(`Copied ${b.dataset.copy}`);
    if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, done); else done();
  }));

  // Radio groups (payment methods)
  $$("[role=radiogroup]").forEach(g => g.addEventListener("click", e => {
    const r = e.target.closest("[role=radio]");
    if (!r) return;
    $$("[role=radio]", g).forEach(x => { x.setAttribute("aria-checked", x === r); x.tabIndex = x === r ? 0 : -1; });
  }));

  // Switches
  $$(".sp-switch").forEach(s => s.addEventListener("click", () => { if (!s.disabled) s.setAttribute("aria-checked", s.getAttribute("aria-checked") !== "true"); }));

  // "Add company details" and similar reveals
  $$("[data-more]").forEach(b => b.addEventListener("click", () => {
    const c = $(`[data-collapse="${b.dataset.more}"]`);
    const open = !c.classList.contains("is-open");
    c.classList.toggle("is-open", open);
    b.setAttribute("aria-expanded", open);
  }));

  /* ---------- Sign in ---------- */
  const au = $("[data-au]");
  if (au) {
    const TEXT = {
      signin: ["Sign in", "Welcome back", "Sign in to download your files, view receipts and manage your saved designs."],
      signup: ["Create account", "Join Draft Studio", "Keep every purchase, certificate and saved design in one place."],
      forgot: ["Password reset", "Forgot your password?", "Enter the email you signed up with and we'll send you a secure link to choose a new one."]
    };
    const show = v => {
      $$(".au-view", au).forEach(x => { x.hidden = x.dataset.view !== v; });
      $("[data-au-eyebrow]").textContent = TEXT[v][0];
      $("[data-au-title]").textContent = TEXT[v][1];
      $("[data-au-sub]").textContent = TEXT[v][2];
      history.replaceState(null, "", v === "signin" ? location.pathname : "#" + v);
      const first = $(`.au-view[data-view="${v}"] input`, au);
      if (first && matchMedia("(pointer: fine)").matches) first.focus({ preventScroll: true });
    };
    $$("[data-goto], [data-goto-out]").forEach(a => a.addEventListener("click", e => { e.preventDefault(); show(a.dataset.goto || a.dataset.gotoOut); }));
    if (TEXT[location.hash.slice(1)]) show(location.hash.slice(1));

    // Live password strength
    const pw = $("[data-pw]"), meter = $("[data-pw-meter]"), label = $("[data-pw-label]");
    const COMMON = ["password", "123456", "qwerty", "letmein", "welcome", "draftstudio", "iloveyou", "admin"];
    if (pw) pw.addEventListener("input", () => {
      const v = pw.value;
      const rules = {
        len: v.length >= 10,
        mix: /[a-z]/.test(v) && /[A-Z]/.test(v),
        num: /[\d\W_]/.test(v),
        common: v.length > 0 && !COMMON.some(c => v.toLowerCase().includes(c))
      };
      Object.entries(rules).forEach(([k, ok]) => $(`[data-rule="${k}"]`).classList.toggle("ok", ok));
      const s = v ? Object.values(rules).filter(Boolean).length : 0;
      meter.dataset.s = s;
      label.textContent = !v ? "Too short" : ["Too weak", "Weak", "Fair", "Good", "Strong"][s];
      label.style.color = s === 4 ? "var(--sp-ok)" : "";
    });
  }

  /* ---------- Checkout ---------- */
  const hold = $("[data-hold]"), holdBar = $("[data-hold-bar]");
  if (hold) {
    const TOTAL = 15 * 60;
    let left = TOTAL;
    const tick = () => {
      hold.textContent = `${String(Math.floor(left / 60)).padStart(2, "0")}:${String(left % 60).padStart(2, "0")}`;
      if (holdBar) holdBar.style.transform = `scaleX(${left / TOTAL})`;
      if (left > 0) left--;
    };
    tick(); setInterval(tick, 1000);
  }
  const agree = $("[data-agree]"), pay = $("[data-pay]");
  if (agree && pay) {
    const sync = () => { pay.disabled = !agree.checked; };
    agree.addEventListener("change", sync); sync();
    pay.addEventListener("click", () => {
      pay.disabled = true;
      pay.innerHTML = '<span class="l"><span class="spin"></span>Connecting to PayFast…</span><span class="amt">R250.00</span>';
      setTimeout(() => { location.href = "thanks.html"; }, 1100);
    });
  }
  const rail = $(".co-rail"), toggle = $(".co-toggle");
  if (rail && toggle) toggle.addEventListener("click", () => {
    const open = rail.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    $("span", toggle).textContent = open ? "Hide order summary" : "Show order summary";
  });

  /* ---------- Order page: live invoice status ---------- */
  // The page shows one of four states, from the order's status on the server:
  // paid, pending (awaiting payment), failed or refunded. Elements carry
  // data-show="paid pending …" and CSS shows only those matching the state.
  // In the preview, the bar at the bottom switches between them.
  const ty = $("[data-ty]");
  if (ty) {
    const box = $("[data-ty-paid]"), wait = $("[data-ty-wait]");
    const steps = $$("[data-ty-steps] li"), bar = $$(".sp-steps li");
    const TITLE = { paid: "Payment successful", pending: "Waiting for payment", failed: "Payment failed", refunded: "Order refunded" };
    const tick = bar[0] ? $("b", bar[0]).innerHTML : "";
    const setState = st => {
      box.dataset.status = st;
      $$("[data-demo]").forEach(b => b.setAttribute("aria-pressed", b.dataset.demo === st));
      document.title = `${TITLE[st]} · Draft Studio`;
      // top bar: all steps done once paid; otherwise still on Payment
      bar.forEach((li, i) => {
        const done = st === "paid" || st === "refunded" ? true : i === 0;
        const on = !done && i === 1;
        li.className = done ? "is-done" : on ? "is-on" : "";
        $("b", li).innerHTML = done ? tick : String(i + 1);
      });
      const u = new URL(location.href); u.searchParams.set("state", st); history.replaceState(null, "", u);
    };
    const show = st => { wait.hidden = true; box.hidden = false; setState(st); };
    const run = () => {
      box.hidden = true; wait.hidden = false;
      steps.forEach(s => s.classList.remove("ok"));
      steps.forEach((s, i) => setTimeout(() => s.classList.add("ok"), 500 + i * 650));
      setTimeout(() => { show("paid"); scrollTo(0, 0); }, 500 + steps.length * 650 + 300);
    };
    const start = new URLSearchParams(location.search).get("state");
    if (TITLE[start]) show(start); else run();
    $$("[data-demo]").forEach(b => b.addEventListener("click", () => show(b.dataset.demo)));
    const replay = $("[data-ty-replay]");
    replay && replay.addEventListener("click", e => { e.preventDefault(); run(); });
  }

  /* ---------- Account ---------- */
  const ac = $("[data-ua]");
  if (ac) {
    const tabs = $$(".sp-tabs [data-tab]", ac);
    const open = id => {
      if (!$(`[data-panel="${id}"]`, ac)) id = "overview";
      tabs.forEach(b => b.setAttribute("aria-selected", b.dataset.tab === id));
      $$("[data-panel]", ac).forEach(p => { p.hidden = p.dataset.panel !== id; });
      history.replaceState(null, "", "#" + id);
    };
    tabs.forEach(b => b.addEventListener("click", () => open(b.dataset.tab)));
    $$("[data-tab-link]", ac).forEach(a => a.addEventListener("click", e => { e.preventDefault(); open(a.dataset.tabLink); scrollTo({ top: 0, behavior: "smooth" }); }));
    open(location.hash.slice(1) || "overview");

    // Settings menu: highlight the section in view
    const links = $$(".st-nav a", ac);
    links.forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      const t = $(a.getAttribute("href"));
      t && t.scrollIntoView({ behavior: "smooth", block: "start" });
      links.forEach(x => x.classList.toggle("is-on", x === a));
    }));

    // Wishlist: built from the real catalogue so it matches the live site
    const wl = $("[data-wishlist]");
    if (wl && window.DS) {
      const items = DS.items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const sm = src => src.replace(/^previews\//, "previews/sm/").replace(/\.(jpe?g|png)$/i, ".webp");
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const SAVED = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/></svg>';
      wl.innerHTML = items.map(it => {
        const sold = it.id === "mato-logo"; // example of how a sold logo looks
        const paid = !!it.price;
        const chip = sold ? '<span class="sp-chip is-dark">SOLD</span>' : paid ? '<span class="sp-chip is-dark">1 OF 1</span>' : "";
        const status = sold ? '<span class="sp-status is-off">Sold to another buyer</span>' : paid ? '<span class="sp-status is-warn">Available · 1 left</span>' : '<span class="sp-status">Free download</span>';
        const price = paid ? `${it.priceFrom ? "From " : ""}${esc(it.price)}<small>${it.date ? "Saved " + new Date(it.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short" }) : ""}</small>` : "Free";
        const buy = sold ? "" : `<a class="sp-btn is-sm is-primary is-block wl-buy" href="${paid ? "checkout.html" : "item.html?id=" + encodeURIComponent(it.id)}">${paid ? "Buy now" : "Download"}</a>`;
        return `<article class="wl-card${sold ? " is-sold" : ""}">
          <div class="wl-img"><img src="${sm(it.preview)}" onerror="this.onerror=null;this.src='${esc(it.preview)}'" alt="" loading="lazy">${chip}${buy}</div>
          <button class="wl-save" type="button" aria-label="Remove from wishlist" data-unsave>${SAVED}</button>
          <div class="wl-body"><div><b>${esc(it.title.split(" — ")[0])}</b><small>${status}</small></div><span class="wl-price">${price}</span></div>
        </article>`;
      }).join("");
      const count = $("[data-wl-n]");
      const recount = () => { if (count) count.textContent = $$(".wl-card", wl).length; };
      recount();
      wl.addEventListener("click", e => {
        const h = e.target.closest("[data-unsave]");
        if (!h) return;
        const card = h.closest(".wl-card");
        card.style.transition = "opacity .25s, transform .25s";
        card.style.opacity = "0"; card.style.transform = "scale(.97)";
        setTimeout(() => { card.remove(); recount(); }, 250);
        toast("Removed from your wishlist");
      });
    }
  }
})();
