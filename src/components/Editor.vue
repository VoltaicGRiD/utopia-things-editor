<template>
  <div class="main-container">

    <div class="editor-container">
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <div class="control">
            <label class="control-label">Type</label>
            <select v-model="documentType" class="control-select">
              <option value="info">Info</option>
              <option value="lore">Lore</option>
            </select>
          </div>

          <div class="control">
            <label class="control-label">Columns</label>
            <select v-model="columnCount" class="control-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div>
        </div>

        <div class="toolbar-center">
          <div class="control">
            <button class="btn secondary" @click="loadState">Load</button>
          </div>
          <div class="control">
            <button class="btn primary" @click="saveState">Save</button>
          </div>
   
          <!-- <div class="control compact">
            <label class="control-label">W</label>
            <input type="number" v-model.number="docWidth" class="control-input" />
          </div>
          <div class="control compact">
            <label class="control-label">H</label>
            <input type="number" v-model.number="docHeight" class="control-input" />
          </div>
          <div class="control compact">
            <label class="control-label">DPI</label>
            <input type="number" v-model.number="dpi" class="control-input" />
          </div>
          <div class="control compact">
            <label class="control-label">Hdr px</label>
            <input type="number" v-model.number="headerFontPx" class="control-input" />
          </div>
          <div class="control compact">
            <label class="control-label">Sub px</label>
            <input type="number" v-model.number="subheaderFontPx" class="control-input" />
          </div>
          <div class="control compact">
            <label class="control-label">Body px</label>
            <input type="number" v-model.number="bodyFontPx" class="control-input" />
          </div> -->
        </div>

        <div class="toolbar-right">
          <div class="control" style="width: 150px;">
            <span class="save-timer" v-if="isSaving">Auto-saving...</span>
          </div>
          <button class="btn primary" @click="exportImage">Export</button>
        </div>
      </div>

      <div class="editor-toolbar">
        <div class="toolbar-left">
          <div class="control">
            <label class="control-label"><i class="ra ra-hammer"></i> Insert Item</label>
            <select v-model="selectedItemType" @change="onItemDropdownSelect" class="control-select">
              <option disabled selected value="">Select Item Type...</option>
              <option value="equipment">Blank Equipment Template</option>
              <option value="sample_javelin">Sample: "JAVELIN OF THE SKIES"</option>
            </select>
          </div>
          <!-- <div class="control">
            <label class="control-label"><i class="ra ra-hammer"></i></label>
            <button class="btn secondary" @click="onEquipmentButtonClick"><i class="ra ra-hammer"></i> Insert</button>
          </div> -->

          <div class="control">
            <label class="control-label"><i class="ra ra-book"></i> Insert Page</label>
            <select v-model="selectedPageType" @change="onPageDropdownSelect" class="control-select">
              <option disabled selected value="">Select Page Type...</option>
              <option value="info">Info Page</option>
              <option value="lore">Lore Page</option>
              <option value="gameplay">Gameplay Page</option>
              <option value="species">Species Page</option>
              <option value="talent">Talent Page</option>
              <option value="toc">ToC Page</option>
              <option value="advanced">Advanced Page</option>
            </select>
          </div>
          <!-- <div class="control">
            <label class="control-label"><i class="ra ra-book"></i></label>
            <button class="btn secondary" @click="onPageButtonClick('info')"><i class="ra ra-book"></i> Insert</button>
          </div> -->

        </div>

        <div class="toolbar-right">
          <div class="control" style="width: 300px; text-align: right; color: #f39c12;" v-if="warningText">
            <i class="ra ra-exclamation-triangle"></i> {{ warningText }}
          </div>
        </div>
      </div>

      <!-- <div class="editor-toolbar">
        <div class="toolbar-left">
          <div class="control">
            <label class="control-label"><i class="ra ra-hammer"></i> Equipment</label>
            <custom-dropdown :options="insertOptions" @select="onInsertSelect" placeholder="Insert..." />
          </div>
        </div>
      </div> -->

  <div ref="monacoContainer" class="editor" aria-label="Markdown editor" tabindex="0" @click="focusEditor"></div>
    </div>

    <div ref="viewerContainer" class="viewer" aria-label="Document preview"></div>

  </div>
</template>

<script>
import * as monaco from 'monaco-editor';
import { parse } from './Parser';
import domtoimage from 'dom-to-image-more';
import JSZip from 'jszip';
import * as FileSaver from 'file-saver';
//import CustomDropdown from './CustomDropdown.vue';

