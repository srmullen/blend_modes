/**
 * Functions
 **/

export function minimum(pix) {
  return Math.min(pix[0], Math.min(pix[1], pix[2]));
}

export function maximum(pix) {
  return Math.max(pix[0], Math.max(pix[1], pix[2]));
}

// return the [min, mid, max] indices
export function mmm(pix) {
  let min = 0;
  let mid = 0;
  let max = 0;

  if (pix[0] < pix[1] && pix[0] < pix[2]) {
    min = 0;
    if (pix[1] > pix[2]) {
      max = 1;
      mid = 2;
    } else {
      max = 2;
      mid = 1;
    }
  } else if (pix[1] < pix[0] && pix[1] < pix[2]) {
    min = 1;
    if (pix[0] > pix[2]) {
      max = 0;
      mid = 2;
    } else {
      max = 2;
      mid = 0;
    }
  } else {
    min = 2;
    if (pix[0] > pix[1]) {
      max = 0;
      mid = 1;
    } else {
      max = 1;
      mid = 0;
    }
  }
  return [min, mid, max];
}

export function lum(pix) {
  return 0.3 * pix[0] + 0.59 * pix[1] + 0.11 * pix[2];
}

export function clipColor(pix) {
  const l = lum(pix);
  const n = minimum(pix);
  const x = maximum(pix);

  let c = [pix[0], pix[1], pix[2], 1];

  if (n < 0) {
    c[0] = l + (((pix[0] - l) * l) / (l - n));
    c[1] = l + (((pix[1] - l) * l) / (l - n));
    c[2] = l + (((pix[2] - l) * l) / (l - n));
  }

  if (x > 1) {
    c[0] = l + (((pix[0] - l) * (1 - l)) / (x - l));
    c[1] = l + (((pix[1] - l) * (1 - l)) / (x - l));
    c[2] = l + (((pix[2] - l) * (1 - l)) / (x - l));
  }

  return c;
}

export function sat(pix) {
  return maximum(pix) - minimum(pix);
}

export function setLum(pix, l) {
  const d = l - lum(pix);
  return clipColor([
    pix[0] + d,
    pix[1] + d,
    pix[2] + d,
    1
  ]);
}

export function setSat(pix, s) {
  const [min, mid, max] = mmm(pix);
  let c = [pix[0], pix[1], pix[2], 1];
  // if (pix[max] > pix[min]) {
  let c_mid = 0;
  if (!(pix[0] === pix[1] && pix[0] === pix[2])) {
    // calculate c_mid
    if (pix[0] < pix[1] && pix[0] < pix[2]) {
      if (pix[1] > pix[2]) {
        c_mid = (((pix[2] - pix[0]) * s) / (pix[1] - pix[0]));
      } else {
        c_mid = (((pix[1] - pix[0]) * s) / (pix[2] - pix[0]));
      }
    } else if (pix[1] < pix[0] && pix[1] < pix[2]) {
      if (pix[0] > pix[2]) {
        c_mid = (((pix[2] - pix[1]) * s) / (pix[0] - pix[1]));
      } else {
        c_mid = (((pix[0] - pix[1]) * s) / (pix[2] - pix[1]));
      }
    } else {
      if (pix[0] > pix[1]) {
        c_mid = (((pix[1] - pix[2]) * s) / (pix[0] - pix[2]));
      } else {
        c_mid = (((pix[0] - pix[2]) * s) / (pix[1] - pix[2]));
      }
    }

    // Set Values
    if (mid === 0) {
      c[0] = c_mid;
    } else if (mid === 1) {
      c[1] = c_mid;
    } else if (mid === 2) {
      c[2] = c_mid;
    }

    if (max === 0) {
      c[0] = s;
    } else if (max === 1) {
      c[1] = s;
    } else if (max === 2) {
      c[2] = s;
    }
  } else {
    if (mid === 0) {
      c[0] = 0;
    } else if (mid === 1) {
      c[1] = 0;
    } else if (mid === 2) {
      c[2] = 0;
    }

    if (max === 0) {
      c[0] = 0;
    } else if (max === 1) {
      c[1] = 0;
    } else if (max === 2) {
      c[2] = 0;
    }
  }

  if (min === 0) {
    c[0] = 0;
  } else if (min === 1) {
    c[1] = 0;
  } else if (min === 2) {
    c[2] = 0;
  }
  return c;
}

