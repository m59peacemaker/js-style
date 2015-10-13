var test = require('tape');

var attr = 'js-style';

var styler = require('../')({
  attr: attr,
  styleFinder: (val, element) => {
    return element[attr];
  },
  wait: false
});

function addStyle(element, style) {
  element.setAttribute(attr, true);
  element[attr] = style;
}

function setup() {
  var rootElem = document.createElement('div');
  document.body.appendChild(rootElem);
  return {
    rootElem: rootElem
  };
}

function teardown() {
  document.body.innerHTML = '';
}

function wait(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms)
  });
}

test('applies to elements already in the DOM', function(t) {
  t.plan(1);
  var state = setup();
  var elem = document.createElement('div');
  addStyle(elem, {color: 'red'});
  state.rootElem.appendChild(elem);
  styler.init(state.rootElem);
  t.equal(elem.style.color, 'red');
  teardown();
});

test('applies to new elements', function(t) {
  t.plan(1);
  var state = setup();
  styler.init(state.rootElem);
  var elem = document.createElement('div');
  addStyle(elem, {color: 'red'});
  state.rootElem.appendChild(elem);
  setTimeout(function() {
    t.equal(elem.style.color, 'red');
    teardown();
  });
});


test('responds to window resize', function(t) {
  t.plan(2);

  var win = window.open("", 'x', "height=500, width=500");

  var elem = document.createElement('div');
  addStyle(elem, [{color: 'red'}, function(element) {
    if (element.clientWidth < 200) {
      return {color: 'blue'};
    }
  }]);

  // give time for window to load
  wait(100).then(function() {
    styler.init(win.document.body);
    win.document.body.appendChild(elem);
    return wait();
  }).then(function() {
    t.equal(elem.style.color, 'red');
    win.resizeTo(200, 200);
    return wait(100); // give time for listener to be called
  }).then(function() {
    t.equal(elem.style.color, 'blue');
    win.close();
  });
});
