import { merge } from './updates.js';
import * as symbols from './symbols';
import MenuButton from './MenuButton.js';
import SelectedItemTextValueMixin from './SelectedItemTextValueMixin.js';
import SingleSelectionMixin from './SingleSelectionMixin.js';
import SlotItemsMixin from './SlotItemsMixin.js';


const valueTagKey = Symbol('valueTag');


const Base =
  SelectedItemTextValueMixin(
  SingleSelectionMixin(
  SlotItemsMixin(
    MenuButton
  )));


/**
 * Shows a single choice made from a pop-up list of choices.
 * 
 * @inherits MenuButton
 * @mixes SelectedItemTextValueMixin
 * @mixes SingleSelectionMixin
 * @mixes SlotItemsMixin
 */
class DropdownList extends Base {

  // By default, opening the menu re-selects the component item that's currently
  // selected.
  get defaultMenuSelectedIndex() {
    return this.state.selectedIndex;
  }

  get defaults() {
    const base = super.defaults || {};
    return Object.assign({}, base, {
      tags: Object.assign({}, base.tags, {
        value: 'div'
      })
    });
  }

  get defaultState() {
    return Object.assign({}, super.defaultState, {
      itemRole: 'menuitemradio',
      selectionRequired: true
    });
  }

  refineState(state) {
    let result = super.refineState ? super.refineState(state) : true;
    const { closeResult, opened, selectedIndex } = state;
    if (!opened && this.opened && closeResult !== undefined &&
        selectedIndex !== closeResult) {
      // Closing: Update our selection from menu selection.
      state.selectedIndex = closeResult;
      result = false;
    }
    return result;
  }

  get sourceSlotContent() {
    const valueTag = this.valueTag || this.defaults.tags.value;
    return `
      <${valueTag} id="value"></${valueTag}>
      <div>
        <svg id="downIcon" xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5">
          <path d="M 0 0 l5 5 5 -5 z"/>
        </svg>
        <svg id="upIcon" xmlns="http://www.w3.org/2000/svg" width="10" height="5" viewBox="0 0 10 5">
          <path d="M 0 5 l5 -5 5 5 z"/>
        </svg>
      </div>
    `;
  }

  get updates() {
    const popupPosition = this.state.popupPosition;
    const itemRole = 'itemRole' in this.$.menu ? this.state.itemRole : null;
    const clone = this.selectedItem ?
      this.selectedItem.cloneNode(true) :
      null;
    const childNodes = clone ? clone.childNodes : [];
    return merge(super.updates, {
      $: {
        downIcon: {
          style: {
            display: popupPosition === 'below' ? 'block' : 'none',
            fill: 'currentColor',
            'margin-left': '0.25em',
          }
        },
        menu: Object.assign(
          {
            style: {
              padding: 0
            },
          },
          itemRole ? { itemRole } : null
        ),
        upIcon: {
          style: {
            display: popupPosition === 'above' ? 'block' : 'none',
            fill: 'currentColor',
            'margin-left': '0.25em',
          }
        },
        value: {
          childNodes
        }
      }
    });
  }

  /**
   * The tag used to define the element that will contain the DropdownList's
   * current value.
   * 
   * @type {string}
   * @default 'div'
   */
  get valueTag() {
    return this[valueTagKey];
  }
  set valueTag(valueTag) {
    this[symbols.hasDynamicTemplate] = true;
    this[valueTagKey] = valueTag;
  }

}


export default DropdownList;
customElements.define('elix-dropdown-list', DropdownList);