export function calcAlpha(cb, alphaB, cs, alphaS) {
  return cs * alphaS + cb * alphaB * (1 - alphaS);
}

export function applyAlpha(backdrop, source) {
  return [
    calcAlpha(backdrop[0], backdrop[3], source[0], source[3]),
    calcAlpha(backdrop[1], backdrop[3], source[1], source[3]),
    calcAlpha(backdrop[2], backdrop[3], source[2], source[3]),
  ];
}

/**
* Kernels
**/

export function add(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const alpha = pix2[3] + pix1[3] * (1 - pix2[3]);
  const blend = [
    pix1[0] + pix2[0],
    pix1[1] + pix2[1],
    pix1[2] + pix2[2],
    pix2[3]
  ];
  const alphaB = pix1[3];
  const alphaS = pix2[3];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}

export function subtract(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const blend = [
    pix1[0] - pix2[0],
    pix1[1] - pix2[1],
    pix1[2] - pix2[2],
    pix2[3]
  ];
  const composite = applyAlpha(pix1, blend);
  this.color(
    composite[0],
    composite[1],
    composite[2],
    1
  );
}

export function darken(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    Math.min(pix1[0], pix2[0]),
    Math.min(pix1[1], pix2[1]),
    Math.min(pix1[2], pix2[2]),
    1
  );
}

export function lighten(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    Math.max(pix1[0], pix2[0]),
    Math.max(pix1[1], pix2[1]),
    Math.max(pix1[2], pix2[2]),
    255
  );
}

export function multiply(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    pix1[0] * pix2[0],
    pix1[1] * pix2[1],
    pix1[2] * pix2[2],
    1
  );
}

export function divide(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    pix1[0] / pix2[0],
    pix1[1] / pix2[1],
    pix1[2] / pix2[2],
    1
  );
}

export function screen(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    1 - (1 - pix1[0]) * (1 - pix2[0]),
    1 - (1 - pix1[1]) * (1 - pix2[1]),
    1 - (1 - pix1[2]) * (1 - pix2[2]),
    1
  );
}

export function overlay(img1, img2, cutoff) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let r1 = pix1[0];
  let g1 = pix1[1];
  let b1 = pix1[2];
  let r2 = pix2[0];
  let g2 = pix2[1];
  let b2 = pix2[2];

  let r = 0;
  if (r1 < cutoff) {
    r = r1 * r2 * 2;
  } else {
    r = 1 - 2 * (1 - r1) * (1 - r2);
  }

  let g = 0;
  if (g1 < cutoff) {
    g = g1 * g2 * 2;
  } else {
    g = 1 - 2 * (1 - g1) * (1 - g2);
  }

  let b = 0;
  if (b1 < cutoff) {
    b = b1 * b2 * 2;
  } else {
    b = 1 - 2 * (1 - b1) * (1 - b2);
  }

  this.color(r, g, b, 1);
}

export function hardLight(img1, img2) {
  const cutoff = 0.5;
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let r1 = pix1[0];
  let g1 = pix1[1];
  let b1 = pix1[2];
  let r2 = pix2[0];
  let g2 = pix2[1];
  let b2 = pix2[2];

  let r = 0;
  if (r2 < cutoff) {
    r = r1 * r2 * 2;
  } else {
    r = 1 - 2 * (1 - r1) * (1 - r2);
  }

  let g = 0;
  if (g2 < cutoff) {
    g = g1 * g2 * 2;
  } else {
    g = 1 - 2 * (1 - g1) * (1 - g2);
  }

  let b = 0;
  if (b2 < cutoff) {
    b = b1 * b2 * 2;
  } else {
    b = 1 - 2 * (1 - b1) * (1 - b2);
  }

  this.color(r, g, b, 1);
}

