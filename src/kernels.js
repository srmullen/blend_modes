export function add(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    pix1[0] + pix2[0],
    pix1[1] + pix2[1],
    pix1[2] + pix2[2],
    255
  );
}

export function subtract(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    pix1[0] - pix2[0],
    pix1[1] - pix2[1],
    pix1[2] - pix2[2],
    255
  );
}

export function darken(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    Math.min(pix1[0], pix2[0]),
    Math.min(pix1[1], pix2[1]),
    Math.min(pix1[2], pix2[2]),
    255
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

export function colorBurn(img1, img2) {
  const pix1 = img1[this.thread.y][this.thread.x];
  const pix2 = img2[this.thread.y][this.thread.x];
  this.color(
    1 - (1 - pix2[0]) / pix1[0],
    1 - (1 - pix2[1]) / pix1[1],
    1 - (1 - pix2[2]) / pix1[2],
    1
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
  this.color(
    pix2[0] / (1 - pix1[0]),
    pix2[1] / (1 - pix1[1]),
    pix2[2] / (1 - pix1[2]),
    1
  );
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

export function createImageKernel(gpu, fn, output, ...args) {
  const kernel = gpu.createKernel(fn)
    .setGraphical(true)
    .setOutput(output)
  // .setOutput([image1.width, image1.height]);

  // kernel(image1, image2);
  kernel(...args)
  return kernel.getPixels();
}