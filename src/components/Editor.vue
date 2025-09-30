<template>
  <div class="main-container">

    <div class="editor-container">
      <div class="editor-toolbar">
        <!-- <div class="toolbar-left"> -->
          <!-- <div class="control">
            <label class="control-label">Type</label>
            <select v-model="documentType" class="control-select">
              <option value="info">Info</option>
              <option value="lore">Lore</option>
            </select>
          </div> -->
<!-- 
          <div class="control">
            <label class="control-label">Columns</label>
            <select v-model="columnCount" class="control-select">
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </div> -->

          <!-- <div class="control compact">
            <label class="control-label">DPI</label>
            <input class="control-input" type="number" min="72" max="600" step="1" v-model.number="dpi" aria-label="Document DPI" />
          </div>

          <div class="control compact">
            <label class="control-label">Width (px)</label>
            <input class="control-input" type="number" min="640" max="2048" step="1" v-model.number="docWidth" aria-label="Document width" />
          </div>

          <div class="control compact">
            <label class="control-label">Height (px)</label>
            <input class="control-input" type="number" min="900" max="2800" step="1" v-model.number="docHeight" aria-label="Document height" />
          </div> -->
        <!-- </div> -->

        <div class="toolbar-left">
          <div class="control">
            <button class="btn secondary" @click="loadState">Load</button>
          </div>
          <div class="control">
            <button class="btn primary" @click="saveState">Save</button>
          </div>
        </div>

        <div class="toolbar-right">
          <div class="control" style="width: 150px;">
            <span class="save-timer" v-if="isSaving">Auto-saving...</span>
          </div>
          <!-- <button class="btn secondary" @click="exportPdf">Export PDF</button> -->
          <button class="btn primary" @click="exportImage">Export Images</button>
        </div>
      </div>

      <div class="editor-toolbar">
        <div class="toolbar-left">
          <div class="control">
            <label class="control-label"><i class="ra ra-hammer"></i> Insert Item</label>
            <select v-model="selectedItemType" @change="onItemDropdownSelect" class="control-select">
              <option disabled value="">Select Item Type...</option>
              <option value="equipment">Blank Equipment Template</option>
              <option value="sample_javelin">Sample: "JAVELIN OF THE SKIES"</option>
              <option value="sample_specialist_table">Sample: Specialist Talent Table</option>
              <option value="sample_spell">Sample: Spell Template</option>
              <option value="sample_species_profile">Sample: Species Profile</option>
              <option value="sample_lore_excerpt">Sample: Lore Excerpt</option>
            </select>
          </div>

          <div class="control">
            <label class="control-label"><i class="ra ra-book"></i> Insert Page</label>
            <select v-model="selectedPageType" @change="onPageDropdownSelect" class="control-select">
              <option disabled value="">Select Page Type...</option>
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
            <label class="control-label"><i class="ra ra-gear-hammer"></i> Insert Snippet</label>
            <select v-model="selectedSnippet" @change="onSnippetDropdownSelect" class="control-select">
              <option disabled value="">Select Snippet...</option>
              <option value="note-callout">Note Callout Block</option>
              <option value="two-column-quote">Two-Column Quote</option>
              <option value="lore-facts">Lore Fact List</option>
              <option value="stat-block">Quick Stat Block</option>
            </select>
          </div> -->
        </div>

        <div class="toolbar-right">
          <div class="control" style="width: 300px; text-align: right; color: #f39c12;" v-if="warningText">
            <i class="ra ra-exclamation-triangle"></i> {{ warningText }}
          </div>
          <div class="control">
            <input class="username-input" type="text" placeholder="username" v-model="username" />
          </div>
          <div class="control">
            <button class="btn secondary" @click="loadSampleDocument('starter-pack')">Load Starter Packet</button>
          </div>
        </div>
      </div>

      <div class="editor-toolbar toolbar-advanced">
        <div class="toolbar-left">
          <div class="control compact">
            <label class="control-label">Header (pt)</label>
            <input class="control-input" type="number" min="16" max="96" step="1" v-model.number="headerFontPt" aria-label="Header font size in points" />
          </div>
          <div class="control compact">
            <label class="control-label">Subheader (pt)</label>
            <input class="control-input" type="number" min="14" max="72" step="1" v-model.number="subheaderFontPt" aria-label="Subheader font size in points" />
          </div>
          <div class="control compact">
            <label class="control-label">Body (pt)</label>
            <input class="control-input" type="number" min="8" max="48" step="0.5" v-model.number="bodyFontPt" aria-label="Body font size in points" />
          </div>
        </div>

        <div class="toolbar-right">
          <!-- <div class="control checkbox-control">
            <label>
              <input type="checkbox" v-model="showUsername" />
              <span>Show author credit</span>
            </label>
          </div> -->
          <div class="control checkbox-control">
            <label>
              <input type="checkbox" v-model="showGridOverlay" />
              <span>Layout grid</span>
            </label>
          </div>
          <div class="control">
            <button class="btn secondary" @click="resetLayoutDefaults">Reset Layout</button>
          </div>
        </div>
      </div>

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
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
//import CustomDropdown from './CustomDropdown.vue';

