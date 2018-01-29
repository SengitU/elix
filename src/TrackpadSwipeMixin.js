import * as symbols from './symbols.js';
import Symbol from './Symbol.js';


const absorbDecelerationSymbol = Symbol('absorbDeceleration');
const lastDeltaXSymbol = Symbol('lastDeltaX');
const lastWheelTimeoutSymbol = Symbol('lastWheelTimeout');
const postNavigateDelayCompleteSymbol = Symbol('postNavigateDelayComplete');
const wheelDistanceSymbol = Symbol('wheelDistance');


/**
 * Mixin which maps trackpad events to swipe gestures.
 * 
 * @module TrackpadSwipeMixin
 */
export default function TrackpadSwipeMixin(Base) {

  // The class prototype added by the mixin.
  return class TrackpadSwipe extends Base {

    constructor() {
      // @ts-ignore
      super();
      this.addEventListener('wheel', event => {
        const handled = handleWheel(this, event);
        if (handled) {
          event.preventDefault();
        }
      });
      resetWheelTracking(this);
    }

    get defaultState() {
      return Object.assign({}, super.defaultState, {
        swipeFraction: null
      });
    }

    /**
     * See [symbols.swipeTarget](symbols#swipeTarget).
     * 
     * @property symbols.swipeTarget
     * @memberof TrackpadSwipeMixin
     * @type {HTMLElement}
     */
    get [symbols.swipeTarget]() {
      return super[symbols.swipeTarget] || this;
    }
  }
}


// Time we wait following a navigation before paying attention to wheel
// events again.
const POST_NAVIGATE_TIME = 250;

// Time we wait after the last wheel event before we reset things.
const WHEEL_TIME = 100;


/*
* A wheel event has been generated. This could be a real wheel event, or it
* could be fake (see notes in the header).
*
* This handler uses several strategies to try to approximate native trackpad
* swipe navigation.
*
* If the user has dragged enough to cause a navigation, then for a short
* delay following that navigation, subsequent wheel events will be ignored.
*
* Furthermore, follwowing a navigation, we ignore all wheel events until we
* receive at least one event where the event's deltaX (distance traveled) is
* *greater* than the previous event's deltaX. This helps us filter out the
* fake wheel events generated by the browser to simulate deceleration.
*
*/
function handleWheel(component, event) {

  // Since we have a new wheel event, reset our timer waiting for the last
  // wheel event to pass.
  if (component[lastWheelTimeoutSymbol]) {
    clearTimeout(component[lastWheelTimeoutSymbol]);
  }
  component[lastWheelTimeoutSymbol] = setTimeout(() => {
    wheelTimedOut(component);
  }, WHEEL_TIME);

  const deltaX = event.deltaX;
  const deltaY = event.deltaY;

  // See if component event represents acceleration or deceleration.
  const acceleration = sign(deltaX) * (deltaX - component[lastDeltaXSymbol]);
  component[lastDeltaXSymbol] = deltaX;

  if (Math.abs(deltaX) < Math.abs(deltaY)) {
    // Move was mostly vertical. The user may be trying scroll with the
    // trackpad/wheel. To be on the safe, we ignore such events.
    return false;
  }

  if (component[postNavigateDelayCompleteSymbol]) {
    // It's too soon after a navigation; ignore the event.
    return true;
  }

  if (acceleration > 0) {
    // The events are not (or are no longer) decelerating, so we can start
    // paying attention to them again.
    component[absorbDecelerationSymbol] = false;
  } else if (component[absorbDecelerationSymbol]) {
    // The wheel event was likely faked to simulate deceleration; ignore it.
    return true;
  }

  component[wheelDistanceSymbol] -= deltaX;

  // Update the travel fraction of the component being navigated.
  const width = component[symbols.swipeTarget].offsetWidth;
  let swipeFraction = width > 0 ?
    component[wheelDistanceSymbol] / width :
    0;
  swipeFraction = sign(swipeFraction) * Math.min(Math.abs(swipeFraction), 1);

  // If the user has dragged enough to reach the previous/next item, then
  // complete a navigation to that item.
  let gesture;
  if (swipeFraction === -1) {
    gesture = symbols.swipeLeft;
  } else if (swipeFraction === 1) {
    gesture = symbols.swipeRight;
  }
  if (gesture) {
    if (component[gesture]) {
      component[gesture]();
    }
    postNavigate(component);
  } else {
    component.setState({ swipeFraction });
  }

  return true;
}

// Following a navigation, partially reset our wheel tracking.
function postNavigate(component) {
  component[wheelDistanceSymbol] = 0;
  component[postNavigateDelayCompleteSymbol] = true;
  component[absorbDecelerationSymbol] = true;
  setTimeout(() => {
    component[postNavigateDelayCompleteSymbol] = false;
  }, POST_NAVIGATE_TIME);
  component.setState({ swipeFraction: null });
}

// Reset all state related to the tracking of the wheel.
function resetWheelTracking(component) {
  component[wheelDistanceSymbol] = 0;
  component[lastDeltaXSymbol] = 0;
  component[absorbDecelerationSymbol] = false;
  component[postNavigateDelayCompleteSymbol] = false;
  if (component[lastWheelTimeoutSymbol]) {
    clearTimeout(component[lastWheelTimeoutSymbol]);
    component[lastWheelTimeoutSymbol] = null;
  }
}

// Define our own sign function, since IE doesn't supply Math.sign().
function sign(x) {
  return (x === 0) ?
    0 :
    (x > 0) ?
      1 :
      -1;
}

// A sufficiently long period of time has passed since the last wheel event.
// We snap the selection to the closest item, then reset our state.
function wheelTimedOut(component) {

  // Snap to the closest item.
  const swipeFraction = component.state.swipeFraction;
  let gesture;
  if (swipeFraction <= -0.5) {
    gesture = symbols.swipeLeft;
  } else if (swipeFraction >= 0.5) {
    gesture = symbols.swipeRight;
  }

  // TODO: Listen for the transition to complete, and then restore
  // dragging to false (or the previous value).
  resetWheelTracking(component);
  component.setState({ swipeFraction: null });

  if (gesture && component[gesture]) {
    component[gesture]();
  }
}
