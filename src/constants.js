export const CANVAS_STYLE = 'max-height: 75vh; max-width: 100%;';

export const MODES = [
  {
    name: 'Normal',
    value: 'normal',
    description: 'Uses only the values from the source pixel.'
  },
  { 
    name: 'Add', 
    value: 'add',
    description: 'Add the values from the backdrop and source pixel together. This results in a brighter image.'
  },
  { 
    name: 'Multiply', 
    value: 'multiply',
    description: 'Multiply the values of the backdrop pixel by the source pixel. This results in a brighter image.'
   },
  { 
    name: 'Subtract', 
    value: 'subtract',
    description: 'Subtract the values of the source pixel from the values of the backdrop pixel. This results in a darker image.'
   },
  { 
    name: 'Divide', 
    value: 'divide',
    description: 'Divide the values of the backdrop pixel by the source pixel. This reuslts in a brighter image.'
   },
  { 
    name: 'Darken', 
    value: 'darken',
    description: 'Compare each channel in the backdrop and source pixels and take the smaller values.'
   },
  { 
    name: 'Lighten', 
    value: 'lighten',
    description: 'Compare each channel in the backdrop and source pixels and take the larger values.'
   },
  { 
    name: 'Screen', 
    value: 'screen',
    description: 'The screen mode is meant to provide an opposite effect of multiply. By inverting the pixels before multiplying them and then reinverting the output pixel the image gets lighter rather than darker.'
   },
  { 
    name: 'Overlay', 
    value: 'overlay',
    description: 'A combination of screen and multiply blend modes. For each channel, apply the multiply blend mode if the backdrop channel is less than 0.5, otherwise apply the screen blend mode.'
   },
  { 
    name: 'Hard Light', 
    value: 'hardLight',
    description: 'A combination of screen and multiply blend modes. For each channel, apply the multiply blend mode if the source channel is less than 0.5, otherwise apply the screen blend mode.'
   },
  { 
    name: 'Color Burn', 
    value: 'colorBurn',
    description: 'Darkens the backdrop color by increasing the contrast with the source color.'
   },
  { 
    name: 'Linear Burn', 
    value: 'linearBurn',
    description: 'Darkens the backdrop color based on the brightness of the source pixel.'
   },
  { 
    name: 'Color Dodge', 
    value: 'colorDodge',
    description: 'Brightens the backdrop color by decreasing the contrast with the source color.'
   },
  { 
    name: 'Difference', 
    value: 'difference',
    description: 'For each channel take the absolute value of one channel minus the other channel. Unlike the subtract mode, this operation is commutative (i.e. the order of the pixels does not affect the output).'
   },
  { 
    name: 'Soft Light', 
    value: 'softLight',
    description: 'Related to the Hard Light blend mode because it darkens or lightens based on the source pixel. Dampens the amount of burning or dodging at the extremes to prevent pure black or white.'
   },
  { 
    name: 'Exclusion', 
    value: 'exclusion',
    description: 'If the source channel is at full value it inverts the backdrop channel. As the source channel approaches zero the inversion decreases until the output is equal to just the backdrop channel. The effect is similar to difference but with lower contrast.'
  },
  {
    name: 'Hard Mix',
    value: 'hardMix',
    description: 'For each channel, add the backdrop and source values. If the result is greater than one the channel receives a value of one, otherwise it receives a value of zero.'
  },
  {
    name: 'Lighter Color',
    value: 'lighterColor',
    description: 'Sum the red, green, and blue channels of the backdrop and source pixels. If the backdrop result is greater than the source then the output is the backdrop color, otherwise it is the source color.'
  },
  {
    name: 'Darker Color',
    value: 'darkerColor',
    description: 'Sum the red, green, and blue channels of the backdrop and source pixels. If the backdrop result is less than the source then the output is the backdrop color, otherwise it is the source color.'
  },
  {
    name: 'Pin Light',
    value: 'pinLight',
    description: 'For each channel, use the source value if the backdrop value is between 0.5 and the source value, otherwise use the backdrop value.'
  },
  {
    name: 'Vivid Light',
    value: 'vividLight',
    description: 'For each channel, if the source value is greater than 0.5 apply color dodge, otherwise apply color burn.'
  },
  {
    name: 'Linear Light',
    value: 'linearLight',
    description: 'For each channel, if the source value is greater than 0.5 apply linear dodge (add), otherwise apply linear burn.'
  },
  { 
    name: 'Hue', 
    value: 'hue',
    description: 'Convert the pixel to HSL color mode. Use the hue of the source color and the saturation and luminosity of the backdrop color.'
   },
  { 
    name: 'Saturation', 
    value: 'saturation',
    description: 'Convert the pixel to HSL color mode. Use the saturation of the source color and the hue and luminosity of the backdrop color.'
   },
  { 
    name: 'Luminosity', 
    value: 'luminosity',
    description: 'Convert the pixel to HSL color mode. Use the luminosity of the source color and the hue and saturation of the backdrop color.'
   },
  { 
    name: 'Color', 
    value: 'color',
    description: 'Convert the pixel to HSL color mode. Use the hue and saturation of the source color and the luminosity of the backdrop color.'
  }
];