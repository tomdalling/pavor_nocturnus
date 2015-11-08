var DEBUG = (window.location.search == "?debug");
var DEBUG_STARTING_GRUNGE_LEVEL = 'reality';
var DEBUG_STARTING_VIEW_KEY = 'livingroom_forward';
var DEBUG_STARTING_INVENTORY = ['knife', 'key', 'cloth'];

var GAME_WIDTH = 1280;
var GAME_HEIGHT = 720;
var GRUNGE_LEVELS = ['normal', 'grunge_01', 'grunge_02']

var AUDIO = {
  grunge_level_normal: { volume: 0.15, },
  grunge_level_grunge_01: { volume: 0.25, },
  grunge_level_grunge_02: { volume: 0.5, },
  grunge_level_reality: {},
  monster_growl: {},
  growl_inside: {},
  scratching: {},
  wakeup: {},
  dogdeath: {},
  ending: {},
  sfx_monster_attack: {},
};

var ITEMS = {
  computer: {
    has_view_image: false,
    action: {
      do_choose: function(){ return state.grunge_level },
      normal:    { do_dialog: 'computer_normal' },
      grunge_01: { do_dialog: 'computer_grunge_01' },
      reality:   { do_dialog: 'computer_reality' },
    }
  },

  computer_flicker: {
    has_view_image: true,
    animation_options: {
      frame_size: [175, 111],
      loop: true,
    },
    only_in_grunge_levels: ['grunge_02'],
    action: { do_dialog: 'computer_grunge_02' },
  },

  key: {
    has_view_image: true,
    action: { do_dialog: 'got_key', do_give: 'key', do_destroy: true },
  },

  knife: {
    has_view_image: true,
    only_in_grunge_levels: ['grunge_01'],
    action: {
      do_dialog: 'got_knife',
      do_give: 'knife',
      do_destroy: true,
      do_grunge_level: 'grunge_02',
    },
  },

  cloth: {
    has_view_image: true,
    only_in_grunge_levels: ['grunge_01'],
    action: { do_dialog: 'got_cloth', do_give: 'cloth', do_destroy: true },
  },

  collar: {
    has_view_image: true,
    action: { do_dialog: 'got_collar', do_destroy: true, do_grunge_level: 'grunge_01' },
  },

  dog_bed: {
    has_view_image: false,
    only_in_grunge_levels: ['normal', 'grunge_01'],
    action: {
      do_choose: function(){ return state.grunge_level },
      normal:    { do_dialog: 'dog_bed_normal' },
      grunge_01: { do_dialog: 'dog_bed_grunge_01' },
    }
  },

  photo: {
    has_view_image: false,
    action: {
      do_choose: function(){ return state.grunge_level; },
      normal:    { do_dialog: 'photo_normal' },
      grunge_01: { do_dialog: 'photo_grunge_01' },
      grunge_02: { do_dialog: 'photo_grunge_02' },
      reality:   { do_dialog: 'photo_reality' },
    },
  },

  lotion: {
    has_view_image: false,
    action: {
      do_choose: function(){ return state.grunge_level; },
      normal:    { do_dialog: 'lotion_normal' },
      grunge_01: { do_dialog: 'lotion_grunge_01' },
      grunge_02: { do_dialog: 'lotion_grunge_02' },
      reality:   { do_dialog: 'lotion_reality' },
    }
  },

  balcony_door: {
    icon: {
      type: 'arrow',
    },
    action: {
      do_choose: function(){
        if(state.grunge_level == 'reality'){
          return 'ending';
        } else {
          return player_has('key') ? 'unlocked' : 'locked';
        }
      },
      locked: { do_dialog: 'balcony_door_locked' },
      unlocked: { do_view: 'balcony' },
      ending: { do_view: 'balcony_ending' },
    }
  },

  corridor_door: {
    icon: { type: 'arrow' },
    action: {
      do_choose: function(){
        if(state.grunge_level == 'grunge_01' && !player_has('cloth')) {
          return 'locked';
        } else {
          return 'unlocked';
        }
      },
      unlocked: { do_view: 'corridor' },
      locked: { do_dialog: 'corridor_door_dirty' },
    }
  },

  balcony_outside_door: {
    icon: {
      type: 'arrow',
      rotation: -75,
    },
    action: {
      do_choose: function(){ return player_has('knife') ? 'ending' : 'go_back' },
      go_back: { do_view: 'livingroom_backward' },
      ending: { do_cutscene: 'monster_fight', do_once: true }
    }
  },

  monster: {
    only_in_grunge_levels: ['grunge_02'],
    has_view_image: true,
    icon: { type: 'none' },
  }
}

