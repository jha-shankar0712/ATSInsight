# ATSInsight

**Free ATS Resume Builder & Analyzer — 100% frontend, 100% private.**

> Build smarter. Pass ATS. Get noticed.

ATSInsight is a portfolio-grade, single-page web app that lets anyone build a professional resume, customize its design, and check it against a rule-based ATS (Applicant Tracking System) scoring engine — entirely in the browser. No backend, no database, no paid or external AI APIs.

---

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Project architecture](#project-architecture)
- [Folder structure](#folder-structure)
- [How to run](#how-to-run)
- [How ATS scoring works](#how-ats-scoring-works)
- [Scoring categories](#scoring-categories)
- [Keyword matching approach](#keyword-matching-approach)
- [Resume builder features](#resume-builder-features)
- [Templates](#templates)
- [LocalStorage architecture](#localstorage-architecture)
- [Privacy](#privacy)
- [Browser compatibility](#browser-compatibility)
- [Responsive design](#responsive-design)
- [Accessibility](#accessibility)
- [Known limitations](#known-limitations)
- [Future improvements / roadmap](#future-improvements--roadmap)
- [Use cases](#use-cases)
- [Learning outcomes](#learning-outcomes)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Features

- Multi-section resume builder: personal info, summary, experience, projects, education, skills (categorized), certifications, achievements, languages, interests
- Live resume preview that updates instantly as you type, no page refresh
- 4 printable templates: Classic ATS, Modern, Minimal, Professional
- Design controls: font, font size, line spacing, section spacing, page margins, heading style, accent color, and an **ATS Safe Mode** that strips decoration for maximum parser compatibility
- Print / Save as PDF via the browser's native print dialog, tuned for A4
- Dedicated **ATS Checker**: paste resume text or upload a real PDF / DOCX / TXT file (auto text extraction), paste a job description, and run a rule-based analysis
- **Edit-in-Builder**: after analysis, jump straight into the Builder — either globally or via a "Fix in Builder →" button on each detected issue that opens and scrolls to the exact section to fix
- 12 font choices, colorful category-coded score dashboard, and a rotating 3-slide product preview on the homepage
- Transparent ATS Compatibility Estimate out of 100, broken into 6 weighted categories
- Keyword extraction and matching against a job description, with matched/missing keyword chips
- Issue detection (missing sections, weak bullets, no metrics, formatting risks, etc.) with a "why it matters" and "how to fix it" for each
- Downloadable plain-text resume health report
- Contextual, rule-based writing suggestions (summary tips, live ATS score in the builder, bullet-point improver)
- Sample resume loader for instantly seeing the app in action
- Save / load / clear resume in `localStorage`, plus JSON export / import
- Dark / light theme toggle, saved across sessions
- Fully responsive, keyboard accessible, and privacy-first

## Screenshots

> Screenshots go here once you add them to a `screenshots/` folder in your repo.

```
screenshots/home.png
screenshots/builder.png
screenshots/ats-checker.png
screenshots/report.png
```

## Tech stack

- **HTML5** — semantic, single-page structure
- **CSS3** — custom properties, Grid/Flexbox, print stylesheet, dark mode via `[data-theme]`
- **Vanilla JavaScript (ES6+)** — no frameworks, no build step, no bundler

## Project architecture

ATSInsight is a single-page app. Navigation between "pages" (Home, Builder, ATS Checker, Templates, Tips, About) is handled by toggling `.page.active` on plain `<section>` elements inside one `index.html` — no routing library, no reloads.

The resume itself is modeled as one JavaScript state object (`state`) containing personal info, arrays for each repeatable section, and a `design` sub-object for template/typography/color choices. Every input in the editor is bound to a path in that object (`data-f="experience.<id>.title"`); a single delegated `input` listener updates state and re-renders the live preview. Adding/removing repeatable items (experience, projects, skills, etc.) re-renders just that list.

The ATS analysis is driven by one pure function, `calculateATSScore(resumeText, jobDescription)`, so the same engine powers both the small "live score" widget in the builder sidebar and the full ATS Checker page.

## Folder structure

```
ATSInsight/
├── index.html      # single-page markup for every screen
├── style.css       # all styling, organized into numbered sections
├── script.js       # all application logic, organized into numbered sections
└── README.md
```

## How to run

No build tools, no installs required.

1. Download or clone this folder.
2. Open `index.html` directly in any modern browser, **or**
3. Right-click `index.html` in VS Code and choose "Open with Live Server" for auto-reload while editing.

That's it — the whole app runs client-side.

## How ATS scoring works

`calculateATSScore()` in `script.js` runs a series of transparent, rule-based checks against the resume text (and, optionally, a job description) and returns a score out of 100, a status label, per-category breakdowns, matched/missing keywords, detected issues, and detected strengths. It is clearly labeled throughout the UI as the **"ATSInsight ATS Compatibility Estimate"** — a rule-based approximation, not a simulation of any specific company's real ATS software.

## Scoring categories

| Category | Points | What it checks |
|---|---|---|
| Contact information | 10 | Email, phone, location, LinkedIn, GitHub/portfolio present |
| Section structure | 15 | Summary, Skills, Experience, Education, Projects headings present |
| Keyword match | 25 | Overlap between resume text and extracted job-description keywords |
| Formatting / ATS safety | 15 | Decorative symbols, overly long lines, table-like pipe formatting, excessive caps, non-standard headings |
| Content quality | 20 | Resume length, bullet-point usage, action verbs, quantifiable achievements |
| Readability | 15 | Average sentence length, filler words, repeated words |

## Keyword matching approach

1. **Tokenize** the job description into lowercase word tokens.
2. **Remove stop words** using a built-in stop-word list (common English words plus a few resume-generic terms).
3. **Frequency-count** the remaining tokens and rank them, giving priority to terms found in a curated technical/tool keyword list (languages, frameworks, tools, platforms).
4. **Compare** the top keywords against the resume text to produce *Matched* and *Missing* lists and a match percentage.
5. The UI always reminds users: *"Consider adding these only if you genuinely have experience with them."* — ATSInsight never encourages fabricating skills.

## Resume builder features

- Repeatable sections (experience, projects, education, certifications, achievements, languages, interests) with add/remove controls
- Categorized skill tags (Programming, Web Development, Database, Tools, Soft Skills, Other)
- "Current job" checkbox that auto-fills "Present" as the end date
- Word/character counter and rule-based "Improve Summary" suggestions
- Standalone "Improve Bullet Point" tool that rewrites a weak bullet using action verbs — without inventing metrics, technologies, or experience
- Live ATS score widget in the sidebar while you edit

## Templates

| Template | Style |
|---|---|
| Classic ATS | Black & white, centered header, maximum parser compatibility |
| Modern | Accent-colored header band, clean section styling |
| Minimal | Light weight typography, generous whitespace |
| Professional | Left accent border, shaded section headings, corporate feel |

All four remain print-safe and switch instantly without losing your content. **ATS Safe Mode** (in the Design panel) overrides any template's decoration with a plain, single-color, single-column layout for maximum machine readability.

## LocalStorage architecture

| Key | Contents |
|---|---|
| `atsinsight_resume` | The full resume `state` object (personal info, all sections, design settings), as JSON |
| `atsinsight_theme` | `"light"` or `"dark"` |

Use **Save Resume** / **Load Resume** / **Clear Resume** in the builder toolbar to manage this data, or **Export JSON** / **Import JSON** to move your resume between browsers or back it up as a file.

## Privacy

> **Your resume stays in your browser. ATSInsight does not send your resume data to a server.**

There is no backend and no analytics collecting resume content. All processing (ATS scoring, keyword extraction, template rendering) happens locally with JavaScript. The only persistence is your own browser's `localStorage`, which you can clear at any time.

## Browser compatibility

Built with standard, widely supported Web APIs (`localStorage`, `FileReader`, `Blob`, CSS Grid/Flexbox, CSS custom properties, `window.print()`). Works in current versions of Chrome, Edge, Firefox, and Safari. No polyfills required.

## Responsive design

CSS Grid layouts collapse from a 3-column builder (editor / preview / tools) down to a single column on tablets and phones. The navigation becomes a toggleable menu below ~860px. The resume preview scales to fit its container width via a JavaScript-driven CSS transform so it never overflows horizontally.

## Accessibility

- Semantic HTML (`header`, `nav`, `main`, `section`, `article`, `footer`, proper heading levels)
- A "skip to content" link
- All form controls have associated `<label>` elements
- Visible focus states via `:focus-visible`
- Sufficient color contrast in both light and dark themes
- `aria-live` regions for ATS results and toast notifications
- `prefers-reduced-motion` respected

## Known limitations

- PDF/DOCX text extraction relies on two optional CDN libraries (PDF.js and Mammoth.js, loaded from cdnjs — see `index.html`). Nothing is uploaded anywhere; parsing happens fully in the browser. If you're offline or the CDN is unreachable, uploading still fails gracefully and the app prompts you to paste resume text instead — the rest of the app works with zero dependency on these libraries.
- Scanned/image-only PDFs have no selectable text, so extraction can return empty results; paste the text manually in that case.
- The ATS scoring engine is rule-based and heuristic. It approximates common ATS behavior but cannot replicate any specific vendor's proprietary system.
- Location, phone, and formatting detection use regular expressions and can occasionally miss uncommon formats.

## Future improvements / roadmap

- Optional, clearly-documented CDN library for basic PDF text extraction (kept fully optional per the privacy-first design)
- Additional templates and per-template color themes
- Resume version history within `localStorage`
- Exportable PDF generation without relying on the browser's print dialog
- Multi-language keyword dictionaries

## Use cases

- Job seekers building a first resume or tailoring one to a specific posting
- Students creating a portfolio-ready resume from scratch
- Career changers checking whether their resume covers standard ATS expectations
- Anyone who wants a quick, private, offline-friendly resume health check

## Learning outcomes

This project demonstrates: vanilla JS state management without a framework, SPA-style navigation with plain DOM APIs, event delegation for dynamic forms, `localStorage`-based persistence with import/export, a rule-based text-analysis engine (tokenization, stop-word removal, frequency ranking), print-specific CSS, and accessible, responsive UI design.

## Contributing

Issues and pull requests are welcome. Please keep contributions framework-free (vanilla HTML/CSS/JS), keep the app fully client-side, and avoid introducing paid or external AI APIs.

## License

MIT License — free to use, modify, and distribute.

## Credits

Built as an open portfolio project. Sample resume content uses a fictional candidate ("Alex Morgan") for demonstration purposes only.
