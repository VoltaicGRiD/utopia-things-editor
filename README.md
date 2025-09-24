# things-editor

[![Release](https://img.shields.io/github/v/release/VoltaicGRiD/utopia-things-editor?style=flat-square)](https://github.com/VoltaicGRiD/utopia-things-editor/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/VoltaicGRiD/utopia-things-editor/ci.yml?branch=main&style=flat-square)](https://github.com/VoltaicGRiD/utopia-things-editor/actions)
[![Issues](https://img.shields.io/github/issues/VoltaicGRiD/utopia-things-editor?style=flat-square)](https://github.com/VoltaicGRiD/utopia-things-editor/issues)
[![Stars](https://img.shields.io/github/stars/VoltaicGRiD/utopia-things-editor?style=flat-square)](https://github.com/VoltaicGRiD/utopia-things-editor/stargazers)
[![License](https://img.shields.io/github/license/VoltaicGRiD/utopia-things-editor?style=flat-square)](https://github.com/VoltaicGRiD/utopia-things-editor/blob/main/LICENSE)
[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/voltaicgrid)

This repository contains the Things Editor web app and a lightweight markup parser at `src/components/Parser.js`.

The editor provides a Monaco-based text editor with a live preview powered by the parser and tools to export pages as PNGs.

## Quick commands

Install dependencies:

```pwsh
npm install
```

Run dev server:

```pwsh
npm run serve
```

Run tests (Jest):

```pwsh
npm test
```

Lint:

```pwsh
npm run lint
```

## What this project provides

- A lightweight markup parser: `src/components/Parser.js` (function: `parse(input: string, columnCount = 1) -> HTMLElement`). It returns a `div.content-parent` containing `.page` elements, each with `.page-content` and one or more `.column` children.
- A visual editor UI at `src/components/Editor.vue` that embeds Monaco, exposes document controls (columns, page type, templates), shows a live rendered preview, and supports exporting pages to PNG via `dom-to-image-more`.
- Unit tests for the parser in `tests/parser.test.js` (Jest + jsdom).

## Editor (UI) overview

Location: `src/components/Editor.vue`

Key features:
- Monaco-based text editor with lightweight syntax highlighting for parser commands.
- Live preview that renders parsed DOM from `parse()` and scales the document to preserve pixel font sizes.
- Toolbar controls for page type, column count, document width/height, font sizes (px/pt) and DPI.
- Template insertions for equipment, spells, talent/specialist tables and other reusable blocks.
- Auto-save to `localStorage` under the key `things-editor-content` (interval-based autosave).
- Export: renders each `.page` into a PNG (one file per page) and packages them into a ZIP using `JSZip` and `FileSaver`.

Dependencies used by the editor:
- `monaco-editor`
- `dom-to-image-more`
- `jszip`
- `file-saver`

## Parser overview & supported commands

Lines beginning with a slash (`/`) are commands (case-insensitive). The parser also supports Markdown-like headings, lists, code fences and inline formatting. Below are the most used commands; see the source for full behavior.

- `/page <type> <label>` — create a new page. `type` may be: `equipment`, `gameplay`, `info`, `lore`, `species`, `talent`, `toc`, or `advanced`. `label` becomes the page number or label text.
- `/columns <N>` — set columns for the current page (overrides default passed to `parse`).
- `/column` or `/col` — advance to the next column on the active page.
- `/spacing <px>` or `/sp <px>` — insert vertical spacing (pixels).
- `/page-num <N>` — insert a page-number element (formatted as 3 digits).
- `/page-break` — insert a `.page-break` marker element.
- `/style begin` ... `/style end` — collect lines and inject a `<style>` element into the returned document (parser sanitizes `<` and `>` from the collected text).
- `/img <src> [alt and attribute block]` — insert an image; you can append an attribute block (see below).
- `/note <text>` (aliases `/info`, `/lore`) ... `/end` — create a decorative note box with paragraph content inside.
- `/equipment <rarity> <name>` ... `/next` `/end` — create an equipment block with detail sub-commands: `/type`, `/cost`, `/tag`, `/damage`, `/desc`, `/flavor`, `/craft`.
- `/toc begin` ... `/toc end` — create a table-of-contents block; lines inside are parsed like `Title | Page`.
- Headings: `#`, `##`, `###` — standard Markdown-style headings; you can append an attribute block.
- Lists: `- ` or `* ` — unordered lists; `1. ` etc — ordered lists.
- Code fences: triple backticks produce `<pre><code>` blocks; optional language is added as a class on `<code>`.
- Horizontal rule: `---` or `/hr` creates an `<hr>`.

All user content is HTML-escaped before inline formatting is applied (bold, italic, links) to avoid injection.

## Attribute block syntax

Append an attribute block `{...}` to headings, paragraphs, or many single-line commands to add classes, id, inline styles, or a `span-N` directive used by some layout elements.

Examples:

```
# Chapter {.lead #chapter-1 style="color:#222" span-2}
This paragraph has attributes {.muted}
```

Supported tokens inside `{}`:
- `.name` — add class `name`
- `#id` — set id
- `style="..."` — set inline style attribute
- `span-N` — sets the span value (useful for headings that should span columns)

## Inline formatting

- Bold: `**bold**` → `<strong>`
- Italic: `*italic*` → `<em>`
- Links: `[text](url)` → `<a href="url">text</a>`

The parser escapes HTML before processing inline tokens to keep rendered output safe.

## Examples

Simple document:

```
# Title
This is a **bold** and *italic* paragraph.
/img /assets/logo.png Logo {.center}
- bullet a
- bullet b
```

Equipment block example:

```
/equipment rare Fine Blade
/type Sword
/cost 250
/desc A finely made blade.
/next
/tag Material:Steel
/end
```

Style injection example:

```
/style begin
.note { border-radius: 6px; }
/style end
```

## Tests

Unit tests live in `tests/parser.test.js`. They use `jsdom` via Jest to validate DOM output.

Run them with:

```pwsh
npm test
```

## Developer notes

- The editor disposes Monaco and disconnects observers on component unmount to avoid leaks.
- Preview scaling is computed in `Editor.vue` (function `updateScale()` or similar) to preserve pixel font sizes while fitting the viewer.
- Export pipeline uses `dom-to-image-more` (prefers `toBlob`) and `JSZip` + `FileSaver` to create a ZIP of PNG pages.
- If you add new templates or toolbar items in `Editor.vue`, update the corresponding insertion handlers so templates are inserted at the editor cursor.

## Contributing / Running locally

1. npm install
2. npm run serve
3. Open the app in your browser, edit markup in the left pane, and preview updates on the right.
4. Use the Export button to create a ZIP of page PNGs.

If anything in this README appears out of sync with the code, please update the appropriate files in `src/components` and the tests in `tests/`.