var game = new Phaser.Game(800, 600, Phaser.AUTO, 'pavor-nocturnus', {
  preload: preload,
  create: create
});

function preload() {
    game.load.image('woteva', 'assets/woteva.jpg');
}

function create() {
    game.add.sprite(0, 0, 'woteva');
}
