# two-pages probe (new code)

## 1-main-only

- report: `{"patched":true,"problems":[]}`
- stillPin flagged: **false**
- image: 1-main-only.png

## 2-main-plus-popup

- report: `{"patched":true,"problems":[]}`
- stillPin flagged: **false**
- image: 2-main-plus-popup.png

## 3-main-lost-subscription-popup-still-clean

- report: `{"patched":false,"problems":["no live sessions:getSession subscription: every one was removed or its socket closed (signed out, reloaded without re-subscribing, or the provider unmounted)"]}`
- stillPin flagged: **true**
- image: 3-main-lost-subscription-popup-still-clean.png

Blocked writes: 6