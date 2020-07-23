// ==UserScript==
// @name        ytSpeedControl
// @namespace   https://github.com/rmv125
// @include     https://www.youtube.com/watch?*
// @version     2.3
// @grant       none
// ==/UserScript==

const CHANGE_STEP = 0.05;
const MIN_VALUE = 1;
const MAX_VALUE = 3;
const LS_KEY = 'userscriptYtSpeedControl';

const SPEED_UP_KEY = 'KeyD';
const SLOW_DOWN_KEY = 'KeyA';
const RESET_KEY = 'KeyS';
const ARROW_LEFT = 'ArrowLeft';
const ARROW_RIGHT = 'ArrowRight';
const CHAPTERS_DATA_PATH = ytInitialData.contents.twoColumnWatchNextResults.results.results.contents[1].videoSecondaryInfoRenderer.description.runs.filter(i => i.navigationEndpoint && i.navigationEndpoint.watchEndpoint && Number.isInteger(i.navigationEndpoint.watchEndpoint.startTimeSeconds));

class SpeedController {
  constructor(video) {
    this.speed = this._getSpeed();
    this.previousSpeed = null;
    this.video = video;
    this._setSpeed(this.speed);
  }

  speedUp() {
    if (this.speed + CHANGE_STEP < MAX_VALUE) {
      this.previousSpeed = null;
      this._setSpeed(this.speed + CHANGE_STEP);
    }
  }

  slowDown() {
    if (this.speed > MIN_VALUE) {
      this.previousSpeed = null;
      this._setSpeed(this.speed - CHANGE_STEP);
    }
  }

  resetSpeed() {
    const previousSpeed = this.previousSpeed;
    this.previousSpeed = previousSpeed ? null : this.speed;
    this._setSpeed(previousSpeed || 1);
  }

  _getSpeed() {
    const val = localStorage.getItem(LS_KEY);
    return val ? +val : 1;
  }

  _setSpeed(speed) {
    this.speed = speed;
    this.video.playbackRate = speed;
    localStorage.setItem(LS_KEY, speed);
  }

  setTime(time) {
    this.video.currentTime = time;
  }
}

// simple case
function init() {
  const speedController = new SpeedController(document.querySelector('video'));
  const { button, indicator, icon } = injectButton();

  const updateContent = value => {
    icon.innerHTML = iconContent(value);
    indicator.innerHTML = value.toFixed(2);
  };

  let threshold = 0;

  button.addEventListener('wheel', e => {
    e.preventDefault();
    e.stopPropagation();

    threshold += Math.abs(e.wheelDeltaY);

    if (threshold > 100) {
      threshold = 0;
      if (e.deltaY < 0) {
        speedController.speedUp();
      } else {
        speedController.slowDown();
      }
      updateContent(speedController.speed);
    }
  });

  button.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    speedController.resetSpeed();
    updateContent(speedController.speed);
  });

  document.addEventListener('keydown', function(event) {
    if (event.target.contentEditable !== 'true') {
      switch (event.code) {
        case SPEED_UP_KEY: {
          speedController.speedUp();
          return updateContent(speedController.speed);
        }
        case SLOW_DOWN_KEY: {
          speedController.slowDown();
          return updateContent(speedController.speed);
        }
        case RESET_KEY: {
          speedController.resetSpeed();
          return updateContent(speedController.speed);
        }
        case ARROW_LEFT:
        case ARROW_RIGHT: {
          return handleChapterChange(event, speedController);
        }
      }
    }
  });

  updateContent(speedController.speed);
}

const getPreviousChapterTime = (currentTime) => {
  if (currentTime < 5) return 0;

  const chapters = CHAPTERS_DATA_PATH;
  const index = chapters.findIndex(c => c.navigationEndpoint.watchEndpoint.startTimeSeconds > currentTime) - 1;

  if (index === 0) return chapters[index];

  if (currentTime - chapters[index].navigationEndpoint.watchEndpoint.startTimeSeconds < 5) {
    return chapters[index - 1].navigationEndpoint.watchEndpoint.startTimeSeconds;
  }

  return chapters[index].navigationEndpoint.watchEndpoint.startTimeSeconds;
};

const getNextChapterTime = (currentTime) => {
  const chapters = CHAPTERS_DATA_PATH;

  const index = chapters.findIndex(c => c.navigationEndpoint.watchEndpoint.startTimeSeconds > currentTime);

  return chapters[index].navigationEndpoint.watchEndpoint.startTimeSeconds;
};

