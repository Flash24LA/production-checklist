(function () {
  "use strict";

  const ENDPOINT = ((window.APP_CONFIG || {}).logEndpoint || "").trim();
  const TOKEN_KEY = "psb:v1:adminToken";

  const root = document.getElementById("admin");
  const signOutBtn = document.getElementById("signOutBtn");

  // Everything in the log was typed by app users, so always escape it.
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const getToken = () => {
    try { return sessionStorage.getItem(TOKEN_KEY); } catch (_) { return null; }
  };
  const setToken = (t) => {
    try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
  };

  async function call(body) {
    // text/plain keeps this a "simple" request, which Google Apps Script accepts cross-origin.
    const res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) });
    return res.json();
  }

  // "2026-10-31" → "Sat, Oct 31, 2026"; anything else is shown as the sheet has it.
  function fmtDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    if (!m) return s || "No date";
    return new Date(+m[1], m[2] - 1, +m[3]).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }

  // ---------- Sign in ----------

  function renderLogin(message) {
    signOutBtn.hidden = true;
    if (!ENDPOINT) {
      root.innerHTML = `
        <div class="start-card">
          <h2>Not connected yet</h2>
          <p class="start-sub">The Google Sheet log isn't connected. Follow <strong>google-sheet/SETUP.md</strong>, then paste the Web app URL into <strong>data/config.js</strong>.</p>
        </div>`;
      return;
    }
    root.innerHTML = `
      <form class="start-card" id="loginForm" novalidate>
        <div class="guide-icon">🔒</div>
        <h2>Admin sign in</h2>
        <p class="start-sub">Completed setups, breakdowns and notes.</p>
        <div class="field">
          <label for="userInput">Username</label>
          <input id="userInput" autocomplete="username" autocapitalize="none" spellcheck="false" />
        </div>
        <div class="field">
          <label for="passInput">Password</label>
          <input id="passInput" type="password" autocomplete="current-password" />
        </div>
        <p class="field-error" id="loginError" ${message ? "" : "hidden"}>${esc(message || "")}</p>
        <button class="btn primary block" type="submit" id="loginBtn">Sign in</button>
      </form>`;

    const form = document.getElementById("loginForm");
    const err = document.getElementById("loginError");
    const btn = document.getElementById("loginBtn");
    document.getElementById("userInput").focus();

    form.onsubmit = async (e) => {
      e.preventDefault();
      const username = document.getElementById("userInput").value.trim();
      const password = document.getElementById("passInput").value;
      if (!username || !password) {
        err.textContent = "Enter your username and password.";
        err.hidden = false;
        return;
      }
      btn.disabled = true;
      btn.textContent = "Signing in…";
      try {
        const r = await call({ action: "login", username, password });
        if (!r.ok) throw new Error(r.error || "Sign in failed.");
        setToken(r.token);
        loadRuns();
      } catch (ex) {
        err.textContent = ex.message === "Failed to fetch" ? "Couldn't reach the log. Check your connection." : ex.message;
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = "Sign in";
      }
    };
  }

  signOutBtn.onclick = async () => {
    const token = getToken();
    setToken(null);
    renderLogin();
    if (token) call({ action: "logout", token }).catch(() => {});
  };

  // ---------- Log ----------

  let allRuns = [];
  const filters = { routine: "all", notesOnly: false, q: "" };

  async function loadRuns() {
    const token = getToken();
    if (!token) return renderLogin();
    signOutBtn.hidden = false;
    root.innerHTML = `<p class="admin-loading">Loading the log…</p>`;
    try {
      const r = await call({ action: "runs", token });
      if (!r.ok) {
        setToken(null);
        return renderLogin(r.error === "session_expired" ? "You were signed out. Please sign in again." : r.error);
      }
      allRuns = r.runs.slice().reverse(); // sheet is oldest-first; show newest first
      renderLog();
    } catch (_) {
      root.innerHTML = `
        <div class="start-card">
          <h2>Couldn't load the log</h2>
          <p class="start-sub">Check your connection and try again.</p>
          <button class="btn primary block" id="retryBtn">Try again</button>
        </div>`;
      document.getElementById("retryBtn").onclick = loadRuns;
    }
  }

  function matches(run) {
    if (filters.routine !== "all" && run.routine.toLowerCase() !== filters.routine) return false;
    if (filters.notesOnly && !run.notes.trim()) return false;
    if (filters.q) {
      const hay = `${run.name} ${run.notes} ${run.area} ${run.routine} ${run.date}`.toLowerCase();
      if (!hay.includes(filters.q.toLowerCase())) return false;
    }
    return true;
  }

  function runCard(run) {
    const isSetup = run.routine.toLowerCase() === "setup";
    const notes = run.notes.trim();
    return `
      <article class="run-card">
        <div class="run-top">
          <span class="run-tag ${isSetup ? "setup" : "breakdown"}">${esc(run.area)} ${esc(run.routine)}</span>
          <span class="run-name">${esc(run.name)}</span>
        </div>
        <div class="run-meta">
          ${run.started || run.finished ? `${esc(run.started)} – ${esc(run.finished)}` : ""}
          ${run.minutes !== "" ? ` · ${esc(run.minutes)} min` : ""}
          ${run.stepsDone ? ` · ${esc(run.stepsDone)} steps` : ""}
        </div>
        ${notes ? `<div class="run-notes">📝 ${esc(notes)}</div>` : ""}
      </article>`;
  }

  function renderLog() {
    const shown = allRuns.filter(matches);
    const setups = allRuns.filter((r) => r.routine.toLowerCase() === "setup").length;
    const withNotes = allRuns.filter((r) => r.notes.trim()).length;

    // Group by the date the person entered, keeping newest-first order.
    const groups = [];
    shown.forEach((run) => {
      const last = groups[groups.length - 1];
      if (last && last.date === run.date) last.runs.push(run);
      else groups.push({ date: run.date, runs: [run] });
    });

    root.innerHTML = `
      <div class="stat-row">
        <div class="stat"><b>${allRuns.length}</b><span>Completed</span></div>
        <div class="stat"><b>${setups}</b><span>Setups</span></div>
        <div class="stat"><b>${allRuns.length - setups}</b><span>Breakdowns</span></div>
        <div class="stat"><b>${withNotes}</b><span>With notes</span></div>
      </div>

      <div class="seg" id="routineSeg">
        ${["all", "setup", "breakdown"].map((k) => `<button data-routine="${k}" class="${filters.routine === k ? "on" : ""}">${k === "all" ? "All" : k[0].toUpperCase() + k.slice(1)}</button>`).join("")}
      </div>
      <div class="filter-row">
        <input id="searchInput" type="search" placeholder="Search name or notes" value="${esc(filters.q)}" />
        <label class="toggle"><input type="checkbox" id="notesOnly" ${filters.notesOnly ? "checked" : ""} /> Notes only</label>
        <button class="btn" id="refreshBtn" title="Refresh">↻</button>
      </div>

      ${groups.length
        ? groups.map((g) => `
            <section class="list-section">
              <h3><span>${esc(fmtDate(g.date))}</span><span>${g.runs.length}</span></h3>
              ${g.runs.map(runCard).join("")}
            </section>`).join("")
        : `<p class="admin-empty">${allRuns.length ? "Nothing matches these filters." : "No completed checklists yet."}</p>`}`;

    root.querySelectorAll("[data-routine]").forEach((b) => {
      b.onclick = () => { filters.routine = b.dataset.routine; renderLog(); };
    });
    document.getElementById("notesOnly").onchange = (e) => { filters.notesOnly = e.target.checked; renderLog(); };
    document.getElementById("refreshBtn").onclick = loadRuns;
    const search = document.getElementById("searchInput");
    search.oninput = () => {
      filters.q = search.value;
      const pos = search.selectionStart;
      renderLog();
      const again = document.getElementById("searchInput");
      again.focus();
      again.setSelectionRange(pos, pos);
    };
  }

  getToken() ? loadRuns() : renderLogin();
})();
