/**
 * Constants and Configuration
 */
const ANIMATION_TIMING = {
  SCENE_CHANGE: {
    TITLE_IN: 1600,
    SUBTITLE_IN: 500,
    VALUE_GROUP_IN: 300,
    ELEMENT_EXIT: 300,
    ELEMENT_EXIT_DELAY: 60
  },
  TRANSITIONS: {
    OPACITY: "opacity 0.15s cubic-bezier(0.4, 0.0, 0.2, 1)",
    TRANSFORM: "transform 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)"
  }
};

/**
 * DOM Element Selection Helpers
 */
const elements = {
  title: () => document.querySelector(".frame__title"),
  subtitles: () => document.querySelectorAll(".frame__subtitle"),
  valueGroup: () => document.querySelector(".frame__value-group"),
  dollarSymbol: () => document.querySelector(".frame__dollar-symbol"),
  value: () => document.querySelector(".frame__value"),
  rightColumn: () => document.querySelector(".frame__right-column"),
  circleText: () => document.querySelector(".frame__circle-text")
};

/**
 * Character Span Creation and Setup
 */
const createCharacterSpan = (char) => {
  const span = document.createElement("span");
  span.textContent = char;
  return span;
};

const createCharacterSpans = (text) => {
  return [...text].map(createCharacterSpan);
};

const wrapTextInSpans = (element) => {
  const wordSpans = element.querySelectorAll("span");
  
  // Store original text and properties
  const originalWords = Array.from(wordSpans).map(span => ({
    element: span,
    text: span.textContent,
    isHighlight: span.classList.contains("frame__highlight")
  }));

  // Clear and rebuild with character spans
  wordSpans.forEach(span => span.textContent = "");
  originalWords.forEach(({ element, text }) => {
    const charSpans = createCharacterSpans(text);
    charSpans.forEach(span => element.appendChild(span));
  });
};

/**
 * Element Setup Functions
 */
const setupValueGroup = () => {
  const valueGroup = elements.valueGroup();
  if (!valueGroup) return;

  // Setup dollar symbol
  const dollarSymbol = elements.dollarSymbol();
  if (dollarSymbol) {
    const span = createCharacterSpan(dollarSymbol.textContent);
    dollarSymbol.textContent = "";
    dollarSymbol.appendChild(span);
  }

  // Setup value
  const value = elements.value();
  if (value) {
    const span = createCharacterSpan(value.textContent);
    value.textContent = "";
    value.appendChild(span);
  }
};

const setupSubtitles = () => {
  const subtitles = elements.subtitles();
  subtitles.forEach(wrapTextInSpans);
};

/**
 * Animation Functions
 */
const animateTextIn = (element, duration, delay = 0) => {
  const spans = element.querySelectorAll("span > span, span");
  const totalSpans = spans.length;
  const baseDelay = duration / totalSpans;

  Array.from(spans).forEach((span, index) => {
    setTimeout(() => {
      span.style.opacity = "1";
      span.style.transform = "translateY(0)";
    }, delay + (index * baseDelay));
  });

  return delay + (totalSpans * baseDelay);
};

const animateTextOut = (element) => {
  return new Promise((resolve) => {
    const spans = element.querySelectorAll(
      "span > span, .frame__dollar-symbol > span, .frame__value > span"
    );
    const totalSpans = spans.length;
    const baseDelay = ANIMATION_TIMING.SCENE_CHANGE.ELEMENT_EXIT / totalSpans;

    Array.from(spans)
      .reverse()
      .forEach((span, index) => {
        span.style.transition = `${ANIMATION_TIMING.TRANSITIONS.OPACITY}, ${ANIMATION_TIMING.TRANSITIONS.TRANSFORM}`;

        setTimeout(() => {
          span.style.opacity = "0";
          setTimeout(() => {
            span.style.transform = "translateY(-25px)";
            if (index === totalSpans - 1) {
              setTimeout(resolve, 50);
            }
          }, 25);
        }, index * baseDelay);
      });
  });
};

/**
 * Scene Management
 */
const sceneTransitions = {
  toSceneTwo: () => {
    document.body.classList.remove("scene-one");
    document.body.classList.add("scene-two");
  },
  backToSceneOne: () => {
    document.body.classList.remove("scene-two");
    document.body.classList.add("scene-one");
  }
};

/**
 * Animation Sequences
 */
const animateSceneTwo = async () => {
  const { SCENE_CHANGE } = ANIMATION_TIMING;
  const subtitles = elements.subtitles();
  const valueGroup = elements.valueGroup();
  let currentDelay = 0;

  // Animate first subtitle
  if (subtitles[0]) {
    currentDelay = animateTextIn(subtitles[0], SCENE_CHANGE.SUBTITLE_IN, currentDelay);
  }

  // Animate value group
  if (valueGroup) {
    currentDelay = animateTextIn(valueGroup, SCENE_CHANGE.VALUE_GROUP_IN, currentDelay);
  }

  // Animate second subtitle
  if (subtitles[1]) {
    currentDelay = animateTextIn(subtitles[1], SCENE_CHANGE.SUBTITLE_IN, currentDelay);
  }
};

const animateExitSequence = async () => {
  const subtitles = elements.subtitles();
  const valueGroup = elements.valueGroup();
  const delay = ANIMATION_TIMING.SCENE_CHANGE.ELEMENT_EXIT_DELAY;

  // Animate in reverse order
  if (subtitles[1]) await animateTextOut(subtitles[1]);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (valueGroup) await animateTextOut(valueGroup);
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (subtitles[0]) await animateTextOut(subtitles[0]);
};

/**
 * Event Listeners
 */
const setupAnimationListeners = () => {
  const rightColumn = elements.rightColumn();
  const gradient = document.querySelector('.gradient');
  const circleText = document.querySelector('.frame__circle-text');

  // First animation sequence
  rightColumn.addEventListener("animationend", async () => {
    sceneTransitions.toSceneTwo();
    // Add active class to circle text when scene two starts
    circleText.classList.add('active');
    await animateTextOut(elements.title());
    await animateSceneTwo();
  });

  // Circle text scale and fade
  circleText.addEventListener("animationend", (event) => {
    if (event.animationName === 'stickerSlap') {
      // After the slap animation, add the removing class
      circleText.classList.add('removing');
    }
  });

  // Reset loop on gradient animation end
  gradient.addEventListener("animationend", async () => {
    // First animate out scene two content
    await animateExitSequence();
    
    // Additional delay to ensure all transitions complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Reset to scene one and cleanup circle text classes
    sceneTransitions.backToSceneOne();
    
    // Remove all classes from circle text
    const circleText = elements.circleText();
    if (circleText) {
      circleText.classList.remove('active', 'removing');
    }

    // Delay before starting new animation to ensure clean state
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Animate title back in
    animateTextIn(elements.title(), ANIMATION_TIMING.SCENE_CHANGE.TITLE_IN);
  });
};

/**
 * Initialization
 */
const initializeAnimations = () => {
  const titleElement = elements.title();
  wrapTextInSpans(titleElement);
  setupSubtitles();
  setupValueGroup();
  animateTextIn(titleElement, ANIMATION_TIMING.SCENE_CHANGE.TITLE_IN);
  setupAnimationListeners();
};

// Start the animation
initializeAnimations();