export default {
  name: 'ThingsEditor',
  //components: { CustomDropdown },

  data() {
    return {
      documentType: "info",
      columnCount: 2,
      // Pixel-perfect document settings (defaults can be adjusted)
      docWidth: 1275,
      docHeight: 1650,
      headerFontPx: 58.333333333333336,
      subheaderFontPx: 50,
      bodyFontPx: 25,
      // DPI and point-size controls (Illustrator often uses points)
      dpi: 150,
      headerFontPt: 28,
      subheaderFontPt: 24,
      bodyFontPt: 12,
      
      isSaving: false,
      warningText: '',
      // dropdown insert options for quick commands
      // insertOptions: [
      //   { label: 'Pages', icon: 'ra ra-book', children: [
      //     { value: '/page info 1', label: 'New Info Page', icon: '📄' },
      //     { value: '/page lore 1', label: 'New Lore Page', icon: '📄' },
      //   ]},
      //   { label: 'Notes', icon: 'ra ra-sticky-note', children: [
      //     { value: '/note', label: 'Insert Note', icon: 'ra-compass' },
      //     { value: '/note', label: 'Insert Lore', icon: 'ra-crown' },
      //     { value: '/note', label: 'Insert Info', icon: 'ra-info-circle' },
      //   ]},
      //   { value: '/column', label: 'Insert Column', icon: '▤' },
      //   { label: 'Equipment', icon: 'ra ra-sword', children: [
      //     { value: '/column/left', label: 'Insert Left Column', icon: '▤' },
      //     { value: '/column/right', label: 'Insert Right Column', icon: '▤' }
      //   ]}
      // ]
    };
  },

  mounted() {

    setInterval(() => {
      const model = this._monacoEditor ? this._monacoEditor.getModel() : null;
      if (model && model.getValue().length > 0) {
        this.isSaving = true;
        this.saveState();
        setTimeout(() => this.isSaving = false, 1000);
      }
    }, 20000);

    // Only auto-load saved state if there is no existing content in the editor
    // setTimeout(() => {
    //   if (this._monacoEditor) {
    //   const model = this._monacoEditor.getModel();
    //   if (model && !model.getValue()) {
    //     this.loadState();
    //   }
    //   }
    // }, 500);

    this.$nextTick(() => {
      this.tick();

      // set initial header color; the background image will be applied to
      // the document root inside renderMarkdown so it scales and aligns with
      // the document content.
      const container = this.$refs.viewerContainer;
      if (container) {
        if (this.documentType === 'info') {
          container.style.setProperty('--header-color', '#0067a9');
        } else {
          container.style.setProperty('--header-color', '#8349a4');
        }
      }

      this.$watch('documentType', () => {
        // If a document root already exists, update its background so it
        // stays aligned with the document content. Otherwise header color
        // will be applied when the document is next rendered.
        const viewerContent = this.$refs.viewerContainer && this.$refs.viewerContainer.querySelector('.viewer-content');

        switch (this.documentType) {
          case 'info':
            if (viewerContent) {
              viewerContent.style.backgroundImage = "url('../assets/documents/info-sheet.png')";
              viewerContent.style.backgroundSize = '100% 100%';
              viewerContent.style.backgroundRepeat = 'no-repeat';
              viewerContent.style.backgroundPosition = 'top left';
            }
            if (this.$refs.viewerContainer) this.$refs.viewerContainer.style.setProperty('--header-color', '#0067a9');
            break;
          case 'lore':
            if (viewerContent) {
              viewerContent.style.backgroundImage = "url('../assets/documents/lore-sheet.png')";
              viewerContent.style.backgroundSize = '100% 100%';
              viewerContent.style.backgroundRepeat = 'no-repeat';
              viewerContent.style.backgroundPosition = 'top left';
            }
            if (this.$refs.viewerContainer) this.$refs.viewerContainer.style.setProperty('--header-color', '#8349a4');
            break;
        }
      });
    });
  },

  beforeUnmount() {
    // dispose Monaco editor and observers when component is removed
    try {
      if (this._monacoEditor) {
        this._monacoEditor.dispose();
        this._monacoEditor = null;
      }
    } catch (e) {}

    try {
      if (this._viewerResizeObserver) {
        this._viewerResizeObserver.disconnect();
        this._viewerResizeObserver = null;
      }
    } catch (e) {}

    try {
      if (this._editorResizeObserver) {
        this._editorResizeObserver.disconnect();
        this._editorResizeObserver = null;
      }
    } catch (e) {}
  try { if (window && window.__thingsEditor) delete window.__thingsEditor; } catch (e) {}
  },

  methods: {
    onItemDropdownSelect(event) {
      const itemType = this.selectedItemType;
      if (itemType === "sample_javelin") {
        this.onInsertSelect({
          value: [
          "/equipment mythic JAVELIN OF THE SKIES",
          "/type Fast Weapon, Mythical",
          "/cost 7040 Silver Pieces",
          "/next",
          "/tag Attack Speed: 1 Turn Action",
          "/tag Handling: 2 hands",
          "/tag Range: 15 meters (Ranged)",
          "/tag Size: 27 slots",
          "/next",
          "/damage 7d4 Energy Damage",
          "/desc Attacks made with this weapon affect all creatures within a 1 meter wide line, originating from the user, extending out to the weapon's range. Tests for accuracy do not need to be made.",
          "/desc This weapon is sentient, sensing objects and creatures within 10 meters of it, and can communicate basic emotions directly to its user.",
          "/desc Damage dealt by this weapon ignores defenses.",
          "/desc This weapon requires 1 stamina to attack with. This weapon consumes 1 cell during each attack. Ammunition used this way must be equipped on the user's back or waist slot.",
          "/next",
          "/flavor One of three weapons a part of the Nine Divines. It uses its sentience to implore progress and calculated improvement. Naturally, it hovers between the two hands of its user, firing trailing shards of lightning at high speeds.",
          "/craft 1 Mythical Material Component",
          "/craft 4 Mythical Refinement Components",
          "/craft 3 Mythical Power Components",
          "/end"
          ].join('\n')
        });
      }
      else if (itemType === "equipment") {
        this.onInsertSelect({
          value: [
            "/equipment <rarity> <name>",
            "/type",
            "/cost",
            "/next",
            "/tag <tag>",
            "/next",
            "/damage 7d4 <damageType> Damage",
            "/desc <description>",
            "/next",
            "/flavor <flavor text>",
            "/craft <quantity> <component>",
            "/end"
          ].join('\n')
        });
      }
      // Reset dropdown after insert
      this.selectedItemType = "";
    },

    onPageDropdownSelect(event) {
      const pageType = this.selectedPageType;
      if (pageType) {
      this.onInsertSelect({ value: `/page ${pageType} 1` });
      // Reset dropdown after insert
      this.selectedPageType = "";
      }
    },

    onEquipmentButtonClick() {
      this.onItemDropdownSelect();
    },

    onPageButtonClick(type) {
      this.selectedPageType = type;
      this.onPageDropdownSelect();
    },

    loadState() {
      const content = localStorage.getItem('things-editor-content');
      console.log('Loaded content:', content);
      if (typeof content === 'string' && this._monacoEditor) {
        const editor = this._monacoEditor;
        const model = editor.getModel();
        if (model) {
          const current = model.getValue();
          // avoid replacing the model value if identical (prevents focus/selection loss)
          if (content !== current) {
            let selection = null;
            let hadFocus = false;
            try {
              selection = editor.getSelection();
              hadFocus = document.activeElement && (this.$refs.monacoContainer && this.$refs.monacoContainer.contains(document.activeElement));
            } catch (e) {}

            model.setValue(content);

            try {
              if (selection) editor.setSelection(selection);
              if (hadFocus) editor.focus();
            } catch (e) {}
          }
        }
      }
    },

    saveState() {
      // simple throttle to avoid blocking UI with many writes
      const now = Date.now();
      if (this._lastSave && now - this._lastSave < 200) return;
      this._lastSave = now;

      if (!this._monacoEditor) return;
      const model = this._monacoEditor.getModel();
      if (!model) return;
      const content = model.getValue();
      try {
        localStorage.setItem('things-editor-content', content);
      } catch (e) {
        console.warn('Failed to save to localStorage:', e);
      }
      console.log('Saved content:', content);
    },

    tick() {
      const container = this.$refs.monacoContainer;
      const viewerContainer = this.$refs.viewerContainer;

      if (container && viewerContainer) {
        // Register a small custom language that highlights our Parser commands
        try {
          monaco.languages.register({ id: 'utopia' });

          monaco.languages.setMonarchTokensProvider('utopia', {
            defaultToken: 'invalid',
            keywords: [],
            typeKeywords: [],
            operators: [],
            symbols: /[-+*/=<>!]+/,
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

            tokenizer: {
              root: [
                // commands that start a line: /page, /column, /note, /end, /spacing, /page-num
                [/^\/(page|column|note|info|lore|end|spacing|page-num|advanced|toc )\b/i, 'utopia.command'],
                // page types used with /page commands (case-insensitive)
                [/(equipment|gameplay|info|lore|species|talent|toc|advanced)\b/i, 'utopia.pagetype'],
                // equipment, spells (case-insensitive)
                [/\/(equipment|spell)\b/i, 'utopia.equipment'],
                [/\/(type|cost|tag|damage|desc|flavor|craft)\b/i, 'utopia.equipment'],
                // rarity colors (match common variants and be case-insensitive)
                [/\bcrude\b/i, 'utopia.crude'],
                [/\bcommon\b/i, 'utopia.common'],
                [/\buncommon\b/i, 'utopia.uncommon'],
                [/\brare\b/i, 'utopia.rare'],
                [/\blegendary\b/i, 'utopia.legendary'],
                [/\bmythic(?:al)?\b/i, 'utopia.mythical'],
                // comment
                [/^\/\/\s+(.*)$/i, 'utopia.comment'],
                // numeric values
                [/\b\d+\b/, 'number'],
                // markdown-style headings
                [/^#{1,6}[^\n]*/, 'utopia.heading'],
                // bold / italic inline (simple)
                [/\*\*(.+?)\*\*/, 'utopia.strong'],
                [/\*(.+?)\*/, 'utopia.emphasis'],
                // everything else
                [/[^\n]+/, '']
              ]
            }
          });

          monaco.editor.defineTheme('utopia-theme', {
            base: 'vs-dark',
            inherit: true,
            rules: [
              { token: 'utopia.command', foreground: 'FFA500', fontStyle: 'bold' }, // orange
              { token: 'utopia.pagetype', foreground: '00e5ff' }, // cyan
              { token: 'utopia.equipment', foreground: 'ff79c6' }, // pink

              { token: 'utopia.comment', foreground: '6272a4' }, // blue

              { token: 'utopia.crude', foreground: '8f9092' },
              { token: 'utopia.common', foreground: '737790' },
              { token: 'utopia.uncommon', foreground: '809a7d' },
              { token: 'utopia.rare', foreground: 'c0b985' },
              { token: 'utopia.legendary', foreground: 'b78e70' },
              { token: 'utopia.mythical', foreground: 'a7645b' },

              { token: 'utopia.heading', foreground: 'ffd166', fontStyle: 'bold' }, // gold
              { token: 'number', foreground: 'c792ea' }, // purple
              { token: 'utopia.strong', fontStyle: 'bold' },
              { token: 'utopia.emphasis', fontStyle: 'italic' }
            ],
            colors: {
              'editor.background': '#1e1e1e'
            }
          });
        } catch (e) {
          // If Monaco already registered the language, ignore errors and continue
          console.warn('Monaco language/theme registration issue:', e);
        }

        const editor = monaco.editor.create(container, {
          language: 'utopia',
          wordWrap: 'on',
          theme: 'utopia-theme'
        });

        // focus editor so keyboard input is accepted immediately
        try {
          editor.focus();
        } catch (e) {
          // ignore focus errors in test environments
        }

        // expose the monaco editor instance for toolbar actions
        this._monacoEditor = editor;
        // also expose to window for quick debugging in the browser console
        try { window.__thingsEditor = editor; } catch (e) {}

        const renderMarkdown = () => {
          const content = editor.getValue();

          if (editor && (content.trim().length === 0 || !/^\/page\s+(equipment|gameplay|info|lore|species|talent|toc|advanced)\s+(.+)$/i.test(content.split('\n')[0]))) {
            // if the editor is empty, show a warning
            this.warningText = 'No pages defined. Add a page with /page <type> <number> (e.g. /page info 1) at the start of the document.';
          }
          else {
            this.warningText = '';
          }


          viewerContainer.innerHTML = '';

          // create a document-root sized to the Illustrator pixels
          const viewer = document.createElement('div');
          viewer.className = 'viewer-content';
          viewer.style.width = this.docWidth + 'px';
          viewer.style.height = this.docHeight + 'px';

          // const documentImage = document.createElement('img');
          // documentImage.classList.add('document-image');
          // documentImage.src = this.documentType === 'info' ? '../assets/documents/info-sheet.png' : '../assets/documents/lore-sheet.png';
          // viewer.appendChild(documentImage);

          // set font-size vars so styles are pixel-accurate
          viewer.style.setProperty('--header-font-px', this.headerFontPx + 'px');
          viewer.style.setProperty('--subheader-font-px', this.subheaderFontPx + 'px');
          viewer.style.setProperty('--body-font-px', this.bodyFontPx + 'px');
          viewer.style.setProperty('--doc-height', this.docHeight + 'px');
          viewer.style.setProperty('--doc-width', this.docWidth + 'px');
          //viewer.style.setProperty('--page-background', this.documentType === 'info' ? "url('../assets/documents/info-sheet.png')" : "url('../assets/documents/lore-sheet.png')");
          // set background image on the document root so it remains aligned
          // with the content when scaled and when the window resizes
          if (this.documentType === 'info') {
            //viewer.style.backgroundImage = "url('../assets/documents/info-sheet.png')";
            viewer.style.setProperty('--header-color', '#0067a9');
          } else {
            //viewer.style.backgroundImage = "url('../assets/documents/lore-sheet.png')";
            viewer.style.setProperty('--header-color', '#8349a4');
          }
          viewer.style.backgroundSize = '100% 100%';
          viewer.style.backgroundRepeat = 'no-repeat';
          viewer.style.backgroundPosition = 'top left';

          const parsedContent = parse(content, this.columnCount);
          viewer.appendChild(parsedContent);
          viewerContainer.appendChild(viewer);

          // compute scaling to fit the viewer area while preserving pixel font sizes
          this.updateScale();
        };

        renderMarkdown();

        // Use the editor-level change event so we catch user edits
        editor.onDidChangeModelContent(() => {
          renderMarkdown();
        });

        // watchers for the pixel-perfect controls
        this.$watch('docWidth', () => {
          // force re-render so sizing updates
          renderMarkdown();
        });
        this.$watch('docHeight', () => renderMarkdown());
        this.$watch('headerFontPx', () => {
          // keep pt in sync
          this.headerFontPt = this.pxToPt(this.headerFontPx, this.dpi);
          this.updateVars();
        });
        this.$watch('bodyFontPx', () => {
          this.bodyFontPt = this.pxToPt(this.bodyFontPx, this.dpi);
          this.updateVars();
        });
        this.$watch('columnCount', () => renderMarkdown());

        this.$watch('dpi', () => {
          // recompute px from pt when DPI changes
          this.headerFontPx = this.ptToPx(this.headerFontPt, this.dpi);
          this.subheaderFontPx = this.ptToPx(this.subheaderFontPt, this.dpi);
          this.bodyFontPx = this.ptToPx(this.bodyFontPt, this.dpi);
          renderMarkdown();
        });

        this.$watch('headerFontPt', () => {
          this.headerFontPx = this.ptToPx(this.headerFontPt, this.dpi);
          this.updateVars();
        });

        this.$watch('subheaderFontPt', () => {
          this.subheaderFontPx = this.ptToPx(this.subheaderFontPt, this.dpi);
          this.updateVars();
        });

        this.$watch('bodyFontPt', () => {
          this.bodyFontPx = this.ptToPx(this.bodyFontPt, this.dpi);
          this.updateVars();
        });

        // Resize observer to recompute scale when viewer size changes
        if (window.ResizeObserver) {
          const ro = new ResizeObserver(() => this.updateScale());
          ro.observe(viewerContainer);
          this._viewerResizeObserver = ro;
        } else {
          window.addEventListener('resize', this.updateScale.bind(this));
        }
        // also re-layout the monaco editor on container resize
        if (container) {
          const roEditor = window.ResizeObserver ? new ResizeObserver(() => {
            try { editor.layout(); } catch (e) {}
          }) : null;
          if (roEditor) {
            roEditor.observe(container);
            this._editorResizeObserver = roEditor;
          } else {
            window.addEventListener('resize', () => { try { editor.layout(); } catch (e) {} });
          }
        }
      }
    },

    focusEditor() {
      if (this._monacoEditor) {
        try { this._monacoEditor.focus(); } catch (e) {}
      } else if (this.$refs && this.$refs.monacoContainer) {
        try { this.$refs.monacoContainer.focus(); } catch (e) {}
      }
    },

    onInsertSelect(option) {
      if (!this._monacoEditor) return;
      const insertText = option && option.value ? option.value : '';
      const model = this._monacoEditor.getModel();
      const pos = this._monacoEditor.getPosition();
      if (!model || !pos) {
        // fallback: append to end
        const full = model.getValue();
        model.setValue(full + '\n' + insertText + '\n');
        return;
      }

      // perform an edit at the current cursor
      this._monacoEditor.executeEdits('insert-dropdown', [{
        range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
        text: insertText + '\n',
        forceMoveMarkers: true
      }]);

      // focus editor after inserting
      this._monacoEditor.focus();
    },

  exportImage: async function() {
      const viewerContainer = this.$refs.viewerContainer;
      if (!viewerContainer) return;

      try {
        // Discard the first instance of the toPng to correct object alignment
        // eslint-disable-next-line
        await domtoimage.toPng(viewerContainer);

        const pages = Array.from(document.querySelectorAll('.page'));
        if (pages.length === 0) {
          console.warn('No pages found to export.');
          alert('No pages found to export.');
          return;
        }

        const zip = new JSZip();
        const usedPageNumbers = [];

        // Render each page to PNG and add to the zip. Prefer toBlob if available.
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i];
          var pageNumber = page.querySelector('.page-number') ? page.querySelector('.page-number').textContent.trim() : `page-${i + 1}`;
          
          if (usedPageNumbers.includes(pageNumber)) {
            console.warn(`Duplicate page number found: ${pageNumber}`);
            alert(`Duplicate page number found: ${pageNumber}`);
            pageNumber = `${pageNumber} - ${i}`;
          }
          
          usedPageNumbers.push(pageNumber);
          
          try {
            let blob = null;

            if (domtoimage && typeof domtoimage.toBlob === 'function') {
              // dom-to-image-more exposes toBlob in many builds
              blob = await domtoimage.toBlob(page);
            } else {
              const dataUrl = await domtoimage.toPng(page);
              // Convert dataURL to blob so JSZip stores binary data correctly
              blob = (function dataURLtoBlob(dataurl) {
                const arr = dataurl.split(',');
                const mime = arr[0].match(/:(.*?);/)[1];
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                  u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
              })(dataUrl);
            }

            if (blob) {
              zip.file(`${pageNumber}.png`, blob);
              console.log(`Added ${pageNumber}.png (${blob.size} bytes) to ZIP`);
            } else {
              console.warn(`No blob produced for page ${i + 1}`);
            }
          } catch (err) {
            console.error(`Error exporting page ${i + 1}:`, err);
          }
        }

        // Generate the zip and trigger download
        const content = await zip.generateAsync({ type: 'blob' });
        // Try FileSaver first, then fallback to creating an object URL and clicking an anchor.
        try {
          FileSaver.saveAs(content, 'document.zip');
          console.log('ZIP generated and download triggered via FileSaver');
        } catch (err) {
          console.warn('FileSaver failed, falling back to anchor method:', err);
          try {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.zip';
            document.body.appendChild(a);
            a.click();
            a.remove();
            // allow time for the download to start before revoking
            setTimeout(() => URL.revokeObjectURL(url), 10000);
            console.log('ZIP generated and download triggered via anchor fallback');
          } catch (err2) {
            console.error('Anchor fallback failed to save the zip:', err2);
            alert('Failed to trigger download. Check console for details.');
          }
        }
      } catch (error) {
        console.error('Error creating ZIP:', error);
      }
    },

    updateScale() {
      this.$nextTick(() => {
        const viewerContainer = this.$refs.viewerContainer;
        if (!viewerContainer) return;
        const viewer = viewerContainer.querySelector('.viewer-content');
        if (!viewer) return;

        const containerW = viewerContainer.clientWidth;
        const containerH = viewerContainer.clientHeight;
        const docW = parseFloat(this.docWidth || 1);
        const docH = parseFloat(this.docHeight || 1);

        const scaleX = containerW / docW;
        const scaleY = containerH / docH;
        const scale = Math.min(scaleX, scaleY, 1);

        const scaledW = docW * scale;
        const scaledH = docH * scale;
        const offsetX = containerW > scaledW ? (containerW - scaledW) / 2 : 0;
        const offsetY = containerH > scaledH ? (containerH - scaledH) / 2 : 0;

        viewer.style.transformOrigin = 'top left';
        viewer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        viewer.style.setProperty('--scale', scale);
      });
    },

    updateVars() {
      this.$nextTick(() => {
        const viewerContainer = this.$refs.viewerContainer;
        if (!viewerContainer) return;
        const viewer = viewerContainer.querySelector('.viewer-content');
        if (!viewer) return;
        viewer.style.setProperty('--header-font-px', this.headerFontPx + 'px');
        viewer.style.setProperty('--subheader-font-px', this.subheaderFontPx + 'px');
        viewer.style.setProperty('--body-font-px', this.bodyFontPx + 'px');
      });
    }

      // Helper: convert points to pixels for a given DPI.
      // 1pt = 1/72 inch. px = pt * dpi / 72
      ,ptToPx(pt, dpi) {
        return (parseFloat(pt) || 0) * (parseFloat(dpi) || 72) / 72;
      }

      // Helper: convert pixels to points for a given DPI.
      ,pxToPt(px, dpi) {
        return (parseFloat(px) || 0) * 72 / (parseFloat(dpi) || 72);
      }
  }
};
</script>