export default {
  name: 'ThingsEditor',
  //components: { CustomDropdown },

  data() {
    return {
      documentType: "info",
      columnCount: 2,

      docWidth: 1275,
      docHeight: 1650,
      headerFontPx: 58.333333333333336,
      subheaderFontPx: 50,
      bodyFontPx: 25,

      dpi: 150,
      headerFontPt: 28,
      subheaderFontPt: 24,
      bodyFontPt: 12,

      isSaving: false,
      warningText: '',

      username: '',

      selectedItemType: '',
      selectedPageType: '',
      selectedSnippet: '',

      showGridOverlay: false,
      showUsername: true,

      layoutDefaults: {
        width: 1275,
        height: 1650,
        dpi: 150,
        headerPt: 28,
        subheaderPt: 24,
        bodyPt: 12
      }
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
        const viewerContent = this.$refs.viewerContainer && this.$refs.viewerContainer.querySelector('.viewer-content');

        switch (this.documentType) {
          case 'info':
            if (viewerContent) {
              viewerContent.style.backgroundImage = "url('../assets/documents/blue-page.png')";
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

      this.$watch('username', () => {
        // update username displays on all pages
        const viewer = this.$refs.viewerContainer;
        if (viewer) {
          for (const page of viewer.querySelectorAll('.page')) {
            const usernameDisplay = page.querySelector('.username-display');
            if (usernameDisplay) {
              usernameDisplay.textContent = (document.querySelector('.username-input') ? document.querySelector('.username-input').value.trim() : '');
            }
          }
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
    } catch (e) { }

    try {
      if (this._viewerResizeObserver) {
        this._viewerResizeObserver.disconnect();
        this._viewerResizeObserver = null;
      }
    } catch (e) { }

    try {
      if (this._editorResizeObserver) {
        this._editorResizeObserver.disconnect();
        this._editorResizeObserver = null;
      }
    } catch (e) { }
    try { if (window && window.__thingsEditor) delete window.__thingsEditor; } catch (e) { }
  },

  methods: {

    updateUsernameDisplays() {
      const viewer = this.$refs.viewerContainer;
      if (viewer) {
        for (const page of viewer.querySelectorAll('.page')) {
          const usernameDisplay = page.querySelector('.username-display');
          if (usernameDisplay) {
            usernameDisplay.textContent = 'Authored by: ' + (document.querySelector('.username-input') ? document.querySelector('.username-input').value.trim() : '');
          }
        }
      }
    },

    onItemDropdownSelect(event) {
      console.log('Item dropdown changed:', event);
      if (event.target.value === "sample_javelin") {
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
      else if (event.target.value === "equipment") {
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
      else if (event.target.value === "sample_specialist_table") {
        this.onInsertSelect({
          value: [
            "/page talent 1",
            "/specialist",
            "/title Arcane Specialist Talents",
            "/desc Arcane specialist talents are used to push a caster when putting spells together, allowing for significant versatility. Some require that the caster have a specific talent within the Magecraft tree, others require that the caster can simply cast spells at all, even less require specific trait scores.",
            "Subtle Spells | Must have at least one talent from the **Magecraft** core talent tree. | You may cast spells without making any physical or audible gestures. Creatures gaina point of favor on tests made to resist spells cast this way. You may cast spells 2 meters through a medium rather than 1.",
            "Mystical Cognizance | Must have the **Subtle Spells** specialist talent. | When casting spells with no physical gestures, creatures do not gain a point of favor on tests made to resist spells cast this way. You may cast spells 3 meters through a medium rather than 2.",
            "Arcane Withdrawal | Must know the Art of **Enchantment.** | You may spend 6 turn actions to undo a permanent spell that you cast, given you are within 1 meter of the spell's effects.",
            "In Tune | Must have a **Will** score of 10 or higher. | Your spellcap is equal to your **Will** score. If you have no Spellcap, spells you cast cost less stamina by an amount equal to your **Soul** score.",
            "Enlightened | Must have the **In Tune** specialist talent.\\nMust be able to use at least three **Arcane Arts.** | Your Spellcap is equal to double your **Will** score. If you have no Spellcap, spells you cast cost less stamina by an amount equal to your **Mind** score.",
            "Occult Mind | Must have at least one talent rom the **Magecraft** core talent tree. | You gain 2 points of favor on tests made to resist losing Focus or breaking Concentration.",
            "Pyromancy | Must know the Art of **Evocation.** | You may cast spells that deal only Heat damage and cost 3 stamina or less after discounts without spending any stamina.",
            "Cryomancy | Must know the Art of **Evocation.** | You may cast spells that deal only Chill damage and cost 3 stamina or less after discounts without spending any stamina.",
            "/end"
          ].join('\n')
        })
      }
      else if (event.target.value === "sample_spell") {
        this.onInsertSelect({
          value: [
            "/page equipment 1",
            "/spell DISPEL",
            "/type Utility",
            "/arts Enchantment, Illusion, Necromancy, Evocation",
            "/next",
            "/tag Duration: Immediate",
            "/tag Range: Touch",
            "/tag AOE: Target Spell",
            "/next",
            "/stamina 5 TIMES X STAMINA",
            "/desc You grasp something affected by a spell, methodically unweaving its runes. If a creature is currently focusing or concentrating on the spell, it makes a Will contest against you. Given the spell is no older than X hours and any apposing creatures fail their test, the spell ends.",
            "/end"
          ].join('\n')
        })
      }
      else if (event.target.value === "sample_species_profile") {
        this.onInsertSelect({
          value: [
            "/page species 1",
            "# {Species Profile}",
            "/spacing 24",
            "## The Verdant", 
            "**Traits:** Graceful, Empathic, Photosynthetic",
            "**Size:** Medium | **Speed:** 9 meters",
            "- Gain favor on tests to sense plants or natural toxins",
            "- Can photosynthesize to recover 1 stamina every 10 minutes in bright light",
            "- Suffers disadvantage on perception tests taken underground",
            "/spacing 18",
            "### Culture",
            "The Verdant are a communal people who weave living architecture. Their homes are coaxed from sturdy reeds and sung into shape over the course of weeks.",
            "/spacing 18",
            "### Hooks",
            "1. A Verdant elder asks the party to escort a migratory seed to fertile soil.",
            "2. The settlement's water-garden is mysteriously blighted.",
            "3. Rival wood-cutters have begun logging sacred groves.",
            "/end"
          ].join('\n')
        });
      }
      else if (event.target.value === "sample_lore_excerpt") {
        this.onInsertSelect({
          value: [
            "/page lore 2",
            "# Excerpt from the Journal of Arcanist Vela",
            "The stormglass hums louder each night. Waves of color press against the panes, forming sigils I almost comprehend.",
            "/spacing 12",
            "> \"If the prism fractures, the Wake will spill unchecked through the streets.\"",
            "/spacing 12",
            "## Field Notes",
            "- The Wake resonates with bronze alloys, not silver.",
            "- Divination artistries lose potency within seven kilometers of the lighthouse.",
            "- Enchantment weaves linger longer where the Wake is thickest.",
            "/spacing 12",
            "### Closing",
            "Tomorrow we open the sluice gates and see if the tide will listen.",
            "/end"
          ].join('\n')
        });
      }
      // Reset dropdown after insert
      this.selectedItemType = "";
    },

    onSnippetDropdownSelect(event) {
      const snippetKey = event && event.target ? event.target.value : '';
      if (!snippetKey) {
        return;
      }

      const snippets = {
        'note-callout': [
          '/note info Readying for Expedition',
          'Pack climbing rigging, one spare wake-stone, and at least two doses of nighthoney.',
          '/end'
        ],
        'two-column-quote': [
          '/col',
          '### Scholar\'s Margin',
          'The Wake trends strongest near ley convergence sites.',
          '/col',
          '> \"Measure the silence before you measure the sound.\"\n> — Archivist Rhys',
          '/col'
        ],
        'lore-facts': [
          '### Lore Fragments',
          '- Wake currents flow quickest beneath vaulted ceilings.',
          '- Necromancy glyphs dim in the presence of auric stones.',
          '- Evocation prisms ring like crystal when overstressed.'
        ],
        'stat-block': [
          '/page gameplay 3',
          '### Clockwork Sentry',
          '**Level:** 5 | **Disposition:** Guarded',
          '**Traits:** Construct, Vigilant, Heavy',
          '/spacing 8',
          '**Motive:** Protect the sealed vault',
          '**Vitality:** 46 | **Guard:** 18 | **Resolve:** 12',
          '/spacing 12',
          '**Attacks:**',
          '- Arm Pike — +8 vs Guard, 2d8 Piercing + Push 1',
          '- Wake Pulse — +6 vs Resolve, 2d6 Radiant, target is **Dazed**',
          '/spacing 12',
          '**Protocol:** Gains favor on tests while within 5 meters of a control node.'
        ]
      };

      const snippet = snippets[snippetKey];
      if (snippet) {
        this.onInsertSelect({ value: snippet.join('\n') });
      }

      this.selectedSnippet = '';
    },

    onPageDropdownSelect(event) {
      const pageType = event.target.value;
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

    loadSampleDocument(kind) {
      if (!this._monacoEditor) return;

      const samples = {
        'starter-pack': [
          '/page blue 1',
          '# Welcome to Things',
          'The **Things Editor** lets you rapidly build printable sheets.',
          '/spacing 16',
          '## Getting Started',
          'Use `/page <color> <number>` to start each sheet.',
          'Swap columns with `/col`.',
          'Close blocks like `/note` or `/equipment` with `/end`.',
          '/spacing 18',
          '### Quick Legend',
          '**Bold** items call attention to important rules.',
          '*Italics* mark optional flavor text.',
          'Links like [Myramyth Website](https://myramyth.com/utopia) are allowed (though they won\'t work when exported).',
          '/spacing 24',
          '/note **Handy Commands**',
          'Try `/lore` for purple callouts or `/toc begin` to build a table of contents.',
          '/end',
          '/page blue 2',
          '# Sample Lore Spread',
          '/spacing 12',
          '### The Singing Wake',
          'Every sixty years the Wake changes pitch, harmonizing with previously silent ruins.',
          '/spacing 12',
          '/col',
          '/spacing -30',
          '#### Rumors',
          'Hidden choirs beneath the city keep the Wake docile.',
          'The royal archivist hoards broken wake-stones.',
          'Free-tide sailors can hear storms days in advance.',
          '/spacing 12',
          '#### Adventure Seeds',
          'Hunt a missing conductor before the Wake resonance fails.',
          'Protect a caravan bringing new tuning forks to the capital.',
          'Sabotage rival enchantments that disrupt the city\'s rhythm.',
          '/page yellow 3',
          '# Encounter Sketch',
          '### Gilded Promenade',
          'The promenade is split across three balconies connected by floating stairs.',
          '/spacing 12',
          '#### Features',
          'Crystal balustrades grant cover but shatter when struck (Guard 14).',
          'Wake vents blast upward each round, relocating anyone nearby.',
          'Two control obelisks tune the promenade. Both must be struck within the same round to disable the vents.',
          '/spacing 12',
          '#### Tactics',
          '**Clockwork Sentries** hold the high ground.',
          '**Wake Adepts** attempt to knock foes into the vents.',
          'The promenade guardian arrives at round 4 if the obelisks remain active.'
        ].join('\n')
      };

      const sample = samples[kind];
      if (!sample) {
        return;
      }

      let shouldReplace = !this._monacoEditor.getValue();
      if (!shouldReplace) {
        const canConfirm = typeof window !== 'undefined' && typeof window.confirm === 'function';
        shouldReplace = canConfirm ? window.confirm('Replace the current document with the starter packet?') : true;
      }
      if (!shouldReplace) {
        return;
      }

      this._monacoEditor.setValue(sample);
      this.selectedItemType = '';
      this.selectedPageType = '';
      this.selectedSnippet = '';
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
            } catch (e) { }

            model.setValue(content);

            try {
              if (selection) editor.setSelection(selection);
              if (hadFocus) editor.focus();
            } catch (e) { }
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
                // commands that start a line: /page, /col, /note, /end, /spacing, /page-num
                [/^\/(page|column|note|info|lore|end|spacing|page-num|advanced|toc)\b/i, 'utopia.command'],
                // page types used with /page commands (case-insensitive)
                [/(equipment|gameplay|info|lore|species|talent|toc|advanced)\b/i, 'utopia.pagetype'],
                // talents
                [/\/(specialist)\b/i, 'utopia.talent'],
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
                // escaped characters (use Monarch reference to the escapes pattern)
                [/@escapes/, 'string.escape'],
                [/\n/, 'string.escape'],
                // table cells
                [/[A-Za-z0-9\s]+(?=\||$)/, 'table-cell'],
                // whitespace (consume spaces so word-based rules can match at word-start)
                [/[ \t]+/, ''],
                // pipes
                [/\|/, 'delimiter.pipe'],
                // everything else (avoid consuming pipes so pipe token can match)
                [/[^|\n]+/, '']
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

              { token: 'utopia.talent', foreground: 'ffb86c' }, // light orange

              { token: 'utopia.crude', foreground: '8f9092' },
              { token: 'utopia.common', foreground: '737790' },
              { token: 'utopia.uncommon', foreground: '809a7d' },
              { token: 'utopia.rare', foreground: 'c0b985' },
              { token: 'utopia.legendary', foreground: 'b78e70' },
              { token: 'utopia.mythical', foreground: 'a7645b' },

              { token: 'table-cell', foreground: 'ff965d' },

              { token: 'utopia.heading', foreground: 'ffd166', fontStyle: 'bold' }, // gold
              { token: 'number', foreground: 'c792ea' }, // purple
              { token: 'utopia.strong', fontStyle: 'bold' },
              { token: 'utopia.emphasis', fontStyle: 'italic' },

              { token: 'string.escape', foreground: 'ff79c6' }, // pink
              { token: 'delimiter.pipe', foreground: 'ffd166' } // white
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
        try { window.__thingsEditor = editor; } catch (e) { }

        const renderMarkdown = () => {
          const content = editor.getValue();

          // if (editor && (content.trim().length === 0 || !/^\/page\s+(equipment|gameplay|info|lore|species|talent|toc|advanced)\s+(.+)$/i.test(content.split('\n')[0]))) {
          //   // if the editor is empty, show a warning
          //   this.warningText = 'No pages defined. Add a page with /page <type> <number> (e.g. /page info 1) at the start of the document.';
          // }
          // else {
          //   this.warningText = '';
          // }
          this.warningText = '';


          viewerContainer.innerHTML = '';

          // create a document-root sized to the Illustrator pixels
          const viewer = document.createElement('div');
          viewer.className = 'viewer-content';
          viewer.style.width = this.docWidth + 'px';
          viewer.style.height = this.docHeight + 'px';

          // const documentImage = document.createElement('img');
          // documentImage.classList.add('document-image');
          // documentImage.src = this.documentType === 'info' ? '../assets/documents/blue-page.png' : '../assets/documents/lore-sheet.png';
          // viewer.appendChild(documentImage);

          // set font-size vars so styles are pixel-accurate
          viewer.style.setProperty('--header-font-px', this.headerFontPx + 'px');
          viewer.style.setProperty('--subheader-font-px', this.subheaderFontPx + 'px');
          viewer.style.setProperty('--body-font-px', this.bodyFontPx + 'px');
          viewer.style.setProperty('--doc-height', this.docHeight + 'px');
          viewer.style.setProperty('--doc-width', this.docWidth + 'px');
          //viewer.style.setProperty('--page-background', this.documentType === 'info' ? "url('../assets/documents/blue-page.png')" : "url('../assets/documents/lore-sheet.png')");
          // set background image on the document root so it remains aligned
          // with the content when scaled and when the window resizes
          const themeBackgrounds = {
            info: "url('../assets/documents/blue-page.png')",
            lore: "url('../assets/documents/lore-sheet.png')"
          };
          const themeColors = {
            info: '#0067a9',
            lore: '#8349a4'
          };

          const backgroundImage = themeBackgrounds[this.documentType] || themeBackgrounds.info;
          const headerColor = themeColors[this.documentType] || themeColors.info;

          viewer.style.backgroundImage = backgroundImage;
          viewer.style.setProperty('--header-color', headerColor);
          viewer.style.backgroundSize = '100% 100%';
          viewer.style.backgroundRepeat = 'no-repeat';
          viewer.style.backgroundPosition = 'top left';

          if (this.showGridOverlay) {
            viewer.classList.add('viewer-grid');
          }

          const parsedContent = parse(content, this.columnCount);
          viewer.appendChild(parsedContent);
          viewerContainer.appendChild(viewer);

          if (this.showUsername) {
            for (const page of viewer.querySelectorAll('.page')) {
              const usernameDisplay = document.createElement('div');
              usernameDisplay.className = 'username-display';
              usernameDisplay.textContent = 'Authored by: ' + (document.querySelector('.username-input') ? document.querySelector('.username-input').value.trim() : '');
              page.appendChild(usernameDisplay);
            }
          }

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

        this.$watch('documentType', () => renderMarkdown());
        this.$watch('showUsername', () => renderMarkdown());
        this.$watch('showGridOverlay', () => renderMarkdown());

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
            try { editor.layout(); } catch (e) { }
          }) : null;
          if (roEditor) {
            roEditor.observe(container);
            this._editorResizeObserver = roEditor;
          } else {
            window.addEventListener('resize', () => { try { editor.layout(); } catch (e) { } });
          }
        }
      }
    },

    focusEditor() {
      if (this._monacoEditor) {
        try { this._monacoEditor.focus(); } catch (e) { }
      } else if (this.$refs && this.$refs.monacoContainer) {
        try { this.$refs.monacoContainer.focus(); } catch (e) { }
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

    exportImage: async function () {
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

    exportPdf: async function () {
      const viewerContainer = this.$refs.viewerContainer;
      if (!viewerContainer) return;

      const pages = Array.from(viewerContainer.querySelectorAll('.page'));
      if (pages.length === 0) {
        console.warn('No pages found to export.');
        alert('No pages found to export.');
        return;
      }

      try {
        const pdfDoc = await PDFDocument.create();
        const fonts = {
          regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
          bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
          italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
          boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
        };

        const pageWidthPt = this.pxToPt(this.docWidth, this.dpi);
        const pageHeightPt = this.pxToPt(this.docHeight, this.dpi);

        for (let i = 0; i < pages.length; i++) {
          const pageElement = pages[i];
          const pdfPage = pdfDoc.addPage([pageWidthPt, pageHeightPt]);

          // capture the rendered page as an image for backgrounds and artwork
          try {
            const dataUrl = await domtoimage.toPng(pageElement);
            const pngImage = await pdfDoc.embedPng(dataUrl);
            pdfPage.drawImage(pngImage, {
              x: 0,
              y: 0,
              width: pageWidthPt,
              height: pageHeightPt,
              opacity: 0.35
            });
          } catch (imgErr) {
            console.warn(`Unable to capture background for page ${i + 1}:`, imgErr);
          }

          const pageRect = pageElement.getBoundingClientRect();
          const scale = pageRect.width > 0 ? pageRect.width / this.docWidth : 1;
          const textBlocks = this._collectTextBlocks(pageElement);

          for (const element of textBlocks) {
            const computed = window.getComputedStyle(element);
            if (computed.display === 'none' || computed.visibility === 'hidden') {
              continue;
            }

            const normalizedText = this._normalizeTextContent(element.innerText);
            if (!normalizedText) continue;

            const elementRect = element.getBoundingClientRect();
            const paddingLeft = parseFloat(computed.paddingLeft) || 0;
            const paddingRight = parseFloat(computed.paddingRight) || 0;
            const paddingTop = parseFloat(computed.paddingTop) || 0;

            const widthPx = Math.max(0, (elementRect.width / scale) - paddingLeft - paddingRight);
            if (widthPx <= 0) continue;

            const xPx = (elementRect.left - pageRect.left) / scale + paddingLeft;
            const yTopPx = (elementRect.top - pageRect.top) / scale + paddingTop;

            const fontSizePx = parseFloat(computed.fontSize) || this.bodyFontPx;
            const lineHeightPx = computed.lineHeight === 'normal'
              ? fontSizePx * 1.2
              : parseFloat(computed.lineHeight) || fontSizePx * 1.2;

            const fontSizePt = this.pxToPt(fontSizePx, this.dpi);
            const lineHeightPt = this.pxToPt(lineHeightPx, this.dpi);
            const maxWidthPt = this.pxToPt(widthPx, this.dpi);

            const font = this._resolveFont(computed, fonts);
            const { color, opacity } = this._cssColorToRgb(computed.color, parseFloat(computed.opacity));

            const lines = this._wrapTextIntoLines(font, normalizedText, fontSizePt, maxWidthPt);
            if (!lines.length) continue;

            let cursorY = pageHeightPt - this.pxToPt(yTopPx, this.dpi) - fontSizePt;
            const align = computed.textAlign || 'left';

            for (const line of lines) {
              const lineWidth = font.widthOfTextAtSize(line, fontSizePt);
              let lineX = this.pxToPt(xPx, this.dpi);

              if (align === 'center') {
                lineX += Math.max(0, (maxWidthPt - lineWidth) / 2);
              } else if (align === 'right') {
                lineX += Math.max(0, maxWidthPt - lineWidth);
              }

              pdfPage.drawText(line, {
                x: lineX,
                y: cursorY,
                size: fontSizePt,
                font,
                color,
                opacity
              });
              cursorY -= lineHeightPt;
              if (cursorY < -pageHeightPt) {
                break;
              }
            }
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });

        try {
          FileSaver.saveAs(blob, 'document.pdf');
        } catch (err) {
          console.warn('FileSaver failed, falling back to anchor method:', err);
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          } catch (err2) {
            console.error('Failed to trigger PDF download:', err2);
            alert('Failed to export PDF. Check console for details.');
          }
        }
      } catch (error) {
        console.error('Error creating PDF:', error);
        alert('Failed to export PDF. Check console for details.');
      }
    },

    _collectTextBlocks(root) {
      const blocks = [];
      const visit = (element) => {
        if (!(element instanceof HTMLElement)) return;
        const tagName = element.tagName ? element.tagName.toLowerCase() : '';
        if (tagName === 'script' || tagName === 'style') return;
        if (element.classList.contains('page-watermark')) return;

        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) {
          return;
        }

        const children = Array.from(element.children).filter(child => {
          const childStyle = window.getComputedStyle(child);
          return childStyle.display !== 'none' && childStyle.visibility !== 'hidden' && parseFloat(childStyle.opacity) !== 0;
        });

        const hasBlockChild = children.some(child => {
          const display = window.getComputedStyle(child).display;
          return display !== 'inline' && display !== 'contents';
        });

        const hasTextNode = Array.from(element.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0);

        const display = style.display;
        const isBlockLike = display !== 'inline' && display !== 'contents';

        if (hasTextNode && isBlockLike && !hasBlockChild) {
          blocks.push(element);
        }

        for (const child of children) {
          visit(child);
        }
      };

      visit(root);
      return blocks;
    },

    _cssColorToRgb(colorString, opacity = 1) {
      const normalizedOpacity = Number.isFinite(opacity) ? opacity : 1;
      if (!colorString || typeof colorString !== 'string') {
        return { color: rgb(0, 0, 0), opacity: Math.max(0, Math.min(1, normalizedOpacity)) };
      }

      const rgbaMatch = colorString.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/i);
      if (rgbaMatch) {
        const r = Math.min(255, parseInt(rgbaMatch[1], 10) || 0) / 255;
        const g = Math.min(255, parseInt(rgbaMatch[2], 10) || 0) / 255;
        const b = Math.min(255, parseInt(rgbaMatch[3], 10) || 0) / 255;
        const a = rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1;
        const finalOpacity = Number.isFinite(a) ? a * normalizedOpacity : normalizedOpacity;
        return { color: rgb(r, g, b), opacity: Math.max(0, Math.min(1, finalOpacity)) };
      }

      const hexMatch = colorString.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) {
          hex = hex.split('').map(ch => ch + ch).join('');
        }
        const intVal = parseInt(hex, 16);
        const r = ((intVal >> 16) & 255) / 255;
        const g = ((intVal >> 8) & 255) / 255;
        const b = (intVal & 255) / 255;
        return { color: rgb(r, g, b), opacity: Math.max(0, Math.min(1, normalizedOpacity)) };
      }

      return { color: rgb(0, 0, 0), opacity: Math.max(0, Math.min(1, normalizedOpacity)) };
    },

    _resolveFont(style, fonts) {
      const weight = style.fontWeight;
      const isBold = weight === 'bold' || weight === 'bolder' || (parseInt(weight, 10) || 0) >= 600;
      const fontStyle = style.fontStyle;
      const isItalic = fontStyle === 'italic' || fontStyle === 'oblique';

      if (isBold && isItalic) return fonts.boldItalic;
      if (isBold) return fonts.bold;
      if (isItalic) return fonts.italic;
      return fonts.regular;
    },

    _normalizeTextContent(text) {
      if (!text || typeof text !== 'string') return '';
      return text
        .replace(/\u00A0/g, ' ')
        .replace(/[\t\r]+/g, ' ')
        .replace(/\s+\n/g, '\n')
        .replace(/\n\s+/g, '\n')
        .replace(/ +/g, ' ')
        .trim();
    },

    _wrapTextIntoLines(font, text, fontSize, maxWidth) {
      if (!text || typeof text !== 'string') return [];
      if (!font || !Number.isFinite(fontSize) || fontSize <= 0) {
        return text.split('\n');
      }

      if (!Number.isFinite(maxWidth) || maxWidth <= 0) {
        return text.split('\n');
      }

      const lines = [];
      const paragraphs = text.split('\n');

      for (const paragraph of paragraphs) {
        const trimmedParagraph = paragraph.trim();
        if (!trimmedParagraph) {
          lines.push('');
          continue;
        }

        const words = trimmedParagraph.split(' ');
        let currentLine = '';

        for (const rawWord of words) {
          const word = rawWord.trim();
          if (!word) continue;

          const candidate = currentLine ? `${currentLine} ${word}` : word;
          const candidateWidth = font.widthOfTextAtSize(candidate, fontSize);

          if (candidateWidth <= maxWidth) {
            currentLine = candidate;
            continue;
          }

          if (currentLine) {
            lines.push(currentLine);
            currentLine = '';
          }

          const wordWidth = font.widthOfTextAtSize(word, fontSize);
          if (wordWidth <= maxWidth) {
            currentLine = word;
            continue;
          }

          const fragments = this._breakWordIntoChunks(font, word, fontSize, maxWidth);
          if (fragments.length) {
            for (let i = 0; i < fragments.length - 1; i++) {
              lines.push(fragments[i]);
            }
            currentLine = fragments[fragments.length - 1];
          } else {
            currentLine = word;
          }
        }

        if (currentLine) {
          lines.push(currentLine);
        } else if (trimmedParagraph.length === 0) {
          lines.push('');
        }
      }

      return lines;
    },

    _breakWordIntoChunks(font, word, fontSize, maxWidth) {
      if (!word) return [];
      const chunks = [];
      let current = '';

      for (const char of Array.from(word)) {
        const candidate = current + char;
        const width = font.widthOfTextAtSize(candidate, fontSize);

        if (width <= maxWidth || current.length === 0) {
          current = candidate;
        } else {
          chunks.push(current);
          current = char;
        }
      }

      if (current) {
        chunks.push(current);
      }

      return chunks;
    },

    resetLayoutDefaults() {
      if (!this.layoutDefaults) return;
      this.docWidth = this.layoutDefaults.width;
      this.docHeight = this.layoutDefaults.height;
      this.dpi = this.layoutDefaults.dpi;
      this.headerFontPt = this.layoutDefaults.headerPt;
      this.subheaderFontPt = this.layoutDefaults.subheaderPt;
      this.bodyFontPt = this.layoutDefaults.bodyPt;
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
    , ptToPx(pt, dpi) {
      return (parseFloat(pt) || 0) * (parseFloat(dpi) || 72) / 72;
    }

    // Helper: convert pixels to points for a given DPI.
    , pxToPt(px, dpi) {
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

  --toolbar-bg: rgba(0, 0, 0, 0.35);
  --toolbar-fg: #fff;
  --control-bg: rgba(255, 255, 255, 0.06);
  --accent: #2f9adf;

  --line-width: 5px;
  --line-offset: -38px;
  /* how far left from origin */
  --line-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);

  --info-background: url('@/assets/documents/blue-page.png');
  --lore-background: url('@/assets/documents/lore-sheet.png');
  --equipment-background: url('@/assets/documents/equipment-sheet.png');
  --species-background: url('@/assets/documents/species-sheet.png');
  --talent-background: url('@/assets/documents/yellow-page.png');
  --toc-background: url('@/assets/documents/toc-sheet.png');
  --gameplay-background: url('@/assets/documents/gameplay-sheet.png');
  --advanced-background: url('@/assets/documents/advanced-sheet.png');

  --purple-background: url('@/assets/documents/purple-page.png');
  --red-background: url('@/assets/documents/red-page.png');
  --yellow-background: url('@/assets/documents/yellow-page.png');
  --blue-background: url('@/assets/documents/blue-page.png');
  --green-background: url('@/assets/documents/green-page.png');
  --orange-background: url('@/assets/documents/orange-page.png');
  --pink-background: url('@/assets/documents/pink-page.png');

  --header-color: #000000;
  --page-color: #000000;

  --info-color: #0c4e81;
  --lore-color: #32004b;
  --equipment-color: #a36209;
  --species-color: #007236;
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

  --artistry-enchantment: url('@/assets/artistries/enchantment.svg');
  --artistry-alteration:  url('@/assets/artistries/alteration.svg');
  --artistry-array:  url('@/assets/artistries/array.svg');
  --artistry-divination: url('@/assets/artistries/divination.svg');
  --artistry-evocation:  url('@/assets/artistries/evocation.svg');
  --artistry-illusion: url('@/assets/artistries/illusion.svg');
  --artistry-necromancy:  url('@/assets/artistries/necromancy.svg');
  --artistry-wake:  url('@/assets/artistries/wake.svg');  

  --specialist-table: url('@/assets/blocks/specialist-table.png');
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
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.5);
  flex-wrap: wrap;
}

.editor-toolbar .toolbar-left,
.editor-toolbar .toolbar-center,
.editor-toolbar .toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.editor-toolbar.toolbar-advanced {
  align-items: center;
  justify-content: space-between;
}

.control {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #e6eef6;
}

.control.compact {
  flex-direction: row;
  align-items: center;
}

.control.checkbox-control {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.control.checkbox-control label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 12px;
}

.control.checkbox-control input[type="checkbox"] {
  width: 16px;
  height: 16px;
}

.control-label {
  font-size: 12px;
  opacity: 0.9;
}

.control-select,
.control-input {
  background: #f0f0f0;
  color: #000;
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 8px;
  border-radius: 6px;
  min-width: 64px;
}

.control-input[type=number] {
  width: 80px;
}

.username-input {
  width: 160px;
}

.btn {
  appearance: none;
  border: 0;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn.primary {
  background: linear-gradient(180deg, var(--accent), #176fa6);
  color: white;
  box-shadow: 0 6px 14px rgba(34, 139, 199, 0.25);
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
  background: linear-gradient(180deg, #f3f2f0 0%, #dcdcdc 100%);
  padding: 12px;
  border-radius: 8px;
}

.viewer-content {
  text-align: left;
  transform-origin: top left;
  will-change: transform;
  background-clip: padding-box;
  background-origin: padding-box;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
  border-radius: 6px;
  position: relative;
}

.viewer-content.viewer-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.12) 1px, transparent 1px),
    linear-gradient(rgba(0, 0, 0, 0.2) 4px, transparent 4px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.2) 4px, transparent 4px);
  background-size: 48px 48px, 48px 48px, 240px 240px, 240px 240px;
  opacity: 0.25;
  mix-blend-mode: multiply;
}

.page {
  min-width: var(--doc-width);
  max-width: var(--doc-width);
  min-height: var(--doc-height, 1650px);
  max-height: var(--doc-height, 1650px);
  position: relative;
}

.page-watermark {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-60deg);
  opacity: 0.05;
  font-size: 320px;
  font-family: "Rockwell Nova Condensed";
  font-weight: bold;
  color: #ff0000;
  pointer-events: none;
  user-select: none;
  z-index: 1;
}

.username-display {
  position: absolute;
  left: 0;
  right: 0;
  top: 20px;
  font-size: 18px;
  font-family: "Bahnschrift";
  color: #000000;
  z-index: 5;
  text-align: center;
}

.page.page-equipment {
  background: var(--equipment-background);
  --header-color: var(--equipment-color);
  --page-color: var(--equipment-page-number);
}

.page.page-gameplay {
  background: var(--gameplay-background);
  --header-color: var(--gameplay-color);
  --page-color: var(--gameplay-page-number);
}

.page.page-info {
  background: var(--info-background);
  --header-color: var(--info-color);
  --page-color: var(--info-page-number);
}

.page.page-lore {
  background: var(--lore-background);
  --header-color: var(--lore-color);
  --page-color: var(--lore-page-number);
}

.page.page-species {
  background: var(--species-background);
  --header-color: var(--species-color);
  --page-color: var(--species-page-number);
}

.page.page-talent {
  display: flex;
  gap: 25px;
  flex-wrap: nowrap;

  background: var(--yellow-background);
  --header-color: var(--talent-color);
  --page-color: var(--talent-page-number);
}

.page.page-toc {
  background: var(--toc-background);
  --header-color: var(--toc-color);
  --page-color: var(--toc-page-number);
}

.page.page-advanced {
  background: var(--advanced-background);
  --header-color: var(--advanced-color);
  --page-color: var(--advanced-page-number);
}

.page.page-purple {
  background: var(--purple-background);
  --header-color: var(--lore-color);
  --page-color: var(--lore-page-number);
}

.page.page-red {
  background: var(--red-background);
  --header-color: var(--advanced-color);
  --page-color: var(--advanced-page-number);
}

.page.page-yellow {
  background: var(--yellow-background);
  --header-color: var(--talent-color);
  --page-color: var(--talent-page-number);
}

.page.page-blue {
  background: var(--blue-background);
  --header-color: var(--info-color);
  --page-color: var(--info-page-number);
}

.page.page-green {
  background: var(--green-background);
  --header-color: var(--species-color);
  --page-color: var(--species-page-number);
}

.page.page-orange {
  background: var(--orange-background);
  --header-color: var(--equipment-color);
  --page-color: var(--equipment-page-number);
}

.page.page-pink {
  background: var(--pink-background);
  --header-color: var(--gameplay-color);
  --page-color: var(--gameplay-page-number);
}

.page h1 {
  color: var(--header-color, #573084);
  font-family: "Rockwell Nova Condensed";
  font-weight: bold;
  font-size: var(--header-font-px, 28pt);
  line-height: 1.15;
  margin: 0 0 28px;
}

.page h1.span-2 {
  position: absolute;
  left: 150px;
  /* align with page-content left */
  top: 125px;
  /* adjust vertically to sit above page content */
  width: calc(459px * 2 + 58px);
  /* two columns + gap */
  z-index: 6;
  margin: 0 0 18px;
  box-sizing: border-box;
}

.page.has-span-2 .column {
  padding-top: 120px;
}

.page h2 {
  color: var(--header-color, #573084);
  font-family: "Rockwell Nova Condensed";
  font-weight: bold;
  font-size: var(--subheader-font-px, 24pt);
  line-height: 1.15;
  margin: 38px 0 -5px;
}

.page h3 {
  color: var(--header-color, #573084);
  font-family: "Rockwell Nova Condensed";
  font-weight: bold;
  font-size: var(--subheader-font-px, 24pt);
  line-height: 1.15;
  margin: 38px 0 -5px;
}

.page h4 {
  color: var(--header-color, #573084);
  font-family: "Rockwell Nova Condensed";
  font-weight: bold;
  font-size: 46px;
  line-height: 1.15;
  margin: 28px 0 -5px;
}

.page p {
  color: black;
  font-family: "Bahnschrift";
  font-size: var(--body-font-px, 12px);
  margin: 0 0 30px;
  line-height: 1.2;
}

.page-content {
  position: absolute;
  left: 150px;
  top: 120px;
  display: flex;
  gap: 50px;
}

.page.page-talent .page-content {
  left: 175px;
  right: 175px;
  top: 100px;
  display: flex;
  flex-direction: row;
  position: relative;
  align-content: center;
  justify-content: center;
  gap: 16px;
  overflow: none;
}

.page.page-talent .page-content .talent-tree {
  flex: 1;
  max-width: 300px;
  min-width: 300px;
  /* fixed width to match column */
  overflow: visible;
  padding-right: 10px;
  box-sizing: border-box;
}

.full-column {
  width: calc(459px * 2 + 58px);
}

.talent-content {
  position: absolute;
  bottom: 230px;
  display: flex;
  flex-direction: column;
  gap: 0px;
  left: -175px;
  right: -175px;
  width: 137%;
  height: 250px;
  justify-content: center;
  align-content: center;
  align-items: center;
}

.talent-label {
  position: relative;
  left: -4px;
  right: 0;
  text-align: center;
  font-size: 66px;
  font-family: "Bahnschrift";
  font-weight: bold;
}

.talent-description {
  font-size: 22px;
  font-family: "Bahnschrift";
  text-align: center;
  position: relative;
  top: -10px;
}

.column {
  max-width: 465px;
  min-width: 465px;
}

.column h1,
.column h2,
.column h3,
.column p {
  padding-right: 5px;
  word-wrap: break-word;
}

.column p:first-of-type {
  margin-top: 5px;
}

.page-number {
  color: var(--page-color);
  font-family: "Rockwell Nova";
  font-weight: bold;
  position: absolute;
  bottom: 25px;
  font-size: 56px;
  width: 100%;
  text-align: center;
}

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
  left: var(--line-offset);
  /* negative to push it out to the left */
  width: var(--line-width);
  /* fixed horizontal size — prevents horizontal growth */
  background-image: linear-gradient(to right, #a7a9ac 100%, #d1d3d4 110%, #a7a9ac 120%);
  pointer-events: none;
  z-index: 4;
  /* place under/over content as needed */
  /* filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.3)); */
  border-radius: 2px;
  /* optional subtle rounding */
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
  width: 8px;
  /* fixed horizontal size so background cannot expand horizontally */
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
  .main-container {
    flex-direction: column;
    padding: 12px;
  }

  .editor-container,
  .viewer {
    width: 100%;
  }

  .editor {
    height: 360px;
  }
}

.equipment {
  position: relative;
  background: var(--equipment-background);
  background-clip: padding-box;
  /* don’t paint behind the border */
  isolation: isolate;

  /* border-image as before */
  border: 5px solid transparent;
  border-image-source: var(--frame);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--frame-edge);
  border-image-repeat: round;
}

/* map each rarity class to a custom property used by the pseudo element */
.equipment.rarity-crude {
  --equipment-background: var(--rarity-crude);
  --frame: var(--frame-crude);
}

.equipment.rarity-common {
  --equipment-background: var(--rarity-common);
  --frame: var(--frame-common);
}

.equipment.rarity-uncommon {
  --equipment-background: var(--rarity-uncommon);
  --frame: var(--frame-uncommon);
}

.equipment.rarity-rare {
  --equipment-background: var(--rarity-rare);
  --frame: var(--frame-rare);
}

.equipment.rarity-legendary {
  --equipment-background: var(--rarity-legendary);
  --frame: var(--frame-legendary);
}

.equipment.rarity-mythic {
  --equipment-background: var(--rarity-mythic);
  --frame: var(--frame-mythic);
}

.equipment-content {
  position: relative;
  background-clip: content-box;
  z-index: 1;
  padding-top: 10px;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.equipment-title {
  font-family: "Bahnschrift";
  font-weight: bold;
  font-size: 21.5px;
}

.equipment-detail {
  font-family: "Bahnschrift";
  font-size: 18px;
  z-index: 10;
  position: relative;
}

.equipment-detail.cost {
  color: white;
}

.equipment-detail.tag {
  font-family: "Bahnschrift";
  font-size: 21.5px;
  margin-bottom: 5px;
  margin-top: 2px;
}

.equipment-tag-type {
  font-weight: bold;
}

.equipment-detail.damage {
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 21px;
  font-weight: bold;
  margin-top: 13px;
  margin-bottom: 25px;
  text-align: center;
}

.equipment-detail.desc {
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 20.51px;
  margin-bottom: 25px;
  line-height: 1.22;
}

.equipment-detail.flavor {
  color: #585858;
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 20.7px;
  margin-bottom: 23px;
  margin-top: 13px;
  line-height: 1.23;
  text-align: center;
}

.equipment-detail.craft {
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 20.7px;
  margin-bottom: 1px;
}

.equipment-section {
  position: relative;
  margin-top: 2px;
  /* reserve space for the border on all sides */
  padding-left: 3px;
  padding-top: 10px;
  margin-left: 5px;
  /* clip the background so it doesn’t render under the border */
  background: var(--section-bg);
  background-clip: padding-box;
  /* no background behind the border:contentReference[oaicite:0]{index=0} */
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

.spell {
  position: relative;
  background: var(--rarity-crude);
  background-clip: padding-box;
  /* don’t paint behind the border */
  isolation: isolate;

  /* border-image as before */
  border: 5px solid transparent;
  border-image-source: var(--frame-crude);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--frame-edge);
  border-image-repeat: round;
}

.spell-content {
  position: relative;
  background-clip: content-box;
  z-index: 1;
  padding-top: 10px;
  padding-left: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.spell-title {
  font-family: "Bahnschrift";
  font-weight: bold;
  font-size: 21.5px;
}

.spell-detail {
  font-family: "Bahnschrift";
  font-size: 18px;
  z-index: 10;
  position: relative;
}

.spell-detail.arts {
  color: white;
}

.spell-detail.tag {
  font-family: "Bahnschrift";
  font-size: 21.5px;
  margin-bottom: 5px;
  margin-top: 2px;
}

.spell-tag-type {
  font-weight: bold;
}

.spell-detail.stamina,
.spell-detail.sta {
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 21px;
  font-weight: bold;
  margin-top: 13px;
  margin-bottom: 25px;
  text-align: center;
}

.spell-detail.desc {
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 20.51px;
  margin-bottom: 25px;
  line-height: 1.22;
  text-align: center;
}

.spell-detail.flavor {
  color: #585858;
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 20.7px;
  margin-bottom: 23px;
  margin-top: 13px;
  line-height: 1.23;
  text-align: center;
}

.spell-detail.craft {
  font-family: "Bahnschrift";
  font-stretch: semi-condensed;
  font-size: 20.7px;
  margin-bottom: 1px;
}

.spell-section {
  position: relative;
  margin-top: 2px;
  /* reserve space for the border on all sides */
  padding-left: 3px;
  padding-top: 10px;
  margin-left: 5px;
  /* clip the background so it doesn’t render under the border */
  background: var(--section-bg);
  background-clip: padding-box;
  /* no background behind the border:contentReference[oaicite:0]{index=0} */
  /* optional: rounded corners if your frame has them */
  border-radius: 4px;
}

.spell-section.section-1 {
  background-color: var(--section-1-bg);
  /* draw the torn frame; reuse your existing border image variables */
  border: 2px solid transparent;
  border-image-source: var(--section-1-border);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--section-border-size);
  border-image-repeat: round;
}

.spell-section.section-2 {
  padding-left: 0px;
  background-color: var(--section-2-bg);
  /* draw the torn frame; reuse your existing border image variables */
  border: 5px solid transparent;
  border-image-source: var(--section-2-border);
  border-image-slice: var(--edge-top) var(--edge-right) var(--edge-bottom) var(--edge-left);
  border-image-width: var(--section-border-size);
  border-image-repeat: round;
  position: relative;
}

.spell-section .artistry-container {
  display: flex;
  align-items: center;
  gap: 0px;
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  height: 100%;
  width: 100%;
  pointer-events: none;
  opacity: 0.2;
}

.spell-section .artistry-container-1 {
  justify-content: center;
}

.spell-section .artistry-container-2 {
  justify-content: space-around;
}

.spell-section .artistry-container-3,
.spell-section .artistry-container-4,
.spell-section .artistry-container-5,
.spell-section .artistry-container-6 {
  justify-content: center;
}

.spell-section .artistry-container-3 .artistry-icon:nth-child(odd),
.spell-section .artistry-container-4 .artistry-icon:nth-child(odd),
.spell-section .artistry-container-5 .artistry-icon:nth-child(odd),
.spell-section .artistry-container-6 .artistry-icon:nth-child(odd) {
  position: relative;
  top: -25px;
}
.spell-section .artistry-container-3 .artistry-icon:nth-child(even),
.spell-section .artistry-container-4 .artistry-icon:nth-child(even),
.spell-section .artistry-container-5 .artistry-icon:nth-child(even),
.spell-section .artistry-container-6 .artistry-icon:nth-child(even) {
  position: relative;
  bottom: -25px;
}

.artistry-icon {
  position: relative;
  width: 100px;
  height: 100px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
}

.artistry-enchantment {
  background-image: var(--artistry-enchantment);
}
.artistry-alteration {
  background-image: var(--artistry-alteration);
}
.artistry-array {
  background-image: var(--artistry-array);
}
.artistry-divination {
  background-image: var(--artistry-divination);
}
.artistry-evocation {
  background-image: var(--artistry-evocation);
}
.artistry-illusion {
  background-image: var(--artistry-illusion);
}
.artistry-necromancy {
  background-image: var(--artistry-necromancy);
}
.artistry-wake {
  background-image: var(--artistry-wake);
}


.toc-entry {
  font-family: "Bahnschrift";
  display: flex;
  gap: 20px;
  justify-content: space-between;
  font-size: 22px;
}

.toc-title {
  font-weight: bold;
}

.toc-page {
  color: gray;
}

.specialist-table {
  position: absolute;
  inset: 0;
  background-image: var(--specialist-table);
}

.specialist-header {
  position: absolute;
  top: 93px;
  left: 105px;
  padding-right: 119px;
  word-wrap: break-word;
  word-break: break-all;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
  font-family: "Bahnschrift";
}

.specialist-content {
  inset: 251px 88px 163px 105px;
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.specialist-row.header {
  position: absolute;
  top: 211px;
  left: 105px;
  font-family: "Bahnschrift";
  display: grid;
  grid-template-columns: 281px 285px 1fr;
  gap: 0;
}

.specialist-row.header .specialist-cell.cell-1,
.specialist-row.header .specialist-cell.cell-2,
.specialist-row.header .specialist-cell.cell-3 {
  font-size: 25px;
  font-weight: bold;
}

.specialist-row {
  flex: 1;
  align-items: center;
  display: grid;
  grid-template-columns: 292px 282px 1fr;
}

.specialist-cell {
  font-size: 19.5px;
  font-family: "Bahnschrift";
}

.specialist-cell.cell-1 {
  font-weight: bold;
}

.specialist-cell.cell-2 {
  letter-spacing: 0.2px;
  font-size: 20.5px;
  padding-right: 38px;
}

.specialist-cell.cell-3 {
  padding-bottom: 8px;
  font-size: 20.8px;
  padding-right: 25px;
}

.specialist-table .specialist-title {
  font-family: "Bahnschrift";
  font-size: 25px;
  font-weight: bold;  
  margin: 0;
  padding: 0;
  color: black;
}

.specialist-table .specialist-desc {
  color: black;
  font-family: "Bahnschrift";
  font-size: 20.5px;
  margin: 0 0 30px;
  text-align: left;
  line-height: 1.2;
  word-break: break-word;
  word-wrap: break-word;
  hyphens: auto;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
}
</style>