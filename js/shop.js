/* Shop pages (preview): sign in, checkout, payment result, account.
   Only the interface: nothing here talks to a server yet. Forms show a
   "preview" note instead of submitting. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Small note at the bottom of the screen
  let toastT = 0;
  const toast = msg => {
    let t = $(".sx-toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "sx-toast";
      t.setAttribute("role", "status");
      document.body.append(t);
    }
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 2600);
  };
  const PREVIEW = "Design preview: this isn't connected yet.";

  // Segmented tabs with a sliding thumb
  const seg = el => {
    const thumb = $(".sx-seg-thumb", el);
    const place = () => {
      const on = $('[aria-selected="true"]', el);
      if (!on || !thumb) return;
      thumb.style.width = on.offsetWidth + "px";
      thumb.style.transform = `translateX(${on.offsetLeft}px)`;
    };
    el.addEventListener("click", e => {
      const b = e.target.closest("button[role=tab]");
      if (!b) return;
      $$("button[role=tab]", el).forEach(x => x.setAttribute("aria-selected", x === b));
      place();
      el.dispatchEvent(new CustomEvent("seg", { detail: b.dataset.view }));
    });
    addEventListener("resize", place);
    requestAnimationFrame(place);
    return place;
  };
  $$(".sx-seg").forEach(seg);

  // Show / hide password
  $$("[data-eye]").forEach(b => b.addEventListener("click", () => {
    const i = b.parentElement.querySelector("input");
    const show = i.type === "password";
    i.type = show ? "text" : "password";
    b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    b.classList.toggle("is-on", show);
  }));

  // Forms don't submit in the preview
  $$("form[data-preview]").forEach(f => f.addEventListener("submit", e => { e.preventDefault(); toast(PREVIEW); }));
  $$("[data-preview-click]").forEach(b => b.addEventListener("click", e => { e.preventDefault(); toast(PREVIEW); }));

  /* ---------- Sign in ---------- */
  const au = $("[data-au]");
  if (au) {
    const show = v => {
      $$(".au-view", au).forEach(x => { x.hidden = x.dataset.view !== v; });
      const tabs = $(".sx-seg", au);
      if (tabs) tabs.hidden = v === "forgot";
      $("[data-au-title]").textContent = { signin: "Welcome back", signup: "Create your account", forgot: "Reset your password" }[v];
      $("[data-au-sub]").textContent = {
        signin: "Sign in to see your purchases and saved designs.",
        signup: "Keep your purchases, downloads and saved designs in one place.",
        forgot: "Enter your email and we'll send you a link to choose a new password."
      }[v];
      if (v !== "forgot") history.replaceState(null, "", v === "signup" ? "#signup" : location.pathname);
    };
    $(".sx-seg", au).addEventListener("seg", e => show(e.detail));
    $$("[data-goto]", au).forEach(a => a.addEventListener("click", e => { e.preventDefault(); show(a.dataset.goto); }));
    if (location.hash === "#signup") $('[data-view="signup"][role=tab]', au).click();
  }

  /* ---------- Checkout ---------- */
  const hold = $("[data-hold]");
  if (hold) {
    let left = 15 * 60;
    const tick = () => {
      const m = Math.floor(left / 60), s = left % 60;
      hold.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
      if (left > 0) left--;
    };
    tick(); setInterval(tick, 1000);
  }
  const agree = $("[data-agree]"), pay = $("[data-pay]");
  if (agree && pay) {
    const sync = () => { pay.disabled = !agree.checked; };
    agree.addEventListener("change", sync); sync();
    pay.addEventListener("click", e => { e.preventDefault(); location.href = "thanks.html"; });
  }

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
  const ac = $("[data-ac]");
  if (ac) {
    const tabs = $$(".ac2-nav [data-tab]", ac);
    const open = id => {
      if (!$(`[data-panel="${id}"]`, ac)) id = "purchases";
      tabs.forEach(b => b.setAttribute("aria-selected", b.dataset.tab === id));
      $$("[data-panel]", ac).forEach(p => { p.hidden = p.dataset.panel !== id; });
      history.replaceState(null, "", "#" + id);
    };
    tabs.forEach(b => b.addEventListener("click", () => open(b.dataset.tab)));
    open(location.hash.slice(1) || "purchases");

    // Wishlist: built from the real catalogue so it looks like the live site
    const wl = $("[data-wishlist]");
    if (wl && window.DS) {
      const items = DS.items.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 6);
      const sm = src => src.replace(/^previews\//, "previews/sm/").replace(/\.(jpe?g|png)$/i, ".webp");
      const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
      const HEART = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5"/></svg>';
      wl.innerHTML = items.map((it, i) => {
        const sold = it.id === "mato-logo"; // shows how a sold logo looks
        const price = it.price ? `<span class="wl-price">${it.priceFrom ? "<small>From</small>" : ""}${esc(it.price)}</span>` : `<span class="wl-price">Free</span>`;
        const btn = sold ? `<span class="btn" aria-disabled="true">Sold</span>`
          : it.price ? `<a class="btn btn-dark" href="checkout.html">Buy now</a>` : `<a class="btn" href="item.html?id=${encodeURIComponent(it.id)}">Download</a>`;
        return `<article class="wl-card sx-card">
          <a class="wl-img" href="item.html?id=${encodeURIComponent(it.id)}"><img src="${sm(it.preview)}" onerror="this.onerror=null;this.src='${esc(it.preview)}'" alt="" loading="lazy"></a>
          ${sold ? '<span class="wl-sold">Sold</span>' : ""}
          <button class="wl-heart" type="button" aria-label="Remove from wishlist" data-unheart>${HEART}</button>
          <div class="wl-body"><h3>${esc(it.title)}</h3><div class="wl-row">${price}${btn}</div></div>
        </article>`;
      }).join("");
      const count = $("[data-wl-n]");
      const recount = () => { const n = $$(".wl-card", wl).length; if (count) count.textContent = n; };
      recount();
      wl.addEventListener("click", e => {
        const h = e.target.closest("[data-unheart]");
        if (!h) return;
        const card = h.closest(".wl-card");
        card.style.transition = "opacity .25s, transform .25s";
        card.style.opacity = "0"; card.style.transform = "scale(.96)";
        setTimeout(() => { card.remove(); recount(); }, 250);
        toast("Removed from your wishlist (preview)");
      });
    }
  }
})();
