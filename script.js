/* =========================================================
   ATSInsight — script.js
   Vanilla JS. No frameworks, no external APIs.
   Sections: 1.Utils 2.State 3.Navigation 4.Theme 5.Toasts
   6.Home content 7.Editor render 8.Preview render 9.Design
   10.Bullet improver 11.Storage 12.Sample data 13.ATS engine
   14.ATS page 15.Templates/Tips pages 16.Init
   ========================================================= */

/* ---------- 1. UTILS ---------- */
let UID = 1;
const uid = () => "id" + UID++;
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ---------- 2. STATE ---------- */
const defaultState = () => ({
  personal: { name: "", title: "", email: "", phone: "", location: "", linkedin: "", github: "", portfolio: "", photo: false },
  summary: "",
  experience: [],
  projects: [],
  education: [],
  skills: [],
  certifications: [],
  achievements: [],
  languages: [],
  interests: [],
  design: {
    template: "classic", font: "Arial, Helvetica, sans-serif", size: 10.5,
    spacing: 1.4, gap: 14, margin: 16, heading: "upper", accent: "#3d4ef5", safe: false,
  },
});
let state = defaultState();

/* ---------- 3. NAVIGATION (SPA-like) ---------- */
function goTo(page) {
  $$(".page").forEach((p) => p.classList.toggle("active", p.id === "page-" + page));
  $$(".nav nav button").forEach((b) => b.classList.toggle("active", b.dataset.page === page));
  $("#navLinks").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (page === "builder") { updatePreview(); updateLiveScore(); }
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (btn) goTo(btn.dataset.page);
});
$("#menuBtn").addEventListener("click", () => {
  const nav = $("#navLinks");
  const open = nav.classList.toggle("open");
  $("#menuBtn").setAttribute("aria-expanded", open);
});

/* ---------- 4. THEME ---------- */
function initTheme() {
  const saved = localStorage.getItem("atsinsight_theme");
  const theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
}
$("#themeBtn").addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", cur);
  localStorage.setItem("atsinsight_theme", cur);
});

