// 获取canvas和context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// 游戏配置
const GRID_SIZE = 20; // 网格大小
const TILE_COUNT = canvas.width / GRID_SIZE; // 网格数量
const INITIAL_SPEED = 100; // 初始速度(ms)

// 游戏状态
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop = null;
let isGameRunning = false;
let isPaused = false;

// DOM元素
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const restartBtn = document.getElementById('restartBtn');

// 初始化高分显示
highScoreElement.textContent = highScore;

// 初始化游戏
function initGame() {
    // 初始化蛇的位置(中心位置)
    snake = [
        { x: 10, y: 10 },
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];

    // 初始化方向(向右)
    dx = 1;
    dy = 0;

    // 初始化分数
    score = 0;
    scoreElement.textContent = score;

    // 生成食物
    generateFood();

    // 清除画布
    clearCanvas();

    // 绘制初始状态
    drawSnake();
    drawFood();
}

// 生成食物
function generateFood() {
    let foodPosition;
    let isOnSnake;

    do {
        isOnSnake = false;
        foodPosition = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };

        // 检查食物是否生成在蛇身上
        for (let segment of snake) {
            if (segment.x === foodPosition.x && segment.y === foodPosition.y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);

    food = foodPosition;
}

// 清除画布
function clearCanvas() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// 绘制蛇
function drawSnake() {
    snake.forEach((segment, index) => {
        // 蛇头颜色更深
        if (index === 0) {
            ctx.fillStyle = '#2E7D32';
        } else {
            ctx.fillStyle = '#4CAF50';
        }

        ctx.fillRect(
            segment.x * GRID_SIZE,
            segment.y * GRID_SIZE,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );

        // 添加圆角效果
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            segment.x * GRID_SIZE,
            segment.y * GRID_SIZE,
            GRID_SIZE - 2,
            GRID_SIZE - 2
        );
    });
}

// 绘制食物
function drawFood() {
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2,
        food.y * GRID_SIZE + GRID_SIZE / 2,
        GRID_SIZE / 2 - 2,
        0,
        2 * Math.PI
    );
    ctx.fill();

    // 添加高光效果
    ctx.fillStyle = '#FFCDD2';
    ctx.beginPath();
    ctx.arc(
        food.x * GRID_SIZE + GRID_SIZE / 2 - 3,
        food.y * GRID_SIZE + GRID_SIZE / 2 - 3,
        GRID_SIZE / 4,
        0,
        2 * Math.PI
    );
    ctx.fill();
}

// 移动蛇
function moveSnake() {
    // 计算新的头部位置
    const head = {
        x: snake[0].x + dx,
        y: snake[0].y + dy
    };

    // 将新头部添加到数组开头
    snake.unshift(head);

    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;

        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            localStorage.setItem('snakeHighScore', highScore);
        }

        // 生成新食物
        generateFood();
    } else {
        // 如果没吃到食物,移除尾部
        snake.pop();
    }
}

// 检查碰撞
function checkCollision() {
    const head = snake[0];

    // 检查是否撞墙
    if (head.x < 0 || head.x >= TILE_COUNT ||
        head.y < 0 || head.y >= TILE_COUNT) {
        return true;
    }

    // 检查是否撞到自己
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }

    return false;
}

// 游戏循环
function gameUpdate() {
    if (isPaused) return;

    moveSnake();

    // 检查碰撞
    if (checkCollision()) {
        gameOver();
        return;
    }

    // 清除画布并重绘
    clearCanvas();
    drawFood();
    drawSnake();
}

// 开始游戏
function startGame() {
    if (isGameRunning && !isPaused) return;

    if (!isGameRunning) {
        initGame();
        isGameRunning = true;
    }

    isPaused = false;
    gameLoop = setInterval(gameUpdate, INITIAL_SPEED);

    startBtn.disabled = true;
    pauseBtn.disabled = false;
}

// 暂停游戏
function pauseGame() {
    if (!isGameRunning) return;

    if (isPaused) {
        isPaused = false;
        gameLoop = setInterval(gameUpdate, INITIAL_SPEED);
        pauseBtn.textContent = '暂停';
    } else {
        isPaused = true;
        clearInterval(gameLoop);
        pauseBtn.textContent = '继续';
    }
}

// 游戏结束
function gameOver() {
    clearInterval(gameLoop);
    isGameRunning = false;
    isPaused = false;

    // 在画布上显示游戏结束
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 20);

    ctx.font = '20px Arial';
    ctx.fillText('得分: ' + score, canvas.width / 2, canvas.height / 2 + 20);

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
}

// 重新开始游戏
function restartGame() {
    clearInterval(gameLoop);
    isGameRunning = false;
    isPaused = false;

    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';

    initGame();
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    // 防止方向键滚动页面
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }

    // 空格键暂停/继续
    if (e.key === ' ') {
        pauseGame();
        return;
    }

    if (!isGameRunning || isPaused) return;

    switch(e.key) {
        case 'ArrowUp':
            if (dy === 0) { // 防止反向移动
                dx = 0;
                dy = -1;
            }
            break;
        case 'ArrowDown':
            if (dy === 0) {
                dx = 0;
                dy = 1;
            }
            break;
        case 'ArrowLeft':
            if (dx === 0) {
                dx = -1;
                dy = 0;
            }
            break;
        case 'ArrowRight':
            if (dx === 0) {
                dx = 1;
                dy = 0;
            }
            break;
    }
});

// 按钮事件
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);

// 初始化游戏
initGame();
