export function mapDisplaySelection(selection, display, source) {
  if (display.width <= 0 || display.height <= 0 || source.width <= 0 || source.height <= 0) {
    throw new Error("The captured screenshot has no usable dimensions.");
  }
  return {
    x: selection.x * source.width / display.width,
    y: selection.y * source.height / display.height,
    width: selection.width * source.width / display.width,
    height: selection.height * source.height / display.height
  };
}
