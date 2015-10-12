var merge = require('lodash/object/merge');
var resizeDetector = require('element-resize-detector')({
  callOnAdd: false
});
var debounce = require('lodash/function/debounce');

var config = {
  attr: 'js-style',
  styleFinder: (element) => {
    return element[config.attr];
  }
};

function applyStylesFromObject(element, styleObject) {
  Object.keys(styleObject).forEach((key) => {
    element.style[key] = styleObject[key];
  });
}

function getStyleObject(element, styles) {
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

function applyStyles(element, styles) {
  applyStylesFromObject(element, getStyleObject(element, styles));
}

var observer = new MutationObserver(function(mutations) {
  mutations.reduce((prev, current) => {
    return prev.concat([].slice.call(current.addedNodes));
  }, []).filter((node) => {
    return node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(config.attr);
  }).forEach((element) => {
    var styles = config.styleFinder(element);
    applyStyles(element, styles);
    if (styles.some(styleItem => typeof styleItem === 'function')) {
      // has function(s) - setup listener
      resizeDetector.listenTo(element, debounce(applyStyles.bind(null, element, styles), 250));
    }
  });
});

observer.observe(document.body, {
  childList: true,
  //subtree: true
});

var elem = document.createElement('div');
elem.setAttribute(config.attr, true)
elem[config.attr] = [{
  color: 'red'
}, function(element) {
  if (element.parentNode.offsetWidth < 768) {
    return {
      color: 'green'
    };
  }
}];
elem.textContent = 'heh hey hey';
document.body.appendChild(elem);

var p = document.createElement('p');
elem.setAttribute(config.attr, true)
elem[config.attr] = [{
  color: 'red'
}, function(element) {
  if (element.parentNode.offsetWidth < 768) {
    return {
      color: 'blue'
    }
  }
}];
p.textContent = 'YO, G!';
setTimeout(() => {
  elem.appendChild(p);
}, 1000);
