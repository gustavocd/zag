import {
  defaultPropNormalizer,
  PropNormalizer,
  StateMachine as S,
} from "@ui-machines/core"
import { isValidBlurEvent } from "@ui-machines/utils"
import {
  DOMButtonProps,
  DOMHTMLProps,
  EventKeyMap,
  WithDataAttr,
} from "../type-utils"
import { getElementIds, getElements } from "./menu.dom"
import { MenuMachineContext, MenuMachineState } from "./menu.machine"

export function connectMenuMachine(
  state: S.State<MenuMachineContext, MenuMachineState>,
  send: (event: S.Event<S.AnyEventObject>) => void,
  normalize: PropNormalizer = defaultPropNormalizer,
) {
  const { context: ctx } = state
  const isOpen = state.matches("open")
  const ids = getElementIds(ctx.uid)

  return {
    menuButtonProps: normalize<DOMButtonProps>({
      type: "button",
      id: ids.button,
      "aria-haspopup": true,
      "aria-controls": ids.menu,
      "aria-expanded": isOpen || undefined,
      onClick() {
        send("BUTTON_CLICK")
      },
      onBlur() {
        send("BUTTON_BLUR")
      },
      onFocus() {
        send("BUTTON_FOCUS")
      },
      onKeyDown(event) {
        const keyMap: EventKeyMap = {
          ArrowDown() {
            send("ARROW_DOWN")
          },
          ArrowUp() {
            send("ARROW_UP")
          },
        }

        if (event.key in keyMap) {
          event.preventDefault()
          const exec = keyMap[event.key]
          exec(event)
        }
      },
    }),

    menuListProps: normalize<DOMHTMLProps>({
      id: ids.menu,
      hidden: !isOpen,
      role: "menu",
      tabIndex: 0,
      "aria-activedescendant": ctx.activeDescendantId ?? "",
      onBlur(event) {
        const { button } = getElements(ctx)

        const isValidBlur = isValidBlurEvent(event, {
          exclude: button,
          pointerdownNode: ctx.pointerdownNode,
        })

        if (isValidBlur) {
          send("BLUR")
        }
      },
      onKeyDown(event) {
        const keyMap: EventKeyMap = {
          ArrowDown() {
            send("ARROW_DOWN")
          },
          ArrowUp() {
            send("ARROW_UP")
          },
          Escape() {
            send("ESCAPE")
          },
          Enter() {
            send("ENTER")
          },
          Home() {
            send("HOME")
          },
          End() {
            send("END")
          },
        }

        const exec = keyMap[event.key]

        if (exec) {
          event.preventDefault()
          exec(event)
        } else if (event.key.length === 1) {
          event.preventDefault()
          send({ type: "TYPEAHEAD", key: event.key })
        }
      },
    }),

    getMenuItemProps({ id }: { id?: string }) {
      return normalize<WithDataAttr<DOMHTMLProps>>({
        id,
        role: "menuitem",
        "data-ownedby": ids.menu,
        "data-selected": ctx.activeDescendantId === id,
        onClick() {
          send("ITEM_CLICK")
        },
        onPointerLeave() {
          send("ITEM_POINTERLEAVE")
        },
        onPointerEnter(event) {
          send({
            type: "ITEM_POINTEROVER",
            id: event.target instanceof HTMLElement ? event.target.id : null,
          })
        },
      })
    },
  }
}