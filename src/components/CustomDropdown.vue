<template>
  <div class="custom-dropdown" ref="root" @keydown.prevent.stop="onKeydown">
    <button class="trigger" @click="toggle" :aria-expanded="open" aria-haspopup="true">
      <span class="trigger-left">
        <span class="trigger-icon" v-if="selected && selected.icon">
          <img v-if="isImage(selected.icon)" :src="selected.icon" class="icon-img" alt="" />
          <i v-else-if="isIconClass(selected.icon)" :class="selected.icon" aria-hidden="true"></i>
          <span v-else>{{ selected.icon }}</span>
        </span>

        <span class="trigger-icon" v-else-if="!selected && placeholderIcon">
          <img v-if="isImage(placeholderIcon)" :src="placeholderIcon" class="icon-img" alt="" />
          <i v-else-if="isIconClass(placeholderIcon)" :class="placeholderIcon" aria-hidden="true"></i>
          <span v-else v-html="placeholderIcon"></span>
        </span>

        <span class="trigger-label">{{ selected ? selected.label : placeholder }}</span>
      </span>
      <span class="caret">▾</span>
    </button>

    <ul v-if="open" class="menu" role="menu">
      <li v-for="(opt, idx) in options" :key="opt.value" class="menu-item"
          :class="{ focused: idx === focusedIndex }"
          @click="onSelect(opt)"
          @mouseenter="(focusedIndex = idx, opt.children ? openSubmenu(idx) : closeSubmenu())"
          @mouseleave="closeSubmenu()"
          role="menuitem">
        <span class="item-icon" v-if="opt.icon">
          <img v-if="isImage(opt.icon)" :src="opt.icon" class="icon-img" alt="" />
          <i v-else-if="isIconClass(opt.icon)" :class="opt.icon" aria-hidden="true"></i>
          <span v-else>{{ opt.icon }}</span>
        </span>
        <span class="item-label">{{ opt.label }}</span>

        <!-- Submenu indicator -->
        <span v-if="opt.children && opt.children.length" class="submenu-caret">▸</span>

        <!-- Submenu -->
        <ul v-if="opt.children && openSubmenuFor === idx" class="submenu" role="menu">
          <li v-for="(child, cidx) in opt.children" :key="child.value" class="menu-item sub-item"
              :class="{ focused: cidx === subFocusedIndex }"
              @click.stop="onSelect(child)"
              @mouseenter="subFocusedIndex = cidx"
              role="menuitem">
            <span class="item-icon" v-if="child.icon">
              <img v-if="isImage(child.icon)" :src="child.icon" class="icon-img" alt="" />
              <i v-else-if="isIconClass(child.icon)" :class="child.icon" aria-hidden="true"></i>
              <span v-else>{{ child.icon }}</span>
            </span>
            <span class="item-label">{{ child.label }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'CustomDropdown',
  props: {
    value: { required: false },
    options: { type: Array, default: () => [] },
    placeholder: { type: String, default: 'Select' },
    // placeholderIcon may be an emoji/text or an image path/data URL
    placeholderIcon: { type: String, default: '' }
  },
  data() {
    return {
      open: false,
  focusedIndex: -1,
  // index of option whose submenu is open (-1 = none)
  openSubmenuFor: -1,
  // focused index inside the open submenu
  subFocusedIndex: -1
    };
  },
  computed: {
    selected() {
      return this.options.find(o => o.value === this.value) || null;
    }
  },
  methods: {
    toggle() {
      this.open = !this.open;
      if (this.open) this.$nextTick(() => this.focusedIndex = 0);
    },
    close() {
      this.open = false;
      this.focusedIndex = -1;
    },
    onSelect(opt) {
      this.$emit('input', opt.value);
      this.$emit('select', opt);
      this.close();
    },
    onKeydown(e) {
      if (!this.open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        this.open = true;
        this.focusedIndex = 0;
        return;
      }

  if (!this.open) return;

      if (e.key === 'Escape') {
        this.close();
        return;
      }

      if (e.key === 'ArrowDown') {
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.options.length - 1);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowUp') {
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowRight') {
        // open submenu if focused option has children
        const opt = this.options[this.focusedIndex];
        if (opt && Array.isArray(opt.children) && opt.children.length > 0) {
          this.openSubmenuFor = this.focusedIndex;
          this.subFocusedIndex = 0;
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        // close submenu if open
        if (this.openSubmenuFor !== -1) {
          this.openSubmenuFor = -1;
          this.subFocusedIndex = -1;
          e.preventDefault();
        }
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        // if submenu open, select the subitem
        if (this.openSubmenuFor !== -1) {
          const children = this.options[this.openSubmenuFor].children || [];
          const child = children[this.subFocusedIndex];
          if (child) this.onSelect(child);
          return;
        }

        const opt = this.options[this.focusedIndex];
        if (opt) {
          // if has children, open submenu instead
          if (Array.isArray(opt.children) && opt.children.length > 0) {
            this.openSubmenuFor = this.focusedIndex;
            this.subFocusedIndex = 0;
          } else {
            this.onSelect(opt);
          }
        }
      }
    },
    onDocClick(e) {
      if (!this.$refs.root) return;
      if (!this.$refs.root.contains(e.target)) this.close();
    }
    ,openSubmenu(idx) {
      this.openSubmenuFor = idx;
      this.subFocusedIndex = 0;
    }
    ,closeSubmenu() {
      this.openSubmenuFor = -1;
      this.subFocusedIndex = -1;
    }
    ,isImage(icon) {
      if (!icon || typeof icon !== 'string') return false;
      if (icon.startsWith && icon.startsWith('data:')) return true;
      return /\.(svg|png|jpe?g|gif)(\?|$)/i.test(icon);
    }
    ,isIconClass(icon) {
      if (!icon || typeof icon !== 'string') return false;
      // simple heuristic: contains a space and a hyphen or starts with known prefix like 'ra ' or 'fa '
      return (/^([a-z0-9_-]+\s+)?[a-z0-9_-]+(-[a-z0-9_-]+)+$/i.test(icon) || /^(ra|fa|fas|far|fal|falr)\b/i.test(icon));
    }
  },
  mounted() {
    document.addEventListener('click', this.onDocClick);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.onDocClick);
  }
};
</script>

