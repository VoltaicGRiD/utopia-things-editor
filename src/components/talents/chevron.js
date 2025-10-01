import { createApp, defineComponent, ref, computed } from 'vue';
import './chevron.css';

const defaultGradient = 'linear-gradient(135deg, rgba(185, 194, 202, 1) 0%, rgba(97, 101, 105, 1) 100%);';

const ensureTrailingSlash = (value) => (value.endsWith('/') ? value : `${value}/`);
const baseAssetPath = ensureTrailingSlash(process.env.BASE_URL || '/');
const pointsImage = `${baseAssetPath}assets/tree/points.png`;

const offsetsForScale = (scale, position) => {
  switch (scale) {
    case 3:
      return { imageBottom: -15 + (-2 * position), bodySoulBottom: 21 + (-2 * position), mindBottom: 12 + (-2 * position) };
    case 4:
      return { imageBottom: -17 + (-2 * position), bodySoulBottom: 19 + (-2 * position), mindBottom: 10 + (-2 * position) };
    case 5:
      return { imageBottom: -19 + (-2 * position), bodySoulBottom: 17 + (-2 * position), mindBottom: 8 + (-2 * position) };
    default:
      return { imageBottom: 0, bodySoulBottom: 0, mindBottom: 0 };
  }
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const ParentChevronComponent = defineComponent({
  name: 'ParentChevron',
  props: {
    scale: {
      type: Number,
      required: true
    },
    column: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const textSize = ref(25);
    const showMenu = ref(false);
    const fill = ref(defaultGradient);
    const color1 = ref('#474747');
    const color2 = ref('#555555');
    const stop1 = ref(0);
    const stop2 = ref(100);
    const descriptionTop = ref(48);
    const descriptionColor = ref('#FFFFFF');

    // let height = 0;

    // switch (props.scale) {
    //   case 3:
    //     height = computed(() => (700 + (67 * props.scale)) / props.scale);
    //     break;
    //   case 4:
    //     height = computed(() => (750 + (67 * props.scale)) / props.scale);
    //     break;
    //   case 5:
    //     height = computed(() => (800 + (67 * props.scale)) / props.scale);
    //     break;
    // }

    const height = computed(() => (1150 + (32 * props.scale)) / props.scale);
    const offsets = computed(() => offsetsForScale(props.scale, 0));
    const gradientId = computed(() => `myGradient-parent-${props.column}`);

    const updateTextSize = (event) => {
      textSize.value = toNumber(event.target.value, textSize.value);
    };

    const updateDescriptionTop = (event) => {
      descriptionTop.value = toNumber(event.target.value, descriptionTop.value);
    };

    const updateColorOne = (event) => {
      fill.value = `url(#${gradientId.value})`;
      color1.value = event.target.value;
    };

    const updateStopOne = (event) => {
      fill.value = `url(#${gradientId.value})`;
      stop1.value = toNumber(event.target.value, stop1.value);
    };

    const updateColorTwo = (event) => {
      fill.value = `url(#${gradientId.value})`;
      color2.value = event.target.value;
    };

    const updateStopTwo = (event) => {
      fill.value = `url(#${gradientId.value})`;
      stop2.value = toNumber(event.target.value, stop2.value);
    };

    const updateDescriptionColor = (event) => {
      descriptionColor.value = event.target.value;
    };

    const reset = () => {
      fill.value = defaultGradient;
    };

    return {
      textSize,
      showMenu,
      fill,
      color1,
      color2,
      stop1,
      stop2,
      descriptionTop,
      descriptionColor,
      height,
      offsets,
      gradientId,
      column: props.column,
      pointsImage,
      updateTextSize,
      updateDescriptionTop,
      updateColorOne,
      updateStopOne,
      updateColorTwo,
      updateStopTwo,
      updateDescriptionColor,
      reset
    };
  },
  template: `
    <div class="chevron-container" @mouseenter="showMenu = true" @mouseleave="showMenu = false">
      <div class="chevron-svg" :style="{ height: height + 'px', zIndex: 100 }" style="overflow: visible;">
        <svg class="chevron" viewBox="0 0 159 170" preserveAspectRatio="none" style="overflow: visible;">
          <defs>
            <radialGradient class="radial" :id="gradientId">
              <stop class="chevron-radial-1" :offset="stop1 + '%'" :stop-color="color1" />
              <stop class="chevron-radial-2" :offset="stop2 + '%'" :stop-color="color2" />
            </radialGradient>
          </defs>
          <polyline :fill="fill" points="159 1 159 155 79 170 0 155 0 1 159 1" />
        </svg>
      </div>
      <div class="parent-chevron-controls">
        <textarea class="title" placeholder="Epic Talent"></textarea>
        <img :src="pointsImage" alt="points" class="points-img" :style="{ bottom: offsets.imageBottom + 'px', height: '104px' }" />
        <textarea class="skillbody" placeholder="Some awesome, incredible, homebrew'd talent" :style="{ fontSize: textSize + 'px', top: descriptionTop + '%' }"></textarea>
        <input class="body" type="number" maxlength="1" min="0" max="9" value="0" :style="{ bottom: offsets.bodySoulBottom + 'px' }" />
        <input class="mind" type="number" maxlength="1" min="0" max="9" value="0" :style="{ bottom: offsets.mindBottom + 'px' }" />
        <input class="soul" type="number" maxlength="1" min="0" max="9" value="0" :style="{ bottom: offsets.bodySoulBottom + 'px' }" />
      </div>

      <div class="chevron-extras" :style="{ display: showMenu ? 'flex' : 'none' }">
        <div class="control-group">
          <div class="control-label">
            <label :for="'text-size-parent-' + column">Font size: {{ textSize }} [1]</label>
            <input :id="'text-size-parent-' + column" :name="'text-size-parent-' + column" step="0.01" min="0.3" max="2" placeholder="1" type="number" :value="textSize" @input="updateTextSize" />
          </div>
          <div class="control-label">
            <label :for="'description-top-parent-' + column">Height: {{ descriptionTop }}% [50%]</label>
            <input :id="'description-top-parent-' + column" :name="'description-top-parent-' + column" step="0.1" min="0" max="100" type="number" :value="descriptionTop" @input="updateDescriptionTop" />
          </div>
        </div>
        <div class="control-group">
          <div class="control-label">
            <label :for="'inner-gradient-parent-' + column">Inner gradient color</label>
            <input :id="'inner-gradient-parent-' + column" :name="'inner-gradient-parent-' + column" type="color" :value="color1" @input="updateColorOne" />
          </div>
          <div class="control-label">
            <label :for="'inner-position-parent-' + column">and position</label>
            <input :id="'inner-position-parent-' + column" :name="'inner-position-parent-' + column" type="number" :value="stop1" placeholder="10" @input="updateStopOne" />
          </div>
        </div>
        <div class="control-group">
          <div class="control-label">
            <label :for="'outer-gradient-parent-' + column">Outer gradient color</label>
            <input :id="'outer-gradient-parent-' + column" :name="'outer-gradient-parent-' + column" type="color" :value="color2" @input="updateColorTwo" />
          </div>
          <div class="control-label">
            <label :for="'outer-position-parent-' + column">and position</label>
            <input :id="'outer-position-parent-' + column" :name="'outer-position-parent-' + column" type="number" :value="stop2" placeholder="95" @input="updateStopTwo" />
          </div>
        </div>
        <div class="control-group">
          <div class="control-label">
            <label :for="'description-color-' + column">Description color</label>
            <input :id="'description-color-' + column" :name="'description-color-' + column" type="color" :value="descriptionColor" @input="updateDescriptionColor" />
          </div>
        </div>
        <button type="button" @click="reset">Reset Gradients</button>
      </div>
    </div>
  `
});

const ChevronComponent = defineComponent({
  name: 'Chevron',
  props: {
    position: {
      type: Number,
      required: true
    },
    scale: {
      type: Number,
      required: true
    },
    column: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const textSize = ref(25);
    const showMenu = ref(false);
    const fill = ref(defaultGradient);
    const color1 = ref('#474747');
    const color2 = ref('#555555');
    const stop1 = ref(0);
    const stop2 = ref(100);
    const descriptionTop = ref(46);
    const descriptionColor = ref('#FFFFFF');
    const marginTop = -50;

    const offsets = computed(() => offsetsForScale(props.scale, props.position));
    const height = computed(() => (1150 + (32 * props.scale)) / props.scale);
    const zIndex = computed(() => 100 - props.position);
    const display = computed(() => (props.position > props.scale ? 'none' : 'block'));
    const extrasTop = computed(() => `${marginTop - 20}px`);
    const gradientId = computed(() => `myGradient-${props.position}-${props.column}`);

    const updateTextSize = (event) => {
      textSize.value = toNumber(event.target.value, textSize.value);
    };

    const updateDescriptionTop = (event) => {
      descriptionTop.value = toNumber(event.target.value, descriptionTop.value);
    };

    const updateColorOne = (event) => {
      fill.value = `url(#${gradientId.value})`;
      color1.value = event.target.value;
    };

    const updateStopOne = (event) => {
      fill.value = `url(#${gradientId.value})`;
      stop1.value = toNumber(event.target.value, stop1.value);
    };

    const updateColorTwo = (event) => {
      fill.value = `url(#${gradientId.value})`;
      color2.value = event.target.value;
    };

    const updateStopTwo = (event) => {
      fill.value = `url(#${gradientId.value})`;
      stop2.value = toNumber(event.target.value, stop2.value);
    };

    const updateDescriptionColor = (event) => {
      descriptionColor.value = event.target.value;
    };

    const reset = () => {
      fill.value = defaultGradient;
    };

    return {
      position: props.position,
      column: props.column,
      textSize,
      showMenu,
      fill,
      color1,
      color2,
      stop1,
      stop2,
      descriptionTop,
      descriptionColor,
      marginTop,
      offsets,
      height,
      zIndex,
      display,
      extrasTop,
      gradientId,
      pointsImage,
      updateTextSize,
      updateDescriptionTop,
      updateColorOne,
      updateStopOne,
      updateColorTwo,
      updateStopTwo,
      updateDescriptionColor,
      reset
    };
  },
  template: `
    <div class="chevron-container" @mouseenter="showMenu = true" @mouseleave="showMenu = false" :style="{ display }">
      <div class="chevron-svg" :style="{ marginTop: marginTop + 'px', height: height + 'px', zIndex }" style="overflow: visible;">
        <svg class="chevron" viewBox="0 0 159 170" preserveAspectRatio="none" style="overflow: visible;">
          <defs>
            <radialGradient class="radial" :id="gradientId">
              <stop class="chevron-radial-1" :offset="stop1 + '%'" :stop-color="color1" />
              <stop class="chevron-radial-2" :offset="stop2 + '%'" :stop-color="color2" />
            </radialGradient>
          </defs>
          <polyline :fill="fill" points="159 1 159 155 79 170 0 155 0 1 159 1" />
        </svg>
      </div>
      <div class="chevron-controls">
        <textarea class="title" :style="{ top: '1%' }"></textarea>
        <img :src="pointsImage" alt="points" class="points-img" :style="{ bottom: offsets.imageBottom + 'px', height: '104px' }" />
        <textarea class="skillbody" :style="{ fontSize: textSize + 'px', top: descriptionTop + '%' }"></textarea>
        <input class="body" type="number" maxlength="1" min="0" max="9" value="0" :style="{ bottom: offsets.bodySoulBottom + 'px' }" />
        <input class="mind" type="number" maxlength="1" min="0" max="9" value="0" :style="{ bottom: offsets.mindBottom + 'px' }" />
        <input class="soul" type="number" maxlength="1" min="0" max="9" value="0" :style="{ bottom: offsets.bodySoulBottom + 'px' }" />
      </div>

      <div class="chevron-extras" :style="{ display: showMenu ? 'flex' : 'none', top: extrasTop }">
        <div class="control-group">
          <div class="control-label">
            <label :for="'text-size-' + position + '-' + column">Font size: {{ textSize }} [1]</label>
            <input :id="'text-size-' + position + '-' + column" :name="'text-size-' + position + '-' + column" step="0.01" min="0.3" max="2" placeholder="1" type="number" :value="textSize" @input="updateTextSize" />
          </div>
          <div class="control-label">
            <label :for="'description-top-' + position + '-' + column">Height: {{ descriptionTop }}% [50%]</label>
            <input :id="'description-top-' + position + '-' + column" :name="'description-top-' + position + '-' + column" step="0.1" min="0" max="100" type="number" :value="descriptionTop" @input="updateDescriptionTop" />
          </div>
        </div>
        <div class="control-group">
          <div class="control-label">
            <label :for="'inner-gradient-' + position + '-' + column">Inner gradient color</label>
            <input :id="'inner-gradient-' + position + '-' + column" :name="'inner-gradient-' + position + '-' + column" type="color" :value="color1" @input="updateColorOne" />
          </div>
          <div class="control-label">
            <label :for="'inner-position-' + position + '-' + column">and position</label>
            <input :id="'inner-position-' + position + '-' + column" :name="'inner-position-' + position + '-' + column" type="number" :value="stop1" placeholder="10" @input="updateStopOne" />
          </div>
        </div>
        <div class="control-group">
          <div class="control-label">
            <label :for="'outer-gradient-' + position + '-' + column">Outer gradient color</label>
            <input :id="'outer-gradient-' + position + '-' + column" :name="'outer-gradient-' + position + '-' + column" type="color" :value="color2" @input="updateColorTwo" />
          </div>
          <div class="control-label">
            <label :for="'outer-position-' + position + '-' + column">and position</label>
            <input :id="'outer-position-' + position + '-' + column" :name="'outer-position-' + position + '-' + column" type="number" :value="stop2" placeholder="95" @input="updateStopTwo" />
          </div>
        </div>
        <div class="control-group">
          <div class="control-label">
            <label :for="'description-color-' + column">Description color</label>
            <input :id="'description-color-' + column" :name="'description-color-' + column" type="color" :value="descriptionColor" @input="updateDescriptionColor" />
          </div>
        </div>
        <button type="button" @click="reset">Reset Gradients</button>
      </div>
    </div>
  `
});

const TalentTree = defineComponent({
  name: 'TalentTree',
  components: {
    ParentChevron: ParentChevronComponent,
    Chevron: ChevronComponent
  },
  props: {
    scale: {
      type: Number,
      default: 5
    },
    columns: {
      type: Number,
      default: 1
    }
  },
  setup(props) {
    const chevronPositions = computed(() => Array.from({ length: Math.max(1, props.scale - 1) }, (_, idx) => idx + 1));
    return {
      chevronPositions
    };
  },
  template: `
    <div class="talent-tree-wrapper">
      <ParentChevron :scale="scale" :column="0" />
      <div class="talent-tree-children">
        <Chevron
          v-for="pos in chevronPositions"
          :key="pos"
          :position="pos"
          :scale="scale"
          :column="0"
        />
      </div>
    </div>
  `
});

class ChevronTalentTree {
  constructor(container, options = {}) {
    this.container = container;
    this.options = options;
    this.mountEl = document.createElement('div');
    this.mountEl.className = 'talent-tree-host';
    this.container.appendChild(this.mountEl);
    const { scale = 5, columns = 1 } = options;
    this.app = createApp(TalentTree, { scale, columns });
    this.app.mount(this.mountEl);
  }

  destroy() {
    if (this.app) {
      this.app.unmount();
      this.app = null;
    }
    if (this.mountEl && this.mountEl.parentNode) {
      this.mountEl.parentNode.removeChild(this.mountEl);
    }
  }
}

export const ParentChevron = ParentChevronComponent;
export const Chevron = ChevronComponent;

export default ChevronTalentTree;