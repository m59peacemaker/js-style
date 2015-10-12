var attr = 'js-style';

var styler = require('../')({
  attr: attr,
  styleFinder: (val, element) => {
    return element['js-style'];
  }
});

styler.init();

function addStyle(element, style) {
  element.setAttribute(attr, true);
  element[attr] = style;
}

var elem = document.createElement('div');
elem.textContent = 'heh hey hey';
addStyle(elem, [{
  color: 'red'
}, function(element) {
  if (element.parentNode.offsetWidth < 768) {
    return {
      color: 'green'
    };
  }
}]);
document.body.appendChild(elem);

var p = document.createElement('p');
p.textContent = 'YO, G!';
addStyle(p, [{
  color: 'red'
}, function(element) {
  if (element.parentNode.offsetWidth < 768) {
    return {
      color: 'blue'
    }
  }
}]);
setTimeout(() => {
  elem.appendChild(p);
}, 1000);
