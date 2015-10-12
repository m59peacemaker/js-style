var merge = require('lodash/object/merge');

module.exports = styleParser;

function styleParser(styles, element) {
  var styleObjects = styles.map((styleItem) => {
    if (typeof styleItem === 'object') {
      return styleItem;
    } else if (typeof styleItem === 'function') {
      return styleItem(element);
    }
  });
  styleObjects.unshift({});
  return merge.apply(null, styleObjects);
}

