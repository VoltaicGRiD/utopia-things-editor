/**
 * Parse lightweight markup into structured DOM nodes.
 *
 * Supported commands (case-insensitive):
 *  /page <type> <number|label>
 *  /column   (alias: /col)
 *  /spacing <px> (alias: /sp <px>)
 *  /equipment <rarity> <name>
 *      followed by /type /cost /tag /damage /desc /flavor /craft lines
 *      /next to start a new equipment section, /end to close equipment block
 *  /note <text> (aliases: /info, /lore) ... /end
 *  /toc begin  ... /toc end
 *      Inside TOC block: lines shaped as "Title | 001" become entries.
 *  /page-num <number>
 *  /style begin ... /style end  -> injects a <style> block (sanitized)
 *  /img <src> [alt and attributes]
 *  /columns <n>  -> set number of columns for current page
 *  /page-break
 *
 * Headings:  #, ##, ### etc. Append {.class #id style="..." span-2} to add attributes.
 * Inline formatting: **bold**, *italic*, [link](url).
 * All user content is HTML-escaped prior to inline formatting replacement.
 */
export function parse(input, columnCount = 1) {
  columnCount = Math.max(1, parseInt(columnCount, 10) || 1);
  const lines = (input || '').split('\n');

  // ---------- Utility helpers ----------
  const escapeHTML = (str) => String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const applyInlineFormatting = (text) => {
    // Work on escaped text so user HTML cannot break out.
    let safe = escapeHTML(text);
    // Bold first to avoid double-processing inside italic.
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Links: [text](url)
    safe = safe.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t, u) => {
      return `<a href="${escapeHTML(u)}">${t}</a>`;
    });
    return safe;
  };

  const createEl = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };

  const makeColumn = () => createEl('div', 'column');
  const makePage = (pageType) => {
    const type = pageType || 'default';
    const page = createEl('div', 'page page-' + type);
    page.style.setProperty('background', `var(--${type}-background)`);
    page.appendChild(createEl('div', 'page-content'));
    return page;
  };

  // ---------- Regex (precompiled) ----------
  const RE = {
    comment: /^\/\/\s+(.*)$/i,
    page: /^\/page\s+(equipment|gameplay|info|lore|species|talent|toc|advanced)\s+(.+)$/i,
    pageNum: /^\/page-num\s+(\d+)$/i,
    column: /^\/(column|col)$/i,
    spacing: /^\/(spacing|sp)\s+(\d+)$/i,
    equipment: /^\/equipment\s+(crude|common|uncommon|rare|legendary|mythic)\s+(.*)$/i,
    equipmentDetail: /^\/(type|cost|tag|damage|desc|flavor|craft)\s+(.*)$/i,
    equipmentNext: /^\/next$/i,
    noteStart: /^\/(note|info|lore)\s+(.*)$/i,
    blockEnd: /^\/end$/i,
    toc: /^\/toc\s+(begin|end)$/i,
    heading: /^(#+)\s+(.*)$/,
    // style blocks
    styleBegin: /^\/style\s+begin$/i,
    styleEnd: /^\/style\s+end$/i,
    img: /^\/img\s+(\S+)(?:\s+(.*))?$/i,
    codeFenceBegin: /^```\s*(\w+)?\s*$/,
    hr: /^-{3,}\s*$/,
    pageBreak: /^\/page-break$/i,
    columns: /^\/columns\s+(\d+)$/i
  };

  // ---------- State ----------
  const parent = createEl('div', 'content-parent');
  // lazy pages: don't create a page until a explicit /page command is seen
  const pages = [];
  let activePageIndex = -1;
  let activePage = null;
  const pageColumns = [];
  let activeColumnIndex = -1;

  let noteDiv = null; // current note box
  let equipmentDiv = null; // current equipment wrapper
  let equipmentSectionContainer = null; // current equipment inner section
  let equipmentSectionCount = 0;
  let tocDiv = null; // TOC container
  let styleCollect = null; // array of style lines when inside style block
  const pageColumnLimits = [];

  const getActiveColumn = () => pageColumns[activePageIndex][activeColumnIndex];

  const ensureColumn = () => {
    if (activePageIndex < 0) return; // no active page
    if (!pageColumns[activePageIndex] || pageColumns[activePageIndex].length === 0) {
      pageColumns[activePageIndex] = [makeColumn()];
      activePage.querySelector('.page-content').appendChild(pageColumns[activePageIndex][0]);
      activeColumnIndex = 0;
    }
  };

  const startNewPage = (type, pageLabel) => {
    const page = makePage(type);
    pages.push(page);
    parent.appendChild(page);
    activePageIndex = pages.length - 1;
    activePage = page;
    pageColumns[activePageIndex] = [];
    const firstCol = makeColumn();
    page.querySelector('.page-content').appendChild(firstCol);
    pageColumns[activePageIndex].push(firstCol);
    activeColumnIndex = 0;
    if (pageLabel) {
      const pageDiv = createEl('div', 'page-number');
      if (/^\d+$/.test(pageLabel)) {
        pageDiv.textContent = pageLabel.toString().padStart(3, '0');
      } else {
        pageDiv.textContent = pageLabel;
      }
      activePage.appendChild(pageDiv);
    }
  };

  const startEquipment = (rarity, name) => {
    const equipment = createEl('div', 'equipment rarity-' + rarity.toLowerCase());
    const contentWrap = createEl('div', 'equipment-content');
    const title = createEl('div', 'equipment-title', name);
    contentWrap.appendChild(title);
    equipment.appendChild(contentWrap);
    getActiveColumn().appendChild(equipment);
    equipmentDiv = equipment;
    equipmentSectionContainer = contentWrap;
    equipmentSectionCount = 0;
  };

  const addEquipmentDetail = (kind, rawContent) => {
    if (!equipmentDiv) return;
    // Don't create a new section until the first 'next' is called
    // if (!equipmentSectionContainer || equipmentSectionCount === 0) {
    //   equipmentSectionCount = 1;
    //   const section = createEl('div', 'equipment-section section-1');
    //   equipmentDiv.appendChild(section);
    //   equipmentSectionContainer = section;
    // }
    const detail = createEl('div', 'equipment-detail ' + kind.toLowerCase());
    if (kind.toLowerCase() === 'tag') {
      const [left, ...rest] = rawContent.split(':');
      const right = rest.join(':').trim();
      const first = createEl('span', 'equipment-tag-type', left.trim() + ': ');
      const second = createEl('span', 'equipment-tag-content', right);
      detail.appendChild(first);
      detail.appendChild(second);
    } else {
      detail.textContent = rawContent;
    }
    equipmentSectionContainer.appendChild(detail);
  };

  const nextEquipmentSection = () => {
    if (!equipmentDiv) return;
    equipmentSectionCount += 1;
    const section = createEl('div', 'equipment-section section-' + equipmentSectionCount);
    equipmentDiv.appendChild(section);
    equipmentSectionContainer = section;
  };

  const endEquipment = () => {
    equipmentDiv = null;
    equipmentSectionContainer = null;
    equipmentSectionCount = 0;
  };

  const startNote = (type, firstLine) => {
    const wrapper = createEl('div', 'note ' + type.toLowerCase());
    const makeImg = (cls, file) => {
      const img = document.createElement('img');
      img.className = 'box ' + cls;
      img.src = '../assets/blocks/' + file;
      return img;
    };
    wrapper.appendChild(makeImg('box-top-left', 'box-top-left.svg'));
    wrapper.appendChild(makeImg('box-top-right', 'box-top-right.svg'));
    wrapper.appendChild(makeImg('box-bottom-left', 'box-bottom-left.svg'));
    wrapper.appendChild(makeImg('box-bottom-right', 'box-bottom-right.svg'));
    const gradient = createEl('div', 'box box-gradient ' + type.toLowerCase());
    wrapper.appendChild(gradient);
    const p = createEl('p', 'note-content');
    p.innerHTML = applyInlineFormatting(firstLine);
    wrapper.appendChild(p);
    getActiveColumn().appendChild(wrapper);
    noteDiv = wrapper;
  };

  const appendNoteLine = (line) => {
    if (!noteDiv) return;
    const p = createEl('p', 'note-content');
    p.innerHTML = applyInlineFormatting(line);
    noteDiv.appendChild(p);
  };

  const endNote = () => { noteDiv = null; };

  const startTOC = () => {
    tocDiv = createEl('div', 'toc');
    getActiveColumn().appendChild(tocDiv);
  };
  const endTOC = () => { tocDiv = null; };
  const addTOCEntry = (title, page) => {
    if (!tocDiv) return;
    const entry = createEl('div', 'toc-entry');
    const t = createEl('span', 'toc-title');
    t.textContent = title;
    const p = createEl('span', 'toc-page');
    p.textContent = page;
    entry.appendChild(t);
    entry.appendChild(p);
    tocDiv.appendChild(entry);
  };

  const addHeading = (level, text, span, attrs) => {
    level = Math.min(6, level || 1);
    const h = createEl('h' + level);
    h.textContent = text;
    if (attrs) {
      if (attrs.id) h.id = attrs.id;
      attrs.classes.forEach(c => h.classList.add(c));
      if (attrs.style) h.setAttribute('style', attrs.style);
    }
    if (span && span > 1) {
      h.classList.add('span-' + span);
      if (attrs && !attrs.classes.includes('span-' + span)) {
        h.classList.add('span-' + span);
      }
      activePage.appendChild(h);
      activePage.classList.add('has-span-' + span);
    } else {
      getActiveColumn().appendChild(h);
    }
  };

  const addParagraph = (line, attrs) => {
    const p = createEl('p');
    p.innerHTML = applyInlineFormatting(line);
    if (attrs) {
      if (attrs.id) p.id = attrs.id;
      attrs.classes.forEach(c => p.classList.add(c));
      if (attrs.style) p.setAttribute('style', attrs.style);
    }
    getActiveColumn().appendChild(p);
  };

  const addSpacing = (px) => {
    const spacer = createEl('div', 'spacing');
    spacer.style.height = px + 'px';
    getActiveColumn().appendChild(spacer);
  };

  const addPageNumber = (num) => {
    const pageDiv = createEl('div', 'page-number');
    pageDiv.textContent = num.toString().padStart(3, '0');
    activePage.appendChild(pageDiv);
  };

  const advanceColumn = () => {
    const cols = pageColumns[activePageIndex];
    const limit = pageColumnLimits[activePageIndex] || columnCount;
    if (cols.length < limit) {
      const newCol = makeColumn();
      cols.push(newCol);
      activePage.querySelector('.page-content').appendChild(newCol);
      activeColumnIndex = cols.length - 1;
    } else {
      activeColumnIndex = (activeColumnIndex + 1) % limit;
    }
  };

  // Attribute block parser: supports {.class1 .class2 #id style="color:red;" span-2}
  const parseAttributeBlock = (body) => {
    const attrMatch = body.match(/\s\{([^}]*)}\s*$/);
    if (!attrMatch) return { text: body, classes: [], id: null, style: null, span: null };
    const attrContent = attrMatch[1].trim();
    const remaining = body.slice(0, attrMatch.index).trim();
    // Tokenize by spaces not inside quotes (simple split suffices for limited syntax)
    const rawTokens = attrContent.match(/(?:"[^"]*"|'[^']*'|[^\s]+)/g) || [];
    const classes = [];
    let id = null;
    let style = null;
    let span = null;
    rawTokens.forEach(t => {
      if (t.startsWith('.')) {
        classes.push(t.slice(1));
      } else if (t.startsWith('#')) {
        id = t.slice(1);
      } else if (t.toLowerCase().startsWith('style=')) {
        const val = t.substring(6).replace(/^['"]|['"]$/g, '');
        style = val;
      } else if (/^span-(\d+)$/i.test(t)) {
        const m = t.match(/span-(\d+)/i);
        span = parseInt(m[1], 10) || null;
      } else {
        // treat unknown token as class to be flexible
        classes.push(t);
      }
    });
    return { text: remaining, classes, id, style, span };
  };

  // ---------- Main loop ----------
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let line = raw.trim();
    if (!line) continue;

    // If no page has been created yet, ignore all non-page lines to avoid
    // inserting a blank initial page. Allow style blocks and comments.
    if (activePageIndex < 0 && !RE.page.test(line) && !RE.styleBegin.test(line) && !RE.styleEnd.test(line) && !RE.comment.test(line)) {
      continue;
    }

    // Style block collection mode
    if (styleCollect && !(RE.styleEnd.test(line) || RE.blockEnd.test(line))) {
      styleCollect.push(line);
      continue;
    }
    if (styleCollect && (RE.styleEnd.test(line) || RE.blockEnd.test(line))) {
      // finalize style element
      const styleEl = document.createElement('style');
      // Basic sanitization: remove < and >
      const css = styleCollect.join('\n').replace(/[<>]/g, '');
      styleEl.textContent = css;
      parent.appendChild(styleEl);
      styleCollect = null;
      continue;
    }

    // Skip comments
    if (RE.comment.test(line)) continue;

    // Handle modes first
    if (noteDiv && !RE.blockEnd.test(line)) {
      appendNoteLine(line);
      continue;
    }

    if (equipmentDiv && !RE.blockEnd.test(line)) {
      if (RE.equipmentNext.test(line)) { nextEquipmentSection(); continue; }
      const mDet = line.match(RE.equipmentDetail);
      if (mDet) { addEquipmentDetail(mDet[1], mDet[2]); continue; }
    }

    if (tocDiv && !RE.toc.test(line)) {
      // Expect pattern: Title | 001   (page part optional)
      const parts = line.split('|');
      if (parts.length >= 1) {
        const title = parts[0].trim();
        const page = (parts[1] || '').trim();
        addTOCEntry(title, page);
      }
      continue;
    }

    // Generic command matching
    let m;
    if ((m = line.match(RE.page))) { startNewPage(m[1].toLowerCase(), m[2]); continue; }
    if (RE.styleBegin.test(line)) { styleCollect = []; continue; }
    if (RE.styleEnd.test(line)) { /* stray end without begin ignored */ continue; }
    if ((m = line.match(RE.pageNum))) { addPageNumber(m[1]); continue; }
    if ((m = line.match(RE.column))) { advanceColumn(); continue; }
    if ((m = line.match(RE.columns))) { pageColumnLimits[activePageIndex] = parseInt(m[1], 10) || columnCount; continue; }
    if ((m = line.match(RE.spacing))) { addSpacing(m[2]); continue; }
    if ((m = line.match(RE.equipment))) { startEquipment(m[1], m[2]); continue; }
    if ((m = line.match(RE.noteStart))) { startNote(m[1], m[2]); continue; }
    if ((m = line.match(RE.img))) {
      const src = m[1];
      const rest = (m[2] || '').trim();
      const attrs = parseAttributeBlock(rest);
      const img = document.createElement('img');
      img.src = src;
      img.alt = attrs.text || '';
      if (attrs.id) img.id = attrs.id;
      attrs.classes.forEach(c => img.classList.add(c));
      if (attrs.style) img.setAttribute('style', attrs.style);
      getActiveColumn().appendChild(img);
      continue;
    }
    if (RE.blockEnd.test(line)) { endNote(); endEquipment(); endTOC(); continue; }
    if ((m = line.match(RE.toc))) { if (m[1].toLowerCase() === 'begin') startTOC(); else endTOC(); continue; }
    if (RE.hr.test(line) || /^\/hr$/i.test(line)) { getActiveColumn().appendChild(document.createElement('hr')); continue; }
    if (RE.pageBreak.test(line)) { const pb = createEl('div', 'page-break'); getActiveColumn().appendChild(pb); continue; }

    // Headings
    if ((m = line.match(RE.heading))) {
      const level = m[1].length;
      let body = m[2].trim();
      const attrs = parseAttributeBlock(body);
      body = attrs.text;
      addHeading(level, body, attrs.span, attrs);
      continue;
    }

    // Unordered lists
    const mList = line.match(/^[-*]\s+(.*)$/);
    if (mList) {
      const ul = createEl('ul');
      while (i < lines.length) {
        const liLine = lines[i].trim();
        const mItem = liLine.match(/^[-*]\s+(.*)$/);
        if (!mItem) break;
        const li = createEl('li');
        li.innerHTML = applyInlineFormatting(mItem[1]);
        ul.appendChild(li);
        i++;
      }
      i--;
      ensureColumn();
      getActiveColumn().appendChild(ul);
      continue;
    }

    // Ordered lists
    const mOrdered = line.match(/^(\d+)\.\s+(.*)$/);
    if (mOrdered) {
      const ol = createEl('ol');
      while (i < lines.length) {
        const liLine = lines[i].trim();
        const mItem = liLine.match(/^(\d+)\.\s+(.*)$/);
        if (!mItem) break;
        const li = createEl('li');
        li.innerHTML = applyInlineFormatting(mItem[2]);
        ol.appendChild(li);
        i++;
      }
      i--;
      ensureColumn();
      getActiveColumn().appendChild(ol);
      continue;
    }

    // Code fence blocks ```lang
    let mf;
    if ((mf = line.match(RE.codeFenceBegin))) {
      const lang = mf[1] || '';
      const buffer = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buffer.push(lines[i]);
        i++;
      }
      const pre = createEl('pre');
      const code = createEl('code');
      if (lang) code.className = 'language-' + lang;
      code.textContent = buffer.join('\n');
      pre.appendChild(code);
      ensureColumn();
      getActiveColumn().appendChild(pre);
      continue;
    }

    // Fallback paragraph
    ensureColumn();
    // Attribute parsing for paragraphs
    const pAttrs = parseAttributeBlock(line);
    addParagraph(pAttrs.text, pAttrs);
  }

  console.log(`Parsed ${pages.length} pages.`);
  console.log(parent);

  return parent;
}