export function colorBurn(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    1 - (1 - pix1[0]) / pix2[0],
    1 - (1 - pix1[1]) / pix2[1],
    1 - (1 - pix1[2]) / pix2[2]
  );
}

export function linearBurn(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    pix1[0] + pix2[0] - 1,
    pix1[1] + pix2[1] - 1,
    pix1[2] + pix2[2] - 1,
    1
  );
}

export function colorDodge(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const red = Math.min(1, pix1[0] / (1 - pix2[0]))
  const green = Math.min(1, pix1[1] / (1 - pix2[1]))
  const blue = Math.min(1, pix1[2] / (1 - pix2[2]))
  this.color(red, green, blue);
}

export function softLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];

  let red = 0;
  if (pix2[0] <= 0.5) {
    red = pix1[0] - (1 - 2 * pix2[0]) * pix1[0] * (1 - pix1[0]);
  } else {
    let d = 0;
    if (pix1[0] <= 0.25) {
      d = ((16 * pix1[0] - 12) * pix1[0] + 4) * pix1[0];
    } else {
      d = Math.sqrt(pix1[0]);
    }
    red = pix1[0] + (2 * pix2[0] - 1) * (d - pix1[0]);
  }

  let green = 0;
  if (pix2[1] <= 0.5) {
    green = pix1[1] - (1 - 2 * pix2[1]) * pix1[1] * (1 - pix1[1]);
  } else {
    let d = 0;
    if (pix1[1] <= 0.25) {
      d = ((16 * pix1[1] - 12) * pix1[1] + 4) * pix1[1];
    } else {
      d = Math.sqrt(pix1[1]);
    }
    green = pix1[1] + (2 * pix2[1] - 1) * (d - pix1[1]);
  }

  let blue = 0;
  if (pix2[2] <= 0.5) {
    blue = pix1[2] - (1 - 2 * pix2[2]) * pix1[2] * (1 - pix1[2]);
  } else {
    let d = 0;
    if (pix1[2] <= 0.25) {
      d = ((16 * pix1[2] - 12) * pix1[2] + 4) * pix1[2];
    } else {
      d = Math.sqrt(pix1[2]);
    }
    blue = pix1[2] + (2 * pix2[2] - 1) * (d - pix1[2]);
  }

  this.color(red, green, blue);
}

export function difference(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    Math.abs(pix1[0] - pix2[0]),
    Math.abs(pix1[1] - pix2[1]),
    Math.abs(pix1[2] - pix2[2])
  );
}

export function exclusion(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    pix1[0] + pix2[0] - 2 * pix1[0] * pix2[0],
    pix1[1] + pix2[1] - 2 * pix1[1] * pix2[1],
    pix1[2] + pix2[2] - 2 * pix1[2] * pix2[2]
  );
}

export function hardMix(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const red = (pix1[0] + pix2[0]) > 1.0 ? 1.0 : 0;
  const green = (pix1[1] + pix2[1]) > 1.0 ? 1.0 : 0;
  const blue = (pix1[2] + pix2[2]) > 1.0 ? 1.0 : 0;
  this.color(red, green, blue);
}

export function lighterColor(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const total1 = pix1[0] + pix1[1] + pix1[2];
  const total2 = pix2[0] + pix2[1] + pix2[2];
  if (total1 > total2) {
    this.color(pix1[0], pix1[1], pix1[2]);
  } else {
    this.color(pix2[0], pix2[1], pix2[2]);
  }
}

