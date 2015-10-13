var merge          = require('lodash/object/merge');
var debounce       = require('lodash/function/debounce');
var resizeDetector = require('element-resize-detector')({
  callOnAdd: false,
  //strategy: 'scroll'
});
var applyStylesFromObject = require('./lib/apply-styles-from-object');
var styleParser           = require('./lib/style-parser');

module.exports = function(options) {

  options = merge({
    attr: 'js-style',
    styleFinder: () => null,
    styleParser: styleParser,
    wait: 250
  }, options);

  function applyStyles(element, styles) {
    applyStylesFromObject(element, options.styleParser(styles, element));
  }

  function processElement(element) {
    var styles = options.styleFinder(element.getAttribute('js-style'), element);
    var apply = applyStyles.bind(null, element, styles);
    apply();
    if (hasFunction(styles)) {
      // has function(s) - setup listener
      var listener = options.wait ? debounce(apply, options.wait) : apply;
      resizeDetector.listenTo(element, listener);
    }
  }

  function hasFunction(styles) {
    return typeof styles === 'function' ||
      (Array.isArray(styles) && styles.some(styleItem => typeof styleItem === 'function'))
    ;
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.reduce((prev, current) => {
      return prev.concat([].slice.call(current.addedNodes));
    }, []).filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(options.attr);
    }).forEach(processElement);
  });

  function init(rootElement) {
    rootElement = rootElement || document.body;
    [].forEach.call(rootElement.querySelectorAll('['+options.attr+']'), processElement);
    observer.observe(rootElement, {
      childList: true,
      subtree: true
    });
  }

  return {
    init: init
  }
}
