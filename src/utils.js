export function createCanvas(
  [width, height],
  { hidden = false, el = document.body, id, style, className } = {}
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  if (style) {
    canvas.style = style;
  }
  if (className) {
    canvas.className = className;
  }
  canvas.hidden = hidden;
  if (id) {
    canvas.id = id;
  }
  el.appendChild(canvas);

  return canvas;
}

export function randomImageURL() {
  const randomString = Math.random().toString(36).substring(2);
  return `https://picsum.photos/1500/1000?_=${randomString}`;
}

export function randomImage() {
  // const url = `https://source.unsplash.com/random?_=${cryptoRandomString({ length: 6 })}`;
  const url = randomImageURL();
  return loadImage(url);
}

export function saveImage(canvas, { filename = 'blendmode.jpeg' } = {}) {
  const img = canvas.toDataURL('image/jpeg', 1.0);
  const link = document.createElement('a');
  link.setAttribute('download', filename);
  link.href = img;
  link.style = 'display: none';
  document.body.appendChild(link);
  link.click();
}