/* ---------- 5. TOASTS ---------- */
function toast(msg, type = "ok") {
  const el = document.createElement("div");
  el.className = "toast" + (type === "err" ? " err" : "");
  el.textContent = msg;
  $("#toasts").appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- 6. HOME CONTENT ---------- */
const FEATURES = [
  ["ATS Resume Checker", "Score your resume with a transparent, rule-based engine — no black box."],
  ["Professional Templates", "Four printable layouts: Classic, Modern, Minimal and Professional."],
  ["Live Resume Builder", "Edit on the left, see your resume update instantly on the right."],
  ["Keyword Matching", "Paste a job description and see exactly which keywords you're missing."],
  ["Smart Suggestions", "Contextual, rule-based tips as you write each section."],
  ["PDF Ready", "Print or save as PDF straight from your browser, formatted for A4."],
  ["Skill Analysis", "Categorized skills with relevance checks against the job you want."],
  ["Resume Health Report", "A full report of strengths, issues and next steps you can download."],
];
$("#featureGrid").innerHTML = FEATURES.map(([t, d]) => `<div class="card"><h3>${t}</h3><p>${d}</p></div>`).join("");

/* ---------- 7. EDITOR RENDER ---------- */
const SKILL_CATS = ["Programming", "Web Development", "Database", "Tools", "Soft Skills", "Other"];
const LANG_LEVELS = ["Beginner", "Intermediate", "Professional", "Native"];

function renderEditor() {
  const p = state.personal;
  $("#editor").innerHTML = `
    <details class="card" id="sec-personal" open><summary>Personal information</summary><div class="body">
      <label>Full name<input data-f="personal.name" value="${esc(p.name)}" placeholder="Alex Morgan"></label>
      <label>Professional title<input data-f="personal.title" value="${esc(p.title)}" placeholder="Frontend Developer"></label>
      <label>Email<input type="email" data-f="personal.email" value="${esc(p.email)}" placeholder="you@example.com"></label>
      <label>Phone<input data-f="personal.phone" value="${esc(p.phone)}" placeholder="+91 90000 00000"></label>
      <label>Location<input data-f="personal.location" value="${esc(p.location)}" placeholder="Kolkata, India"></label>
      <label>LinkedIn<input data-f="personal.linkedin" value="${esc(p.linkedin)}" placeholder="linkedin.com/in/you"></label>
      <label>GitHub<input data-f="personal.github" value="${esc(p.github)}" placeholder="github.com/you"></label>
      <label>Portfolio<input data-f="personal.portfolio" value="${esc(p.portfolio)}" placeholder="you.dev"></label>
      <label class="check"><input type="checkbox" data-f="personal.photo" ${p.photo ? "checked" : ""}> Show profile photo placeholder</label>
    </div></details>

    <details class="card" id="sec-summary" open><summary>Professional summary</summary><div class="body">
      <label>Summary<textarea data-f="summary" rows="4" placeholder="A 2-4 line summary of who you are.">${esc(state.summary)}</textarea></label>
      <p class="count" id="sumCount"></p>
      <button class="btn sm" id="improveSummaryBtn" type="button">Improve Summary</button>
      <ul class="tips-list" id="summaryTips"></ul>
    </div></details>

    <details class="card" id="sec-experience"><summary>Experience</summary><div class="body" id="expList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="experience">+ Add experience</button></div></details>

    <details class="card" id="sec-projects"><summary>Projects</summary><div class="body" id="projList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="projects">+ Add project</button></div></details>

    <details class="card" id="sec-education"><summary>Education</summary><div class="body" id="eduList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="education">+ Add education</button></div></details>

    <details class="card" id="sec-skills"><summary>Skills</summary><div class="body">
      <div class="row">
        <input id="skillName" placeholder="e.g. JavaScript" style="flex:2">
        <select id="skillCat" style="flex:1">${SKILL_CATS.map((c) => `<option>${c}</option>`).join("")}</select>
        <button class="btn sm" id="addSkillBtn" type="button">+ Add</button>
      </div>
      <div id="skillChips" style="margin-top:10px"></div>
    </div></details>

    <details class="card" id="sec-certifications"><summary>Certifications</summary><div class="body" id="certList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="certifications">+ Add certification</button></div></details>

    <details class="card" id="sec-achievements"><summary>Achievements</summary><div class="body" id="achList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="achievements">+ Add achievement</button></div></details>

    <details class="card" id="sec-languages"><summary>Languages</summary><div class="body" id="langList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="languages">+ Add language</button></div></details>

    <details class="card" id="sec-interests"><summary>Interests</summary><div class="body" id="intList"></div>
      <div style="padding:0 16px 14px"><button class="btn sm" data-add="interests">+ Add interest</button></div></details>
  `;
  renderExperience(); renderProjects(); renderEducation(); renderSkills();
  renderCertifications(); renderAchievements(); renderLanguages(); renderInterests();
  updateSummaryUI();
}

function itemHeader(section, id, label) {
  return `<div class="row" style="justify-content:space-between"><b>${label}</b><button class="rm" type="button" data-rm="${section}" data-id="${id}">Remove ✕</button></div>`;
}

function renderExperience() {
  const wrap = $("#expList"); if (!wrap) return;
  wrap.innerHTML = state.experience.map((x, i) => `
    <div class="item">${itemHeader("experience", x.id, "Experience " + (i + 1))}
      <label>Job title<input data-f="experience.${x.id}.title" value="${esc(x.title)}"></label>
      <label>Company<input data-f="experience.${x.id}.company" value="${esc(x.company)}"></label>
      <label>Location<input data-f="experience.${x.id}.location" value="${esc(x.location)}"></label>
      <div class="row"><label style="flex:1">Start<input data-f="experience.${x.id}.start" value="${esc(x.start)}" placeholder="Jun 2023"></label>
      <label style="flex:1">End<input data-f="experience.${x.id}.end" value="${esc(x.end)}" placeholder="Present" ${x.current ? "disabled" : ""}></label></div>
      <label class="check"><input type="checkbox" data-f="experience.${x.id}.current" ${x.current ? "checked" : ""}> Current job</label>
      <label>Description (one bullet per line)<textarea rows="3" data-f="experience.${x.id}.desc">${esc(x.desc)}</textarea></label>
    </div>`).join("") || `<p class="hint">No experience added yet.</p>`;
}
function renderProjects() {
  const wrap = $("#projList"); if (!wrap) return;
  wrap.innerHTML = state.projects.map((x, i) => `
    <div class="item">${itemHeader("projects", x.id, "Project " + (i + 1))}
      <label>Project name<input data-f="projects.${x.id}.name" value="${esc(x.name)}"></label>
      <label>Role<input data-f="projects.${x.id}.role" value="${esc(x.role)}"></label>
      <label>Technologies<input data-f="projects.${x.id}.tech" value="${esc(x.tech)}" placeholder="React, Node.js"></label>
      <label>Project link<input data-f="projects.${x.id}.link" value="${esc(x.link)}"></label>
      <label>GitHub link<input data-f="projects.${x.id}.github" value="${esc(x.github)}"></label>
      <label>Description (one bullet per line)<textarea rows="2" data-f="projects.${x.id}.desc">${esc(x.desc)}</textarea></label>
      <label>Key contributions<textarea rows="2" data-f="projects.${x.id}.contrib">${esc(x.contrib)}</textarea></label>
    </div>`).join("") || `<p class="hint">No projects added yet.</p>`;
}
function renderEducation() {
  const wrap = $("#eduList"); if (!wrap) return;
  wrap.innerHTML = state.education.map((x, i) => `
    <div class="item">${itemHeader("education", x.id, "Education " + (i + 1))}
      <label>Degree<input data-f="education.${x.id}.degree" value="${esc(x.degree)}"></label>
      <label>Institution<input data-f="education.${x.id}.institution" value="${esc(x.institution)}"></label>
      <label>Location<input data-f="education.${x.id}.location" value="${esc(x.location)}"></label>
      <div class="row"><label style="flex:1">Start year<input data-f="education.${x.id}.start" value="${esc(x.start)}"></label>
      <label style="flex:1">End year<input data-f="education.${x.id}.end" value="${esc(x.end)}"></label></div>
      <label>Description<textarea rows="2" data-f="education.${x.id}.desc">${esc(x.desc)}</textarea></label>
    </div>`).join("") || `<p class="hint">No education added yet.</p>`;
}
function renderSkills() {
  const wrap = $("#skillChips"); if (!wrap) return;
  wrap.innerHTML = state.skills.map((s) =>
    `<span class="chip ok">${esc(s.name)} <small>(${esc(s.category)})</small> <button type="button" data-rm="skills" data-id="${s.id}" style="border:0;background:none;color:inherit;cursor:pointer">✕</button></span>`
  ).join("") || `<p class="hint">No skills added yet.</p>`;
}
function renderCertifications() {
  const wrap = $("#certList"); if (!wrap) return;
  wrap.innerHTML = state.certifications.map((x, i) => `
    <div class="item">${itemHeader("certifications", x.id, "Certification " + (i + 1))}
      <label>Name<input data-f="certifications.${x.id}.name" value="${esc(x.name)}"></label>
      <label>Organization<input data-f="certifications.${x.id}.org" value="${esc(x.org)}"></label>
      <label>Date<input data-f="certifications.${x.id}.date" value="${esc(x.date)}"></label>
      <label>Credential link<input data-f="certifications.${x.id}.link" value="${esc(x.link)}"></label>
    </div>`).join("") || `<p class="hint">No certifications added yet.</p>`;
}
function renderAchievements() {
  const wrap = $("#achList"); if (!wrap) return;
  wrap.innerHTML = state.achievements.map((x, i) => `
    <div class="item">${itemHeader("achievements", x.id, "Achievement " + (i + 1))}
      <label>Description<input data-f="achievements.${x.id}.text" value="${esc(x.text)}"></label>
    </div>`).join("") || `<p class="hint">No achievements added yet.</p>`;
}
function renderLanguages() {
  const wrap = $("#langList"); if (!wrap) return;
  wrap.innerHTML = state.languages.map((x, i) => `
    <div class="item">${itemHeader("languages", x.id, "Language " + (i + 1))}
      <label>Language<input data-f="languages.${x.id}.name" value="${esc(x.name)}"></label>
      <label>Proficiency<select data-f="languages.${x.id}.level">${LANG_LEVELS.map((l) => `<option ${x.level === l ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    </div>`).join("") || `<p class="hint">No languages added yet.</p>`;
}
function renderInterests() {
  const wrap = $("#intList"); if (!wrap) return;
  wrap.innerHTML = state.interests.map((x, i) => `
    <div class="item">${itemHeader("interests", x.id, "Interest " + (i + 1))}
      <label>Interest<input data-f="interests.${x.id}.text" value="${esc(x.text)}"></label>
    </div>`).join("") || `<p class="hint">No interests added yet.</p>`;
}

const LIST_RENDERERS = {
  experience: renderExperience, projects: renderProjects, education: renderEducation,
  certifications: renderCertifications, achievements: renderAchievements,
  languages: renderLanguages, interests: renderInterests, skills: renderSkills,
};
const EMPTY_ITEM = {
  experience: () => ({ id: uid(), title: "", company: "", location: "", start: "", end: "", current: false, desc: "" }),
  projects: () => ({ id: uid(), name: "", role: "", tech: "", link: "", github: "", desc: "", contrib: "" }),
  education: () => ({ id: uid(), degree: "", institution: "", location: "", start: "", end: "", desc: "" }),
  certifications: () => ({ id: uid(), name: "", org: "", date: "", link: "" }),
  achievements: () => ({ id: uid(), text: "" }),
  languages: () => ({ id: uid(), name: "", level: "Professional" }),
  interests: () => ({ id: uid(), text: "" }),
};

function setByPath(obj, path, value) {
  const keys = path.split(".");
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
}

$("#editor").addEventListener("input", (e) => {
  const f = e.target.dataset.f; if (!f) return;
  const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
  setByPath(state, f, val);
  updatePreview(); updateLiveScore(); updateSummaryUI();
});
$("#editor").addEventListener("change", (e) => {
  const f = e.target.dataset.f;
  if (f && f.endsWith(".current") && e.target.checked) {
    setByPath(state, f.replace(".current", ".end"), "Present");
    renderExperience(); updatePreview();
  }
});
$("#editor").addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]");
  if (add) {
    const section = add.dataset.add;
    state[section].push(EMPTY_ITEM[section]());
    LIST_RENDERERS[section]();
    updatePreview(); updateLiveScore();
    return;
  }
  const rm = e.target.closest("[data-rm]");
  if (rm) {
    const section = rm.dataset.rm, id = rm.dataset.id;
    state[section] = state[section].filter((x) => x.id !== id);
    LIST_RENDERERS[section]();
    updatePreview(); updateLiveScore();
  }
});
$("#editor").addEventListener("click", (e) => {
  if (e.target.id === "addSkillBtn") {
    const name = $("#skillName").value.trim();
    if (!name) { toast("Enter a skill name first.", "err"); return; }
    state.skills.push({ id: uid(), name, category: $("#skillCat").value });
    $("#skillName").value = "";
    renderSkills(); updatePreview(); updateLiveScore();
  }
  if (e.target.id === "improveSummaryBtn") showSummaryTips();
});

function updateSummaryUI() {
  const words = state.summary.trim() ? state.summary.trim().split(/\s+/).length : 0;
  const el = $("#sumCount"); if (el) el.textContent = `${words} words · ${state.summary.length} characters`;
}
function showSummaryTips() {
  const tips = [];
  const s = state.summary.trim();
  if (!s) tips.push("Add a 2–4 line professional summary highlighting your role, strongest skills, and career direction.");
  else {
    const words = s.split(/\s+/).length;
    if (words > 80) tips.push("Make it shorter — aim for 40–60 words, 2–4 lines.");
    if (!/\d/.test(s)) tips.push("Consider adding measurable impact where truthful, such as time saved or performance improved.");
    if (!state.skills.length || !state.skills.some((sk) => s.toLowerCase().includes(sk.name.toLowerCase())))
      tips.push("Mention your primary skill so it's visible immediately.");
    if (!/(experience|years|built|led|developed|managed)/i.test(s)) tips.push("Mention relevant experience or what you've built.");
    if (/(hardworking|team player|detail[- ]oriented|passionate)/i.test(s)) tips.push("Avoid generic statements like \"hardworking\" or \"team player\" — show it with specifics instead.");
  }
  if (!tips.length) tips.push("Your summary looks solid. Consider tailoring it to each job description.");
  $("#summaryTips").innerHTML = tips.map((t) => `<li>💡 ${esc(t)}</li>`).join("");
}

/* ---------- 8. PREVIEW RENDER ---------- */
function fmtRange(a, b) { return [a, b].filter(Boolean).join(" – "); }
function bulletify(text) {
  const lines = (text || "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";
  return `<ul>${lines.map((l) => `<li>${esc(l.replace(/^[-•*]\s*/, ""))}</li>`).join("")}</ul>`;
}
function contactLine() {
  const p = state.personal;
  return [p.email, p.phone, p.location, p.linkedin, p.github, p.portfolio].filter(Boolean).map(esc).join(" · ");
}
function buildResumeHTML() {
  const p = state.personal, d = state.design;
  const skillsByCat = SKILL_CATS.map((c) => ({ c, items: state.skills.filter((s) => s.category === c) })).filter((g) => g.items.length);
  return `
  <header>
    ${p.photo ? `<div style="width:60px;height:60px;border-radius:50%;background:#e5e7eb;margin-bottom:8px"></div>` : ""}
    <h1>${esc(p.name) || "Your Name"}</h1>
    ${p.title ? `<p class="rtitle">${esc(p.title)}</p>` : ""}
    <p class="contact">${contactLine() || "email · phone · location · linkedin"}</p>
  </header>

  ${state.summary ? `<section><h2>Summary</h2><p>${esc(state.summary)}</p></section>` : ""}

  ${state.experience.length ? `<section><h2>Experience</h2>${state.experience.map((x) => `
    <div class="entry"><div class="eh"><span>${esc(x.title)}${x.company ? ", " + esc(x.company) : ""}</span><span>${esc(fmtRange(x.start, x.current ? "Present" : x.end))}</span></div>
    ${x.location ? `<div class="sub">${esc(x.location)}</div>` : ""}${bulletify(x.desc)}</div>`).join("")}</section>` : ""}

  ${state.projects.length ? `<section><h2>Projects</h2>${state.projects.map((x) => `
    <div class="entry"><div class="eh"><span>${esc(x.name)}${x.role ? " — " + esc(x.role) : ""}</span><span>${esc(x.tech)}</span></div>
    ${bulletify(x.desc)}${x.contrib ? `<p class="sub">${esc(x.contrib)}</p>` : ""}
    ${(x.link || x.github) ? `<p class="sub">${[x.link, x.github].filter(Boolean).map(esc).join(" · ")}</p>` : ""}</div>`).join("")}</section>` : ""}

  ${state.education.length ? `<section><h2>Education</h2>${state.education.map((x) => `
    <div class="entry"><div class="eh"><span>${esc(x.degree)}${x.institution ? ", " + esc(x.institution) : ""}</span><span>${esc(fmtRange(x.start, x.end))}</span></div>
    ${x.location ? `<div class="sub">${esc(x.location)}</div>` : ""}${x.desc ? `<p>${esc(x.desc)}</p>` : ""}</div>`).join("")}</section>` : ""}

  ${skillsByCat.length ? `<section><h2>Skills</h2><div class="skills-grid">${skillsByCat.map((g) => `<p><b>${g.c}:</b> ${g.items.map((s) => esc(s.name)).join(", ")}</p>`).join("")}</div></section>` : ""}

  ${state.certifications.length ? `<section><h2>Certifications</h2><ul>${state.certifications.map((x) => `<li>${esc(x.name)}${x.org ? " — " + esc(x.org) : ""}${x.date ? ", " + esc(x.date) : ""}</li>`).join("")}</ul></section>` : ""}

  ${state.achievements.length ? `<section><h2>Achievements</h2><ul>${state.achievements.map((x) => `<li>${esc(x.text)}</li>`).join("")}</ul></section>` : ""}

  ${state.languages.length ? `<section><h2>Languages</h2><p>${state.languages.map((x) => `${esc(x.name)} (${esc(x.level)})`).join(" · ")}</p></section>` : ""}

  ${state.interests.length ? `<section><h2>Interests</h2><p>${state.interests.map((x) => esc(x.text)).join(" · ")}</p></section>` : ""}
  `;
}
function resumePlainText() {
  const p = state.personal;
  const parts = [p.name, p.title, contactLine().replace(/·/g, " "), "SUMMARY", state.summary, "SKILLS",
    state.skills.map((s) => s.name).join(", "), "EXPERIENCE"];
  state.experience.forEach((x) => parts.push(`${x.title} ${x.company} ${fmtRange(x.start, x.current ? "Present" : x.end)}`, x.desc));
  parts.push("PROJECTS");
  state.projects.forEach((x) => parts.push(`${x.name} ${x.tech}`, x.desc, x.contrib));
  parts.push("EDUCATION");
  state.education.forEach((x) => parts.push(`${x.degree} ${x.institution} ${fmtRange(x.start, x.end)}`, x.desc));
  parts.push("CERTIFICATIONS");
  state.certifications.forEach((x) => parts.push(`${x.name} ${x.org} ${x.date}`));
  parts.push("ACHIEVEMENTS");
  state.achievements.forEach((x) => parts.push(x.text));
  parts.push("LANGUAGES");
  state.languages.forEach((x) => parts.push(`${x.name} ${x.level}`));
  parts.push("INTERESTS");
  state.interests.forEach((x) => parts.push(x.text));
  return parts.filter(Boolean).join("\n");
}
function updatePreview() {
  const r = $("#resume"); if (!r) return;
  const d = state.design;
  r.className = "resume t-" + d.template + " hs-" + d.heading + (d.safe ? " safe" : "");
  r.style.setProperty("--accent", d.accent);
  r.style.setProperty("--ff", d.font);
  r.style.setProperty("--fs", d.size + "pt");
  r.style.setProperty("--lh", d.spacing);
  r.style.setProperty("--gap", d.gap + "px");
  r.style.setProperty("--m", d.margin + "mm");
  r.innerHTML = buildResumeHTML();
  fitPreview();
}
function fitPreview() {
  const col = $("#previewCol"), wrap = $("#resumeWrap");
  if (!col || !wrap) return;
  const avail = col.clientWidth - 32;
  const scale = clamp(avail / 794, 0.35, 1);
  wrap.style.transform = `scale(${scale})`;
  wrap.style.width = 794 * scale + "px";
  wrap.style.height = (state.design ? $("#resume").scrollHeight : 1123) * scale + "px";
}
window.addEventListener("resize", debounce(fitPreview, 150));

/* ---------- 9. DESIGN CONTROLS ---------- */
const ACCENTS = ["#3d4ef5", "#0f9d6b", "#c77700", "#d1344a", "#6c3ce9", "#0e7490", "#111827"];
function renderSwatches() {
  $("#swatches").innerHTML = ACCENTS.map((c) => `<button type="button" data-accent="${c}" style="background:${c}" aria-label="Accent ${c}"></button>`).join("");
}
function syncDesignInputs() {
  const d = state.design;
  $("#dTemplate").value = d.template; $("#dFont").value = d.font; $("#dSize").value = d.size;
  $("#dSpacing").value = d.spacing; $("#dGap").value = d.gap; $("#dMargin").value = d.margin;
  $("#dHeading").value = d.heading; $("#dSafe").checked = d.safe;
  $$("#swatches button").forEach((b) => b.classList.toggle("on", b.dataset.accent === d.accent));
}
["dTemplate", "dFont", "dSize", "dSpacing", "dGap", "dMargin", "dHeading"].forEach((id) => {
  $("#" + id).addEventListener("input", () => {
    const map = { dTemplate: "template", dFont: "font", dSize: "size", dSpacing: "spacing", dGap: "gap", dMargin: "margin", dHeading: "heading" };
    const key = map[id];
    let v = $("#" + id).value;
    if (["size", "spacing", "gap", "margin"].includes(key)) v = parseFloat(v);
    state.design[key] = v;
    updatePreview();
  });
});
$("#dSafe").addEventListener("change", (e) => { state.design.safe = e.target.checked; updatePreview(); });
$("#swatches").addEventListener("click", (e) => {
  const b = e.target.closest("[data-accent]"); if (!b) return;
  state.design.accent = b.dataset.accent; syncDesignInputs(); updatePreview();
});

/* ---------- 10. BULLET IMPROVER ---------- */
const ACTION_VERBS = ["Built", "Developed", "Designed", "Implemented", "Automated", "Optimized", "Created", "Led", "Improved", "Launched", "Architected", "Streamlined"];
function improveBullet(text) {
  const t = text.trim();
  if (!t) return [];
  const techMatch = t.match(/using ([a-zA-Z0-9,.\s/+#-]+)/i);
  const tech = techMatch ? techMatch[1].trim().replace(/\.$/, "") : "";
  const startsWithVerb = ACTION_VERBS.some((v) => new RegExp("^" + v, "i").test(t));
  const results = [];
  const base = t.replace(/^i\s+/i, "").replace(/\.$/, "");
  if (!startsWithVerb) {
    results.push(`${ACTION_VERBS[0]} ${base.charAt(0).toLowerCase() + base.slice(1)}${tech ? `, implementing core functionality with ${tech}` : ""}.`);
    results.push(`${ACTION_VERBS[2]} and delivered ${base.replace(/^(made|did|worked on)\s*/i, "")}${tech ? ` using ${tech}` : ""}, focused on usability and performance.`);
  } else {
    results.push(`${base}, improving maintainability and following best practices${tech ? ` with ${tech}` : ""}.`);
  }
  results.push(`${base}${tech ? `, using ${tech}` : ""} — describe the outcome or impact if you can measure it truthfully (e.g. users served, time saved).`);
  return [...new Set(results)];
}
$("#bulletBtn").addEventListener("click", () => {
  const out = improveBullet($("#bulletIn").value);
  $("#bulletOut").innerHTML = out.length ? out.map((o) => `<li>${esc(o)}</li>`).join("") : `<li>Type a bullet point above first.</li>`;
});

/* ---------- 11. STORAGE ---------- */
const LS_KEY = "atsinsight_resume";
function saveResume(silent) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); if (!silent) toast("Resume saved successfully."); }
  catch { toast("Could not save — your browser storage may be full or disabled.", "err"); }
}
function loadResume() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) { toast("No saved resume found.", "err"); return; }
    state = { ...defaultState(), ...JSON.parse(raw) };
    renderEditor(); renderSwatches(); syncDesignInputs(); updatePreview(); updateLiveScore();
    toast("Resume loaded.");
  } catch { toast("Saved resume data is invalid.", "err"); }
}
$("#saveBtn").addEventListener("click", () => saveResume(false));
$("#loadBtn").addEventListener("click", loadResume);
$("#clearBtn").addEventListener("click", () => {
  if (!confirm("Clear the entire resume? This cannot be undone.")) return;
  state = defaultState();
  renderEditor(); renderSwatches(); syncDesignInputs(); updatePreview(); updateLiveScore();
  toast("Resume cleared.");
});
$("#exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "atsinsight-resume.json"; a.click();
  toast("Resume data exported.");
});
$("#importFile").addEventListener("change", (e) => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      state = { ...defaultState(), ...data };
      renderEditor(); renderSwatches(); syncDesignInputs(); updatePreview(); updateLiveScore();
      toast("Resume imported.");
    } catch { toast("Invalid file format.", "err"); }
  };
  reader.onerror = () => toast("Could not read that file.", "err");
  reader.readAsText(file);
  e.target.value = "";
});
$("#printBtn").addEventListener("click", () => window.print());

/* ---------- 12. SAMPLE DATA ---------- */
function loadSample() {
  state = defaultState();
  state.personal = { name: "Alex Morgan", title: "Frontend Developer", email: "alex.morgan@email.com", phone: "+1 (555) 012-3456", location: "Austin, TX", linkedin: "linkedin.com/in/alexmorgan", github: "github.com/alexmorgan", portfolio: "alexmorgan.dev", photo: false };
  state.summary = "Frontend developer with 3 years of experience building responsive, accessible web applications with JavaScript and modern CSS. Focused on performance and clean component design.";
  state.experience = [{ id: uid(), title: "Frontend Developer", company: "Brightloop Software", location: "Austin, TX", start: "Jun 2023", end: "", current: true,
    desc: "Rebuilt the customer dashboard in vanilla JS, reducing page load time by 38%\nCollaborated with 4 designers to ship a new component library used across 6 products\nImproved accessibility score from 71 to 96 by auditing and fixing ARIA issues" }];
  state.projects = [{ id: uid(), name: "TaskFlow", role: "Creator", tech: "HTML, CSS, JavaScript, LocalStorage",
    link: "taskflow-demo.dev", github: "github.com/alexmorgan/taskflow",
    desc: "Built a drag-and-drop task board with offline support and keyboard navigation\nImplemented undo/redo and JSON import/export", contrib: "Sole developer; designed UI and wrote all logic." }];
  state.education = [{ id: uid(), degree: "B.Sc. Computer Science", institution: "University of Texas", location: "Austin, TX", start: "2019", end: "2023", desc: "Relevant coursework: Data Structures, Web Development, Databases." }];
  state.skills = [
    { id: uid(), name: "HTML", category: "Web Development" }, { id: uid(), name: "CSS", category: "Web Development" },
    { id: uid(), name: "JavaScript", category: "Programming" }, { id: uid(), name: "Git", category: "Tools" },
    { id: uid(), name: "GitHub", category: "Tools" }, { id: uid(), name: "Responsive Design", category: "Web Development" },
    { id: uid(), name: "Communication", category: "Soft Skills" },
  ];
  state.certifications = [{ id: uid(), name: "Responsive Web Design", org: "freeCodeCamp", date: "2022", link: "freecodecamp.org/certification/alexmorgan" }];
  state.achievements = [{ id: uid(), text: "Won 1st place at a 36-hour university hackathon among 40 teams" }];
  state.languages = [{ id: uid(), name: "English", level: "Native" }, { id: uid(), name: "Spanish", level: "Intermediate" }];
  state.interests = [{ id: uid(), text: "Open source" }, { id: uid(), text: "Chess" }, { id: uid(), text: "Photography" }];
  renderEditor(); renderSwatches(); syncDesignInputs(); updatePreview(); updateLiveScore();
  toast("Sample resume loaded.");
}
$("#sampleBtn").addEventListener("click", loadSample);

/* ---------- 13. ATS SCORING ENGINE ---------- */
const STOP_WORDS = new Set(("a about above after again against all am an and any are aren't as at be because been before being below between both but by can't cannot could couldn't did didn't do does doesn't doing don't down during each few for from further had hadn't has hasn't have haven't having he he'd he'll he's her here here's hers herself him himself his how how's i i'd i'll i'm i've if in into is isn't it it's its itself let's me more most mustn't my myself no nor not of off on once only or other ought our ours ourselves out over own same shan't she she'd she'll she's should shouldn't so some such than that that's the their theirs them themselves then there there's these they they'd they'll they're they've this those through to too under until up very was wasn't we we'd we'll we're we've were weren't what what's when when's where where's which while who who's whom why why's with won't would wouldn't you you'd you'll you're you've your yours yourself yourselves will etc using use used within across per year years also new work role strong ability experience skills excellent good great").split(" "));
const ACTION_VERB_SET = new Set(["built","developed","designed","implemented","automated","optimized","created","led","improved","launched","architected","streamlined","managed","increased","decreased","reduced","achieved","delivered","drove","initiated","mentored","collaborated","analyzed","engineered","deployed","migrated","refactored"]);
const FILLER_WORDS = ["very","really","just","basically","actually","things","stuff","etc","various","several","many"];
const KNOWN_TECH = new Set(["javascript","python","java","typescript","react","angular","vue","node","node.js","html","css","sql","nosql","mongodb","mysql","postgresql","docker","kubernetes","aws","azure","gcp","git","github","gitlab","rest","graphql","api","linux","figma","jira","agile","scrum","express","django","flask","spring","c++","c#",".net","php","ruby","swift","kotlin","tensorflow","pytorch","pandas","numpy","excel","tableau","power bi","sass","webpack","redux","next.js","tailwind"]);

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z][a-z0-9+.#-]{1,}/g) || []);
}
function meaningfulTokens(text) {
  return tokenize(text).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}
function extractKeywords(jdText, limit = 25) {
  const freq = {};
  meaningfulTokens(jdText).forEach((w) => (freq[w] = (freq[w] || 0) + 1));
  const ranked = Object.entries(freq).sort((a, b) => (KNOWN_TECH.has(b[0]) ? 1 : 0) - (KNOWN_TECH.has(a[0]) ? 1 : 0) || b[1] - a[1]);
  return ranked.slice(0, limit).map(([word, count]) => ({ word, count, category: KNOWN_TECH.has(word) ? "Technical / Tool" : "Domain Term" }));
}

function calculateATSScore(resumeText, jobDescription) {
  resumeText = resumeText || "";
  jobDescription = jobDescription || "";
  const lower = resumeText.toLowerCase();
  const lines = resumeText.split("\n").map((l) => l.trim()).filter(Boolean);
  const words = resumeText.trim() ? resumeText.trim().split(/\s+/) : [];
  const issues = [], strengths = [];

  /* --- Contact info (10) --- */
  let contact = 0;
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(resumeText);
  const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(resumeText);
  const hasLocation = /[A-Z][a-zA-Z]+,\s?[A-Z]{2,}|[A-Z][a-zA-Z]+,\s?[A-Z][a-zA-Z]+/.test(resumeText);
  const hasLinkedIn = /linkedin\.com/i.test(resumeText);
  const hasGitPortfolio = /(github\.com|\.dev\b|\.io\b|portfolio)/i.test(resumeText);
  [[hasEmail, "email"], [hasPhone, "phone"], [hasLocation, "location"], [hasLinkedIn, "LinkedIn"], [hasGitPortfolio, "GitHub/portfolio"]].forEach(([ok, label]) => {
    if (ok) { contact += 2; strengths.push(`Includes ${label}.`); }
    else issues.push({ problem: `Missing ${label}`, why: "Recruiters and ATS parsers look for this in the contact block.", how: `Add your ${label} near the top of the resume.` });
  });

  /* --- Section structure (15) --- */
  let sections = 0;
  const sectionChecks = [
    ["summary", /(summary|objective|profile)/i], ["skills", /skills/i],
    ["experience", /(experience|employment)/i], ["education", /education/i], ["projects", /projects/i],
  ];
  sectionChecks.forEach(([name, re]) => {
    if (re.test(resumeText)) { sections += 3; strengths.push(`Has a ${name} section.`); }
    else issues.push({ problem: `No ${name} section detected`, why: "Standard section headings help both humans and ATS software find information quickly.", how: `Add a clearly labeled "${name}" section.` });
  });

  /* --- Keyword match (25) --- */
  let keywordScore = 0, matched = [], missing = [], matchPct = 0;
  const jdKeywords = extractKeywords(jobDescription, 30);
  if (jobDescription.trim()) {
    jdKeywords.forEach((k) => (lower.includes(k.word) ? matched : missing).push(k));
    matchPct = jdKeywords.length ? Math.round((matched.length / jdKeywords.length) * 100) : 0;
    keywordScore = Math.round((matchPct / 100) * 25);
    if (missing.length) issues.push({ problem: "No job-specific keywords for some terms", why: "ATS software ranks resumes partly by keyword overlap with the job description.", how: "Consider adding these only if you genuinely have experience with them." });
  } else {
    keywordScore = 12;
  }

  /* --- Formatting / ATS safety (15) --- */
  let formatting = 15;
  const symbolCount = (resumeText.match(/[★➤♦❖✦☆▪◆]/g) || []).length;
  if (symbolCount > 3) { formatting -= 4; issues.push({ problem: "Excessive decorative symbols", why: "Unusual symbols can confuse ATS parsers or look unprofessional.", how: "Stick to plain bullet points (- or •)." }); }
  const longLines = lines.filter((l) => l.length > 200).length;
  if (longLines > 0) { formatting -= 3; issues.push({ problem: "Very long lines detected", why: "Extremely long lines are hard to scan and may be a sign of missing structure.", how: "Break long paragraphs into shorter bullet points." }); }
  const pipeCount = (resumeText.match(/\|/g) || []).length;
  if (pipeCount > 6) { formatting -= 3; issues.push({ problem: "Heavy use of table-style formatting", why: "Tables and columns can be misread by some ATS parsers.", how: "Prefer a single-column, linear layout." }); }
  const capsLines = lines.filter((l) => l.length > 15 && l === l.toUpperCase()).length;
  if (capsLines > 4) { formatting -= 2; issues.push({ problem: "Excessive all-caps text", why: "Overusing capitals reduces readability.", how: "Reserve capitals for section headings only." }); }
  if (!sectionChecks.some(([, re]) => re.test(resumeText))) { formatting -= 3; issues.push({ problem: "Non-standard section headings", why: "ATS software looks for conventional headings like \"Experience\" or \"Education\".", how: "Use standard, plain-text section headings." }); }
  formatting = clamp(formatting, 0, 15);

  /* --- Content quality (20) --- */
  let content = 0;
  const wc = words.length;
  if (wc >= 250 && wc <= 900) { content += 5; strengths.push("Resume length is in a healthy range."); }
  else issues.push({ problem: wc < 250 ? "Resume appears too short" : "Resume appears too long", why: "Very short resumes may lack detail; very long ones may lose a reader's attention.", how: wc < 250 ? "Expand on your experience and projects with specific details." : "Trim to the most relevant, recent and impactful content (aim for 1-2 pages)." });
  const bulletLines = lines.filter((l) => /^[-•*]/.test(l)).length;
  if (bulletLines >= 3) { content += 5; strengths.push("Uses bullet points for readability."); }
  else issues.push({ problem: "Few or no bullet points", why: "Bullet points are easier to scan than dense paragraphs.", how: "Use one bullet per accomplishment, especially in experience and projects." });
  const verbHits = lines.filter((l) => { const w = tokenize(l)[0]; return w && ACTION_VERB_SET.has(w); }).length;
  if (verbHits >= 2) { content += 5; strengths.push("Bullet points start with strong action verbs."); }
  else issues.push({ problem: "Weak bullet points", why: "Bullets that don't start with an action verb read as passive and vague.", how: "Start with a strong action verb such as Built, Developed, Designed, Implemented, Automated, Optimized, or Created." });
  const hasNumbers = /\d/.test(resumeText.replace(/(\+?\d[\d\s().-]{7,}\d)/g, ""));
  if (hasNumbers) { content += 5; strengths.push("Includes measurable achievements."); }
  else issues.push({ problem: "No measurable achievements", why: "Numbers make impact concrete and credible to both recruiters and hiring managers.", how: "Consider adding measurable impact where truthful, such as time saved, users served, performance improved, or features delivered." });

  /* --- Readability (15) --- */
  let readability = 15;
  const sentences = resumeText.split(/[.!?]\s/).filter((s) => s.trim().length > 3);
  const avgSentenceLen = sentences.length ? sentences.reduce((a, s) => a + tokenize(s).length, 0) / sentences.length : 0;
  if (avgSentenceLen > 30) { readability -= 4; issues.push({ problem: "Long sentences", why: "Long sentences are harder to scan quickly.", how: "Break long bullets into two shorter ones." }); }
  const fillerHits = FILLER_WORDS.filter((f) => lower.includes(f)).length;
  if (fillerHits >= 3) { readability -= 3; issues.push({ problem: "Too many generic or filler phrases", why: "Filler words dilute the impact of your accomplishments.", how: "Remove filler words and be specific about what you did." }); }
  const tokenFreq = {};
  meaningfulTokens(resumeText).forEach((w) => (tokenFreq[w] = (tokenFreq[w] || 0) + 1));
  const repeated = Object.entries(tokenFreq).filter(([, c]) => c > 8).length;
  if (repeated > 0) { readability -= 3; issues.push({ problem: "Repeated words", why: "Repeating the same word too often can feel monotonous.", how: "Vary your vocabulary, especially action verbs." }); }
  if (!resumeText.trim()) readability = 0;
  readability = clamp(readability, 0, 15);

  if (!resumeText.trim()) issues.unshift({ problem: "Resume text is empty", why: "There's nothing to analyze yet.", how: "Paste your resume text or use your builder resume." });

  const total = clamp(Math.round(contact + sections + keywordScore + formatting + content + readability), 0, 100);
  let status = "Needs work";
  if (total >= 85) status = "Strong ATS compatibility";
  else if (total >= 70) status = "Good ATS compatibility";
  else if (total >= 50) status = "Fair ATS compatibility — some gaps to fix";

  return {
    total, status,
    categories: {
      contact: { score: contact, max: 10 }, sections: { score: sections, max: 15 },
      keyword: { score: keywordScore, max: 25, pct: matchPct },
      formatting: { score: formatting, max: 15 }, content: { score: content, max: 20 }, readability: { score: readability, max: 15 },
    },
    matched, missing, issues, strengths, wordCount: wc,
  };
}

const BUZZWORDS = ["hardworking", "team player", "detail oriented", "detail-oriented", "results-driven", "results driven", "dynamic", "go-getter", "self-starter", "synergy", "think outside the box", "hard worker", "people person"];
const PASSIVE_PHRASES = ["was responsible for", "responsible for", "helped with", "assisted with", "duties included", "in charge of"];

function generateExtraTips(resumeText, state, jobDescription) {
  const lower = resumeText.toLowerCase();
  const tips = [];

  const buzzHit = BUZZWORDS.find((b) => lower.includes(b));
  if (buzzHit) tips.push(`Replace vague phrases like "${buzzHit}" with a specific, evidence-backed statement (what you did and its result).`);

  const passiveHit = PASSIVE_PHRASES.find((p) => lower.includes(p));
  if (passiveHit) tips.push(`Swap passive phrasing such as "${passiveHit}" for an active action verb (Built, Led, Delivered, Managed).`);

  if (/references available upon request/i.test(resumeText)) tips.push('Remove "References available upon request" — it\'s outdated and wastes valuable space.');

  if ((resumeText.match(/\bi\b/gi) || []).length > 4) tips.push('Avoid first-person pronouns ("I", "my") — resumes typically read as implied first person, e.g. "Built" not "I built".');

  if (state) {
    if (state.skills.length && state.skills.length < 6) tips.push(`You only have ${state.skills.length} skill${state.skills.length === 1 ? "" : "s"} listed — aim for 6–12 relevant skills so keyword matching has more to work with.`);
    if (!state.skills.length) tips.push("Add a Skills section with 6-12 relevant technical and soft skills.");
    if (state.projects.length && state.projects.some((p) => !p.link && !p.github)) tips.push("Add a live link or GitHub link to each project so recruiters can verify your work.");
    if (!state.certifications.length) tips.push("If you have any, add relevant certifications — they're an easy way to stand out and reinforce keywords.");
    if (state.experience.some((x) => x.desc && x.desc.split("\n").filter(Boolean).length < 2)) tips.push("Give each experience entry at least 2-3 bullet points so your impact is fully visible.");
    if (state.summary && state.skills.length && !state.skills.some((s) => state.summary.toLowerCase().includes(s.name.toLowerCase()))) tips.push("Your summary doesn't mention any of your listed skills — tie it to your strongest one or two.");
    if (!state.languages.length) tips.push("Consider adding a Languages section, especially for roles involving communication or multiple regions.");
  }

  if (jobDescription && jobDescription.trim()) {
    const jdTitleWords = meaningfulTokens(jobDescription.split("\n")[0] || "");
    const resumeTitle = (state && state.personal && state.personal.title || "").toLowerCase();
    if (jdTitleWords.length && resumeTitle && !jdTitleWords.some((w) => resumeTitle.includes(w))) {
      tips.push("Consider aligning your professional title more closely with the job title in the posting, if it's an honest fit.");
    }
  }

  if (!tips.length) tips.push("Nice work — no additional writing issues detected. Keep tailoring your keywords to each job you apply for.");
  return [...new Set(tips)];
}

/* ---------- 13b. JUMP-TO-SECTION (edit-in-builder) ---------- */
function issueSectionKey(problem) {
  const p = problem.toLowerCase();
  if (/email|phone|location|linkedin|github\/portfolio/.test(p)) return "personal";
  if (/summary/.test(p)) return "summary";
  if (/skills/.test(p)) return "skills";
  if (/experience|bullet/.test(p)) return "experience";
  if (/education/.test(p)) return "education";
  if (/project/.test(p)) return "projects";
  if (/achievement|measurable/.test(p)) return "achievements";
  if (/keyword/.test(p)) return "skills";
  return "summary";
}
function jumpToSection(key) {
  goTo("builder");
  requestAnimationFrame(() => {
    const el = document.getElementById("sec-" + key);
    if (!el) return;
    el.setAttribute("open", "");
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstInput = el.querySelector("input, textarea, select");
    if (firstInput) firstInput.focus({ preventScroll: true });
  });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-jump]");
  if (b) jumpToSection(b.dataset.jump);
});

/* ---------- 14. ATS PAGE ---------- */
function updateLiveScore() {
  const r = calculateATSScore(resumePlainText(), "");
  const ringColor = scoreColor(r.total);
  $("#liveRing").style.setProperty("--p", r.total);
  $("#liveRing").style.setProperty("--ring-color", ringColor);
  $("#liveScore").textContent = r.total;
  $("#liveScore").style.color = ringColor;
  $("#liveNote").textContent = r.total ? r.status : "Start typing to see your score.";
  const sug = [];
  if (!state.personal.email) sug.push("Add your email so recruiters can reach you.");
  if (!state.personal.phone) sug.push("Add a phone number to your contact details.");
  if (!state.personal.linkedin) sug.push("Add your LinkedIn URL — most recruiters check it.");
  if (!state.summary.trim()) sug.push("Add a professional summary highlighting your role, strongest skill, and career direction.");
  if (!state.skills.length) sug.push("Add at least 6 relevant skills.");
  if (!state.experience.length && !state.projects.length) sug.push("Add experience or projects — this section carries the most weight.");
  if (state.experience.some((x) => x.desc && !/\d/.test(x.desc))) sug.push("Add a measurable result to at least one experience bullet.");
  if (state.experience.some((x) => x.desc && x.desc.split("\n").filter(Boolean).length < 2)) sug.push("Give each experience entry 2-3 bullet points, not just one.");
  if (!state.education.length) sug.push("Add your education, even if it's in progress.");
  if (state.projects.length && state.projects.some((p) => !p.link && !p.github)) sug.push("Add a live or GitHub link to each project.");
  sug.push(...generateExtraTips(resumePlainText(), state, "").filter((t) => !t.startsWith("Nice work")));
  const seen = new Set();
  const finalSug = sug.filter((s) => (seen.has(s) ? false : (seen.add(s), true))).slice(0, 8);
  if (!finalSug.length) finalSug.push("Looking solid — try the full analysis for a detailed report.");
  $("#suggestions").innerHTML = finalSug.map((s) => `<li>💡 ${esc(s)}</li>`).join("");
}
$("#liveToAts").addEventListener("click", () => { $("#atsResume").value = resumePlainText(); goTo("ats"); runAnalysis(); });
$("#useBuilder").addEventListener("click", () => { $("#atsResume").value = resumePlainText(); toast("Builder resume text loaded."); });

function setUploadHint(msg) { const h = $("#uploadHint"); if (h) h.textContent = msg; }

async function extractPdfText(file) {
  if (typeof pdfjsLib === "undefined") throw new Error("PDF parser unavailable");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  const buf = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return text.trim();
}
async function extractDocxText(file) {
  if (typeof mammoth === "undefined") throw new Error("DOCX parser unavailable");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value || "").trim();
}

$("#atsFile").addEventListener("change", async (e) => {
  const file = e.target.files[0]; if (!file) return;
  const ext = file.name.split(".").pop().toLowerCase();
  setUploadHint("Reading your file…");
  try {
    let text = "";
    if (["txt", "md", "text"].includes(ext)) {
      text = await file.text();
    } else if (ext === "pdf") {
      text = await extractPdfText(file);
    } else if (ext === "docx") {
      text = await extractDocxText(file);
    } else if (ext === "doc") {
      throw new Error("Legacy .doc format isn't supported in-browser.");
    } else {
      throw new Error("Unsupported file type.");
    }
    if (!text.trim()) throw new Error("No readable text found in this file.");
    $("#atsResume").value = text;
    toast("File loaded and text extracted.");
    setUploadHint("We'll extract the text automatically. If a file ever fails to read, just paste the text instead — nothing is uploaded to a server either way.");
  } catch (err) {
    toast("Couldn't read that file automatically. Please copy and paste your resume text instead.", "err");
    setUploadHint("Couldn't parse this file (works best with digital, non-scanned PDF/DOCX). Please copy and paste your resume text below instead.");
  }
  e.target.value = "";
});

function runAnalysis() {
  const resumeText = $("#atsResume").value;
  const jd = $("#atsJD").value;
  if (!resumeText.trim()) { toast("Paste your resume text first.", "err"); return; }
  $("#loader").hidden = false;
  $("#results").innerHTML = "";
  setTimeout(() => {
    const r = calculateATSScore(resumeText, jd);
    const fromBuilder = resumeText.trim() === resumePlainText().trim();
    const extraTips = generateExtraTips(resumeText, fromBuilder ? state : null, jd);
    renderResults(r, !!jd.trim(), extraTips);
    $("#loader").hidden = true;
    toast("ATS analysis complete.");
  }, 550);
}
$("#analyzeBtn").addEventListener("click", runAnalysis);
$("#compareBtn").addEventListener("click", () => {
  if (!$("#atsJD").value.trim()) { toast("Paste a job description first.", "err"); return; }
  runAnalysis();
});

function scoreColor(pct) {
  if (pct >= 85) return "#0f9d6b";
  if (pct >= 70) return "#3d4ef5";
  if (pct >= 50) return "#c77700";
  return "#d1344a";
}
const CAT_META = {
  "Keyword match": { icon: "🔑", color: "#3d4ef5" },
  "Formatting": { icon: "🧩", color: "#6c3ce9" },
  "Content quality": { icon: "📝", color: "#0e7490" },
  "Readability": { icon: "📖", color: "#0f9d6b" },
  "Sections": { icon: "🗂️", color: "#c77700" },
  "Contact info": { icon: "📇", color: "#d1344a" },
};
function catCard(label, cat) {
  const pct = Math.round((cat.score / cat.max) * 100);
  const meta = CAT_META[label] || { icon: "📊", color: "#3d4ef5" };
  return `<div class="card cat-card" style="--cat-color:${meta.color}"><span>${meta.icon} ${label}</span><b style="color:${meta.color}">${cat.pct !== undefined ? cat.pct + "%" : pct + "%"}</b>
    <div class="bar"><i style="width:${pct}%;background:${meta.color}"></i></div><small class="hint">${cat.score}/${cat.max} pts</small></div>`;
}
function renderResults(r, hasJD, extraTips = []) {
  const c = r.categories;
  const ringColor = scoreColor(r.total);
  let html = `
  <div class="card score-head" style="--ring-color:${ringColor}">
    <div class="ring" style="--p:${r.total};--ring-color:${ringColor}"><b>${r.total}</b><small>/ 100</small></div>
    <div style="flex:1"><h3 style="color:${ringColor}">${r.total} / 100</h3><p>${esc(r.status)}</p><p class="hint">ATSInsight ATS Compatibility Estimate · rule-based analysis</p></div>
    <button class="btn primary sm" id="editInBuilderBtn">✏️ Edit resume in Builder</button>
  </div>
  <div class="cats">
    ${catCard("Keyword match", c.keyword)}
    ${catCard("Formatting", c.formatting)}
    ${catCard("Content quality", c.content)}
    ${catCard("Readability", c.readability)}
    ${catCard("Sections", c.sections)}
    ${catCard("Contact info", c.contact)}
  </div>`;

  if (hasJD) {
    html += `<div class="res-cols">
      <div class="card"><h3>Found in resume</h3>${r.matched.length ? r.matched.map((k) => `<span class="chip ok">${esc(k.word)}</span>`).join("") : `<p class="hint">No matches yet.</p>`}</div>
      <div class="card"><h3>Missing from resume</h3>${r.missing.length ? r.missing.map((k) => `<span class="chip miss">${esc(k.word)}</span>`).join("") : `<p class="hint">Nothing missing — great overlap.</p>`}<p class="hint" style="margin-top:8px">Consider adding these only if you genuinely have experience with them.</p></div>
    </div>`;
  }

  html += `<div class="res-cols">
    <div class="card"><h3>Issues to fix</h3>${r.issues.length ? r.issues.map((i) => `<div class="issue"><b>❌ ${esc(i.problem)}</b><span>${esc(i.why)}</span><span><b>Fix:</b> ${esc(i.how)}</span><button class="btn sm" data-jump="${issueSectionKey(i.problem)}" style="margin-top:8px">✏️ Fix in Builder →</button></div>`).join("") : `<p class="hint">No major issues detected.</p>`}</div>
    <div class="card"><h3>Strengths</h3><ul class="good">${r.strengths.length ? r.strengths.map((s) => `<li>✅ ${esc(s)}</li>`).join("") : `<li class="hint">Add more content to surface strengths.</li>`}</ul>
      <h3 style="margin-top:14px">Resume health report</h3>
      <p class="hint">Word count: ${r.wordCount} · Overall score: ${r.total}/100</p>
      <button class="btn sm" id="downloadReportBtn">Download Report</button>
    </div>
  </div>`;

  html += `<div class="card"><h3>More suggestions to strengthen your resume</h3><ul class="tips-list">${extraTips.map((t) => `<li>💡 ${esc(t)}</li>`).join("")}</ul></div>`;

  $("#results").innerHTML = html;
  $("#downloadReportBtn").addEventListener("click", () => downloadReport(r, hasJD, extraTips));
  $("#editInBuilderBtn").addEventListener("click", () => {
    const pasted = $("#atsResume").value.trim();
    const fromBuilder = pasted === resumePlainText().trim();
    goTo("builder");
    toast(fromBuilder ? "Fix the highlighted issues below, then re-run Analyze." : "Update each section below to match your resume, then re-run Analyze.");
  });
}
function downloadReport(r, hasJD, extraTips = []) {
  const lines = [
    "ATSInsight — Resume Health Report", "Rule-based analysis, not a guarantee of any specific employer's ATS.", "",
    `Overall score: ${r.total}/100 (${r.status})`, `Word count: ${r.wordCount}`, "",
    "CATEGORY SCORES",
    `Contact info: ${r.categories.contact.score}/${r.categories.contact.max}`,
    `Section structure: ${r.categories.sections.score}/${r.categories.sections.max}`,
    `Keyword match: ${r.categories.keyword.score}/${r.categories.keyword.max}`,
    `Formatting: ${r.categories.formatting.score}/${r.categories.formatting.max}`,
    `Content quality: ${r.categories.content.score}/${r.categories.content.max}`,
    `Readability: ${r.categories.readability.score}/${r.categories.readability.max}`, "",
  ];
  if (hasJD) {
    lines.push("MATCHED KEYWORDS", r.matched.map((k) => k.word).join(", ") || "None", "",
      "MISSING KEYWORDS (add only if genuinely applicable)", r.missing.map((k) => k.word).join(", ") || "None", "");
  }
  lines.push("STRENGTHS", ...(r.strengths.length ? r.strengths.map((s) => "- " + s) : ["None yet"]), "",
    "ISSUES & HOW TO FIX", ...r.issues.flatMap((i) => [`- ${i.problem}`, `  Why: ${i.why}`, `  Fix: ${i.how}`]), "",
    "MORE SUGGESTIONS", ...(extraTips.length ? extraTips.map((t) => "- " + t) : ["None"]));
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "atsinsight-report.txt"; a.click();
  toast("Report downloaded.");
}

/* ---------- 15. TEMPLATES & TIPS PAGES ---------- */
const TEMPLATES = [
  ["classic", "Classic ATS", "Black and white, traditional, extremely ATS-friendly."],
  ["modern", "Modern", "Clean layout with an accent-colored header."],
  ["minimal", "Minimal", "Lots of whitespace and simple typography."],
  ["professional", "Professional", "Corporate appearance with structured section bars."],
];
$("#tplGrid").innerHTML = TEMPLATES.map(([id, name, desc]) => `
  <div class="card tpl-card"><div class="thumb">${name[0]}</div><h3>${name}</h3><p class="hint">${desc}</p>
  <button class="btn sm" data-usetpl="${id}">Use this template</button></div>`).join("");
$("#tplGrid").addEventListener("click", (e) => {
  const b = e.target.closest("[data-usetpl]"); if (!b) return;
  state.design.template = b.dataset.usetpl; goTo("builder"); syncDesignInputs(); updatePreview();
  toast("Template applied.");
});

const TIPS = [
  ["How ATS works", "Applicant tracking systems parse your resume's text and structure, then rank candidates by keyword and section matches before a human ever sees it."],
  ["How to write a strong summary", "Keep it 2-4 lines. State your role, your strongest skills, and the direction you're headed — skip generic adjectives."],
  ["How to write better project descriptions", "Say what you built, the technologies used, and the result or impact, even if the impact is qualitative."],
  ["How to describe internships", "Treat them like real roles: action verb, what you did, what changed because of it."],
  ["How to use keywords", "Mirror the job description's language for tools and skills you actually have — don't force in ones you don't."],
  ["Common ATS mistakes", "Tables, images-as-text, unusual fonts, missing standard headings, and creative section names can all trip up parsers."],
  ["Resume length guide", "One page for under 5 years of experience; two pages is fine beyond that. Cut anything that isn't recent or relevant."],
  ["ATS-safe formatting", "Single column, standard fonts, plain bullets, and conventional headings like \"Experience\" and \"Education\"."],
  ["Action verbs", "Built, Developed, Designed, Implemented, Automated, Optimized, Created, Led, Improved, Launched."],
  ["Quantifiable achievements", "Where truthful: time saved, users served, performance improved, revenue impacted, features delivered."],
];
$("#tipsGrid").innerHTML = TIPS.map(([t, d]) => `<div class="card"><h3>${t}</h3><p>${d}</p></div>`).join("");

/* ---------- 15b. HERO CAROUSEL ---------- */
function initHeroCarousel() {
  const mock = $("#heroMock"); if (!mock) return;
  const slides = $$(".mock-slide", mock);
  const dots = $$(".mock-dots button", mock);
  if (!slides.length) return;
  let i = 0, timer;
  function show(n) {
    i = n;
    slides.forEach((s, idx) => s.classList.toggle("active", idx === n));
    dots.forEach((d, idx) => d.classList.toggle("on", idx === n));
  }
  function next() { show((i + 1) % slides.length); }
  function restart() { clearInterval(timer); timer = setInterval(next, 4000); }
  dots.forEach((d, idx) => d.addEventListener("click", () => { show(idx); restart(); }));
  restart();
}

/* ---------- 16. INIT ---------- */
function init() {
  initTheme();
  renderEditor();
  renderSwatches();
  syncDesignInputs();
  goTo("home");
  updatePreview();
  updateLiveScore();
  initHeroCarousel();
}
init();
