import { createSignal } from 'solid-js'

import { until } from './index'

function invoke<T>(fn: () => T): T {
  return fn()
}
describe('until', () => {
  it('should toBe', () => {
    return new Promise<void>((resolve, reject) => {
      const [r1, setR1] = createSignal(0)
      const [r2, setR2] = createSignal(0)
      setTimeout(() => {
        setR1(1)
        setR2(1)
      }, 100)

      setTimeout(() => {
        setR1(2)
        setR2(2)
      }, 200)

      invoke(async () => {
        expect(r1()).toBe(0)
        expect(r2()).toBe(0)
        let x = await until(r1).toBe(1)
        expect(x).toBe(1)
        x = await until(r2).toBe(2)
        expect(x).toBe(2)
        resolve()
      }).catch(reject)
    })
  })
}, {
  timeout: 200,
})
