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