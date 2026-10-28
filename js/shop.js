/* Shop pages (preview): sign in, checkout, payment result, account.
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
  const PREVIEW = "Preview only. Nothing is sent or saved yet.";

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

  /* ---------- Sign in ---------- */
  const au = $("[data-au]");
  if (au) {
    const TEXT = {
      signin: ["Sign in to Draft Studio", "Welcome back. Use your email or Google."],
      signup: ["Create your account", "Keep your purchases and saved designs in one place."],
      forgot: ["Reset your password", "We'll email you a link to choose a new one."]
    };
    const show = v => {
      $$(".au-view", au).forEach(x => { x.hidden = x.dataset.view !== v; });
      $("h1", au).textContent = TEXT[v][0];
      $(".au-sub", au).textContent = TEXT[v][1];
      history.replaceState(null, "", v === "signin" ? location.pathname : "#" + v);
      const first = $(`.au-view[data-view="${v}"] input`, au);
      if (first && matchMedia("(pointer: fine)").matches) first.focus({ preventScroll: true });
    };
    $$("[data-goto]", au).forEach(a => a.addEventListener("click", e => { e.preventDefault(); show(a.dataset.goto); }));
    if (TEXT[location.hash.slice(1)]) show(location.hash.slice(1));
  }

  /* ---------- Checkout ---------- */
  const hold = $("[data-hold]");
  if (hold) {
    let left = 15 * 60;
    const tick = () => {
      hold.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
      if (left > 0) left--;
    };
    tick(); setInterval(tick, 1000);
  }
  $$("[role=radiogroup]").forEach(g => g.addEventListener("click", e => {
    const r = e.target.closest("[role=radio]");
    if (!r) return;
    $$("[role=radio]", g).forEach(x => { x.setAttribute("aria-checked", x === r); x.tabIndex = x === r ? 0 : -1; });
  }));
  const agree = $("[data-agree]"), pay = $("[data-pay]");
  if (agree && pay) {
    const sync = () => { pay.disabled = !agree.checked; };
    agree.addEventListener("change", sync); sync();
    pay.addEventListener("click", () => { pay.innerHTML = '<span class="ty-spin" style="width:16px;height:16px;margin:0;border-width:2px;border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>Redirecting to PayFast…'; setTimeout(() => { location.href = "thanks.html"; }, 900); });
  }
  const sum = $(".co-sum"), toggle = $(".co-toggle");
  if (sum && toggle) toggle.addEventListener("click", () => {
    const open = sum.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
    $("span", toggle).textContent = open ? "Hide order summary" : "Show order summary";
  });

  /* ---------- Payment result ---------- */
  const ty = $("[data-ty]");
  if (ty) {
    const paid = () => { $("[data-ty-wait]").hidden = true; $("[data-ty-paid]").hidden = false; };
    if (new URLSearchParams(location.search).get("state") === "paid") paid();
    else setTimeout(paid, 2200);
    const replay = $("[data-ty-replay]");
    replay && replay.addEventListener("click", e => {
      e.preventDefault();
      $("[data-ty-paid]").hidden = true; $("[data-ty-wait]").hidden = false;
      setTimeout(paid, 2200);
    });
  }

  /* ---------- Account ---------- */
  const ac = $("[data-ua]");
  if (ac) {
    const tabs = $$(".ua-tabs [data-tab]", ac);
    const open = id => {
      if (!$(`[data-panel="${id}"]`, ac)) id = "purchases";
      tabs.forEach(b => b.setAttribute("aria-selected", b.dataset.tab === id));
      $$("[data-panel]", ac).forEach(p => { p.hidden = p.dataset.panel !== id; });
      history.replaceState(null, "", "#" + id);
    };
    tabs.forEach(b => b.addEventListener("click", () => open(b.dataset.tab)));
    open(location.hash.slice(1) || "purchases");

    // Wishlist: built from the real catalogue so it matches the live site
    const wl = $("[data-wishlist]");
    if (wl && window.DS) {
      const items = DS.items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const sm = src => src.replace(/^previews\//, "previews/sm/").replace(/\.(jpe?g|png)$/i, ".webp");
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const SAVED = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/></svg>';
      wl.innerHTML = items.map(it => {
        const sold = it.id === "mato-logo"; // example of how a sold logo looks
        const kind = it.price ? "Exclusive logo" : it.category.replace(/s$/, "") + " · Free";
        const price = it.price ? `${it.priceFrom ? "From " : ""}${esc(it.price)}` : "Free";
        return `<article class="wl-card${sold ? " is-sold" : ""}">
          <a class="wl-img" href="${it.price && !sold ? "checkout.html" : "item.html?id=" + encodeURIComponent(it.id)}"><img src="${sm(it.preview)}" onerror="this.onerror=null;this.src='${esc(it.preview)}'" alt="" loading="lazy"></a>
          ${sold ? '<span class="wl-sold">Sold</span>' : ""}
          <button class="wl-save" type="button" aria-label="Remove from wishlist" data-unsave>${SAVED}</button>
          <div class="wl-body"><div><b>${esc(it.title.split(" — ")[0])}</b><small>${sold ? "No longer available" : kind}</small></div><span class="wl-price">${price}</span></div>
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
