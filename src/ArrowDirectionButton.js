import { merge } from './updates.js';
import HoverMixin from './HoverMixin.js';
import SeamlessButton from './SeamlessButton.js';


const Base = 
  HoverMixin(
    SeamlessButton
  );


/**
 * A button used by [ArrowDirectionMixin](ArrowDirectionMixin) for its
 * left/right arrow buttons.
 * 
 * @inherits SeamlessButton
 * @mixes HoverMixin
 */
class ArrowDirectionButton extends Base {

  get updates() {
    const style = Object.assign(
      {
        background: '',
        color: 'rgba(255, 255, 255, 0.7)',
        fill: 'currentColor',
        outline: 'none'
      },
      this.state.hover && !this.state.innerAttributes.disabled && {
        background: 'rgba(255, 255, 255, 0.2)',
        color: 'rgba(255, 255, 255, 0.8)',
        cursor: 'pointer'
      },
      this.state.innerAttributes.disabled && {
        color: 'rgba(255, 255, 255, 0.3)'
      }
    );
    return merge(super.updates, {
      style,
      $: {
        inner: {
          style: {
            color: 'inherit'
          }
        }
      }
    });
  }

}


customElements.define('elix-arrow-direction-button', ArrowDirectionButton);
export default ArrowDirectionButton;
