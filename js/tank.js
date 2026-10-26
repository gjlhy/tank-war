/**
 * 坦克类 - 游戏中的基础坦克对象
 */
class Tank {
    constructor(x, y, color = '#4CAF50', isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = color;
        this.speed = isPlayer ? 3 : 1.5;
        this.angle = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.isPlayer = isPlayer;
        this.lastShot = 0;
        this.shotCooldown = 1000; // 射击冷却时间（毫秒）

        // AI相关属性（仅敌人坦克使用）
        this.targetAngle = 0;
        this.aiState = 'hunting'; // 'hunting', 'attacking', 'evading'
        this.aiDecisionTimer = 0;
        this.aiDecisionInterval = 2000; // AI决策间隔
    }

    /**
     * 更新坦克位置
     */
    update(keys, mouseX, mouseY) {
        if (this.isPlayer) {
            this.handlePlayerInput(keys);
            this.updateAngleFromMouse(mouseX, mouseY);
        } else {
            this.updateAI();
        }

        // 边界检查
        this.checkBoundaries();
    }

    /**
     * 处理玩家输入
     */
    handlePlayerInput(keys) {
        let dx = 0;
        let dy = 0;

        if (keys['w'] || keys['W']) dy = -this.speed;
        if (keys['s'] || keys['S']) dy = this.speed;
        if (keys['a'] || keys['A']) dx = -this.speed;
        if (keys['d'] || keys['D']) dx = this.speed;

        // 对角移动时保持速度一致
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx;
        this.y += dy;
    }

    /**
     * 根据鼠标位置更新坦克朝向
     */
    updateAngleFromMouse(mouseX, mouseY) {
        const dx = mouseX - (this.x + this.width / 2);
        const dy = mouseY - (this.y + this.height / 2);
        this.angle = Math.atan2(dy, dx);
    }

    /**
     * AI行为更新
     */
    updateAI() {
        this.aiDecisionTimer += 16; // 假设60FPS

        if (this.aiDecisionTimer >= this.aiDecisionInterval) {
            this.aiDecisionTimer = 0;
            this.makeAIDecision();
        }

        // 根据AI状态执行行动
        switch (this.aiState) {
            case 'hunting':
                this.moveTowardsTarget();
                break;
            case 'attacking':
                this.maintainAttackDistance();
                break;
            case 'evading':
                this.evadePlayer();
                break;
        }
    }

    /**
     * AI决策逻辑
     */
    makeAIDecision() {
        const distanceToPlayer = this.getDistanceToPlayer();

        if (distanceToPlayer > 300) {
            this.aiState = 'hunting';
        } else if (distanceToPlayer < 150) {
            this.aiState = 'evading';
        } else {
            this.aiState = Math.random() > 0.5 ? 'attacking' : 'hunting';
        }
    }

    /**
     * 移动向目标
     */
    moveTowardsTarget() {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
            this.angle = Math.atan2(dy, dx);
        }
    }

    /**
     * 保持攻击距离
     */
    maintainAttackDistance() {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const targetDistance = 200;

        if (distance > targetDistance + 50) {
            // 太远，靠近
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else if (distance < targetDistance - 50) {
            // 太近，后退
            this.x -= (dx / distance) * this.speed;
            this.y -= (dy / distance) * this.speed;
        }

        this.angle = Math.atan2(dy, dx);
    }

    /**
     * 躲避玩家
     */
    evadePlayer() {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 向远离玩家的方向移动
        if (distance > 0) {
            this.x -= (dx / distance) * this.speed * 1.5;
            this.y -= (dy / distance) * this.speed * 1.5;
            this.angle = Math.atan2(dy, dx) + Math.PI; // 背对玩家
        }
    }

    /**
     * 获取到玩家的距离
     */
    getDistanceToPlayer() {
        const player = game.player;
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 边界检查
     */
    checkBoundaries() {
        const canvas = document.getElementById('gameCanvas');

        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
        if (this.y + this.height > canvas.height) this.y = canvas.height - this.height;
    }

    /**
     * 射击
     */
    shoot() {
        const now = Date.now();
        if (now - this.lastShot >= this.shotCooldown) {
            this.lastShot = now;

            // 计算子弹发射位置（坦克中心）
            const bulletX = this.x + this.width / 2;
            const bulletY = this.y + this.height / 2;

            // 创建子弹
            const bullet = new Bullet(
                bulletX,
                bulletY,
                this.angle,
                this.isPlayer
            );

            return bullet;
        }
        return null;
    }

    /**
     * 受到伤害
     */
    takeDamage(amount) {
        this.health -= amount;
        if (this.health < 0) this.health = 0;
    }

    /**
     * 检查坦克是否存活
     */
    isAlive() {
        return this.health > 0;
    }

    /**
     * 绘制坦克
     */
    draw(ctx) {
        ctx.save();

        // 移动到坦克中心并旋转
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.angle);

        // 绘制坦克主体
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // 绘制坦克炮管
        ctx.fillStyle = '#333';
        ctx.fillRect(0, -5, this.width / 2 + 10, 10);

        // 绘制坦克细节（像素风格）
        ctx.fillStyle = '#555';
        ctx.fillRect(-10, -10, 20, 20);

        ctx.restore();

        // 绘制生命值条
        if (!this.isPlayer || this.health < this.maxHealth) {
            this.drawHealthBar(ctx);
        }
    }

    /**
     * 绘制生命值条
     */
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 6;
        const barY = this.y - 15;

        // 背景
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, barY, barWidth, barHeight);

        // 生命值
        const healthPercent = this.health / this.maxHealth;
        ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' :
                        healthPercent > 0.25 ? '#FFA500' : '#FF4444';
        ctx.fillRect(this.x, barY, barWidth * healthPercent, barHeight);

        // 边框
        ctx.strokeStyle = '#fff';
        ctx.strokeRect(this.x, barY, barWidth, barHeight);
    }

    /**
     * 获取坦克的边界矩形（用于碰撞检测）
     */
    getBounds() {
        return {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };
    }
}