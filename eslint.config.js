// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    type: 'lib',
    typescript: {
      overrides: {
        'ts/explicit-function-return-type': 0,
      },
    },
  },
)