<style lang="css">
:root {
  --doc-height: 1650px;
  --doc-width: 1275px;
  --page-background: white;

  --toolbar-bg: rgba(0,0,0,0.35);
  --toolbar-fg: #fff;
  --control-bg: rgba(255,255,255,0.06);
  --accent: #2f9adf;

  --line-width: 5px;
  --line-offset: -38px; /* how far left from origin */
  --line-shadow: 0 2px 6px rgba(0,0,0,0.9);

  --info-background: url('@/assets/documents/info-sheet.png');
  --lore-background: url('@/assets/documents/lore-sheet.png');
  --equipment-background: url('@/assets/documents/equipment-sheet.png');
  --species-background: url('@/assets/documents/species-sheet.png');
  --talent-background: url('@/assets/documents/talent-sheet.png');
  --toc-background: url('@/assets/documents/toc-sheet.png');
  --gameplay-background: url('@/assets/documents/gameplay-sheet.png');
  --advanced-background: url('@/assets/documents/advanced-sheet.png');

  --header-color: #000000;
  --page-color: #000000;

  --info-color: #0c4e81;
  --lore-color: #32004b;
  --equipment-color: #a36209;
  --species-color:  #007236;
  --talent-color: #aba835;
  --toc-color: #72103e;
  --gameplay-color: #a36209;
  --advanced-color: #a21d21;

  --info-page-number: #203e62;
  --lore-page-number: #39164e;
  --equipment-page-number: #794d12;
  --species-page-number: #00582c;
  --talent-page-number: #706800;
  --toc-page-number: #79314a;
  --gameplay-page-number: #794d12;
  --advanced-page-number: #712d24;

  --rarity-crude: #8f9092;
  --rarity-common: #737790;
  --rarity-uncommon: #809a7d;
  --rarity-rare: #c0b985;
  --rarity-legendary: #b78e70;
  --rarity-mythic: #a7645b;

  --equipment-tags: url('@/assets/blocks/equipment-tags.png');
  --equipment-description: url('@/assets/blocks/equipment-description.png');
  --equipment-flavor: url('@/assets/blocks/equipment-flavor.png');

  --section-1-border: url('@/assets/blocks/equipment-section-1-border.png');
  --section-2-border: url('@/assets/blocks/equipment-section-2-border.png');
  --section-3-border: url('@/assets/blocks/equipment-section-3-border.png');

  --section-1-bg: #a3a4a6;
  --section-2-bg: #cccccc;
  --section-3-bg: #e0e0de;

  --frame-crude: url('@/assets/blocks/rarity-border-crude.png');
  --frame-common: url('@/assets/blocks/rarity-border-common.png');
  --frame-uncommon: url('@/assets/blocks/rarity-border-uncommon.png');
  --frame-rare: url('@/assets/blocks/rarity-border-rare.png');
  --frame-legendary: url('@/assets/blocks/rarity-border-legendary.png');
  --frame-mythic: url('@/assets/blocks/rarity-border-mythic.png');
  --frame-edge: 48px;
  --section-border-size: 48px;
  --edge-top: 64;
  --edge-right: 64;
  --edge-bottom: 64;
  --edge-left: 64;
}