<style scoped>
.custom-dropdown { position: relative; display: inline-block; }
.trigger { display: inline-flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px; background: rgba(255,255,255,0.06); color: white; border: 1px solid rgba(255,255,255,0.06); cursor: pointer; }
.trigger-left { display:flex; align-items:center; gap:8px }
.trigger-icon { font-size: 16px; display: inline-block; width: 18px; text-align:center }
.caret { opacity: 0.85 }
.icon-img { width: 18px; height: 18px; object-fit: contain; display: inline-block }
.trigger-icon i, .item-icon i { font-size: 18px; line-height: 18px; display: inline-block }
.menu { position: absolute; top: calc(100% + 8px); left: 0; min-width: 180px; background: #fff; color: #111; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); padding: 6px 6px; z-index: 40; }
.menu-item { display:flex; align-items:center; gap:8px; padding: 8px 10px; border-radius: 6px; cursor: pointer; }
.menu-item:hover, .menu-item.focused { background: rgba(0,0,0,0.05); }
.item-icon { width: 20px; display:inline-block; text-align:center }
.item-label { flex: 1 }
.submenu { position: absolute; top: 0; left: 100%; min-width: 160px; margin-left: 6px; background: #fff; border-radius: 6px; box-shadow: 0 8px 20px rgba(0,0,0,0.15); padding: 6px; z-index: 50; }
.sub-item { padding: 6px 8px; }
.submenu-caret { margin-left: 8px; opacity: 0.7 }
</style>
