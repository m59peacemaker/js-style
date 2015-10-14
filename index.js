var merge          = require('lodash/object/merge');
var debounce       = require('lodash/function/debounce');
var classList      = require('dom-classlist');
var jsToCSS        = require('js-to-css');
var resizeDetector = require('element-resize-detector')({
  callOnAdd: false,
 // strategy: 'scroll'
});

var styleParser           = require('./lib/style-parser');

module.exports = function(options) {

  options = merge({
    attr: 'js-style',
    styleFinder: (value, element) => null,
    paramsFinder: (value, element) => value,
    styleParser: styleParser,
    wait: 250
  }, options);

  var stylesheetClass = options.attr+'-stylesheet';

  var i = 0;
  function applyStyles(element, styles, params) {
    var result = options.styleParser(styles, params, element) || {};
    var stylesheet = '';
    var id = options.attr+'-'+(++i);
    element.className+= ' '+id;
    if (result.pseudo) {
      stylesheet += getPseudosStylesheet(id, result.pseudo);
      delete result.pseudo;
    }
    stylesheet +=  jsToCSS({['.'+id]: result});
    var styleElem = document.createElement('style');
    styleElem.className = stylesheetClass;
    styleElem.textContent = stylesheet;
    element.appendChild(styleElem);
  }

  function getPseudosStylesheet(id, pseudos) {
    return Object.keys(pseudos).reduce(function(prev, pseudo) {
      var style = {};
      style['.'+id+pseudo] = pseudos[pseudo];
      return prev+jsToCSS(style);
    }, '');
  }

  function processElement(element, isOld) {
    var attrValue = element.getAttribute(options.attr);
    var params    = options.paramsFinder(attrValue, element);
    var styles    = options.styleFinder(attrValue, element);
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
    }).forEach(function(element) {
      processElement(element);
    });
  });

  function init(rootElement) {
    rootElement = rootElement || document.body;
    [].forEach.call(rootElement.querySelectorAll('['+options.attr+']'), function(element) {
      processElement(element);
    });
    observer.observe(rootElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: [options.attr]
    });
  }

  return {
    init: init
  }
}
