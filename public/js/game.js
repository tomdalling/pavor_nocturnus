var GAME_WIDTH = 1280;
var GAME_HEIGHT = 720;
var DEBUG = true;

var ITEMS = {
  computer: {
    text: 'What is Dix? This is foreign to me.',
    has_dialog_image: true,
    has_view_image: false,
  },
  key: {
    text: 'Why does my house key have the Suzuki logo on it?',
    has_dialog_image: true,
    has_view_image: true,
  }
}

var VIEWS = {
  bed_forward: {
    paths: { hallway_forward: [725, 246] },
  },

  bed_backward: {
    paths: {
      hallway_forward: [132.5, 663],
      bed_forward: [636.5, 397],
    },
  },

  hallway_forward: {
    paths: {
      bed_backward: [963, 466],
      livingroom_forward: [640, 527],
      hallway_backward_entrance: [392.5, 702],
    },
  },

  livingroom_forward: {
    paths: {
      balcony: [1126.5, 422],
      hallway_backward_couch: [101.5, 690],
    },
    items: {
      computer: [595.5, 215],
    },
  },

  balcony: {
    paths: {
      livingroom_backward: [102.5, 668],
    },
  },

  livingroom_backward: {
    paths: {
      hallway_backward_entrance: [961.5, 200],
    },
    items: {
      key: [618.5, 508],
    }
  },

  hallway_backward_entrance: {
    paths: {
      corridor: [694.5, 355],
      hallway_forward: [1107.5, 695],
      bathroom: [264.5, 392],
    },
  },

  hallway_backward_couch: {
    paths: {
      hallway_backward_entrance: [735.5, 491],
      livingroom_forward: [433.5, 714],
    }
  },

  corridor: {
    paths: { hallway_backward_entrance: [667.5, 703] },
  },

  bathroom: {
    paths: {
      hallway_backward_entrance: [1257.5, 494],
    },
  }
}

var state = {
  view_key: 'livingroom_backward',
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
    game.load.image('views/' + view_key, 'assets/views/'+view_key+'.jpg');
  });

  _.each(_.keys(ITEMS), function(item_key){
    item = ITEMS[item_key];
    if(item.has_dialog_image){
      game.load.image('items/' + item_key + '/dialog', 'assets/items/'+item_key+'_dialog.png');
    }
    if(item.has_view_image){
      game.load.image('items/' + item_key + '/view', 'assets/items/'+item_key+'.png');
    }
  });

  //TODO: download these js files and serve them locally (in case they change)
  game.load.script('filterX', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurX.js');
  game.load.script('filterY', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurY.js');
}

function create() {
    state.view_group = make_view_group(state.view_key)
}

function render() {
  if(DEBUG){
    game.debug.text(state.view_key, 10, 20, 'red');
    if(state.last_click){
      game.debug.text("Last clicked at: [" + state.last_click[0] + ", " + state.last_click[1] + "]", 10, 40, 'red');
    }
  }
}

function make_view_group(view_key) {
  group = game.add.group()

  view_sprite = game.add.sprite(0, 0, 'views/' + state.view_key);
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
    circle.events.onInputDown.add(path_clicked);
    circle.next_view_key = adj_vk;
    group.add(circle);
  })

  _.each(v.items, function(coord, item_key){
    var circle = game.add.graphics(coord[0], coord[1]);
    circle.beginFill(0xFF0000, 0.3);
    circle.drawCircle(0, 0, 80);
    circle.endFill();
    circle.inputEnabled = true;
    circle.events.onInputDown.add(show_item_dialog, {item_key: item_key, from: circle});
    group.add(circle);

    item = ITEMS[item_key];
    if(item.has_view_image){
      var img = game.add.sprite(coord[0], coord[1], 'items/' + item_key + '/view');
      img.anchor.setTo(0.5, 0.5);
      group.add(img);
    }
  })

  return group;
}

function path_clicked(circle) {
  state.view_group.destroy();
  state.last_click = null;
  state.view_key = circle.next_view_key;
  state.view_group = make_view_group(state.view_key);
}

function show_item_dialog() {
  group = game.add.group();

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
  bg.events.onInputDown.add(dismiss_item_dialog, { blurs: blurs, group: group });
  game.add.tween(bg).from({ alpha: 0 }, 1000, "Linear", true);

  // get the item
  item = ITEMS[this.item_key];
  if(!item){
    console.log("No item found with key: " + item);
  }

  // show image (if available)
  if(item.has_dialog_image){
    image_h_space = item.text ? GAME_HEIGHT * 0.7 : GAME_HEIGHT
    image = game.add.sprite(GAME_WIDTH/2, image_h_space/2, 'items/' + this.item_key + '/dialog');
    group.add(image);
    image.anchor.setTo(0.5, 0.5)
    game.add.tween(image).from({ y: this.from.y, x: this.from.x, alpha: 0 }, 1000, "Linear", true);
    game.add.tween(image.scale).from({ y: 0.2, x: 0.2 }, 1000, "Linear", true);
  }

  // show text (if available)
  if(item.text){
    text_h_space = item.has_dialog_image ? GAME_HEIGHT * 0.3 : GAME_HEIGHT;
    text_style = { fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    text = game.add.text(0, 0, item.text, text_style);
    group.add(text);
    text.setTextBounds(0, GAME_HEIGHT - text_h_space, GAME_WIDTH, text_h_space);
  }

}

function view_sprite_clicked(sprite, point) {
  state.last_click = [point.x, point.y];
}

function dismiss_item_dialog() {
  _.each(this.blurs, function(b){
    game.add.tween(b).to({blur: 0}, 300, "Linear", true);
  });

  tween = game.add.tween(this.group).to({alpha: 0}, 300, "Linear", true);
  tween.onComplete.add(function(){
    group.destroy();
    state.view_group.filters = null;
  })
}
