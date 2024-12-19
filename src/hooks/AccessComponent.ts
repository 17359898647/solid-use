import type { Component, JSX } from 'solid-js'
import { isFunction } from 'lodash-es'

export type MaybeComponent<T extends Record<string, any> = any> = Component<T> | JSX.Element

export function AccessComponent<T extends MaybeComponent>(
  el: T,
  props?: T extends Component<infer P> ? P : never,
): JSX.Element {
  if (isFunction(el)) {
    return el(props ?? {})
  }
  return el as JSX.Element
}
