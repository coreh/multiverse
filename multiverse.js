var UNIVERSE_WIDTH = 16;
var UNIVERSE_HEIGHT = 16;

function create_universe() {
  return new Uint8Array(UNIVERSE_WIDTH * UNIVERSE_HEIGHT);
}

function wrap_x(x) {
  while (x < 0) { x += UNIVERSE_WIDTH; }
  while (x >= UNIVERSE_WIDTH) { x -= UNIVERSE_WIDTH; }
  return x;
}

function wrap_y(y) {
  while (y < 0) { y += UNIVERSE_HEIGHT; }
  while (y >= UNIVERSE_HEIGHT) { y -= UNIVERSE_HEIGHT; }
  return y;
}

function universe_get_cell(universe, x, y) {
  x = wrap_x(x);
  y = wrap_y(y);
  var cell = y * UNIVERSE_WIDTH + x;
  return universe[cell];
}

function universe_set_cell(universe, x, y, value) {
  x = wrap_x(x);
  y = wrap_y(y);
  var cell = y * UNIVERSE_WIDTH + x;
  universe[cell] = value;
}

function universe_render(universe, ctxt) {
  for (var y = 0; y < UNIVERSE_HEIGHT; y++) {
    for (var x = 0; x < UNIVERSE_WIDTH; x++) {
      if (universe_get_cell(universe, x, y)) {
        ctxt.fillRect(x, y, 1, 1);      
      }
    }
  }
}

function create_seed_universe() {
  var universe = create_universe();
  for (var y = 0; y < UNIVERSE_HEIGHT; y++) {
    for (var x = 0; x < UNIVERSE_WIDTH; x++) {
      universe_set_cell(universe, x, y, Math.random() > 0.5);
    }
  }
  return universe;
}

var seed_universe = create_seed_universe();
function create_multiverse() {
  var multiverse = {};
  for (var min = 0; min <= 8; min++) {
    for (var max = 0; max <= 8; max++) {
      for (var rep = 0; rep <= 8; rep++) {
        if (min > max) continue;
        var universe = create_universe();
        for (var y = 0; y < UNIVERSE_HEIGHT; y++) {
          for (var x = 0; x < UNIVERSE_WIDTH; x++) {
            universe_set_cell(universe, x, y, universe_get_cell(seed_universe, x, y));
          }
        }
        multiverse[[min,max,rep]] = {
          universe: universe,
          min: min,
          max: max,
          rep: rep
        }
      }
    }
  }
  return multiverse;
}

function multiverse_render(multiverse, ctxt, w, h) {
  ctxt.clearRect(0, 0, w, h);
  for (var min = 0; min <= 8; min++) {
    for (var max = 0; max <= 8; max++) {
      for (var rep = 0; rep <= 8; rep++) {
        var reality = multiverse[min+','+max+','+rep];
        if (!reality) continue;
        var universe = reality.universe;
        ctxt.save();
        ctxt.translate(min * (UNIVERSE_WIDTH + 1) + (rep % 3) * (UNIVERSE_WIDTH + 1) * 9, max * (UNIVERSE_HEIGHT + 1) + Math.floor(rep / 3) * (UNIVERSE_HEIGHT + 1) * 9);
        ctxt.fillStyle = 'hsla('+ Math.floor(rep * 255 / 8) + ',' + Math.floor(min * 100 / 8) + '%,' + Math.floor(max * 100 / 8) + '%, 0.2)';
        ctxt.fillRect(0, 0, UNIVERSE_WIDTH, UNIVERSE_HEIGHT);
        if (min == 2 && max == 3 && rep == 3) {
          ctxt.strokeStyle = '#white'
          ctxt.strokeRect(-0.5, -0.5, UNIVERSE_WIDTH + 1, UNIVERSE_HEIGHT + 1);
        }
        ctxt.fillStyle = 'hsla('+ Math.floor(rep * 255 / 8) + ',' + Math.floor(min * 100 / 8) + '%,' + Math.floor(max * 100 / 8) + '%, 1)';
        universe_render(universe, ctxt);
        ctxt.restore();
      }
    }
  }
}

function multiverse_step(multiverse) {
  for (var min = 0; min <= 8; min++) {
    for (var max = 0; max <= 8; max++) {
      for (var rep = 0; rep <= 8; rep++) {
        var reality = multiverse[min+','+max+','+rep];
        if (!reality) continue;
        reality.universe = universe_step(reality.universe, reality.min, reality.max, reality.rep);
      }
    }
  }
}

var side_buffer = create_universe();
function universe_step(universe, min, max, rep) {
  for (var y = 0; y < UNIVERSE_HEIGHT; y++) {
    for (var x = 0; x < UNIVERSE_WIDTH; x++) {
      var state = universe_get_cell(universe, x, y);
      var count = universe_get_cell(universe, x - 1, y - 1) + universe_get_cell(universe, x, y - 1) + universe_get_cell(universe, x + 1, y - 1) +
        universe_get_cell(universe, x - 1, y) + universe_get_cell(universe, x + 1, y) +
        universe_get_cell(universe, x - 1, y + 1) + universe_get_cell(universe, x, y + 1) + universe_get_cell(universe, x + 1, y + 1);
      if (state == 1) {
        if (count < min || count > max) {
          state = 0;
        }
      } else if (state == 0) {
        if (count == rep) {
          state = 1;
        }
      } else {
        throw new Error("what");
      }
      universe_set_cell(side_buffer, x, y, state);
    }
  }
  var tmp = side_buffer;
  side_buffer = universe;
  return tmp;
}

var canvas = document.getElementById("display");
canvas.width = 960 * window.devicePixelRatio;
canvas.height = 960 * window.devicePixelRatio;
canvas.style.width = '960px';
canvas.style.height = '960px';

var ctxt = canvas.getContext("2d");
ctxt.scale(window.devicePixelRatio * 2, window.devicePixelRatio * 2);
ctxt.translate(UNIVERSE_WIDTH, UNIVERSE_HEIGHT);

var multiverse = create_multiverse();

setInterval(function() {
  multiverse_step(multiverse);
  multiverse_render(multiverse, ctxt, 960, 960);
}, 20);