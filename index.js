var debounce       = require('lodash/function/debounce');
var classList      = require('dom-classlist');
var jsToCSS        = require('js-to-css');
var getObject      = require('i-object')();
var resizeDetector = require('element-resize-detector')({
  callOnAdd: false
});

module.exports = function(options) {

  options = Object.assign({
    attr: 'js-style',
    styleFinder: (value, element) => null,
    paramsFinder: (value, element) => value,
    transform: styles => styles,
    wait: 250
  }, options);

  var stylesheetClass = options.attr+'-stylesheet';

  var i = 0;
  function applyStyles(element, styles, params) {
    var result = getObject(styles, params, element) || {};
    result = options.transform(result);
    var stylesheet = '';
    var id = options.attr+'-'+(++i);
    element.className+= ' '+id;
    stylesheet +=  jsToCSS({['.'+id]: result});
    var styleElem = document.createElement('style');
    styleElem.className = stylesheetClass;
    styleElem.textContent = stylesheet;
    element.appendChild(styleElem);
  }

  function processElement(element, isOld) {
    var attrValue = element.getAttribute(options.attr);
    var styles    = options.styleFinder(attrValue, element);
    var params    = options.paramsFinder(attrValue, element);
    var apply     = applyStyles.bind(null, element, styles, params);
    if (isOld) {
      var oldClass = findStyleClass(element);
      apply();
      removeOldStyles(element, oldClass);
    } else {
      apply();
    }
    if (hasFunction(styles)) {
      // has function(s) - setup listener
      var listener = options.wait ? debounce(apply, options.wait) : apply;
      resizeDetector.listenTo(element, listener);
    }
  }

  function findStyleClass(element) {
    return element.className.split(' ').find((cls) => {
      return new RegExp('^'+options.attr+'-.+').test(cls);
    });
  }

  function removeOldStyles(element, oldClass) {
    classList(element).remove(oldClass);
    var styleElem = element.querySelector('style.'+stylesheetClass);
    element.removeChild(styleElem);
    resizeDetector.removeAllListeners(element);
  }

  function hasFunction(styles) {
    return typeof styles === 'function' ||
      (Array.isArray(styles) && styles.some(styleItem => typeof styleItem === 'function'))
    ;
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.reduce((prev, current) => {
      if (current.type === 'attributes') {
        processElement(current.target, true);
        return prev;
      }
      return prev.concat([].slice.call(current.addedNodes));
    }, []).filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(options.attr);
    }).forEach(element => processElement(element));
  });

  function init(rootElement) {
    rootElement = rootElement || document.body;
    var elements = rootElement.querySelectorAll('['+options.attr+']');
    Array.from(elements).forEach(element => processElement(element));
    observer.observe(rootElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [options.attr]
    });
  }

  return {
    init: init
  };
}