export function darkerColor(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const total1 = pix1[0] + pix1[1] + pix1[2];
  const total2 = pix2[0] + pix2[1] + pix2[2];
  if (total1 < total2) {
    this.color(pix1[0], pix1[1], pix1[2]);
  } else {
    this.color(pix2[0], pix2[1], pix2[2]);
  }
}

export function pinLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let red = pix1[0];
  if (pix2[0] > 0.5) {
    if (pix1[0] < pix2[0]) {
      red = pix2[0];
    }
  } else {
    if (pix1[0] > pix2[0]) {
      red = pix2[0];
    }
  }

  let green = pix1[1];
  if (pix2[1] > 0.5) {
    if (pix1[1] < pix2[1]) {
      green = pix2[1];
    }
  } else {
    if (pix1[1] > pix2[1]) {
      green = pix2[1];
    }
  }

  let blue = pix1[2];
  if (pix2[2] > 0.5) {
    if (pix1[2] < pix2[2]) {
      blue = pix2[2];
    }
  } else {
    if (pix1[2] > pix2[2]) {
      blue = pix2[2];
    }
  }

  this.color(red, green, blue);
}

export function vividLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let red = 0;
  if (pix2[0] > 0.5) {
    // dodge
    red = Math.min(1, pix1[0] / (1 - pix2[0]))
  } else {
    // burn
    red = 1 - (1 - pix1[0]) / pix2[0];
  }

  let green = 0;
  if (pix2[1] > 0.5) {
    // dodge
    green = Math.min(1, pix1[1] / (1 - pix2[1]));
  } else {
    // burn
    green = 1 - (1 - pix1[1]) / pix2[1];
  }

  let blue = 0;
  if (pix2[2] > 0.5) {
    // color dodge
    blue = Math.min(1, pix1[2] / (1 - pix2[2]));
  } else {
    // color burn
    blue = 1 - (1 - pix1[2]) / pix2[2];
  }

  this.color(red, green, blue);
}

export function linearLight(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  let red = 0;
  if (pix2[0] > 0.5) {
    // linear dodge
    red = pix1[0] + pix2[0];
  } else {
    // linear burn
    red = pix1[0] + pix2[0] - 1;
  }

  let green = 0;
  if (pix2[1] > 0.5) {
    green = pix1[1] + pix2[1];
  } else {
    green = pix1[1] + pix2[1] - 1;
  }

  let blue = 0;
  if (pix2[2] > 0.5) {
    blue = pix1[2] + pix2[2];
  } else {
    blue = pix1[2] + pix2[2] - 1;
  }

  this.color(red, green, blue);
}

export function hue(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const luminosity = lum(pix1);
  const saturation = sat(pix1);
  const newSat = setSat(pix2, saturation);
  const pix = setLum(newSat, luminosity);
  this.color(pix[0], pix[1], pix[2]);
}

export function saturation(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const pix = setLum(setSat(pix1, sat(pix2)), lum(pix1));
  this.color(pix[0], pix[1], pix[2]);
}

export function color(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const pix = setLum(pix2, lum(pix1));
  this.color(pix[0], pix[1], pix[2]);
}

export function luminosity(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  const pix = setLum(pix1, lum(pix2));
  this.color(pix[0], pix[1], pix[2]);
}

/**
 * Similar to disolve mode except no dither pattern is created. Instead random values are generated each time it is
 * run. If the random value is less than the given cutoff the component from the first channel will be used, otherwise
 * the second pixel component will be used.
 * @param {Image} img1 
 * @param {Image} img2 
 * @param {number} cutoff 
 */
export function random_component(img1, img2, cutoff) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  
  const r = Math.random() < cutoff ? pix1[0] : pix2[0];
  const g = Math.random() < cutoff ? pix1[1] : pix2[1];
  const b = Math.random() < cutoff ? pix1[2] : pix2[2];
  this.color(r, g, b, 1);

  // const pix = Math.random() < cutoff ? pix1 : pix2;
  // this.color(pix[0], pix[1], pix[2]);
}