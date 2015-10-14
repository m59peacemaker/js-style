var merge = require('lodash/object/merge');

module.exports = styleParser;

function styleParser(styles, params, element) {
  if (!Array.isArray(styles)) {
    return parseStyleItem(styles, params, element);
  }
  var styleObjects = styles.map((styleItem) => parseStyleItem(styleItem, params, element));
  styleObjects.unshift({});
  return merge.apply(null, styleObjects);
}

function parseStyleItem(styleItem, params, element) {
  if (typeof styleItem === 'object') {
    return styleItem;
  } else if (typeof styleItem === 'function') {
    return styleItem(params, element);
  }
}
