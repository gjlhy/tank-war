/**
 * 输入管理器 - 处理键盘和鼠标输入
 */
class InputManager {
    constructor() {
        // 按键状态
        this.keys = {};

        // 鼠标位置和状态
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.lastClickTime = 0;
        this.clickCooldown = 200; // 点击冷却时间（毫秒）

        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘按下事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        // 键盘释放事件
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // 鼠标移动事件
        const canvas = document.getElementById('gameCanvas');
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // 鼠标按下事件
        canvas.addEventListener('mousedown', (e) => {
            const now = Date.now();
            if (now - this.lastClickTime >= this.clickCooldown) {
                this.isMouseDown = true;
                this.lastClickTime = now;
            }
        });

        // 鼠标释放事件
        canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // 防止右键菜单
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // 窗口失去焦点时重置所有输入
        window.addEventListener('blur', () => {
            this.keys = {};
            this.isMouseDown = false;
        });
    }

    /**
     * 获取当前按下的键
     */
    getKeys() {
        return this.keys;
    }

    /**
     * 获取鼠标位置
     */
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    /**
     * 检查是否点击了鼠标
     */
    isMouseClicked() {
        return this.isMouseDown;
    }

    /**
     * 检查特定键是否被按下
     */
    isKeyPressed(key) {
        return !!this.keys[key];
    }

    /**
     * 获取移动方向（归一化向量）
     */
    getMoveDirection() {
        const dx = (this.keys['d'] || this.keys['D'] ? 1 : 0) -
                   (this.keys['a'] || this.keys['A'] ? 1 : 0);
        const dy = (this.keys['s'] || this.keys['S'] ? 1 : 0) -
                   (this.keys['w'] || this.keys['W'] ? 1 : 0);

        // 归一化（对角线移动时）
        const length = Math.sqrt(dx * dx + dy * dy);
        if (length > 0) {
            return { x: dx / length, y: dy / length };
        }
        return { x: 0, y: 0 };
    }

    /**
     * 检查是否有任何移动键被按下
     */
    isMoving() {
        return this.keys['w'] || this.keys['W'] ||
               this.keys['s'] || this.keys['S'] ||
               this.keys['a'] || this.keys['A'] ||
               this.keys['d'] || this.keys['D'];
    }
}