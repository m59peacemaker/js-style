var merge          = require('lodash/object/merge');
var debounce       = require('lodash/function/debounce');
var resizeDetector = require('element-resize-detector')({
  callOnAdd: false
});
var applyStylesFromObject = require('./lib/apply-styles-from-object');
var styleParser           = require('./lib/style-parser');

module.exports = function(options) {

  options = merge({
    root: document.body,
    attr: 'js-style',
    styleFinder: () => null,
    styleParser: styleParser,
    debounceWait: 250
  }, options);

  function applyStyles(element, styles) {
    applyStylesFromObject(element, options.styleParser(styles, element));
  }

  var observer = new MutationObserver(function(mutations) {
    mutations.reduce((prev, current) => {
      return prev.concat([].slice.call(current.addedNodes));
    }, []).filter((node) => {
      return node.nodeType === Node.ELEMENT_NODE && node.hasAttribute(options.attr);
    }).forEach((element) => {
      var styles = options.styleFinder(element.getAttribute('js-style'), element);
      applyStyles(element, styles);
      if (styles.some(styleItem => typeof styleItem === 'function')) {
        // has function(s) - setup listener
        resizeDetector.listenTo(element, debounce(applyStyles.bind(null, element, styles), options.debounceWait));
      }
    });
  });

  function init() {
    observer.observe(options.root, {
      childList: true,
      subtree: true
    });
  }

  return {
    init: init
  }
}
