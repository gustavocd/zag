///<reference path="../../type.d.ts"/>
import { computed, h, Fragment, ref, VNode, defineComponent } from "vue"

type Prop =
  | { type: "boolean"; label: string; defaultValue: boolean }
  | { type: "string"; label: string; defaultValue: string; placeholder?: string }
  | { type: "select"; options: readonly string[]; defaultValue: string; label: string }
  | { type: "multiselect"; options: readonly string[]; defaultValue: string[]; label: string }
  | { type: "number"; label: string; defaultValue: number; min?: number; max?: number }

type ControlRecord = Record<string, Prop>

type Value<T extends ControlRecord> = {
  [K in keyof T]: T[K] extends { type: "boolean" }
    ? boolean
    : T[K] extends { type: "string" }
    ? string
    : T[K] extends { type: "select" }
    ? T[K]["options"][number]
    : T[K] extends { type: "multiselect" }
    ? T[K]["options"][number][]
    : T[K] extends { type: "number" }
    ? number
    : never
}

function getDefaultValues<T extends ControlRecord>(obj: T) {
  return Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      [key]: obj[key].defaultValue,
    }),
    {} as Value<T>,
  )
}

export function useControls<T extends ControlRecord>(config: T) {
  const state = ref(getDefaultValues(config))

  return {
    context: state,
    ui: defineComponent((props = state.value) => {
      return () => (
        <div
          style={{
            display: "inline-flex",
            gap: "24px",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid lightgray",
            background: "lightgray",
            margin: "24px",
          }}
        >
          {Object.keys(config).map((key) => {
            const { type, label, options, placeholder, min, max } = (config[key] ?? {}) as any
            switch (type) {
              case "boolean":
                return (
                  <div key={key}>
                    <input
                      data-testid={key}
                      id={label}
                      type="checkbox"
                      checked={props[key] as boolean}
                      onInput={(e) => {
                        state.value[key] = e.currentTarget.checked
                      }}
                    />
                    <label for={label}>{label}</label>
                  </div>
                )
              case "string":
                return (
                  <div key={key}>
                    <label style={{ marginRight: "10px" }}>{label}</label>
                    <input
                      data-testid={key}
                      type="text"
                      placeholder={placeholder}
                      value={props[key] as string}
                      //@ts-expect-error
                      onKeydown={(e) => {
                        if (e.key === "Enter") {
                          state.value[key] = (e.target as HTMLInputElement).value
                        }
                      }}
                    />
                  </div>
                )
              case "select":
                return (
                  <div key={key}>
                    <label for={label} style={{ marginRight: "10px" }}>
                      {label}
                    </label>
                    <select
                      data-testid={key}
                      id={label}
                      value={props[key] as string}
                      onChange={(e) => {
                        state.value[key] = (e.target as HTMLSelectElement).value
                      }}
                    >
                      <option>-----</option>
                      {options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              case "number":
                return (
                  <div key={key}>
                    <label for={label} style={{ marginRight: "10px" }}>
                      {label}
                    </label>
                    <input
                      data-testid={key}
                      id={label}
                      type="number"
                      min={min}
                      max={max}
                      value={props[key] as number}
                      onKeydown={(e) => {
                        if (e.key === "Enter") {
                          state.value[key] = (e.target as HTMLInputElement).valueAsNumber
                        }
                      }}
                    />
                  </div>
                )
            }
          })}
        </div>
      )
    }),
  }
}
