var DEBUG = (window.location.search == "?debug");
var DEBUG_STARTING_GRUNGE_LEVEL = 'grunge_02';
var DEBUG_STARTING_VIEW_KEY = 'balcony';

var GAME_WIDTH = 1280;
var GAME_HEIGHT = 720;
var GRUNGE_LEVELS = ['normal', 'grunge_01', 'grunge_02']

var ITEMS = {
  computer: {
    has_view_image: false,
    action: {
      do_choose: function(){ return state.grunge_level },
      normal: {
        do_dialog: 'computer',
        do_grunge_level: 'grunge_01',
      },
      grunge_01: {
        do_dialog: 'computer_original',
      }
    }
  },

  key: {
    has_view_image: true,
    action: {
      do_give: 'key',
      do_destroy: true,
      do_dialog: 'key',
    }
  },

  photo: {
    has_view_image: false,
    action: {
      do_choose: function(){ return state.grunge_level; },
      normal: { do_dialog: 'photo_normal' },
      grunge_01: { do_dialog: 'photo_grunge01' },
      grunge_02: { do_dialog: 'photo_grunge02' },
    },
  },

  door: {
    action: {
      do_choose: function(){ return player_has('key') ? 'unlocked' : 'locked'; },
      locked: { do_dialog: 'door_locked' },
      unlocked: { do_view: 'corridor' },
    }
  },

  norofon: {
    has_view_image: false,
    action: {
      do_choose: function(){ return state.grunge_level; },
      normal: { do_dialog: 'norofon_normal' },
      grunge_01: { do_dialog: 'norofon_grunge01', do_grunge_level: 'grunge_02' },
      grunge_02: { do_dialog: 'norofon_grunge02' },
    },
  },

  monster: {
    only_in_grunge_levels: ['grunge_02'],
    has_view_image: true,
    action: { do_cutscene: 'monster_fight', do_destroy: true },
  }
}

var DIALOGS = {
  key: {
    text: 'Why does my house key have the Suzuki logo on it?',
    image: true,
  },
  computer: {
    text: 'What is Dix? This is foreign to me.',
    image: true,
  },
  computer_original: { text: 'Is that hacker news?' },
  door_locked: { text: 'The door is locked.' },
  enter_test: { text: 'This is a test. Beep boop beep.' },

  photo_normal: { image: true, text: 'My two girls. They must have gone for a walk without me.' },
  photo_grunge01: { image: true, text: '...' },
  photo_grunge02: { image: true, text: '...' },

  norofon_normal: { image: true, text: 'My two girls. They must have gone for a walk without me.' },
  norofon_grunge01: { image: true, text: '...' },
  norofon_grunge02: { image: true, text: '...' },
}

var VIEWS = {
  bed_forward: {
    paths: { bed_backward: [890, 670] },
  },

  bed_backward: {
    paths: {
      hallway_forward: [132.5, 663],
    },
  },

  hallway_forward: {
    paths: {
      bed_backward: [380, 313],
      bathroom: [1160, 580],
      livingroom_forward: [143, 472],
      hallway_backward_entrance: [672, 680],
    },
  },

  livingroom_forward: {
    paths: {
      balcony: [1225, 260],
      hallway_backward_couch: [641, 678],
    },
    items: {
      computer: [597, 289],
      photo: [123, 166],
    },
  },

  balcony: {
    paths: { livingroom_backward: [102.5, 668] },
    enter_action: { do_dialog: 'enter_test' },
    items: { monster: [720, 516] }
  },

  livingroom_backward: {
    paths: {
      hallway_backward_couch: [979, 106],
    },
    items: {
      key: [610, 447],
    }
  },

  hallway_backward_entrance: {
    paths: {
      hallway_forward: [658, 670],
      bathroom: [268, 343],
    },
    items: {
      door: [694.5, 355],
    }
  },

  hallway_backward_couch: {
    paths: {
      hallway_backward_entrance: [735, 571],
      livingroom_forward: [50, 340],
    }
  },

  corridor: {
    paths: { hallway_backward_entrance: [667, 680] },
  },

  bathroom: {
    paths: { hallway_forward: [1220, 494] },
    items: { norofon: [1130, 342] },
  }
}

var state = {
  view_key: (DEBUG ? DEBUG_STARTING_VIEW_KEY : 'bed_forward'),
  inventory: [],
  grunge_level: (DEBUG ? DEBUG_STARTING_GRUNGE_LEVEL : GRUNGE_LEVELS[0]),

  view_group: null,
  last_click: null,
  preload_sprite: null,
}