var DIALOGS = {

  photo_normal:    { image: true, text: 'My two girls. They must have gone for a walk.' },
  photo_grunge_01: { image: true, text: "They didn't go for a walk, did they?" },
  photo_grunge_02: { image: true, text: 'Sal?' },
  photo_reality:   { image: true, text: "I should have gotten rid of this ages ago." },

  lotion_normal:    { image: true, text: "Is that what makes her smell so damn good?" },
  lotion_grunge_01: { image: true, text: "She forgot to take that." },
  lotion_grunge_02: { image: true, text: "Stupid bitch left that here on purpose. She won't let me forget her." },
  lotion_reality:   { text: "..." },

  dog_bed_normal: { text: "Peach is getting too big for that." },
  dog_bed_grunge_01: { text: "Where is that bloody dog?" },

  computer_normal:    { image: true, text: "They look so good together."},
  computer_grunge_01: { image: true, text: "Did I search that?"},
  computer_reality:   { text: "I can't work now."},
  computer_grunge_02: { image: true, text: "What the hell?", animation_options: {
    frame_size: [600, 500],
    loop: true,
  }},

  corridor_door_dirty: { text: "I'm not touching that." },
  balcony_door_locked: { text: 'The door is locked.' },

  got_key: { image: true },
  got_collar: { image: true, text: "Is that Sal's hair?" },
  got_cloth: { image: true, text: "I'll use this." },
  got_knife: { image: true, text: "How did this get out here?" },

  // view enter_action dialogs
  bed_forward_normal: { text: "It's light out. Why didn't Sal wake me?" },
  hallway_backward_entrance_grunge_01: { text: "What's that scratching?" },
  corridor_grunge_02: { text: '"Hello?"'},
  bed_backward_grunge_02: { text: "Is that me?" },
}

var VIEWS = {
  bed_forward: {
    paths: { bed_backward: [890, 670, 45] },
    enter_action: {
      do_choose: function(){ return state.grunge_level; },
      normal: { do_dialog: 'bed_forward_normal', do_once: true },
    }
  },

  bed_backward: {
    paths: { hallway_forward: [132.5, 663, -120] },
    enter_action: {
      do_choose: function(){ return state.grunge_level; },
      grunge_02: { do_dialog: 'bed_backward_grunge_02', do_once: true },
    }
  },

  hallway_forward: {
    paths: {
      bed_backward: [380, 313, 10],
      bathroom: [1160, 580, 20],
      livingroom_forward: [143, 472, 0],
      hallway_backward_entrance: [672, 680, 160],
    },
    sounds: {
      scratching: {
        looping: true,
        volume: 0.5,
        only_in_grunge_levels: ['grunge_01'],
      }
    }
  },

  livingroom_forward: {
    paths: {
      hallway_backward_couch: [641, 678, 190],
    },
    items: {
      computer: [597, 289],
      computer_flicker: [597, 289],
      photo: [123, 166],
      key: [260, 248],
      balcony_door: [1225, 260],
    },
    sounds: {
      monster_growl: {
        looping: true,
        volume: 0.15,
        only_in_grunge_levels: ['grunge_02'],
      }
    }
  },

  balcony: {
    paths: {},
    items: {
      balcony_outside_door: [102.5, 668],
      monster: [720, 516],
      dog_bed: [650, 668],
    },
    sounds: {
      growl_inside: {
        looping: true,
        only_in_grunge_levels: ['grunge_02'],
      },
    }
  },

  balcony_ending: {
    skip_view_loading: true,
    paths: {},
    enter_action: { do_cutscene: 'dead_dog' },
  },

  livingroom_backward: {
    paths: { hallway_backward_couch: [979, 106] },
    items: { collar: [915, 434] },
  },

  hallway_backward_entrance: {
    paths: {
      hallway_forward: [658, 670, 180],
      bathroom: [268, 343, -90],
    },
    items: { corridor_door: [540, 312] },
    enter_action: {
      do_choose: function(){ return state.grunge_level; },
      grunge_01: { do_dialog: 'hallway_backward_entrance_grunge_01', do_once: true },
    },
    sounds: {
      scratching: {
        looping: true,
        volume: 1.2,
        only_in_grunge_levels: ['grunge_01'],
      }
    }
  },

  hallway_backward_couch: {
    paths: {
      hallway_backward_entrance: [735, 571, 0],
      livingroom_forward: [50, 340, -90],
    }
  },

  corridor: {
    paths: { hallway_backward_entrance: [667, 680, 180] },
    items: { knife: [725, 541] },
    enter_action: {
      do_choose: function(){ return state.grunge_level; },
      grunge_02: { do_dialog: 'corridor_grunge_02', do_once: true },
    }
  },

  bathroom: {
    paths: { hallway_forward: [675, 670, 170] },
    items: {
      lotion: [1072, 292],
      cloth: [1185, 475],
    },
    sounds: {
      scratching: {
        looping: true,
        volume: 0.5,
        only_in_grunge_levels: ['grunge_01'],
      }
    }
  }
}

