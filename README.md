# things-editor

## Project setup
# things-editor

This repository contains the Things Editor web app and a lightweight markup parser at `src/components/Parser.js`.

This README documents the parser commands, attribute syntax, examples, and how to run tests.

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

## Parser overview

Function: parse(input: string, columnCount = 1) -> HTMLElement

- Returns a `div.content-parent` containing `.page` elements with `.page-content` and `.column` children.
- Designed for rendering simple document markup into DOM nodes.

Location: `src/components/Parser.js`

Tests: `tests/parser.test.js`

## Full command reference

Lines beginning with a slash (`/`) are commands. Commands are case-insensitive unless noted.

- /page <type> <label>
	- Create a new page with the given type and optional label.
	- type: equipment | gameplay | info | lore | species | talent | toc | advanced
	- label is a number or string that becomes the `.page-number` content.

- /columns <N>
	- Set the number of columns for the current page to N. (Overrides the default columnCount passed to parse.)

- /column or /col
	- Advance to the next column in the active page.

- /spacing <px> or /sp <px>
	- Insert vertical spacing of the given pixel height.

- /page-num <N>
	- Insert a page number element (formatted as 3 digits).

- /page-break
	- Insert an element with class `page-break` to indicate a manual break (for CSS to style).

- /style begin ... /style end
	- Collect lines until `/style end` and inject a `<style>` tag into the returned document.
	- Basic sanitization removes `<` and `>` characters from the collected text. Use with caution for untrusted input.

- /img <src> [alt and attribute block]
	- Insert an `<img>` into the current column. You may append an attribute block to set classes/id/style/alt.
	- Example: `/img /assets/logo.png Logo {.center}`

- /note <text>  (aliases: /info, /lore)
	- Start a decorative note box. Content lines following the start become paragraph lines inside the note.
	- End with `/end`.

- /equipment <rarity> <name>
	- Start an equipment block with rarity (crude, common, uncommon, rare, legendary, mythic) and a title.
	- Following lines may use commands: `/type`, `/cost`, `/tag`, `/damage`, `/desc`, `/flavor`, `/craft` to add details.
	- Use `/next` to start a new equipment-section and `/end` to close the equipment block.

- /toc begin  ... /toc end
	- Start a Table of Contents block. Inside, each line is interpreted as `Title | Page` (page is optional) and becomes a `.toc-entry`.

- Headings: `#`, `##`, `###`, etc.
	- Standard Markdown-style headings. You can append an attribute block (see below).

- Lists:
	- Unordered: lines starting with `- ` or `* ` produce a `<ul>` with `<li>` children.
	- Ordered: lines starting with `1. `, `2. ` produce an `<ol>`.

- Code fences:
	- Standard triple backticks: ```` ```js\nconsole.log(1)\n``` ```` produces a `<pre><code>` block. Language (optional) is set as `language-<lang>` on the `<code>` element.

- Horizontal rule: `---` or `/hr` creates an `<hr>`.

## Attribute block syntax

Append `{...}` to the end of a heading or paragraph (or many single-line commands) to add classes, id, style, or a span number. The syntax is flexible:

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

The parser returns an object that will apply these attributes to the created element.

## Inline formatting

- Bold: `**bold**` → `<strong>`
- Italic: `*italic*` → `<em>`
- Links: `[text](url)` → `<a href="url">text</a>`

All inline text is HTML-escaped before formatting to protect against injection.

## Examples

Simple document:

```
# Title
This is a **bold** and *italic* paragraph.
/img /assets/logo.png Logo {.center}
- bullet a
- bullet b
```

Equipment block:

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