function preload() {
  state.preload_sprite = game.add.sprite(0, 0, 'loading');
  game.load.setPreloadSprite(state.preload_sprite, 1);

  _.each(_.keys(VIEWS), function(view_key){
    _.each(GRUNGE_LEVELS, function(grunge_level){
      game.load.image('views/'+grunge_level+'/'+view_key, 'assets/views/'+grunge_level+'/'+view_key+'.jpg');
    });
  });

  _.each(ITEMS, function(item, item_key){
    if(item.has_view_image){
      game.load.image('items/' + item_key, 'assets/items/'+item_key+'.png');
    }
  });

  _.each(DIALOGS, function(dialog, key){
    if(dialog.image){
      game.load.image('dialogs/' + key, 'assets/dialogs/'+key+'.png');
    }
  })

  game.load.image('monster_close', 'assets/monster_close.png');

  //TODO: download these js files and serve them locally (in case they change)
  game.load.script('filterX', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurX.js');
  game.load.script('filterY', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurY.js');
}

function create() {
  if(DEBUG){
    start_game();
  } else {
    game.time.events.add(Phaser.Timer.SECOND * 1, function(){
      start_game();
    });
  }
}

function start_game() {
  state.preload_sprite.destroy();
  state.preload_sprite = null;

  state.view_group = make_view_group(state.view_key, state.grunge_level);
  if(!DEBUG){
    game.add.tween(state.view_group).from({alpha: 0}, 2000, 'Linear', true);
  }
}

function render() {
  if(DEBUG){
    game.debug.text(state.view_key, 10, 20, 'red');
    game.debug.text('Inventory: ' + state.inventory.join(', '), 10, 40, 'red');
    if(state.last_click){
      game.debug.text("Last clicked at: [" + state.last_click[0] + ", " + state.last_click[1] + "]", 10, 60, 'red');
    }
  }
}

function player_has(thing) {
  return _.contains(state.inventory, thing);
}

function make_view_group(view_key, grunge_level) {
  group = game.add.group()

  view_sprite = game.add.sprite(0, 0, 'views/'+grunge_level+'/'+view_key);
  view_sprite.inputEnabled = true
  view_sprite.events.onInputDown.add(view_sprite_clicked);
  group.add(view_sprite);

  v = VIEWS[view_key];
  if(!v){
    console.log("No view with key: " + view_key)
  }

  _.each(v.paths, function(coord, adj_vk){
    var circle = game.add.graphics(coord[0], coord[1]);
    circle.beginFill(0x00ff00, 0.2);
    circle.drawCircle(0, 0, 80);
    circle.endFill();
    circle.inputEnabled = true;
    circle.events.onInputDown.add(function(){ move_to_view(adj_vk) });
    group.add(circle);
  })

  _.each(v.items, function(coord, item_key){
    var sprite = make_item_sprite(coord, item_key, grunge_level);
    if(sprite)
      group.add(sprite);
  })

  return group;
}

function make_item_sprite(coord, item_key, grunge_level){
    var item = ITEMS[item_key];
    if(item.destroyed)
      return null;

    if(item.only_in_grunge_levels){
      if(!_.contains(item.only_in_grunge_levels, grunge_level)){
        return null;
      }
    }

    var group = game.add.group();
    group.x = coord[0];
    group.y = coord[1];

    if(item.has_view_image){
      var img = game.add.sprite(0, 0, 'items/'+item_key);
      group.add(img);
      img.anchor.setTo(0.5, 0.5);
    }

    var circle = game.add.graphics(0, 0);
    group.add(circle);
    circle.beginFill(0xFF0000, 0.3);
    circle.drawCircle(0, 0, 80);
    circle.endFill();
    circle.inputEnabled = true;
    circle.events.onInputDown.add(function(){
      item = get_item(item_key);
      perform_action(item.action, item, group);
    });

    return group;
}

function get_item(key){
  item = ITEMS[key];
  if(!item){ console.log("Can't find item '" + key + "'"); }
  return item;
}

function move_to_view(view_key) {
  state.view_group.destroy();
  state.last_click = null;
  state.view_key = view_key;
  state.view_group = make_view_group(view_key, state.grunge_level);

  view = VIEWS[view_key];
  if(view.enter_action){
    action = view.enter_action;
    view.enter_action = null; // only do it once
    game.time.events.add(Phaser.Timer.SECOND * 0.5, function(){
      perform_action(action);
    });
  }
}

function perform_action(action, item, sprite) {
  if(!action) return;

  if(action.do_give){
    state.inventory.push(action.do_give);
  }

  if(action.do_destroy){
    item.destroyed = true;
    sprite.destroy();
  }

  if(action.do_choose){
    subaction_key = action.do_choose();
    perform_action(action[subaction_key], item, sprite);
  }

  if(action.do_grunge_level){
    transition_to_grunge_level(action.do_grunge_level)
  }

  if(action.do_dialog){
    show_dialog(action.do_dialog, sprite);
  }

  if(action.do_view){
    move_to_view(action.do_view);
  }

  if(action.do_cutscene){
    this[action.do_cutscene + '_cutscene'].call()
  }
}

function monster_fight_cutscene(){
  monster = game.add.sprite(GAME_WIDTH/2, GAME_HEIGHT, 'monster_close');
  state.view_group.add(monster);
  monster.anchor.setTo(0.5, 1.0);
  game.add.tween(monster.scale).from({x: 0.6, y: 0.6}, 200, 'Bounce.easeOut', true);
}

function transition_to_grunge_level(new_grunge_level) {
  var old_view = state.view_group;

  state.grunge_level = new_grunge_level;
  state.view_group = make_view_group(state.view_key, state.grunge_level);
  state.view_group.filters = old_view.filters;
  game.world.sendToBack(state.view_group);

  tween = game.add.tween(old_view).to({alpha: 0}, 3000, "Linear", true);
  tween.onComplete.add(function(){
    old_view.destroy();
  });
}

function show_dialog(dialog_key, sprite) {
  group = game.add.group();
  dialog = DIALOGS[dialog_key];
  if(!dialog){
    console.log("Missing dialog '" + dialog_key + "'");
  }

  // blur background
  blurs = [game.add.filter('BlurX'), game.add.filter('BlurY')];
  _.each(blurs, function(b){ b.blur = 0; });
  state.view_group.filters = blurs;
  _.each(blurs, function(b){
    game.add.tween(b).to({blur: 30}, 700, "Linear", true);
  });


  // darken background
  bg = game.add.graphics(0, 0);
  group.add(bg);
  bg.beginFill(0x000000, 0.7);
  bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.endFill();
  tween = game.add.tween(bg).from({ alpha: 0 }, 700, "Linear", true);
  tween.onComplete.add(function(){
    bg.inputEnabled = true;
    bg.events.onInputDown.add(function(){ dismiss_dialog(blurs, group) });
  });

  // show image (if available)
  if(dialog.image){
    image_h_space = dialog.text ? GAME_HEIGHT * 0.7 : GAME_HEIGHT
    image = game.add.sprite(GAME_WIDTH/2, image_h_space/2, 'dialogs/' + dialog_key);
    group.add(image);
    image.anchor.setTo(0.5, 0.5)
    game.add.tween(image).from({ y: sprite.y, x: sprite.x, alpha: 0 }, 700, "Linear", true);
    game.add.tween(image.scale).from({ y: 0.2, x: 0.2 }, 1000, "Linear", true);
  }

  // show text (if available)
  if(dialog.text){
    text_h_space = dialog.image ? GAME_HEIGHT * 0.3 : GAME_HEIGHT;
    text_style = { fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    text = game.add.text(0, 0, dialog.text, text_style);
    group.add(text);
    text.setTextBounds(0, GAME_HEIGHT - text_h_space, GAME_WIDTH, text_h_space);
  }

}

function dismiss_dialog(blurs, group) {
  _.each(blurs, function(b){
    game.add.tween(b).to({blur: 0}, 300, "Linear", true);
  });

  tween = game.add.tween(group).to({alpha: 0}, 300, "Linear", true);
  tween.onComplete.add(function(){
    group.destroy();
    state.view_group.filters = null;
  })
}

function view_sprite_clicked(sprite, point) {
  state.last_click = [point.x, point.y];
}

var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'pavor-nocturnus')
game.state.add('boot', {
  preload: function() {
    game.load.image('loading', 'assets/loading.jpg');
  },
  create: function() {
    game.state.start('game');
  }
});
game.state.add('game', {
  preload: preload,
  create: create,
  render: render,
});
game.state.start('boot');
