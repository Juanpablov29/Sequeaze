let submarine, torpedos, bullets, enemies;
let cursors, fireTorpedoKey, fireBulletKey, restartButton;
let lives = 5;
let score = 0;
let highScore = localStorage.getItem('highScore') ? parseInt(localStorage.getItem('highScore')) : 0;
let hasBeatenRecord = false;
let scoreText, livesText, controlsText, highScoreText;
let lastTorpedoFired = 0;
let lastBulletFired = 0;
let shootSound;
let lifeIcons = [];
let recordMessage;

function preload() {
    this.load.image('background', 'images/background.png');
    this.load.image('submarine', 'images/submarine.png');
    this.load.image('enemySub', 'images/enemy_sub.png');
    this.load.image('fish', 'images/fish.png');
    this.load.image('shark', 'images/shark.png');
    this.load.image('torpedo', 'images/torpedo.png');
    this.load.image('bullet', 'images/bullet.png');
    this.load.image('lifeIcon', 'images/submarine.png');
    this.load.audio('shoot', 'sounds/shoot.wav');
}

function create() {
    this.physics.world.setBounds(0, 0, this.sys.game.config.width, this.sys.game.config.height);

    const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.displayWidth = this.sys.game.config.width;
    bg.displayHeight = this.sys.game.config.height;

    submarine = this.physics.add.sprite(this.sys.game.config.width / 2, this.sys.game.config.height - 100, 'submarine');
    submarine.setCollideWorldBounds(true);
    submarine.setScale(2);
    submarine.setFlipX(true);

    torpedos = this.physics.add.group();
    bullets = this.physics.add.group();
    enemies = this.physics.add.group();

    cursors = this.input.keyboard.createCursorKeys();
    fireTorpedoKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    fireBulletKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    shootSound = this.sound.add('shoot');

    scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '24px', fill: '#fff' });
    livesText = this.add.text(16, 50, 'Vidas:', { fontSize: '24px', fill: '#fff' });
    highScoreText = this.add.text(16, 84, `Récord: ${highScore}`, { fontSize: '24px', fill: '#fff' });

    for (let i = 0; i < lives; i++) {
        const icon = this.add.image(120 + i * 50, 65, 'lifeIcon').setScale(0.5).setDepth(1);
        lifeIcons.push(icon);
    }

    controlsText = this.add.text(this.sys.game.config.width - 220, 16, 'Controles:\nFlechas: Movimiento\nEspacio: Torpedo\nB: Bala', {
        fontSize: '20px', fill: '#fff', backgroundColor: '#00000080'
    });

    this.physics.add.collider(torpedos, enemies, hitEnemy, null, this);
    this.physics.add.collider(bullets, enemies, hitEnemy, null, this);
    this.physics.add.collider(submarine, enemies, hitSubmarine, null, this);

    this.spawnEnemies = spawnEnemies;
    this.spawnEnemies.call(this);

    recordMessage = this.add.text(this.sys.game.config.width / 2, 150, '¡Récord superado!', {
        fontSize: '32px',
        fill: '#00ff00',
        backgroundColor: '#00000080'
    }).setOrigin(0.5).setVisible(false);
}

function update() {
    submarine.setVelocity(0);

    if (cursors.left.isDown) {
        submarine.setVelocityX(-200);
        submarine.setFlipX(false);
    } else if (cursors.right.isDown) {
        submarine.setVelocityX(200);
        submarine.setFlipX(true);
    }

    if (cursors.up.isDown) submarine.setVelocityY(-200);
    if (cursors.down.isDown) submarine.setVelocityY(200);

    if (fireTorpedoKey.isDown && this.time.now > lastTorpedoFired) {
        shootTorpedo(this);
        lastTorpedoFired = this.time.now + 500;
    }

    if (fireBulletKey.isDown && this.time.now > lastBulletFired) {
        shootBullet(this);
        lastBulletFired = this.time.now + 250;
    }

    torpedos.getChildren().forEach(torpedo => {
        if (torpedo.x < 0 || torpedo.x > this.sys.game.config.width) torpedo.destroy();
    });

    bullets.getChildren().forEach(bullet => {
        if (bullet.y < 0) bullet.destroy();
    });
}

function shootTorpedo(scene) {
    const direction = submarine.flipX ? 1 : -1;
    const torpedo = torpedos.create(submarine.x, submarine.y, 'torpedo');
    torpedo.setScale(0.7);
    torpedo.setFlipX(!submarine.flipX);
    torpedo.setVelocityX(400 * direction);
    shootSound.play();
}

function shootBullet(scene) {
    const bullet = bullets.create(submarine.x, submarine.y - 20, 'bullet');
    bullet.setScale(1.8);
    bullet.setVelocityY(-400);
    shootSound.play();
}

function spawnEnemies() {
    const enemyTypes = ['enemySub', 'fish', 'shark'];
    for (let i = 0; i < 5; i++) {
        const randomX = Phaser.Math.Between(50, this.sys.game.config.width - 50);
        const randomType = Phaser.Math.RND.pick(enemyTypes);
        const enemy = enemies.create(randomX, -50, randomType);
        enemy.setAngle(90);
        enemy.setScale(0.7);
        enemy.setVelocityY(Phaser.Math.Between(100, 200));

        if (randomType === 'shark') {
            this.tweens.add({
                targets: enemy,
                x: enemy.x + Phaser.Math.Between(-100, 100),
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    this.time.addEvent({
        delay: 3000,
        callback: spawnEnemies,
        callbackScope: this,
        loop: false
    });
}

function hitEnemy(projectile, enemy) {
    const scene = projectile.scene;
    projectile.destroy();
    enemy.destroy();

    const points = 10;
    score += points;
    scoreText.setText(`Puntos: ${score}`);

    const plusText = scene.add.text(enemy.x, enemy.y, `+${points}`, {
        fontSize: '24px',
        fill: '#00ff00',
        stroke: '#000',
        strokeThickness: 3
    }).setOrigin(0.5);

    scene.time.delayedCall(450, () => {
        plusText.destroy();
    });

    if (!hasBeatenRecord && score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreText.setText(`Récord: ${highScore}`);

        recordMessage.setVisible(true);
        hasBeatenRecord = true;

        scene.time.delayedCall(2000, () => {
            recordMessage.setVisible(false);
        });
    }
}

function hitSubmarine(submarine, enemy) {
    enemy.destroy();
    
    lives--;
    if (lifeIcons[lives]) lifeIcons[lives].setVisible(false); // CORRECTO: después de restar
    
    livesText.setText('Vidas:');
    submarine.setTint(0xff0000);
    
    this.time.delayedCall(500, () => submarine.clearTint());

    if (lives <= 0) {
        gameOver(this);
    }
}


function gameOver(scene) {
    if (!scene.physics.world.isPaused) {
        scene.physics.pause();
        submarine.setTint(0xff0000);

        if (score > highScore) {
            highScore = score;
            localStorage.setItem('highScore', highScore);
        }

        scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000'
        }).setOrigin(0.5);

        createRestartButton(scene);
    }
}

function createRestartButton(scene) {
    restartButton = scene.add.text(scene.sys.game.config.width / 2, scene.sys.game.config.height / 2 + 100, 'REINICIAR', {
        fontSize: '32px',
        fill: '#ffffff',
        backgroundColor: '#00000080',
        padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
        scene.scene.restart();
        lives = 5;
        score = 0;
        hasBeatenRecord = false;
    });
}