var state = {
  view_key: (DEBUG ? DEBUG_STARTING_VIEW_KEY : 'bed_forward'),
  inventory: (DEBUG ? DEBUG_STARTING_INVENTORY : []),
  grunge_level: (DEBUG ? DEBUG_STARTING_GRUNGE_LEVEL : GRUNGE_LEVELS[0]),

  view_group: null,
  view_sounds: [],
  dialog_group: null,
  last_click: null,
  preload_sprite: null,
  grunge_level_audio: null,
}

function preload() {
  state.preload_sprite = game.add.sprite(0, 0, 'loading');
  game.load.setPreloadSprite(state.preload_sprite, 1);

  _.each(VIEWS, function(view, view_key){
    if(!view.skip_view_loading){
      _.each(GRUNGE_LEVELS, function(grunge_level){
        game.load.image('views/'+grunge_level+'/'+view_key, 'assets/views/'+grunge_level+'/'+view_key+'.jpg');
      });
    }
  });

  _.each(ITEMS, function(item, item_key){
    if(item.has_view_image){
      key = 'items/' + item_key;
      path = 'assets/items/'+item_key+'.png';
      preload_sprite(key, path, item.animation_options);
    }
  });

  _.each(DIALOGS, function(dialog, dialog_key){
    if(dialog.image){
      key = 'dialogs/'+dialog_key;
      path = 'assets/dialogs/'+dialog_key+'.png';
      preload_sprite(key, path, dialog.animation_options);
    }
  })

  _.each(AUDIO, function(options, key){
    game.load.audio(key, 'assets/audio/'+key+'.ogg');
  });

  game.load.image('icons/circle', 'assets/icon_circle.png');
  game.load.image('icons/arrow', 'assets/icon_arrow.png');
  game.load.image('monster_close', 'assets/monster_close.png');
  game.load.image('title_screen', 'assets/title_screen.jpg');
  game.load.image('views/normal/balcony_ending', 'assets/views/normal/balcony_ending.jpg');

  //TODO: download these js files and serve them locally (in case they change)
  game.load.script('filterX', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurX.js');
  game.load.script('filterY', 'https://cdn.rawgit.com/photonstorm/phaser/master/filters/BlurY.js');
}

function preload_sprite(key, path, animation_options) {
  if(animation_options){
    size = animation_options.frame_size
    game.load.spritesheet(key, path, size[0], size[1]);
  } else {
    game.load.image(key, path);
  }
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

function render() {
  if(DEBUG){
    game.debug.text(state.view_key, 10, 20, 'red');
    game.debug.text('Inventory: ' + state.inventory.join(', '), 10, 40, 'red');
    if(state.last_click){
      game.debug.text("Last clicked at: [" + state.last_click[0] + ", " + state.last_click[1] + "]", 10, 60, 'red');
    }
  }
}

function start_game() {
  state.preload_sprite.destroy();
  state.preload_sprite = null;

  play_grunge_level_audio(state.grunge_level);

  state.view_group = make_view_group(state.view_key, state.grunge_level);
  after_entering_view(state.view_key);
  if(!DEBUG){
    game.add.tween(state.view_group).from({alpha: 0}, 2000, 'Linear', true);
  }
}

function play_grunge_level_audio(level) {
  if(state.grunge_level_audio){
    var old = state.grunge_level_audio;
    old.fadeOut(3000);
    old.onFadeComplete.add(function(){ old.stop(); });
  }

  key = 'grunge_level_' + level
  bg_audio = game.add.audio(key);
  bg_audio.onDecoded.add(function(){
    bg_audio.loopFull(0);
    bg_audio.fadeTo(3000, AUDIO[key].volume || 1);
  });

  state.grunge_level_audio = bg_audio;
}

function player_has(thing) {
  return _.contains(state.inventory, thing);
}

function make_view_group(view_key, grunge_level) {
  group = game.add.group()

  g = (grunge_level == 'reality' ? 'normal' : grunge_level);
  view_sprite = game.add.sprite(0, 0, 'views/'+g+'/'+view_key);
  view_sprite.inputEnabled = true
  view_sprite.events.onInputDown.add(view_sprite_clicked);
  group.add(view_sprite);

  v = VIEWS[view_key];
  if(!v){
    console.log("No view with key: " + view_key)
  }

  _.each(v.paths, function(coord, adj_vk){
    icon = make_icon({type: 'arrow', rotation: coord[2]})
    icon.x = coord[0];
    icon.y = coord[1];
    icon.inputEnabled = true;
    icon.events.onInputDown.add(function(){ move_to_view(adj_vk) });
    group.add(icon);
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
      var sprite = make_sprite('items/'+item_key, item.animation_options);
      group.add(sprite);
    }

    var icon = make_icon(item.icon);
    if(icon){
      group.add(icon);
      icon.inputEnabled = true;
      icon.events.onInputDown.add(function(){
        if(!state.dialog_group){
          item = get_item(item_key);
          perform_action(item.action, item, group);
        }
      });
    }

    return group;
}

function make_sprite(key, animation_options) {
  var sprite = game.add.sprite(0, 0, key);
  sprite.anchor.setTo(0.5, 0.5);

  if(animation_options){
    frames = animation_options.frames || null;
    fps = animation_options.fps || 10;
    loop = animation_options.loop || false;
    sprite.animations.add('default', frames, fps, loop);
    sprite.play('default');
  }

  return sprite;
}

function make_icon(options){
  options = options || {}
  type = options.type || 'circle'
  rotation = options.rotation || 0

  if(type == 'none') return null;

  icon = game.add.sprite(0, 0, 'icons/'+type);
  icon.rotation = game.math.degToRad(rotation);
  icon.anchor.setTo(0.5, 0.5);
  icon.alpha = 0.5;
  return icon;
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
  after_entering_view(view_key);
}

function after_entering_view(view_key) {
  view = VIEWS[view_key];

  if(view.enter_action){
    perform_action(view.enter_action);
  }

  stop_all_view_sounds();
  if(view.sounds)
    play_view_sounds(view.sounds, view);
}

function play_view_sounds(sounds, view){
  _.each(sounds, function(options, sound_key){
    if(!options.only_in_grunge_levels || _.contains(options.only_in_grunge_levels, state.grunge_level) ){
      instance = game.add.audio(sound_key);
      state.view_sounds.push(instance);

      instance.onDecoded.add(function(){
        instance.play(undefined, undefined, 0, (options.looping || false));
        instance.fadeTo(500, options.volume || 1);
      });
    }
  });
}

function stop_all_view_sounds() {
  _.each(state.view_sounds, function(instance){
    instance.fadeOut(500);
    instance.onFadeComplete.add(function(){ instance.stop(); });
  });

  state.view_sounds = [];
}

function perform_action(action, item, sprite) {
  if(!action) return;
  if(action.already_done) return;

  if(action.do_once){
    action.already_done = true;
  }

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
  stop_all_view_sounds();
  stab_sound = game.add.audio('dogdeath');
  attack_sound = game.add.audio('sfx_monster_attack');

  game.time.events.add(3000, function(){
    monster = game.add.sprite(GAME_WIDTH/2, GAME_HEIGHT, 'monster_close');
    state.view_group.add(monster);
    monster.anchor.setTo(0.5, 1.0);
    tween = game.add.tween(monster.scale).from({x: 0.6, y: 0.6}, 200, 'Bounce.easeOut', true);

    stab_sound.play();
    attack_sound.play();

    tween.onComplete.add(function(){
      state.view_group.visible = false;
      game.time.events.add(8000, function(){
        move_to_view('bed_forward')
        transition_to_grunge_level('reality');
      });
    });

  });
}

function dead_dog_cutscene(){
  sound = game.add.sound('ending');
  sound.onDecoded.add(function(){ sound.play() });
  game.time.events.add(7000, function(){
    roll_credits();
    sound.fadeOut(5000);
  });
}

function roll_credits(){
  state.view_group.destroy();
  title = game.add.image(0, 0, 'title_screen');

  credits = "Nick Williams (nickwill82@gmail.com)\n" +
            "Danaë Williams\n" +
            "Tom Dalling (@tom_dalling)";

  credits_sprite = game.add.text(0, 0, credits, {
    fill: "white",
    boundsAlignH: "center",
    boundsAlignV: "middle",
  });
  credits_sprite.setTextBounds(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
  credits_sprite.setShadow(5, 5, 'rgba(0,0,0,0.7)', 15);
  credits_sprite.fontSize = 25;

  text_sprite = game.add.text(GAME_WIDTH/2, GAME_HEIGHT*0.68,  "A spooki game by BAE Collective", {
    fill: 'white',
    align: 'center',
  });
  text_sprite.anchor.setTo(0.5, 1.0);
  text_sprite.setShadow(5, 5, 'rgba(0,0,0,0.7)', 15);
  text_sprite.fontSize = 20;
}

function transition_to_grunge_level(new_grunge_level, animate) {
  animate = (typeof animate == 'undefined' ? true : animate);
  var old_view = state.view_group;

  state.grunge_level = new_grunge_level;
  state.view_group = make_view_group(state.view_key, state.grunge_level);
  state.view_group.filters = old_view.filters;
  game.world.sendToBack(state.view_group);

  play_grunge_level_audio(new_grunge_level);

  if(animate){
    tween = game.add.tween(old_view).to({alpha: 0}, 3000, "Linear", true);
    tween.onComplete.add(function(){
      old_view.destroy();
    });
  } else {
    old_view.destroy();
  }
}

function show_dialog(dialog_key, sprite) {
  group = game.add.group();
  state.dialog_group = group;
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
    var image = make_sprite('dialogs/' + dialog_key, dialog.animation_options);
    group.add(image);

    image_h_space = dialog.text ? GAME_HEIGHT * 0.8 : GAME_HEIGHT
    image.x = GAME_WIDTH/2;
    image.y = image_h_space/2;

    game.add.tween(image).from({ y: sprite.y, x: sprite.x, alpha: 0 }, 700, "Linear", true);
    game.add.tween(image.scale).from({ y: 0.2, x: 0.2 }, 700, "Linear", true);
  }

  // show text (if available)
  if(dialog.text){
    text_h_space = dialog.image ? GAME_HEIGHT * 0.2 : GAME_HEIGHT;
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
    state.dialog_group = null;
    state.view_group.filters = null;
  })
}

function view_sprite_clicked(sprite, point) {
  state.last_click = [point.x, point.y];
}

var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'pavor-nocturnus')
game.state.add('boot', {
  preload: function() {
    game.scale.maxWidth = 1280;
    game.scale.maxHeight = 720;
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    game.load.image('loading', 'assets/loading.jpg');
  },
  create: function() {
    game.state.start('game');
    window.scrollTo(0, 1); //gets rid of the android address bar
  }
});
game.state.add('game', {
  preload: preload,
  create: create,
  render: render,
});
game.state.start('boot');