@font-face {
  font-family: "Rockwell Nova Condensed";
  src: url('~@/assets/fonts/RockwellNovaCond.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Rockwell Nova Condensed";
  src: url('~@/assets/fonts/RockwellNovaCond-Bold.woff') format('woff');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Rockwell Nova";
  src: url('~@/assets/fonts/RockwellNova.woff') format('woff');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Rockwell Nova";
  src: url('~@/assets/fonts/RockwellNova-Bold.woff') format('woff');
  font-weight: bold;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Bahnschrift";
  src: url('~@/assets/fonts/Bahnschrift.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.main-container {
  background-color: #2b2b2b;
  display: flex;
  gap: 24px;
  align-items: stretch;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.editor-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 48%;
  height: 100%;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px;
  background: var(--toolbar-bg);
  color: var(--toolbar-fg);
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.5);
  flex-wrap: wrap;
}

.editor-toolbar .toolbar-left,
.editor-toolbar .toolbar-center,
.editor-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #e6eef6;
}

.control.compact { flex-direction: row; align-items: center; }

.control-label { font-size: 12px; opacity: 0.9; }

.control-select,
.control-input {
  background: #f0f0f0;
  color: #000;
  border: 1px solid rgba(255,255,255,0.06);
  padding: 6px 8px;
  border-radius: 6px;
  min-width: 64px;
}

