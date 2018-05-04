import * as symbols from './symbols.js';
import { merge } from './updates.js';
import { updates } from './elix.js';


const inject = Symbol('inject');


/**
 * Template mixin which adds buttons for managing playback of a slideshow, audio
 * playlist, etc.
 */
export default function PlayControlsMixin(Base) {

  // The class prototype added by the mixin.
  class PlayControls extends Base {

    componentDidMount() {
      if (super.componentDidMount) { super.componentDidMount(); }
      this.$.previousButton.addEventListener('click', event => {
        this.selectPrevious();
      });
      this.$.playButton.addEventListener('click', event => {
        if (!this.playing) {
          this.play();
        } else {
          this.pause();
        }
      });
      this.$.nextButton.addEventListener('click', event => {
        this.selectNext();
      });
      assumeButtonFocus(this, this.$.previousButton);
      assumeButtonFocus(this, this.$.playButton);
      assumeButtonFocus(this, this.$.nextButton);
    }

    [inject](template) {
      return `
        <style>
          #buttons {
            bottom: 0;
            box-sizing: border-box;
            padding: 0.5em;
            position: absolute;
            text-align: center;
            width: 100%;
            z-index: 1;
          }

          button {
            background: transparent;
            border: none;
            fill: rgba(255, 255, 255, 0.5);
            padding: 0;
            transition: fill 0.5s;
            vertical-align: middle;
          }
          :host(:hover) button {
            fill: rgba(255, 255, 255, 0.7);
          }
          button:hover {
            fill: rgba(255, 255, 255, 0.85);
          }
          button:active {
            fill: white;
          }

          .icon {
            height: 30px;
            width: 30px;
          }
          #playButton .icon {
            height: 40px;
            width: 40px;
          }

          #container {
            display: flex;
            flex: 1;
          }
          display: flex; flex: 1; overflow: hidden; position: relative;
          #container ::slotted(*) {
            flex: 1;
          }
        </style>

        <div id="buttons">
          <button id="previousButton" aria-hidden="true">
            <svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
              <g id="skip-previous">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
              </g>
            </svg>
          </button>
          <button id="playButton" aria-hidden="true">
            <svg id="playingIcon" class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
              <g id="pause-circle-outline">
                <path d="M9 16h2V8H9v8zm3-14C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-4h2V8h-2v8z"></path>
              </g>
            </svg>
            <svg id="pausedIcon" class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
              <g id="play-circle-outline">
                <path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path>
              </g>
            </svg>
          </button>
          <button id="nextButton" aria-hidden="true">
            <svg class="icon" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet">
              <g id="skip-next">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
              </g>
            </svg>
          </button>
        </div>

        <div id="container" role="none">
          ${template}
        </div>
      `;
    }

    [symbols.keydown](event) {
      let handled;

      switch (event.keyCode) {
        case 32: /* Space */
          this.playing = !this.playing;
          handled = true;
          break;
      }

      // Prefer mixin result if it's defined, otherwise use base result.
      return handled || (super[symbols.keydown] && super[symbols.keydown](event));
    }

    get updates() {
      const playing = this.playing;
      return merge(super.updates, {
        $: {
          pausedIcon: {
            style: {
              display: playing ? 'none' : ''
            }
          },
          playingIcon: {
            style: {
              display: playing ? '' : 'none'
            }
          }
        }
      })
    }

  }

  return PlayControls;
};


PlayControlsMixin.inject = inject;


/*
 * By default, a button will always take focus on mousedown. For this component,
 * we want to override that behavior, such that a mousedown on a button keeps
 * the focus on the outer component.
 */
function assumeButtonFocus(element, button) {
  button.addEventListener('mousedown', event => {
    // Given the main element the focus if it doesn't already have it.
    element.focus();
    // Prevent the default focus-on-mousedown behavior.
    event.preventDefault();
  });
}