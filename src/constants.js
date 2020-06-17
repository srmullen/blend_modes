export const CANVAS_STYLE = 'max-height: 75vh; max-width: 100%;';

export const MODES = [
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
    description: ''
   },
  { 
    name: 'Linear Burn', 
    value: 'linearBurn',
    description: ''
   },
  { 
    name: 'Color Dodge', 
    value: 'colorDodge',
    description: ''
   },
  // { 
  //   name: 'Random', 
  //   value: 'random_component',
  //   description: ''
  // },
  { 
    name: 'Difference', 
    value: 'difference',
    description: 'For each channel take the absolute value of one channel minus the other channel. Unlike the subtract mode, this operation is commutative (i.e. the order of the pixels does not affect the output).'
   },
  { 
    name: 'Soft Light', 
    value: 'softLight',
    description: ''
   },
  { 
    name: 'Exclusion', 
    value: 'exclusion',
    description: ''
   },
  { 
    name: 'Hue', 
    value: 'hue',
    description: ''
   },
  { 
    name: 'Saturation', 
    value: 'saturation',
    description: ''
   },
  { 
    name: 'Luminosity', 
    value: 'luminosity',
    description: ''
   },
  { 
    name: 'Color', 
    value: 'color',
    description: ''
  }
];