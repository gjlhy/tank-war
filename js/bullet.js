/**
 * 子弹类
 */
class Bullet {
    constructor(x, y, angle, isPlayerBullet = true) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 8;
        this.radius = 4;
        this.isPlayerBullet = isPlayerBullet;
        this.damage = isPlayerBullet ? 25 : 20;

        // 计算速度分量
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;

        // 子弹视觉属性
        this.color = isPlayerBullet ? '#FFD700' : '#FF4444';
        this.trail = []; // 子弹轨迹
        this.maxTrailLength = 5;
    }

    /**
     * 更新子弹位置
     */
    update() {
        // 保存轨迹
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }

        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
    }

    /**
     * 检查子弹是否超出边界
     */
    isOutOfBounds(canvas) {
        return this.x < 0 || this.x > canvas.width ||
               this.y < 0 || this.y > canvas.height;
    }

    /**
     * 绘制子弹
     */
    draw(ctx) {
        // 绘制轨迹
        ctx.strokeStyle = this.color;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;

        // 绘制子弹主体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制子弹光晕效果
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2
        );
        gradient.addColorStop(0, this.color + '88');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 获取子弹的边界圆（用于碰撞检测）
     */
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2,
            radius: this.radius,
            centerX: this.x,
            centerY: this.y
        };
    }
}

/**
 * 爆炸效果类
 */
class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = 30;
        this.speed = 2;
        this.opacity = 1;
        this.color = '#FF6B35';
    }

    update() {
        this.radius += this.speed;
        this.opacity = 1 - (this.radius / this.maxRadius);
        return this.radius < this.maxRadius;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // 外圈
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 内圈
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // 核心
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}