.control-input[type=number] { width: 80px; }

.btn {
  appearance: none;
  border: 0;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  background: linear-gradient(180deg,var(--accent), #176fa6);
  color: white;
  box-shadow: 0 6px 14px rgba(34,139,199,0.25);
}

.editor {
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  text-align: left;
}

.viewer {
  width: 52%;
  height: calc(100% - 0px);
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  overflow: auto;
  background: linear-gradient(180deg,#f3f2f0 0%, #dcdcdc 100%);
  padding: 12px;
  border-radius: 8px;
}

.viewer-content {
  text-align: left;
  transform-origin: top left;
  will-change: transform;
  background-clip: padding-box;
  background-origin: padding-box;
  box-shadow: 0 8px 24px rgba(0,0,0,0.35);
  border-radius: 6px;
}

.page { min-width: var(--doc-width); max-width: var(--doc-width); min-height: var(--doc-height, 1650px); max-height: var(--doc-height, 1650px); position: relative; }
.page.page-equipment { background: var(--equipment-background); --header-color: var(--equipment-color); --page-color: var(--equipment-page-number); }
.page.page-gameplay { background: var(--gameplay-background); --header-color: var(--gameplay-color); --page-color: var(--gameplay-page-number); }
.page.page-info { background: var(--info-background); --header-color: var(--info-color); --page-color: var(--info-page-number); }
.page.page-lore { background: var(--lore-background); --header-color: var(--lore-color); --page-color: var(--lore-page-number); }
.page.page-species { background: var(--species-background); --header-color: var(--species-color); --page-color: var(--species-page-number); }
.page.page-talent { background: var(--talent-background); --header-color: var(--talent-color); --page-color: var(--talent-page-number); }
.page.page-toc { background: var(--toc-background); --header-color: var(--toc-color); --page-color: var(--toc-page-number); }
.page.page-advanced { background: var(--advanced-background); --header-color: var(--advanced-color); --page-color: var(--advanced-page-number); }

.page h1 { color: var(--header-color, #573084); font-family: "Rockwell Nova Condensed"; font-weight: bold; font-size: var(--header-font-px, 28pt); line-height: 1.1; margin: 0 0 28px; }
.page h1.span-2 {
  position: absolute;
  left: 150px; /* align with page-content left */
  top: 120px;   /* adjust vertically to sit above page content */
  width: calc(459px * 2 + 58px); /* two columns + gap */
  z-index: 6;
  margin: 0 0 18px;
  box-sizing: border-box;
}
.page.has-span-2 .column { padding-top: 120px; }
.page h2 { color: var(--header-color, #573084); font-family: "Rockwell Nova Condensed"; font-weight: bold; font-size: var(--subheader-font-px, 24pt); line-height: 1.1; margin: 48px 0 0; }
.page h3 { color: var(--header-color, #573084); font-family: "Rockwell Nova Condensed"; font-weight: bold; font-size: var(--subheader-font-px, 24pt); line-height: 1.1; margin: 48px 0 0; }
.page p { color: black; font-family: "Bahnschrift"; font-size: var(--body-font-px, 12px); margin: 0 0 30px; line-height: 1.2; }

.page-content { position: absolute; left: 150px; top: 129px; display: flex; gap: 50px; }
.column { max-width: 465px; min-width: 465px; }

.page-number { color: var(--page-color); font-family: "Rockwell Nova"; font-weight: bold; position: absolute; bottom: 25px; font-size: 56px; width: 100%; text-align: center; }

.note.lore {
  color: black;
  font-family: "Bahnschrift";
  font-size: var(--body-font-px, 12px);
  margin: 0;
  margin-bottom: 30px;
  line-height: 1.2;
}

.note {
  position: relative;
}

.note::before {
  content: "";
  position: absolute;
  top: 110px;
  bottom: 110px;
  left: var(--line-offset);   /* negative to push it out to the left */
  width: var(--line-width);   /* fixed horizontal size — prevents horizontal growth */
  background-image: linear-gradient(to right, #a7a9ac 100%, #d1d3d4 110%, #a7a9ac 120%);
  pointer-events: none;
  z-index: 4;                 /* place under/over content as needed */
  /* filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.3)); */
  border-radius: 2px;         /* optional subtle rounding */
}

.note-content {
  position: relative;
  z-index: 4;
}

.box {
  z-index: 3;
  position: absolute;
}

.box-gradient {
  top: -10px;
  left: -35px;
  right: -35px;
  bottom: -10px;
  background: radial-gradient(circle at center, #00b6f1, #1c75bc);
  border-radius: 25px;
  z-index: 1;
  opacity: 0.3;
}

.box-top-left {
  top: -20px;
  left: -40px;
}

.box-bottom-left {
  z-index: 5;
  bottom: -20px;
  left: -40px;
}

.box-top-right {
  top: -20px;
  right: -40px;
}

.box-bottom-right {
  bottom: -20px;
  right: -40px;
}

.box-left {
  z-index: 3;
  top: 0;
  left: -39px;
  bottom: 0;
  width: 8px; /* fixed horizontal size so background cannot expand horizontally */
  height: 100%;
  transform: none;
  position: absolute;
  /* Prevent overflow, stretch to content height */
  max-height: 100%;
  pointer-events: none;
  /* If using SVG as background, make it stretch vertically */
  /* map the background to the fixed width (100% of 6px) and full height */
  background-size: 100% 100%;
  background-repeat: no-repeat;
  backdrop-filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
}

/* Responsive: stack editor/viewer on narrow windows */
@media (max-width: 1100px) {
  .main-container { flex-direction: column; padding: 12px; }
  .editor-container, .viewer { width: 100%; }
  .editor { height: 360px; }
}

.equipment {
  position: relative;
  background: var(--equipment-background);
  background-clip: padding-box; /* don’t paint behind the border */
  isolation: isolate;
  
  padding-right: 5px;

  /* border-image as before */
  border: 5px solid transparent;
  border-image-source: var(--frame);
  border-image-slice: var(--edge-top) var(--edge-right)
                      var(--edge-bottom) var(--edge-left);
  border-image-width: var(--frame-edge);
  border-image-repeat: round;
}

/* map each rarity class to a custom property used by the pseudo element */
.equipment.rarity-crude { --equipment-background: var(--rarity-crude); --frame: var(--frame-crude); }
.equipment.rarity-common { --equipment-background: var(--rarity-common); --frame: var(--frame-common); }
.equipment.rarity-uncommon { --equipment-background: var(--rarity-uncommon); --frame: var(--frame-uncommon); }
.equipment.rarity-rare { --equipment-background: var(--rarity-rare); --frame: var(--frame-rare); }
.equipment.rarity-legendary { --equipment-background: var(--rarity-legendary); --frame: var(--frame-legendary); }
.equipment.rarity-mythic { --equipment-background: var(--rarity-mythic); --frame: var(--frame-mythic); }

.equipment-content { position: relative; background-clip: content-box; z-index: 1; padding-top: 10px; padding-left: 10px; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.equipment-title { font-family: "Bahnschrift"; font-weight: bold; font-size: 21.5px; }
.equipment-detail { font-family: "Bahnschrift"; font-size: 18px; z-index: 10; position: relative; }
.equipment-detail.cost { color: white;  }
.equipment-detail.tag { font-family: "Bahnschrift"; font-size: 21.5px; margin-bottom: 5px; margin-top: 2px; }
.equipment-tag-type { font-weight: bold; }
.equipment-detail.damage { font-family: "Bahnschrift"; font-stretch: semi-condensed; font-size: 21px; font-weight: bold; margin-top: 13px; margin-bottom: 25px; text-align: center; }
.equipment-detail.desc { font-family: "Bahnschrift"; font-stretch: semi-condensed; font-size: 20.51px; margin-bottom: 25px; line-height: 1.22; }
.equipment-detail.flavor { color: #585858; font-family: "Bahnschrift"; font-stretch: semi-condensed; font-size: 20.7px; margin-bottom: 23px; margin-top: 13px; line-height: 1.23; text-align: center; }
.equipment-detail.craft { font-family: "Bahnschrift"; font-stretch: semi-condensed; font-size: 20.7px; margin-bottom: 1px; }

.equipment-section {
  position: relative;
  margin-top: 2px;
  /* reserve space for the border on all sides */
  padding-left: 3px;
  padding-top: 10px;
  margin-left: 5px;
  /* clip the background so it doesn’t render under the border */
  background: var(--section-bg);
  background-clip: padding-box;  /* no background behind the border:contentReference[oaicite:0]{index=0} */
  /* optional: rounded corners if your frame has them */
  border-radius: 4px;
}

.equipment-section.section-1 {
  background-color: var(--section-1-bg);
  /* draw the torn frame; reuse your existing border image variables */
  border: 2px solid transparent;
  border-image-source: var(--section-1-border);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--section-border-size);
  border-image-repeat: round;
}
.equipment-section.section-2 {
  padding-left: 0px;
  background-color: var(--section-2-bg);
  /* draw the torn frame; reuse your existing border image variables */
  border: 5px solid transparent;
  border-image-source: var(--section-2-border);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--section-border-size);
  border-image-repeat: round;
}
.equipment-section.section-3 {
  padding-left: 11px;
  padding-right: 9px; 
  padding-bottom: 30px;
  text-align: center;
  background-color: var(--section-3-bg);
  /* draw the torn frame; reuse your existing border image variables */
  border: 5px solid transparent;
  border-image-source: var(--section-3-border);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--section-border-size);
  border-image-repeat: round;
}

.toc-entry { font-family: "Bahnschrift"; display: flex; gap: 20px; justify-content: space-between; font-size: 22px; }
.toc-title { font-weight: bold; }
.toc-page { color: gray; }

</style>