var test = require('tape');
var merge = require('lodash/object/merge');
var wait = function(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
};

// ms to wait for styles to be rendered, tweak as needed, tests may fail if too low
var w = 30;

var attr = 'js-style';


function addStyle(element, style, params) {
  element.setAttribute(attr, params || true);
  element[attr] = style;
}

function setup(stylerOptions) {
  var styler = require('../')(merge({
    attr: attr,
    styleFinder: (value, element) => {
      return element[attr];
    },
    paramsFinder: (value, element) => {
      return value.split(',');
    },
    wait: false
  }, stylerOptions));
  var rootElem = document.createElement('div');
  document.body.appendChild(rootElem);
  return {
    styler: styler,
    rootElem: rootElem
  };
}

function teardown() {
  document.body.innerHTML = '';
}

var rgb = {
  black: 'rgb(0, 0, 0)',
  red:   'rgb(255, 0, 0)',
  blue:  'rgb(0, 0, 255)',
  transparent: 'rgba(0, 0, 0, 0)'
};

test('applies to elements already in the DOM', function(t) {
  t.plan(1);
  var state = setup();
  var elem = document.createElement('div');
  addStyle(elem, {color: 'red'});
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
  t.equal(getComputedStyle(elem).color, rgb.red);
  teardown();
});

test('applies to new elements', function(t) {
  t.plan(1);
  var state = setup();
  state.styler.init(state.rootElem);
  var elem = document.createElement('div');
  addStyle(elem, {color: 'red'});
  state.rootElem.appendChild(elem);
  setTimeout(function() {
    t.equal(getComputedStyle(elem).color, rgb.red);
    teardown();
  });
});


test('responds to window resize', function(t) {
  t.plan(2);
  var state = setup();
  var win = window.open("", 'x', "height=500, width=500");

  var elem = document.createElement('div');
  addStyle(elem, [{color: 'red'}, function(params, element) {
    if (element.clientWidth < 200) {
      return {color: 'blue'};
    }
  }]);

  // give time for window to load
  wait(w*2).then(function() {
    state.styler.init(win.document.body);
    win.document.body.appendChild(elem);
    return wait();
  }).then(function() {
    t.equal(getComputedStyle(elem).color, rgb.red);
    win.resizeTo(200, 200);
    return wait(w); // give time for listener to be called
  }).then(function() {
    t.equal(getComputedStyle(elem).color, rgb.blue);
    win.close();
    teardown();
  });
});

test('applies dynamic pseudo classes (focus)', function(t) {
  t.plan(1);
  var state = setup();
  var elem = document.createElement('a');
  elem.href = '';
  addStyle(elem, [{
    color: 'red',
    pseudo: {
      ':hover': {
        color: 'blue'
      },
      ':focus': {
        color: 'black'
      }
    }
  }]);
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
  setTimeout(function() {
    elem.focus();
    t.equal(getComputedStyle(elem).color, rgb.black);
    teardown();
  }, w);
});

test('applies state pseudo classes (disabled)', function(t) {
  t.plan(1);
  var state = setup();
  var elem = document.createElement('button');
  elem.disabled = true;
  addStyle(elem, [{
    color: 'red',
    pseudo: {
      ':disabled': {
        color: 'black'
      }
    }
  }]);
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
  elem.focus();
  setTimeout(function() {
    t.equal(getComputedStyle(elem).color, rgb.black);
    teardown();
  }, w);
});

test('applies structual pseudo classes (nth-child)', function(t) {
  t.plan(2);
  var state = setup();
  var first = document.createElement('div');
  var second = document.createElement('div');
  var style = [{
    color: 'red',
    pseudo: {
      ':nth-child(2)': {
        color: 'black'
      }
    }
  }];
  addStyle(first, style);
  addStyle(second, style);
  state.rootElem.appendChild(first);
  state.rootElem.appendChild(second);
  state.styler.init(state.rootElem);
  setTimeout(function() {
    t.equal(getComputedStyle(first).color, rgb.red);
    t.equal(getComputedStyle(second).color, rgb.black);
    teardown();
  }, w);
});

test('applies pseudo elements (::after)', function(t) {
  t.plan(1);
  var state = setup();
  var elem = document.createElement('div');
  addStyle(elem, [{
    color: 'red',
    pseudo: {
      '::after': {
        content: '"*"'
      }
    }
  }]);
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
  setTimeout(function() {
    t.equal(getComputedStyle(elem, '::after').getPropertyValue('content'), '"*"');
    teardown();
  }, w);
});

test('finds params for style functions', function(t) {
  t.plan(2);
  var state = setup();
  var elem = document.createElement('div');
  addStyle(elem, function(params, element) {
    t.equal(params[0], 'active');
    t.equal(params[1], 'light');
    teardown();
  }, 'active,light');
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
});

test('re-styles when attribute value changes', function(t) {
  t.plan(2);
  var state = setup();
  var elem = document.createElement('div');
  function style(params, element) {
    if (~params.indexOf('active')) {
      return {color: 'red'};
    } else {
      return {color: 'black'};
    }
  }
  addStyle(elem, style);
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
  wait(w).then(function() {
    t.equal(getComputedStyle(elem).color, rgb.black);
    addStyle(elem, style, 'active,light');
    return wait(w);
  }).then(function() {
    t.equal(getComputedStyle(elem).color, rgb.red);
    teardown();
  });
});

// ensure old styles are ditched each new run
// add param helper (plugin?)
// add plugin system?
// write transpiler

test('old styles are cleaned out on re-style', function(t) {
  t.plan(3);
  var state = setup();
  var elem = document.createElement('div');
  addStyle(elem, {'background-color': 'red'});
  state.rootElem.appendChild(elem);
  state.styler.init(state.rootElem);
  wait(w).then(function() {
    t.equal(getComputedStyle(elem).backgroundColor, rgb.red);
    addStyle(elem, {color: 'blue'});
    return wait(w);
  }).then(function() {
    t.equal(getComputedStyle(elem).backgroundColor, rgb.transparent);
    t.equal(getComputedStyle(elem).color, rgb.blue);
    teardown();
  });
});
