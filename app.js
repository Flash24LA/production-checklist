(function () {
  "use strict";

  const GUIDES = window.PRODUCTION_GUIDES || [];
  const ROUTINE_LABELS = { setup: "Setup", breakdown: "Breakdown" };
  const STORAGE_PREFIX = "psb:v1:";

  const app = document.getElementById("app");
  const backBtn = document.getElementById("backBtn");
  const menuBtn = document.getElementById("menuBtn");
  const topTitle = document.getElementById("topTitle");
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const sheet = document.getElementById("sheet");
  const sheetBody = document.getElementById("sheetBody");

  // ---------- Helpers ----------

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const fmtTime = (iso) =>
    new Date(iso).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  function subStepLabel(step) {
    const n = (step.instructions || []).length;
    return `${n} sub-step${n === 1 ? "" : "s"}`;
  }

  function findGuide(id) {
    return GUIDES.find((g) => g.id === id && !g.comingSoon && g.routines);
  }

  // Flatten sections into a single ordered step list (keeps section title on each step).
  function flatSteps(routine) {
    const out = [];
    routine.sections.forEach((sec) => sec.steps.forEach((st) => out.push({ ...st, section: sec.title })));
    return out;
  }

  // ---------- Saved progress (per device) ----------

  function readStore(key, fallback) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return fallback;
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (_) {}
  }

  // A run starts when someone enters their name + date (startedAt is set).
  // logStatus: undefined → not finished yet, "pending" → waiting to send, "sent", "off" (no sheet configured).
  const emptyState = () => ({ done: {}, notes: {}, operator: "", date: "", startedAt: null, runId: null });

  function loadState(guideId, routineKey) {
    const st = readStore(guideId + ":" + routineKey, null);
    // Progress saved before name/date tracking existed has no runId — start fresh.
    return st && st.runId ? st : emptyState();
  }

  function saveState(guideId, routineKey, state) {
    writeStore(guideId + ":" + routineKey, state);
  }

  const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const fmtDate = (ymd) =>
    ymd ? new Date(ymd + "T12:00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "";

  // ---------- Run log (sent to Google Sheet) ----------

  const LOG_ENDPOINT = ((window.APP_CONFIG || {}).logEndpoint || "").trim();

  function buildLogEntry(ctx) {
    const { guide, routine, routineKey, steps, state } = ctx;
    const finishedAt = steps.map((s) => state.done[s.id]).filter(Boolean).sort().pop();
    return {
      runId: state.runId,
      date: state.date,
      name: state.operator,
      area: guide.name,
      routine: ROUTINE_LABELS[routineKey] || routineKey,
      startedAt: state.startedAt,
      finishedAt,
      minutes: Math.round((new Date(finishedAt) - new Date(state.startedAt)) / 60000),
      stepsDone: `${progressOf(steps, state).done}/${steps.length}`,
      notes: steps.filter((s) => state.notes[s.id]).map((s) => `${s.title}: ${state.notes[s.id].trim()}`).join("\n"),
      routineTitle: routine.title,
      key: `${guide.id}:${routineKey}`,
    };
  }

  // Finished runs wait in this queue until the sheet confirms them, so nothing is lost offline.
  function queueLog(entry) {
    const q = readStore("pendingLogs", []);
    if (!q.some((e) => e.runId === entry.runId)) q.push(entry);
    writeStore("pendingLogs", q);
  }

  let flushing = null;
  function flushLogs() {
    if (!LOG_ENDPOINT) return Promise.resolve();
    if (flushing) return flushing;
    flushing = (async () => {
      for (const entry of readStore("pendingLogs", [])) {
        try {
          // text/plain keeps this a "simple" request, which Google Apps Script accepts cross-origin.
          const res = await fetch(LOG_ENDPOINT, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(entry) });
          const body = await res.json();
          if (!body.ok) throw new Error(body.error || "Sheet rejected the entry");
        } catch (_) {
          break; // offline or misconfigured — try again later
        }
        writeStore("pendingLogs", readStore("pendingLogs", []).filter((e) => e.runId !== entry.runId));
        const [guideId, routineKey] = entry.key.split(":");
        const st = loadState(guideId, routineKey);
        if (st.runId === entry.runId) {
          st.logStatus = "sent";
          saveState(guideId, routineKey, st);
        }
      }
    })().finally(() => (flushing = null));
    return flushing;
  }

  function progressOf(steps, state) {
    const done = steps.filter((s) => state.done[s.id]).length;
    return { done, total: steps.length, pct: steps.length ? Math.round((done / steps.length) * 100) : 0 };
  }

  // ---------- Routing ----------
  // #/                       home
  // #/audio/setup            step-by-step (opens first unfinished step)
  // #/audio/setup/step/3     step-by-step at step 3
  // #/audio/setup/list       full checklist
  // #/audio/setup/done       completion summary
  // (any routine view shows the name + date start screen until a run is started)

  function parseRoute() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { guideId: parts[0], routineKey: parts[1], view: parts[2], arg: parts[3] };
  }

  function go(path) {
    const hash = "#/" + path;
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  function render() {
    closeSheet();
    window.scrollTo(0, 0);
    const r = parseRoute();
    const guide = r.guideId && findGuide(r.guideId);
    const routine = guide && guide.routines[r.routineKey];

    if (!routine) return renderHome();

    const steps = flatSteps(routine);
    const ctx = { guide, routine, routineKey: r.routineKey, steps, state: loadState(guide.id, r.routineKey) };

    if (!ctx.state.startedAt) return renderStart(ctx);
    if (r.view === "list") return renderList(ctx);
    if (r.view === "done") return renderComplete(ctx);

    let idx = parseInt(r.arg, 10) - 1;
    if (r.view !== "step" || isNaN(idx)) {
      idx = steps.findIndex((s) => !ctx.state.done[s.id]);
      if (idx === -1) return go(`${guide.id}/${r.routineKey}/done`);
    }
    idx = Math.max(0, Math.min(steps.length - 1, idx));
    renderStep(ctx, idx);
  }

  function setChrome({ title, back, menu }) {
    topTitle.textContent = title;
    backBtn.hidden = !back;
    backBtn.onclick = back || null;
    menuBtn.hidden = !menu;
    menuBtn.onclick = menu || null;
    document.title = title === "Production Checklist" ? title : title + " · Production Checklist";
  }

  // ---------- Home ----------

  function renderHome() {
    setChrome({ title: "Production Checklist" });
    const cards = GUIDES.map((g) => {
      if (g.comingSoon || !g.routines) {
        return `
          <div class="guide-card soon">
            <div class="guide-head">
              <div class="guide-icon">${esc(g.icon)}</div>
              <div style="flex:1"><h2>${esc(g.name)}</h2><p>${esc(g.description)}</p></div>
              <span class="badge">Coming soon</span>
            </div>
          </div>`;
      }
      const buttons = Object.keys(ROUTINE_LABELS)
        .filter((k) => g.routines[k])
        .map((k) => {
          const steps = flatSteps(g.routines[k]);
          const st = loadState(g.id, k);
          const p = progressOf(steps, st);
          const who = st.operator ? ` · ${esc(st.operator)}` : "";
          const status = !st.startedAt
            ? `${p.total} steps`
            : p.done === p.total
              ? `Complete ✓${who}`
              : `${p.done} of ${p.total} done${who}`;
          return `
            <button class="routine-btn" data-go="${g.id}/${k}">
              <strong>${ROUTINE_LABELS[k]}</strong>
              <span>${status}</span>
              <div class="mini-bar ${p.pct === 100 ? "full" : ""}"><i style="width:${p.pct}%"></i></div>
            </button>`;
        })
        .join("");
      return `
        <div class="guide-card">
          <div class="guide-head">
            <div class="guide-icon">${esc(g.icon)}</div>
            <div><h2>${esc(g.name)}</h2><p>${esc(g.description)}</p></div>
          </div>
          <div class="routine-row">${buttons}</div>
        </div>`;
    }).join("");

    app.innerHTML = `
      <section class="hero">
        <h1>Weekly Production</h1>
        <p>Pick an area and follow each step. Finished checklists are logged with your name and date.</p>
      </section>
      ${cards}`;
    app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
  }

  // ---------- Shared bits ----------

  function progressHeader(ctx) {
    const p = progressOf(ctx.steps, ctx.state);
    return `
      <div class="progress-wrap">
        <div class="progress-meta">
          <span>${p.done} of ${p.total} steps done · ${p.pct}%</span>
          <button class="restart-btn" id="restartBtn">↺ Restart</button>
        </div>
        <div class="progress ${p.pct === 100 ? "full" : ""}"><i style="width:${p.pct}%"></i></div>
      </div>`;
  }

  // Restart = throw away this run and go back to the name/date screen. Needs a second tap.
  function armRestart(btn, ctx, armedText) {
    if (!btn) return;
    const label = btn.textContent;
    let timer = null;
    btn.onclick = () => {
      if (!btn.classList.contains("armed")) {
        btn.classList.add("armed");
        btn.textContent = armedText;
        timer = setTimeout(() => {
          btn.classList.remove("armed");
          btn.textContent = label;
        }, 4000);
        return;
      }
      clearTimeout(timer);
      saveState(ctx.guide.id, ctx.routineKey, emptyState());
      go(`${ctx.guide.id}/${ctx.routineKey}`);
    };
  }

  function viewToggle(ctx, active) {
    const base = `${ctx.guide.id}/${ctx.routineKey}`;
    return `
      <div class="seg">
        <button class="${active === "step" ? "on" : ""}" data-go="${base}">Step by step</button>
        <button class="${active === "list" ? "on" : ""}" data-go="${base}/list">Full list</button>
      </div>`;
  }

  function photoBlock(step) {
    const placeholder = `
      <div class="photo-ph">
        <b>📷</b>
        <span>Photo coming soon</span>
        ${step.image ? `<small>${esc(step.image)}</small>` : ""}
      </div>`;
    const img = step.image
      ? `<img src="${esc(step.image)}" alt="${esc(step.imageCaption || step.title)}" loading="lazy" />`
      : "";
    // A credited photo is a stock stand-in, not our actual gear — label it.
    const stockBadge = step.image && step.imageCredit ? `<span class="photo-badge">Example photo</span>` : "";
    const caption =
      esc(step.imageCaption || "") +
      (stockBadge ? `<span class="photo-credit">${esc(step.imageCredit)}</span>` : "");
    return `
      <div class="photo ${step.image && !step.imageCredit ? "fit" : ""}">${img || placeholder}${stockBadge}</div>
      ${caption ? `<div class="photo-caption">${caption}</div>` : ""}`;
  }

  function wirePhotos(root) {
    root.querySelectorAll(".photo img").forEach((img) => {
      // Missing file → swap to placeholder.
      img.onerror = () => {
        img.parentElement.innerHTML = `<div class="photo-ph"><b>📷</b><span>Photo not found</span><small>${esc(img.getAttribute("src"))}</small></div>`;
      };
      img.onclick = () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        lightbox.hidden = false;
      };
    });
  }

  function toggleDone(ctx, step, value) {
    const s = ctx.state;
    if (value) s.done[step.id] = new Date().toISOString();
    else delete s.done[step.id];
    saveState(ctx.guide.id, ctx.routineKey, s);
  }

  // ---------- Start screen (name + date) ----------

  function renderStart(ctx) {
    const { guide, routine, routineKey, steps } = ctx;
    setChrome({ title: routine.title, back: () => go("") });

    app.innerHTML = `
      <form class="start-card" id="startForm" novalidate>
        <div class="guide-icon">${esc(guide.icon)}</div>
        <h2>${esc(routine.title)}</h2>
        <p class="start-sub">${steps.length} steps · Fill this in so we know who ran it.</p>
        <div class="field">
          <label for="nameInput">Your name</label>
          <input id="nameInput" autocomplete="name" placeholder="First and last name" value="${esc(readStore("lastName", ""))}" />
        </div>
        <div class="field">
          <label for="dateInput">Date</label>
          <input id="dateInput" type="date" value="${todayISO()}" />
        </div>
        <p class="field-error" id="startError" hidden></p>
        <button class="btn primary block" type="submit">Start ${esc(ROUTINE_LABELS[routineKey] || "")}</button>
      </form>`;

    const nameInput = document.getElementById("nameInput");
    const dateInput = document.getElementById("dateInput");
    const err = document.getElementById("startError");
    if (!nameInput.value) nameInput.focus();

    document.getElementById("startForm").onsubmit = (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const date = dateInput.value;
      if (!name || !date) {
        err.textContent = !name ? "Please enter your name." : "Please pick a date.";
        err.hidden = false;
        return;
      }
      writeStore("lastName", name);
      saveState(guide.id, routineKey, {
        ...emptyState(),
        operator: name,
        date,
        startedAt: new Date().toISOString(),
        runId: `${guide.id}-${routineKey}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      });
      go(`${guide.id}/${routineKey}/step/1`);
    };
  }

  // ---------- Step-by-step view ----------

  function renderStep(ctx, idx) {
    const { guide, routine, routineKey, steps, state } = ctx;
    const step = steps[idx];
    const isDone = !!state.done[step.id];
    const base = `${guide.id}/${routineKey}`;

    setChrome({ title: routine.title, back: () => go(""), menu: () => openMenu(ctx) });

    app.innerHTML = `
      ${progressHeader(ctx)}
      ${viewToggle(ctx, "step")}
      <article class="step-card ${isDone ? "is-done" : ""}">
        ${photoBlock(step)}
        <div class="step-body">
          <div class="step-section">${esc(step.section)}</div>
          <h2 class="step-title"><span class="num">${idx + 1}.</span> ${esc(step.title)}</h2>
          ${step.instructions && step.instructions.length
            ? `<ol class="instructions">${step.instructions.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>`
            : ""}
          ${step.tip ? `<div class="note-box tip">💡 ${esc(step.tip)}</div>` : ""}
          ${step.warning ? `<div class="note-box warn">⚠️ ${esc(step.warning)}</div>` : ""}
          <details class="user-note" ${state.notes[step.id] ? "open" : ""}>
            <summary>📝 Add a note (problem, missing item…)</summary>
            <textarea id="noteInput" placeholder="e.g. Channel 4 cable is crackling">${esc(state.notes[step.id] || "")}</textarea>
          </details>
          ${isDone ? `<div class="done-stamp">✓ Done ${esc(fmtTime(state.done[step.id]))}</div>` : ""}
        </div>
      </article>

      <div class="action-bar">
        <div class="action-inner">
          <button class="btn" id="prevBtn" ${idx === 0 ? "disabled" : ""} aria-label="Previous step">←</button>
          <button class="btn ${isDone ? "done" : "primary"}" id="doneBtn">
            ${isDone ? "✓ Done — tap to undo" : idx === steps.length - 1 ? "Mark done & finish" : "Mark done & next"}
          </button>
          <button class="btn" id="nextBtn" ${idx === steps.length - 1 ? "disabled" : ""} aria-label="Next step">→</button>
        </div>
      </div>`;

    app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    armRestart(document.getElementById("restartBtn"), ctx, "Tap again to restart");
    wirePhotos(app);

    const note = document.getElementById("noteInput");
    note.oninput = () => {
      const v = note.value.trim();
      if (v) state.notes[step.id] = note.value;
      else delete state.notes[step.id];
      saveState(guide.id, routineKey, state);
    };

    document.getElementById("prevBtn").onclick = () => go(`${base}/step/${idx}`);
    document.getElementById("nextBtn").onclick = () => go(`${base}/step/${idx + 2}`);
    document.getElementById("doneBtn").onclick = () => {
      if (isDone) {
        toggleDone(ctx, step, false);
        return render();
      }
      toggleDone(ctx, step, true);
      const nextOpen = steps.findIndex((s, i) => i > idx && !state.done[s.id]);
      const anyOpen = steps.findIndex((s) => !state.done[s.id]);
      if (nextOpen !== -1) go(`${base}/step/${nextOpen + 1}`);
      else if (anyOpen !== -1) go(`${base}/step/${anyOpen + 1}`);
      else go(`${base}/done`);
    };
  }

  // ---------- Full list view ----------

  function renderList(ctx) {
    const { guide, routine, routineKey, state } = ctx;
    const base = `${guide.id}/${routineKey}`;
    setChrome({ title: routine.title, back: () => go(""), menu: () => openMenu(ctx) });

    let n = 0;
    const sections = routine.sections.map((sec) => {
      const done = sec.steps.filter((s) => state.done[s.id]).length;
      const items = sec.steps.map((s) => {
        n++;
        const d = !!state.done[s.id];
        return `
          <div class="list-item ${d ? "is-done" : ""}">
            <button class="check" data-toggle="${esc(s.id)}" aria-label="${d ? "Uncheck" : "Check off"} ${esc(s.title)}">✓</button>
            <div class="li-text" data-go="${base}/step/${n}" role="button" tabindex="0">
              <div class="li-title">${n}. ${esc(s.title)}</div>
              <div class="li-sub">${d ? "Done " + esc(fmtTime(state.done[s.id])) : subStepLabel(s)}${state.notes[s.id] ? " · 📝 note" : ""}</div>
            </div>
            <span class="li-go" data-go="${base}/step/${n}">›</span>
          </div>`;
      }).join("");
      return `
        <section class="list-section">
          <h3><span>${esc(sec.title)}</span><span>${done}/${sec.steps.length}</span></h3>
          ${items}
        </section>`;
    }).join("");

    const allDone = progressOf(ctx.steps, state).pct === 100;
    app.innerHTML = `
      ${progressHeader(ctx)}
      ${viewToggle(ctx, "list")}
      ${sections}
      ${allDone ? `<button class="btn primary block" data-go="${base}/done">View completion summary</button>` : ""}`;

    app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    armRestart(document.getElementById("restartBtn"), ctx, "Tap again to restart");
    app.querySelectorAll("[data-toggle]").forEach((b) => {
      b.onclick = () => {
        const step = ctx.steps.find((s) => s.id === b.dataset.toggle);
        toggleDone(ctx, step, !state.done[step.id]);
        const y = window.scrollY;
        render();
        window.scrollTo(0, y);
      };
    });
  }

  // ---------- Completion ----------

  function summaryText(ctx) {
    const { routine, steps, state } = ctx;
    const finished = steps.map((s) => state.done[s.id]).filter(Boolean).sort().pop();
    const lines = [
      `${routine.title} — complete`,
      state.date ? `Date: ${fmtDate(state.date)}` : null,
      state.operator ? `By: ${state.operator}` : null,
      finished ? `Finished: ${fmtTime(finished)}` : null,
    ].filter(Boolean);
    const notes = steps.filter((s) => state.notes[s.id]);
    if (notes.length) {
      lines.push("", "Notes:");
      notes.forEach((s) => lines.push(`- ${s.title}: ${state.notes[s.id].trim()}`));
    }
    return lines.join("\n");
  }

  function renderComplete(ctx) {
    const { guide, routine, routineKey, steps, state } = ctx;
    const base = `${guide.id}/${routineKey}`;
    const p = progressOf(steps, state);
    setChrome({ title: routine.title, back: () => go(""), menu: () => openMenu(ctx) });

    if (p.pct < 100) return go(base);

    // First time this run reaches 100%: log it (once — logStatus is kept even if a step is unticked later).
    if (!state.logStatus) {
      state.logStatus = LOG_ENDPOINT ? "pending" : "off";
      saveState(guide.id, routineKey, state);
      if (LOG_ENDPOINT) queueLog(buildLogEntry(ctx));
    }

    const entry = buildLogEntry(ctx);
    const noteSteps = steps.filter((s) => state.notes[s.id]);

    app.innerHTML = `
      <div class="complete">
        <div class="big">✅</div>
        <h2>${esc(routine.title)} complete</h2>
        <p>
          <strong>${esc(state.operator)}</strong> · ${esc(fmtDate(state.date))}<br />
          Finished ${esc(fmtTime(entry.finishedAt))} · ${entry.minutes} min
        </p>
        <p class="log-status" id="logStatus"></p>
      </div>
      ${noteSteps.length ? `
        <div class="summary-notes">
          <h3>📝 Notes to follow up</h3>
          <ul>${noteSteps.map((s) => `<li><strong>${esc(s.title)}:</strong> ${esc(state.notes[s.id])}</li>`).join("")}</ul>
        </div>` : ""}
      <button class="btn block" id="copyBtn" style="margin-bottom:10px">Copy summary</button>
      <button class="btn block" data-go="${base}/list" style="margin-bottom:10px">Review checklist</button>
      <button class="btn block" id="newRunBtn" style="margin-bottom:10px">Start a new ${esc((ROUTINE_LABELS[routineKey] || "").toLowerCase())}</button>
      <button class="btn primary block" data-go="">Back to home</button>`;

    const statusEl = document.getElementById("logStatus");
    const showStatus = () => {
      const s = loadState(guide.id, routineKey).logStatus;
      statusEl.className = "log-status " + s;
      statusEl.innerHTML =
        s === "sent" ? "✓ Saved to the production log"
        : s === "off" ? "Log sheet not connected — this run was not recorded"
        : `Not saved to the log yet — will retry automatically. <button class="link-btn" id="retryLog">Retry now</button>`;
      const retry = document.getElementById("retryLog");
      if (retry) retry.onclick = () => {
        statusEl.textContent = "Saving…";
        flushLogs().then(showStatus);
      };
    };
    if (state.logStatus === "pending") {
      statusEl.textContent = "Saving to the production log…";
      flushLogs().then(showStatus);
    } else showStatus();

    document.getElementById("newRunBtn").onclick = () => {
      saveState(guide.id, routineKey, emptyState());
      go(base);
    };
    app.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => go(b.dataset.go)));
    const copyBtn = document.getElementById("copyBtn");
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(summaryText(ctx));
        copyBtn.textContent = "Copied ✓";
      } catch (_) {
        copyBtn.textContent = "Couldn't copy on this device";
      }
    };
  }

  // ---------- Options sheet ----------

  function openMenu(ctx) {
    const { guide, routineKey, state } = ctx;
    sheetBody.innerHTML = `
      <h3>${esc(ctx.routine.title)}</h3>
      <div class="field">
        <label for="operatorInput">Name</label>
        <input id="operatorInput" placeholder="Your name" value="${esc(state.operator)}" />
      </div>
      <div class="field">
        <label for="dateEdit">Date</label>
        <input id="dateEdit" type="date" value="${esc(state.date)}" />
      </div>
      <button class="btn danger" id="resetBtn">↺ Clear and start over</button>
      <button class="btn" id="closeSheetBtn">Close</button>`;
    sheet.hidden = false;

    // Name/date edits apply to this run; once it's been logged, the sheet row is final.
    const nameEl = document.getElementById("operatorInput");
    const dateEl = document.getElementById("dateEdit");
    const saveEdits = () => {
      if (nameEl.value.trim()) state.operator = nameEl.value.trim();
      if (dateEl.value) state.date = dateEl.value;
      saveState(guide.id, routineKey, state);
    };
    nameEl.oninput = saveEdits;
    dateEl.onchange = saveEdits;

    armRestart(document.getElementById("resetBtn"), ctx, "Tap again to clear all check-offs and notes");
    document.getElementById("closeSheetBtn").onclick = closeSheet;
  }

  function closeSheet() {
    sheet.hidden = true;
  }

  sheet.addEventListener("click", (e) => {
    if (e.target === sheet) closeSheet();
  });
  lightbox.addEventListener("click", () => {
    lightbox.hidden = true;
    lightboxImg.src = "";
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      lightbox.hidden = true;
      closeSheet();
    }
  });

  window.addEventListener("hashchange", render);
  window.addEventListener("online", () => flushLogs());
  render();
  flushLogs(); // send anything left over from an earlier offline run
})();