const handleChapterChange = (event, speedController) => {
  if (!event.altKey || !CHAPTERS_DATA_PATH.length) return;

  const currentTime = speedController.video.getCurrentTime();
  let nextTime = null;

  if (event.code === ARROW_LEFT) {
    nextTime = getPreviousChapterTime(currentTime);
  } else {
    nextTime = getNextChapterTime(currentTime);
  }

  speedController.setTime(nextTime);
};

const iconContent = value => {
  const rotate = ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * 188; // 188 - max rotate
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 296 141.97">
  <path fill="#fff" d="M276.74 124.08v-1.53l-.06-1.53V119.86l-.05-.64-.2-2.56-.05-.65-.07-.84-.16-1.67-.16-1.67-.09-.83c0-.25-.07-.51-.1-.76-.28-2-.53-4-.88-5.91l-.5-2.81-.56-2.68c-.34-1.73-.77-3.36-1.14-4.86l-.27-1.1-.29-1-.55-1.93c-.18-.61-.32-1.17-.48-1.69l-.46-1.42-.51-1.58a1.2 1.2 0 0 0-1.48-.79l-39.43 11.19a1.22 1.22 0 0 0-.86 1.39c0 .22.09.49.15.78l.18 1c.07.38.12.75.18 1.16l.2 1.32c0 .23.08.47.11.71l.08.75c.11 1 .28 2.13.35 3.3l.15 1.81c.05.62.06 1.25.09 1.89.09 1.27.07 2.6.09 3.94V117.51c0 .86-.07 1.71-.11 2.57v.76l-.09 1-.09 1-.12 1c-.08.65-.13 1.29-.24 1.92s-.18 1.24-.26 1.84-.21 1.19-.31 1.76-.21 1.12-.32 1.65l-.31 1.54c-.11.54-.22 1-.33 1.4a31.55 31.55 0 0 1-.29 1.17l-.08.29h48.12a1.2 1.2 0 0 0 1.21-1.15l.12-2.76c0-.93 0-1.9.06-2.87s0-2 0-3a4.7 4.7 0 0 1-.19-1.55zM264.23 73.57a1.21 1.21 0 0 0 .64-1.64c-.13-.28-.29-.6-.46-1l-.55-1.16-.83-1.69-1-1.92-.51-1-.53-1-1.15-2.09-1.29-2.21-.67-1.15-.72-1.15-1.5-2.38c-1.07-1.58-2.14-3.23-3.33-4.84l-.88-1.22-.44-.61-.47-.6-1.85-2.41c-.63-.79-1.29-1.57-1.93-2.35-.32-.38-.63-.77-1-1.15l-1-1.13-1-1.12c-.32-.37-.65-.73-1-1.09l-2-2.1c-.65-.69-1.32-1.34-2-2s-1.27-1.28-1.91-1.86l-1.84-1.73c-.59-.56-1.2-1.06-1.76-1.57l-1.63-1.42-1.51-1.24-1.33-1.09c-.41-.34-.8-.63-1.15-.9l-1.27-1a1.2 1.2 0 0 0-1.66.19l-20.94 25.72a1.21 1.21 0 0 0 .08 1.63l.61.6.73.73.84.88 1 1 1 1.14c.35.41.73.81 1.1 1.25l1.13 1.37c.4.46.78 1 1.17 1.46s.81 1 1.2 1.55l1.18 1.63c.21.27.4.55.59.84l.59.86.59.86.56.89 1.13 1.78 1.07 1.81.27.45.25.46.5.92c.68 1.2 1.26 2.43 1.86 3.59l.82 1.75.39.85.36.84.69 1.6c.21.53.4 1 .59 1.52l.28.71c.09.23.2.48.25.67l.39 1.12.35 1 .38 1.15.34 1a1.21 1.21 0 0 0 1.6.74zM133.32 27.78l1-.14 1-.1 1.87-.19 1.75-.12h.82c.27 0 .53-.05.76-.05h4.83a1.21 1.21 0 0 0 1.2-1.29l-1.57-23.9a1.19 1.19 0 0 0-1.35-1.12l-1.07.13-1.25.16-1.74.26-2 .3c-.36 0-.69.12-1 .18l-1.05.2-2.22.43-2.36.54-1.23.28c-.42.1-.83.22-1.25.33l-2.58.68-2.63.8c-.45.13-.9.26-1.34.41l-1.34.46-1.35.46q-.68.23-1.35.48l-2.68 1c-.89.35-1.77.73-2.65 1.1l-1.31.56-1.29.59-1.27.59c-.43.2-.85.39-1.26.6l-2.43 1.23c-.8.4-1.56.84-2.31 1.25s-1.49.81-2.19 1.23l-2 1.21c-.67.39-1.28.81-1.88 1.18l-1.72 1.1c-.53.37-1 .72-1.51 1l-1.33.92c-.41.28-.77.56-1.1.8l-1.15.85a1.19 1.19 0 0 0-.28 1.65l9.92 14.59a1.21 1.21 0 0 0 1.59.38l.89-.5c.3-.17.62-.36 1-.55l1.17-.61 1.33-.69 1.5-.72c.52-.25 1.05-.52 1.62-.77l1.76-.77c.6-.28 1.24-.52 1.88-.78s1.29-.53 2-.77l2-.74c.34-.13.69-.24 1.05-.35l1.06-.34 1.08-.35 1.09-.31c.73-.2 1.45-.43 2.19-.62l2.2-.54c.36-.1.73-.17 1.1-.25l1.1-.23 1-.25 1.08-.19 2.12-.37zM65.64 46.66l-.78 1.11-.79 1.12-.76 1.14-1.51 2.31c-.51.78-1 1.57-1.45 2.35l-.35.58-.34.6-.68 1.18c-.91 1.55-1.71 3.15-2.52 4.66l-1.11 2.27-.53 1.1-.49 1.08-.94 2.09-.81 2c-.26.63-.52 1.23-.74 1.81l-.62 1.66-.54 1.45-.42 1.25-.43 1.24a1.2 1.2 0 0 0 .71 1.51l9.24 3.49a1.19 1.19 0 0 0 1.52-.6l.48-1 .51-1.05.64-1.23.72-1.39.84-1.52.92-1.64c.32-.57.69-1.13 1-1.73l.63-.84.58-.91 1.2-1.86c.87-1.23 1.72-2.52 2.68-3.77l.71-.95.35-.48.37-.47 1.49-1.87c.5-.61 1-1.21 1.54-1.82.26-.3.5-.6.77-.9l.79-.87.78-.86c.26-.29.52-.58.79-.85l1.57-1.63c.51-.53 1.05-1 1.56-1.52s1-1 1.51-1.44l1.46-1.33c.47-.43 1-.81 1.39-1.2l1.29-1.09 1.14-.91 1-.79.5-.38.47-.35.86-.65a1.21 1.21 0 0 0 .19-1.75L81.46 30.66a1.2 1.2 0 0 0-1.75-.09l-.78.75-.43.41-.48.47-1.17 1.18-1.32 1.34-1.36 1.48c-.47.51-1 1-1.46 1.61l-1.52 1.76c-.53.6-1 1.24-1.57 1.89s-1.07 1.31-1.59 2l-1.6 2.11c-.27.34-.53.7-.79 1.09zM46.53 89.85l-.22 1.05-.24 1.22-.28 1.54-.3 1.76-.16.95-.13 1c-.16 1.29-.4 2.75-.53 4.29l-.23 2.35c-.08.8-.11 1.65-.17 2.46-.13 1.67-.16 3.4-.23 5.19v5.32c0 .89.07 1.77.11 2.65v1.35l.09 1.27.09 1.25.13 1.3.13 1.29.06.63c0 .21.05.42.08.62a144.5 144.5 0 0 0 .66 4.73l.37 2.17v.17a1.19 1.19 0 0 0 1.18 1h3.42a1.21 1.21 0 0 0 1.21-1.27v-.57c0-.67-.09-1.37-.11-2.09s0-1.45-.07-2.2 0-1.52 0-2.31v-.59-.58-2.37l.06-1.26.06-1.27v-1.2l.2-2.48v-.62l.07-.62c0-.41.1-.82.14-1.23l.14-1.23.07-.61.09-.6c.25-1.61.46-3.19.77-4.71l.42-2.23c.14-.72.32-1.44.48-2.13.28-1.38.65-2.66.95-3.85l.23-.88c.07-.29.16-.54.24-.8l.44-1.49c.14-.49.26-.89.4-1.31l.39-1.18.34-1a1.2 1.2 0 0 0-.83-1.54l-8.01-2.27a1.2 1.2 0 0 0-1.51.93zM164.04.24c-1.38-.12-1.34 0-1.95-.08l-1.71-.11h-1.52l-1.6-.06a1.21 1.21 0 0 0-1.24 1.13l-1.26 25.36a1.2 1.2 0 0 0 1 1.27l.84.14c.31 0 .65.09 1 .16l1.19.23 1.36.26 1.49.34c.52.12 1.06.22 1.62.37l1.72.45c.59.14 2.57.63 3.19.81s1.24.35 1.87.56l1.92.63 1 .34 1 .36 1 .36c.33.11.65.26 1 .38l2 .8 1.93.85.48.21.47.23.94.45c1.25.57 2.44 1.24 3.61 1.83l1.68.94.82.46.78.48 1.49.9 1.37.88.64.42c.21.14.44.27.59.39l1 .69.86.6 1 .71.88.63a1.2 1.2 0 0 0 1.72-.33l17.36-26.51a1.21 1.21 0 0 0-.43-1.7l-.95-.53-1.11-.61-1.67-.89-1.89-1-1-.49-1-.49-2.15-1-2.33-1.05-1.21-.54-1.27-.51-2.6-1.06c-1.79-.66-3.62-1.38-5.53-2l-1.42-.48-.72-.24-.73-.22-2.91-.87c-1-.28-.44-.12-1.42-.38l-1.46-.38-1.46-.34-1.45-.33-1.44-.31-2.83-.56c-.93-.18-1.85-.31-2.75-.46s-1.77-.25-2.63-.35z"/>
  <path fill="#fff"  transform="rotate(${rotate}, 147.86, 114.79)"  d="M148.62 137.98h-1.25l-136.66-7.41a6.93 6.93 0 0 1-6.14-4.25 7.33 7.33 0 0 1 .29-6.29 7.05 7.05 0 0 1 5-3.54l134.79-23.7a23.88 23.88 0 0 1 4-.35h1.17a22.79 22.79 0 0 1-1.22 45.55zm-.73-28.45a5.08 5.08 0 0 0-2 .42 5.21 5.21 0 0 0 2 10 5.09 5.09 0 0 0 2-.42 5.21 5.21 0 0 0-2-10z"/>
  <path fill="#000"  transform="rotate(${rotate}, 147.86, 114.79)"  d="M148.67 96.4h1a18.79 18.79 0 0 1-1 37.55h-1l-85.31-4.63-30.69-1.66-20.74-1.12a2.94 2.94 0 0 1-2.67-1.82 3.08 3.08 0 0 1 2.3-4.33l19.67-3.46 31.75-5.58 83.37-14.69a21 21 0 0 1 3.32-.28m-.77 27.56a9.23 9.23 0 0 0 8.48-12.81 9.22 9.22 0 0 0-8.49-5.62 9.23 9.23 0 0 0-8.47 12.81 9.21 9.21 0 0 0 8.48 5.62m.77-35.56a28.2 28.2 0 0 0-4.66.4l-83.42 14.69-31.75 5.59-19.66 3.46a11 11 0 0 0-7.83 5.56 11.32 11.32 0 0 0-.46 9.76 11 11 0 0 0 9.61 6.69l20.74 1.13 30.6 1.66 85.31 4.63h1.47a26.79 26.79 0 0 0 1.42-53.51h-1.38zm-.77 27.56a1.21 1.21 0 0 1-1.11-.74 1.15 1.15 0 0 1 0-.93 1.17 1.17 0 0 1 .65-.66 1.27 1.27 0 0 1 .46-.1 1.21 1.21 0 0 1 .48 2.33 1.32 1.32 0 0 1-.47.1z"/>
</svg>`;
};

function injectButton() {
  const button = document.createElement('button');
  const indicator = document.createElement('div');
  const icon = document.createElement('div');
  button.className = 'ytp-button speed-button';
  indicator.className = 'speed-indicator';
  button.appendChild(icon);
  button.appendChild(indicator);
  document
    .querySelector('.ytp-left-controls')
    .insertBefore(button, document.querySelector('.ytp-next-button'));
  return { button, indicator, icon };
}

init();

////////////////////////////////// styles /////////////////////////////////////////////

const styles = `
  .speed-button {
    vertical-align: top;
    position: relative;
    height: 36px;
    width: 36px;
    padding-top: 3px;
  }
  .speed-indicator {
    position: absolute;
    bottom: 1px;
    line-height: 1;
    width: 100%;
    text-align: center;
    font-size: 9px;
  }
  .ytp-big-mode .speed-indicator {
    bottom: 3px;
    font-size: 12px;
  }
`;
const style_node = document.createElement('style');
style_node.appendChild(document.createTextNode(styles));
document.head.appendChild(style_node);
