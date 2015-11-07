var GAME_WIDTH = 1280;
var GAME_HEIGHT = 720;
var DEBUG = true;
var GRUNGE_LEVELS = [
  'grunge_01',
]

var ITEMS = {
  computer: {
    has_view_image: false,
    do_dialog: 'computer',
  },

  key: {
    has_view_image: true,
    do_give: 'key',
    do_destroy: true,
    do_dialog: 'key',
  },

  door: {
    do_choose: function(){ return player_has('key') ? 'unlocked' : 'locked'; },
    locked: { do_dialog: 'door_locked' },
    unlocked: { do_view: 'corridor' },
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
  door_locked: {
    text: 'The door is locked',
  }
}

var VIEWS = {
  bed_forward: {
    paths: { hallway_forward: [617, 250] },
  },

  bed_backward: {
    paths: {
      hallway_forward: [132.5, 663],
      bed_forward: [636.5, 397],
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
    },
  },

  balcony: {
    paths: {
      livingroom_backward: [102.5, 668],
    },
  },

  livingroom_backward: {
    paths: {
      hallway_backward_entrance: [979, 106],
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
    paths: { hallway_backward_entrance: [667.5, 703] },
  },

  bathroom: {
    paths: {
      hallway_forward: [1220, 494],
    },
  }
}

var state = {
  view_key: 'livingroom_backward',
  inventory: [],
  grunge_level: GRUNGE_LEVELS[0],

  view_group: null,
  last_click: null,
}

var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'pavor-nocturnus', {
  preload: preload,
  create: create,
  render: render,
});

function preload() {
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

  //TODO: download these js files and serve them locally (in case they change)
  game.load.script('filterX', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurX.js');
  game.load.script('filterY', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurY.js');
}

function create() {
    state.view_group = make_view_group(state.view_key);
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

function make_view_group(view_key) {
  group = game.add.group()

  view_sprite = game.add.sprite(0, 0, 'views/'+state.grunge_level+'/'+state.view_key);
  view_sprite.inputEnabled = true
  view_sprite.events.onInputDown.add(view_sprite_clicked);
  group.add(view_sprite);

  v = VIEWS[state.view_key];
  if(!v){
    console.log("No view with key: " + state.view_key)
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
    var sprite = make_item_sprite(coord, item_key);
    if(sprite)
      group.add(sprite);
  })

  return group;
}

function make_item_sprite(coord, item_key){
    var item = ITEMS[item_key];
    if(item.destroyed)
      return null;

    var group = game.add.group();
    group.x = coord[0];
    group.y = coord[1];

    var circle = game.add.graphics(0, 0);
    group.add(circle);
    circle.beginFill(0xFF0000, 0.3);
    circle.drawCircle(0, 0, 80);
    circle.endFill();
    circle.inputEnabled = true;
    circle.events.onInputDown.add(function(){
      activate_item(get_item(item_key), group)
    });

    if(item.has_view_image){
      var img = game.add.sprite(0, 0, 'items/'+item_key);
      group.add(img);
      img.anchor.setTo(0.5, 0.5);
    }

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
  state.view_group = make_view_group(view_key);
}

function activate_item(item, sprite) {
  if(item.do_give){
    state.inventory.push(item.do_give);
  }

  if(item.do_destroy){
    item.destroyed = true;
    sprite.destroy();
  }

  if(item.do_choose){
    subitem_key = item.do_choose();
    activate_item(item[subitem_key], sprite);
  }

  if(item.do_dialog){
    show_item_dialog(item.do_dialog, sprite);
  }

  if(item.do_grunge_level){
    state.grunge_level = item.do_grunge_level;
  }

  if(item.do_view){
    move_to_view(item.do_view);
  }
}

function show_item_dialog(dialog_key, sprite) {
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
    game.add.tween(b).to({blur: 30}, 1000, "Linear", true);
  });


  // darken background
  bg = game.add.graphics(0, 0);
  group.add(bg);
  bg.beginFill(0x000000, 0.8);
  bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.endFill();
  bg.inputEnabled = true;
  bg.item_group = group;
  bg.events.onInputDown.add(function(){ dismiss_item_dialog(blurs, group) });
  game.add.tween(bg).from({ alpha: 0 }, 1000, "Linear", true);

  // show image (if available)
  if(dialog.image){
    image_h_space = dialog.text ? GAME_HEIGHT * 0.7 : GAME_HEIGHT
    image = game.add.sprite(GAME_WIDTH/2, image_h_space/2, 'dialogs/' + dialog_key);
    group.add(image);
    image.anchor.setTo(0.5, 0.5)
    game.add.tween(image).from({ y: sprite.y, x: sprite.x, alpha: 0 }, 1000, "Linear", true);
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

function view_sprite_clicked(sprite, point) {
  state.last_click = [point.x, point.y];
}

function dismiss_item_dialog(blurs, group) {
  _.each(blurs, function(b){
    game.add.tween(b).to({blur: 0}, 300, "Linear", true);
  });

  tween = game.add.tween(group).to({alpha: 0}, 300, "Linear", true);
  tween.onComplete.add(function(){
    group.destroy();
    state.view_group.filters = null;
  })
}
