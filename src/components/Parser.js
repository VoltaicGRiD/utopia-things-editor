import ChevronTalentTree from "./talents/chevron";

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
    safe = safe.replace(/\\n/g, '<br/>');
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
    page: /^\/page\s+(red|pink|orange|yellow|purple|green|blue|talent)\s+(.+)$/i,
    pageNum: /^\/page-num\s+(\d+)$/i,
    column: /^\/(column|col)$/i,
  spacing: /^\/(spacing|sp)\s+(-?\d+)$/i,
    equipment: /^\/equipment\s+(crude|common|uncommon|rare|legendary|mythic)\s+(.*)$/i,
    equipmentDetail: /^\/(type|cost|tag|damage|desc|flavor|craft)\s+(.*)$/i,
    equipmentNext: /^\/next$/i,
    spell: /^\/spell\s+(.*)$/i,
    spellDetail: /^\/(type|arts|tag|sta|stamina|desc)\s+(.*)$/i,
    spellNext: /^\/next$/i,
    specialist: /^\/specialist$/i,
    noteStart: /^\/(note|info|lore)\s+(.*)$/i,
    blockEnd: /^\/end$/i,
    toc: /^\/toc\s+(begin|end)$/i,
    heading: /^(#+)\s+(.*)$/, 

    // Talent handling
    talentStart: /^\/tree\s+([3-5])$/i,
    talentContent: /^\/talent\s+(label|description)\s+(.*)$/i,
    talentEnd: /^\/end-tree$/i,

    // style blocks
    styleBegin: /^\/style\s+begin$/i,
    styleEnd: /^\/style\s+end$/i,
    img: /^\/img\s+(\S+)(?:\s+(.*))?$/i,
    codeFenceBegin: /^```\s*(\w+)?\s*$/,
    hr: /^-{3,}\s*$/,
    pageBreak: /^\/page-break$/i,
    columns: /^\/columns\s+(\d+)$/i,

    // creature stat blocks
    creatureStart: /^\/creature\s+(.*)$/i,
    creatureEnd: /^\/endcreature$/i,
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
  let spellDiv = null;
  let spellArtistries = [];
  let spellSectionContainer = null;
  let spellSectionCount = 0;

  let buildingCreature = false;
  let buildingCreatureDescription1 = false;
  let buildingCreatureDescription2 = false;
  let buildingCreatureDescriptionIndex = 0;
  let creatureData = {};

  let treeDiv = null; // container for current talent tree
  let talentTreeInstance = null;

  let tocDiv = null; // TOC container
  let styleCollect = null; // array of style lines when inside style block
  let specialistDiv = null; // current specialist table
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
    if (type !== "talent") {
      const firstCol = makeColumn();
      page.querySelector('.page-content').appendChild(firstCol);
      pageColumns[activePageIndex].push(firstCol);
      activeColumnIndex = 0;
    }
    else {
      const col = createEl('div', 'full-column talent-content');
      page.querySelector('.page-content').appendChild(col);
      pageColumns[activePageIndex].push(col);
      activeColumnIndex = 0;
    }
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

  const startCreature = (name) => {
    buildingCreature = true;
    creatureData = { name };
  }

  const endCreature = () => {
    console.log('creatureData:', creatureData);
    createCreature(creatureData);
    creatureData = {};
    buildingCreature = false;
  };

  // Create creature
  const createCreature = (creatureData) => {
    const { name, type, dr, stats, bd, travel, defense, agi, str, int, wil, dis, cha, drops, harvest, description1, description2, flavor } = creatureData;
    console.log('Creating creature:', name, type, dr, stats, bd, travel, defense, agi, str, int, wil, dis, cha, drops, harvest, description1, description2, flavor);

    const creatureDiv = createEl('div', 'creature');
    const title = createEl('div', 'creature-title', name || 'Unnamed Creature');
    creatureDiv.appendChild(title);
    activePage.querySelector(".page-content").appendChild(creatureDiv);

    const typeDiv = createEl('div', 'creature-type', type || 'Unknown Type');
    creatureDiv.appendChild(typeDiv);

    const drDiv = createEl('div', 'creature-dr', 'DR ' + (dr || 'N/A'));
    creatureDiv.appendChild(drDiv);
    
    const firstBlock = createEl('div', 'creature-first-block');
    creatureDiv.appendChild(firstBlock);

    const statsDiv = createEl('div', 'creature-stats');
    const shpSpan = createEl('span', 'creature-shp');
    shpSpan.innerHTML = applyInlineFormatting('**' + (stats ? stats.split(' ')[0] + "** SHP" : 'N/A'));
    const dhpSpan = createEl('span', 'creature-dhp');
    dhpSpan.innerHTML = applyInlineFormatting('**' + (stats ? stats.split(' ')[1] + "** DHP" : 'N/A'));
    const staSpan = createEl('span', 'creature-sta');
    staSpan.innerHTML = applyInlineFormatting('**' + (stats ? stats.split(' ')[2] + "** Stamina" : 'N/A'));
    statsDiv.appendChild(shpSpan);
    statsDiv.appendChild(dhpSpan);
    statsDiv.appendChild(staSpan);
    firstBlock.appendChild(statsDiv);

    const bdDiv = createEl('div', 'creature-bd');
    const blockSpan = createEl('span', 'creature-block');
    blockSpan.innerHTML = applyInlineFormatting('**' + (bd ? bd.split(' ')[0] : 'N/A') + "** Block");
    bdDiv.appendChild(blockSpan);
    const dodgeSpan = createEl('span', 'creature-dodge');
    dodgeSpan.innerHTML = applyInlineFormatting('**' + ((bd ? bd.split(' ')[1] : 'N/A')) + "** Dodge");
    bdDiv.appendChild(dodgeSpan);
    firstBlock.appendChild(bdDiv);

    const travelDiv = createEl('div', 'creature-travel');
    const landSpan = createEl('span', 'creature-land');
    landSpan.innerHTML = applyInlineFormatting('**' + (travel ? travel.split(' ')[0] : 'N/A') + "** Land Travel");
    travelDiv.appendChild(landSpan);
    const waterSpan = createEl('span', 'creature-water');
    waterSpan.innerHTML = applyInlineFormatting('**' + (travel ? travel.split(' ')[1] : 'N/A') + "** Water Travel");
    travelDiv.appendChild(waterSpan);
    const airSpan = createEl('span', 'creature-air');
    airSpan.innerHTML = applyInlineFormatting('**' + (travel ? travel.split(' ')[2] : 'N/A') + "** Air Travel");
    travelDiv.appendChild(airSpan);
    firstBlock.appendChild(travelDiv);

    const defensesDiv = createEl('div', 'creature-defenses');
    const defensesHeader = createEl('span', 'creature-defense-header', 'Defenses');
    defensesDiv.appendChild(defensesHeader);
    const defensesContainer = createEl('div', 'creature-defenses-container');
    ['Physical', 'Energy', 'Heat', 'Chill', 'Psyche'].forEach((def, idx) => {
      const defSpan = createEl('span', 'creature-defense');
      defSpan.innerHTML = applyInlineFormatting('**' + (defense ? defense.split(' ')[idx] : 'N/A') + "** " + def);
      defensesContainer.appendChild(defSpan);
    });
    defensesDiv.appendChild(defensesContainer);
    creatureDiv.appendChild(defensesDiv);

    const attributesDiv = createEl('div', 'creature-attributes');
    let sign = '';

    if (agi && agi.split(' ').length === 3) {
      const agilityDiv = createEl('div', 'creature-attribute');
      sign = agi.split(' ')[0].startsWith('-') ? '' : '+';
      const agiLabel = createEl('span', 'creature-attribute-label', `${sign}${agi ? agi.split(' ')[0] : 'N/A'} Agility`);
      agilityDiv.appendChild(agiLabel);

      const speedSpan = createEl('span', 'creature-value');
      const speed = agi ? agi.split(' ')[1] : 'N/A';
      sign = speed.startsWith('-') ? '' : '+';
      speedSpan.innerHTML = applyInlineFormatting(`**${sign}${speed}** Speed`);
      agilityDiv.appendChild(speedSpan);

      const dexteritySpan = createEl('span', 'creature-value');
      const dexterity = agi ? agi.split(' ')[2] : 'N/A';
      sign = dexterity.startsWith('-') ? '' : '+';
      dexteritySpan.innerHTML = applyInlineFormatting(`**${sign}${dexterity}** Dexterity`);
      agilityDiv.appendChild(dexteritySpan);

      attributesDiv.appendChild(agilityDiv);
    }

    if (str && str.split(' ').length === 3) {
      const strengthDiv = createEl('div', 'creature-attribute');
      sign = str.startsWith('-') ? '' : '+';
      const strLabel = createEl('span', 'creature-attribute-label', `${sign}${str ? str.split(' ')[0] : 'N/A'} Strength`);
      strengthDiv.appendChild(strLabel);
  
      const powerSpan = createEl('span', 'creature-value');
      const power = str ? str.split(' ')[1] : 'N/A';
      sign = power.startsWith('-') ? '' : '+';
      powerSpan.innerHTML = applyInlineFormatting(`**${sign}${power}** Power`);
      strengthDiv.appendChild(powerSpan);

      const fortitudeSpan = createEl('span', 'creature-value');
      const fortitude = str ? str.split(' ')[2] : 'N/A';
      sign = fortitude.startsWith('-') ? '' : '+';
      fortitudeSpan.innerHTML = applyInlineFormatting(`**${sign}${fortitude}** Fortitude`);
      strengthDiv.appendChild(fortitudeSpan);

      attributesDiv.appendChild(strengthDiv);
    }

    if (int && int.split(' ').length === 3) {
      const intellectDiv = createEl('div', 'creature-attribute');
      sign = int.startsWith('-') ? '' : '+';
      const intLabel = createEl('span', 'creature-attribute-label', `${sign}${int ? int.split(' ')[0] : 'N/A'} Intellect`);
      intellectDiv.appendChild(intLabel);

      const engineeringSpan = createEl('span', 'creature-value');
      const engineering = int ? int.split(' ')[1] : 'N/A';
      sign = engineering.startsWith('-') ? '' : '+';
      engineeringSpan.innerHTML = applyInlineFormatting(`**${sign}${engineering}** Engineering`);
      intellectDiv.appendChild(engineeringSpan);
      
      const memoryDiv = createEl('span', 'creature-value');
      const memory = int ? int.split(' ')[2] : 'N/A';
      sign = memory.startsWith('-') ? '' : '+';
      memoryDiv.innerHTML = applyInlineFormatting(`**${sign}${memory}** Memory`);
      intellectDiv.appendChild(memoryDiv);

      attributesDiv.appendChild(intellectDiv);
    }

    if (wil && wil.split(' ').length === 3) {
      const willDiv = createEl('div', 'creature-attribute');
      sign = wil.startsWith('-') ? '' : '+';
      const wilLabel = createEl('span', 'creature-attribute-label', `${sign}${wil ? wil.split(' ')[0] : 'N/A'} Will`);
      willDiv.appendChild(wilLabel);

      const resolveSpan = createEl('span', 'creature-value');
      const resolve = wil ? wil.split(' ')[1] : 'N/A';
      sign = resolve.startsWith('-') ? '' : '+';
      resolveSpan.innerHTML = applyInlineFormatting(`**${sign}${resolve}** Resolve`);
      willDiv.appendChild(resolveSpan);

      const awarenessSpan = createEl('span', 'creature-value');
      const awareness = wil ? wil.split(' ')[2] : 'N/A';
      sign = awareness.startsWith('-') ? '' : '+';
      awarenessSpan.innerHTML = applyInlineFormatting(`**${sign}${awareness}** Awareness`);
      willDiv.appendChild(awarenessSpan);

      attributesDiv.appendChild(willDiv);
    }

    if (dis && dis.split(' ').length === 3) {
      const displayDiv = createEl('div', 'creature-attribute');
      sign = dis.startsWith('-') ? '' : '+';
      const disLabel = createEl('span', 'creature-attribute-label', `${sign}${dis ? dis.split(' ')[0] : 'N/A'} Display`);
      displayDiv.appendChild(disLabel);

      const portrayalSpan = createEl('span', 'creature-value');
      const portrayal = dis ? dis.split(' ')[1] : 'N/A';
      sign = portrayal.startsWith('-') ? '' : '+';
      portrayalSpan.innerHTML = applyInlineFormatting(`**${sign}${portrayal}** Portrayal`);
      displayDiv.appendChild(portrayalSpan);

      const stuntSpan = createEl('span', 'creature-value');
      const stunt = dis ? dis.split(' ')[2] : 'N/A';
      sign = stunt.startsWith('-') ? '' : '+';
      stuntSpan.innerHTML = applyInlineFormatting(`**${sign}${stunt}** Stunt`);
      displayDiv.appendChild(stuntSpan);

      attributesDiv.appendChild(displayDiv);
    }

    if (cha && cha.split(' ').length === 3) {
      const charmDiv = createEl('div', 'creature-attribute');
      sign = cha.startsWith('-') ? '' : '+';
      const chaLabel = createEl('span', 'creature-attribute-label', `${sign}${cha ? cha.split(' ')[0] : 'N/A'} Charm`);
      charmDiv.appendChild(chaLabel);

      const appealSpan = createEl('span', 'creature-value');
      const appeal = cha ? cha.split(' ')[1] : 'N/A';
      sign = appeal.startsWith('-') ? '' : '+';
      appealSpan.innerHTML = applyInlineFormatting(`**${sign}${appeal}** Appeal`);
      charmDiv.appendChild(appealSpan);

      const languageSpan = createEl('span', 'creature-value');
      const language = cha ? cha.split(' ')[2] : 'N/A';
      sign = language.startsWith('-') ? '' : '+';
      languageSpan.innerHTML = applyInlineFormatting(`**${sign}${language}** Language`);
      charmDiv.appendChild(languageSpan);
      
      attributesDiv.appendChild(charmDiv);
      creatureDiv.appendChild(attributesDiv);
    }

    const descriptionContainerDiv = createEl('div', 'creature-description-container');
    const descriptionColumnContainer = createEl('div', 'creature-description-columns');
    descriptionContainerDiv.appendChild(descriptionColumnContainer);
    if (description1) {
      const descriptionColumn1 = createEl('div', 'creature-description-column');
      descriptionColumnContainer.appendChild(descriptionColumn1);
      for (const line of (description1 || [])) {
        const descPara = createEl('p', 'creature-description-text');
        descPara.innerHTML = applyInlineFormatting(line);
        descriptionColumn1.appendChild(descPara);
      }
      descriptionColumnContainer.appendChild(descriptionColumn1);
    }
    if (description2) {
      const descriptionColumn2 = createEl('div', 'creature-description-column');
      descriptionColumnContainer.appendChild(descriptionColumn2);
      for (const line of (description2 || [])) {
        const descPara = createEl('p', 'creature-description-text');
        descPara.innerHTML = applyInlineFormatting(line);
        descriptionColumn2.appendChild(descPara);
      }
      descriptionColumnContainer.appendChild(descriptionColumn2);
    }
    creatureDiv.appendChild(descriptionContainerDiv);

    if (drops || harvest) {
      const dropsAndHarvestDiv = createEl('div', 'creature-drops-harvest');
      const dropsHeader = createEl('div', 'creature-drops-harvest-header', 'DROPS AND HARVESTS');
      dropsAndHarvestDiv.appendChild(dropsHeader);

      const dropsContent = createEl('div', 'creature-drops-harvest-content');
      if (drops) {
        const dropsDiv = createEl('div', 'creature-drops');
        const items = drops.split(',') || '';
        for (let i = 0; i < items.length; i++) {
          const itemSpan = createEl('span', 'creature-drops-item', items[i].trim());
          dropsDiv.appendChild(itemSpan);
        }
        dropsContent.appendChild(dropsDiv);
      }
      if (harvest) {
        const harvestDiv = createEl('div', 'creature-harvest');
        const testSpan = createEl('span', 'creature-harvest-header', harvest.split(':')[0]);
        harvestDiv.appendChild(testSpan);
        const items = harvest.split(':')[1].split(',') || '';
        for (let i = 0; i < items.length; i++) {
          const itemSpan = createEl('span', 'creature-harvest-item', items[i].trim());
          harvestDiv.appendChild(itemSpan);
        }
        dropsContent.appendChild(harvestDiv);
      }
      dropsAndHarvestDiv.appendChild(dropsContent);
      descriptionContainerDiv.appendChild(dropsAndHarvestDiv);
    }

    if (flavor) {
      const flavorDiv = createEl('div', 'creature-flavor', flavor);
      creatureDiv.appendChild(flavorDiv);
    }
  }

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

  const startSpell = (name) => {
    const spell = createEl('div', 'spell');
    const contentWrap = createEl('div', 'spell-content');
    const title = createEl('div', 'spell-title', name);
    contentWrap.appendChild(title);
    spell.appendChild(contentWrap);
    getActiveColumn().appendChild(spell);
    spellDiv = spell;
    spellSectionContainer = contentWrap;
    spellSectionCount = 0;
  };

  const startTalent = (count) => {
    if (!activePage) return;
    const scale = Math.max(1, parseInt(count, 10) || 5);
    const pageContent = activePage.querySelector('.page-content');
    if (!pageContent) return;

    if (!treeDiv) {
      treeDiv = createEl('div', 'talent-tree');
      pageContent.appendChild(treeDiv);
    }

    if (talentTreeInstance) {
      talentTreeInstance.destroy();
      talentTreeInstance = null;
    }

    treeDiv.innerHTML = '';
    talentTreeInstance = new ChevronTalentTree(treeDiv, { scale, columns: 3 });
  };

  const endTalent = () => {
    if (!talentTreeInstance) return;
    talentTreeInstance = null;
    treeDiv = null;
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

  const addSpellDetail = (kind, rawContent) => {
    if (!spellDiv) return;
    // Don't create a new section until the first 'next' is called
    // if (!spellSectionContainer || spellSectionCount === 0) {
    //   spellSectionCount = 1;
    //   const section = createEl('div', 'spell-section section-1');
    //   spellDiv.appendChild(section);
    //   spellSectionContainer = section;
    // }
    const detail = createEl('div', 'spell-detail ' + kind.toLowerCase());
    if (kind.toLowerCase() === 'tag') {
      const [left, ...rest] = rawContent.split(':');
      const right = rest.join(':').trim();
      const first = createEl('span', 'equipment-tag-type', left.trim() + ': ');
      const second = createEl('span', 'equipment-tag-content', right);
      detail.appendChild(first);
      detail.appendChild(second);
    } else if (kind.toLowerCase() === "arts") {
      const arts = rawContent.split(',');
      arts.forEach(a => spellArtistries.push(a.trim().toLowerCase()));
      detail.textContent = rawContent;
    } else {
      detail.textContent = rawContent;
    }
    spellSectionContainer.appendChild(detail);
  };

  const nextEquipmentSection = () => {
    if (!equipmentDiv) return;
    equipmentSectionCount += 1;
    const section = createEl('div', 'equipment-section section-' + equipmentSectionCount);
    equipmentDiv.appendChild(section);
    equipmentSectionContainer = section;
  };

  const nextSpellSection = () => {
    if (!spellDiv) return;
    spellSectionCount += 1;
    const section = createEl('div', 'spell-section section-' + spellSectionCount);
    spellDiv.appendChild(section);
    spellSectionContainer = section;
  }

  const endEquipment = () => {
    equipmentDiv = null;
    equipmentSectionContainer = null;
    equipmentSectionCount = 0;
  };

  const endSpell = () => {
    if (!spellDiv) {
      spellSectionContainer = null;
      spellSectionCount = 0;
      spellArtistries = [];
      return;
    }

    try {
      const section = spellDiv.querySelector('.section-2');
      const artistryCount = spellArtistries.length;
      const container = createEl('div', 'artistry-container artistry-container-' + artistryCount, '');
      section.appendChild(container);

      for (const artistry of spellArtistries) {
        const artistryIcon = createEl('img', `artistry-icon artistry-${artistry}`, '');
        artistryIcon.setAttribute('width', '130');
        artistryIcon.setAttribute('height', '130');
        container.appendChild(artistryIcon);
      }

      spellDiv = null;
      spellSectionContainer = null;
      spellSectionCount = 0;
      spellArtistries = [];
    } catch (e) {
      console.error('Error finalizing spell:', e);
    }
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
    const amount = parseFloat(px);
    if (!Number.isFinite(amount)) return;

    const spacer = createEl('div', 'spacing');
    if (amount >= 0) {
      spacer.style.height = amount + 'px';
    } else {
      spacer.style.height = '0px';
      spacer.style.marginTop = amount + 'px';
      spacer.classList.add('spacing-negative');
    }
    spacer.setAttribute('aria-hidden', 'true');
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

  const addTalentContent = (type, content) => {
    if (!activePage) return;
    if (!getActiveColumn().classList.contains('talent-content')) return;

    if (type === "label") {
      const label = createEl('div', 'talent-label', content);
      getActiveColumn().appendChild(label);
    }

    if (type === "description") {
      const description = createEl('div', 'talent-description', '');
      description.innerHTML = applyInlineFormatting(content);
      getActiveColumn().appendChild(description);
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

  const addSpecialistTable = () => {
    const div = createEl('div', 'specialist-table');
    activePage.appendChild(div);
    const headerWrap = createEl('div', 'specialist-header');
    div.appendChild(headerWrap);
    const contentWrap = createEl('div', 'specialist-content');
    div.appendChild(contentWrap);
    const headerRow = createEl('div', 'specialist-row header');
    ['Talent Name', 'Prerequisites', 'Abilities'].forEach((text, idx) => {
      const cell = createEl('div', 'specialist-cell cell-' + (idx + 1), text);
      headerRow.appendChild(cell);
    });
    div.appendChild(headerRow);
    specialistDiv = div;
  };

  // ---------- Main loop ----------
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    let line = raw.trim();
    if (!line) continue;

    // If no page has been created yet, ignore all non-page lines to avoid
    // inserting a blank initial page. Allow style blocks and comments.
    if (activePageIndex < 0 && !RE.page.test(line) && !RE.styleBegin.test(line) && !RE.styleEnd.test(line) && !RE.comment.test(line)) {
      startNewPage('default');
      ensureColumn();
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

    if (buildingCreature && !RE.creatureEnd.test(line)) {
      if (line.trim().startsWith('/desc')) {
        if (buildingCreatureDescriptionIndex === 0) {
          buildingCreatureDescription1 = true;
        } else if (buildingCreatureDescriptionIndex === 1) {
          buildingCreatureDescription2 = true;
        }
        continue;
      }

      if (buildingCreatureDescription1) {
        if (line.trim() === '/enddesc') {
          buildingCreatureDescription1 = false;
          buildingCreatureDescriptionIndex += 1;
          continue;
        }

        if (creatureData['description1'] === undefined) {
          creatureData['description1'] = [line.trim()];
        } else {
          if (line.trim() === '') {
            creatureData['description1'].push('\n');
          } else {
            creatureData['description1'].push(line.trim());
          }
        } 
        
        continue;
      } else if (buildingCreatureDescription2) {
        if (line.trim() === '/enddesc') {
          buildingCreatureDescription2 = false;
          buildingCreatureDescriptionIndex += 1;
          continue;
        }

        if (creatureData['description2'] === undefined) {
          creatureData['description2'] = [line.trim()];
        } else {
          if (line.trim() === '') {
            creatureData['description2'].push('\n');
          } else {
            creatureData['description2'].push(line.trim());
          }
        }
        
        continue;
      }

      const key = line.trim().split(' ')[0].substring(1).toLowerCase();
      const value = line.trim().split(' ').slice(1).join(' ').trim();

      console.log('Creature line:', line, 'key:', key, 'value:', value);

      if (key && value) {
        creatureData[key] = (creatureData[key] || '') + (creatureData[key] ? '\n' : '') + value;
      }
      continue;
    }

    if (equipmentDiv && !RE.blockEnd.test(line)) {
      if (RE.equipmentNext.test(line)) { nextEquipmentSection(); continue; }
      const mDet = line.match(RE.equipmentDetail);
      if (mDet) { addEquipmentDetail(mDet[1], mDet[2]); continue; }
    }

    if (spellDiv && !RE.blockEnd.test(line)) {
      if (RE.spellNext.test(line)) { nextSpellSection(); continue; }
      const mDet = line.match(RE.spellDetail);
      if (mDet) { addSpellDetail(mDet[1], mDet[2]); continue; }
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

    if (specialistDiv) {
      if (RE.blockEnd.test(line)) {
        specialistDiv = null;
        continue;
      } else {
        const title = /^\/title\s*(.*)$/i.exec(line);
        if (title) {
          const h2 = createEl('h2', 'specialist-title', title[1]);
          specialistDiv.querySelector('.specialist-header').appendChild(h2);
          continue;
        }

        const desc = /^\/desc\s*(.*)$/i.exec(line);
        if (desc) {
          const p = createEl('p', 'specialist-desc');
          p.innerHTML = applyInlineFormatting(desc[1]);
          specialistDiv.querySelector('.specialist-header').appendChild(p);
          continue;
        }

        const splits = line.split('|').map(s => s.trim());
        if (splits.length === 3) {
          const row = createEl('div', 'specialist-row');
          splits.forEach((text, idx) => {
            const cell = createEl('div', 'specialist-cell cell-' + (idx + 1));
            cell.innerHTML = applyInlineFormatting(text);
            row.appendChild(cell);
          });
          specialistDiv.querySelector('.specialist-content').appendChild(row);
          continue;
        }
      }
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
    if ((m = line.match(RE.spell))) { startSpell(m[1]); continue; }
    if ((m = line.match(RE.specialist))) { addSpecialistTable(); continue; }
    if ((m = line.match(RE.noteStart))) { startNote(m[1], m[2]); continue; }
    if ((m = line.match(RE.talentStart))) { startTalent(m[1]); continue; }
    if ((m = line.match(RE.creatureStart))) { startCreature(m[1]); continue; }
    if ((m = line.match(RE.creatureEnd))) { endCreature(); continue; }
    if (RE.talentEnd.test(line)) { endTalent(); continue; }
    if ((m = line.match(RE.talentContent))) {
      const type = m[1];
      const content = m[2];
      addTalentContent(type, content);
      continue;
    }
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
  if (RE.blockEnd.test(line)) { endNote(); endEquipment(); endSpell(); endTOC(); continue; }
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

  return parent;
}