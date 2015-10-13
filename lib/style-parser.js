var merge = require('lodash/object/merge');

module.exports = styleParser;

function styleParser(styles, element) {
  if (!Array.isArray(styles)) {
    return parseStyleItem(styles);
  }
  var styleObjects = styles.map((styleItem) => parseStyleItem(styleItem, element));
  styleObjects.unshift({});
  return merge.apply(null, styleObjects);
}

function parseStyleItem(styleItem, element) {
  if (typeof styleItem === 'object') {
    return styleItem;
  } else if (typeof styleItem === 'function') {
    return styleItem(element);
  }
}
