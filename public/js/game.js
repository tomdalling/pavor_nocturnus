
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
  view_key: 'bed_forward',
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

  return group;
}

function path_clicked(circle) {
  state.view_group.destroy()
  state.view_key = circle.next_view_key
  state.view_group = make_view_group(state.view_key)
}

function view_sprite_clicked(sprite, point) {
  console.log('You clicked at [' + point.x + ', ' + point.y + ']')
}
