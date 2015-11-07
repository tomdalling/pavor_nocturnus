var GAME_WIDTH = 1280;
var GAME_HEIGHT = 720;

var ITEMS = {
  computer: {
    text: 'What is Dix? This is foreign to me.'
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
  view_key: 'livingroom_forward',
  view_group: null,
}

var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'pavor-nocturnus', {
  preload: preload,
  create: create
});

function preload() {
  _.each(_.keys(VIEWS), function(view_key){
    game.load.image('views/' + view_key, 'assets/views/'+view_key+'.jpg');
  })

  _.each(_.keys(ITEMS), function(item_key){
    game.load.image('items/' + item_key, 'assets/items/'+item_key+'.png');
  })
}

function create() {
    state.view_group = make_view_group(state.view_key)
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
    circle.events.onInputDown.add(item_clicked);
    circle.item_key = item_key;
    group.add(circle);
  })

  return group;
}

function path_clicked(circle) {
  state.view_group.destroy()
  state.view_key = circle.next_view_key
  state.view_group = make_view_group(state.view_key)
}

function item_clicked(circle) {
  item = ITEMS[circle.item_key];
  if(!item){
    console.log("No item found with key: " + item);
  }

  group = game.add.group();

  bg = game.add.graphics(0, 0);
  group.add(bg);
  bg.beginFill(0x000000, 0.8);
  bg.drawRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  bg.endFill();

  bg.inputEnabled = true;
  bg.item_group = group;
  bg.events.onInputDown.add(dismiss_item_dialog);

  image = game.add.sprite(GAME_WIDTH/2, GAME_HEIGHT * 0.4, 'items/' + circle.item_key);
  group.add(image);
  image.anchor.setTo(0.5, 0.5)

  if(item.text){
    text_style = { fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    text = game.add.text(0, 0, item.text, text_style);
    group.add(text);
    text.setTextBounds(0, GAME_HEIGHT - 300, GAME_WIDTH, 300);
  }
}

function view_sprite_clicked(sprite, point) {
  console.log('You clicked at [' + point.x + ', ' + point.y + ']')
}

function dismiss_item_dialog(bg) {
  bg.item_group.destroy();
}
