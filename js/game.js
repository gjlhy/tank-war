/**
 * 游戏主逻辑管理器
 */
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // 游戏状态
        this.state = 'menu'; // 'menu', 'playing', 'paused', 'gameOver'
        this.score = 0;
        this.wave = 1;
        this.enemiesPerWave = 3;

        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];

        // 输入管理器
        this.input = new InputManager();

        // 游戏计时器
        this.lastEnemySpawn = 0;
        this.enemySpawnDelay = 3000;

        // 初始化游戏
        this.init();
    }

    /**
     * 初始化游戏
     */
    init() {
        // 创建玩家坦克
        this.player = new Tank(
            this.canvas.width / 2,
            this.canvas.height - 100,
            '#4CAF50',
            true
        );

        // 生成第一波敌人
        this.spawnWave();

        // 设置UI事件监听
        this.setupUIEvents();

        // 开始游戏循环
        this.gameLoop();
    }

    /**
     * 设置UI事件
     */
    setupUIEvents() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const restartBtn = document.getElementById('restartBtn');

        startBtn.addEventListener('click', () => {
            if (this.state === 'menu' || this.state === 'gameOver') {
                this.startGame();
            }
        });

        pauseBtn.addEventListener('click', () => {
            if (this.state === 'playing') {
                this.pauseGame();
            } else if (this.state === 'paused') {
                this.resumeGame();
            }
        });

        restartBtn.addEventListener('click', () => {
            this.restartGame();
        });
    }

    /**
     * 开始游戏
     */
    startGame() {
        this.state = 'playing';
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        document.getElementById('gameOver').classList.add('hidden');
    }

    /**
     * 暂停游戏
     */
    pauseGame() {
        this.state = 'paused';
        document.getElementById('pauseBtn').textContent = '继续';
    }

    /**
     * 继续游戏
     */
    resumeGame() {
        this.state = 'playing';
        document.getElementById('pauseBtn').textContent = '暂停';
    }

    /**
     * 重新开始游戏
     */
    restartGame() {
        // 重置游戏状态
        this.state = 'menu';
        this.score = 0;
        this.wave = 1;

        // 清空游戏对象
        this.enemies = [];
        this.bullets = [];
        this.explosions = [];

        // 重置玩家
        this.player.health = this.player.maxHealth;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height - 100;

        // 生成第一波敌人
        this.spawnWave();

        // 重置UI
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = '暂停';
        document.getElementById('gameOver').classList.add('hidden');
        this.updateUI();
    }

    /**
     * 生成一波敌人
     */
    spawnWave() {
        this.enemies = [];
        for (let i = 0; i < this.enemiesPerWave; i++) {
            const x = Math.random() * (this.canvas.width - 40);
            const y = Math.random() * 200; // 在上半部分生成
            const enemy = new Tank(x, y, '#FF4444', false);
            this.enemies.push(enemy);
        }
    }

    /**
     * 游戏主循环
     */
    gameLoop() {
        // 清空画布
        this.ctx.fillStyle = '#0f0f0f';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格背景
        this.drawGrid();

        if (this.state === 'playing') {
            // 更新游戏逻辑
            this.update();
        }

        // 绘制游戏对象
        this.draw();

        // 绘制UI覆盖层
        if (this.state === 'paused') {
            this.drawPauseOverlay();
        }

        // 继续循环
        requestAnimationFrame(() => this.gameLoop());
    }

    /**
     * 更新游戏逻辑
     */
    update() {
        const keys = this.input.getKeys();
        const mousePos = this.input.getMousePosition();

        // 更新玩家
        if (this.player.isAlive()) {
            this.player.update(keys, mousePos.x, mousePos.y);

            // 玩家射击
            if (this.input.isMouseClicked()) {
                const bullet = this.player.shoot();
                if (bullet) {
                    this.bullets.push(bullet);
                }
            }
        } else {
            // 玩家死亡，游戏结束
            this.gameOver();
        }

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.isAlive()) {
                enemy.update(keys, mousePos.x, mousePos.y);

                // 敌人射击
                if (Math.random() < 0.01) { // 1% 概率每帧射击
                    const bullet = enemy.shoot();
                    if (bullet) {
                        this.bullets.push(bullet);
                    }
                }
            } else {
                // 敌人死亡
                this.explosions.push(new Explosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2
                ));
                this.enemies.splice(i, 1);
                this.score += 100;

                // 检查是否需要生成新的一波
                if (this.enemies.length === 0) {
                    this.wave++;
                    this.enemiesPerWave = Math.min(this.enemiesPerWave + 1, 10);
                    setTimeout(() => this.spawnWave(), 2000);
                }
            }
        }

        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update();

            // 检查是否超出边界
            if (bullet.isOutOfBounds(this.canvas)) {
                this.bullets.splice(i, 1);
                continue;
            }

            // 碰撞检测
            if (bullet.isPlayerBullet) {
                // 检查子弹是否击中敌人
                for (const enemy of this.enemies) {
                    if (this.checkCollision(bullet.getBounds(), enemy.getBounds())) {
                        enemy.takeDamage(bullet.damage);
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            } else {
                // 检查子弹是否击中玩家
                if (this.player.isAlive() &&
                    this.checkCollision(bullet.getBounds(), this.player.getBounds())) {
                    this.player.takeDamage(bullet.damage);
                    this.bullets.splice(i, 1);
                }
            }
        }

        // 更新爆炸效果
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            if (!this.explosions[i].update()) {
                this.explosions.splice(i, 1);
            }
        }

        // 更新UI
        this.updateUI();
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        // 绘制玩家
        if (this.player.isAlive()) {
            this.player.draw(this.ctx);
        }

        // 绘制敌人
        for (const enemy of this.enemies) {
            if (enemy.isAlive()) {
                enemy.draw(this.ctx);
            }
        }

        // 绘制子弹
        for (const bullet of this.bullets) {
            bullet.draw(this.ctx);
        }

        // 绘制爆炸效果
        for (const explosion of this.explosions) {
            explosion.draw(this.ctx);
        }
    }

    /**
     * 绘制网格背景
     */
    drawGrid() {
        this.ctx.strokeStyle = '#1a1a1a';
        this.ctx.lineWidth = 1;

        // 垂直线
        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // 水平线
        for (let y = 0; y < this.canvas.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * 绘制暂停覆盖层
     */
    drawPauseOverlay() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = '48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('游戏暂停', this.canvas.width / 2, this.canvas.height / 2);

        this.ctx.font = '24px Arial';
        this.ctx.fillText('按空格键继续', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }

    /**
     * 碰撞检测（矩形和圆形）
     */
    checkCollision(obj1, obj2) {
        if (obj1.radius && obj2.radius) {
            // 圆形与圆形碰撞
            const dx = obj1.centerX - obj2.centerX;
            const dy = obj1.centerY - obj2.centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance < obj1.radius + obj2.radius;
        } else if (obj1.radius) {
            // 圆形与矩形碰撞
            return this.circleRectCollision(obj1, obj2);
        } else if (obj2.radius) {
            // 矩形与圆形碰撞
            return this.circleRectCollision(obj2, obj1);
        } else {
            // 矩形与矩形碰撞
            return obj1.x < obj2.x + obj2.width &&
                   obj1.x + obj1.width > obj2.x &&
                   obj1.y < obj2.y + obj2.height &&
                   obj1.y + obj1.height > obj2.y;
        }
    }

    /**
     * 圆形与矩形碰撞检测
     */
    circleRectCollision(circle, rect) {
        let closestX = Math.max(rect.x, Math.min(circle.centerX, rect.x + rect.width));
        let closestY = Math.max(rect.y, Math.min(circle.centerY, rect.y + rect.height));

        const dx = circle.centerX - closestX;
        const dy = circle.centerY - closestY;

        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }

    /**
     * 更新UI显示
     */
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('health').textContent = this.player.health;

        // 更新波数显示
        const title = document.querySelector('header h1');
        title.textContent = `坦克大战 - 第 ${this.wave} 波`;
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.state = 'gameOver';
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOver').classList.remove('hidden');
        document.getElementById('pauseBtn').disabled = true;
    }
}

// 全局游戏实例
let game;

// 页面加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});