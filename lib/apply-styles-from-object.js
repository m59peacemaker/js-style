module.exports = applyStylesFromObject;

function applyStylesFromObject(element, styleObject) {
  Object.keys(styleObject).forEach((key) => {
    element.style[key] = styleObject[key];
  });
}
