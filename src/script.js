import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import backgroundMusicUrl from '/music.mp3'
import lineClearSoundUrl from '/line_clear.mp3'

document.addEventListener("DOMContentLoaded", () => {
    const backgroundMusic = new Audio(backgroundMusicUrl);
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5;

    const lineClearSound = new Audio(lineClearSoundUrl);
    lineClearSound.volume = 0.3;

    // Three.js setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    scene.background = new THREE.Color(0x1a1a2e);

    // Improved lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 15);
    scene.add(directionalLight);

    const orbitControls = new OrbitControls(camera, renderer.domElement);

    // Adjust camera for better view of borders
    camera.position.set(10, 0, 25);
    camera.lookAt(0, 0, 0);

    orbitControls.update();

    const tetrominoes = {
        I: [[1,1,1,1]],
        J: [[0,0,1],[1,1,1]],
        L: [[1,0,0],[1,1,1]],
        O: [[1,1],[1,1]],
        S: [[0,1,1],[1,1,0]],
        T: [[0,1,0],[1,1,1]],
        Z: [[1,1,0],[0,1,1]]
    };

    const colors = {
        I: 0x01EDFA,
        J: 0x2E2E84,
        L: 0xFFC82E,
        O: 0xFEFB34,
        S: 0x53DA3F,
        T: 0xDD0AB2,
        Z: 0xFD3F59
    };

    let isGameRunning = false;
    let gameScore = 0;
    let timerId = 0;
    let currentTetromino;
    
    const blockSize = 1;
    const rows = 20;
    const columns = 10;
    
    const board = Array.from({length: rows}, () => Array(columns).fill(0));
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    const borderBlocksGroup = new THREE.Group();
        
    function createBorders() {
        const borderBlockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
        const borderBlockMaterial = new THREE.MeshPhongMaterial({ color: "#58888a" });
    
        // Create a group specifically for border blocks
        scene.add(borderBlocksGroup);  // Add to scene instead of boardGroup
    
        for (let x = -1; x <= columns; x++) {
            for (let y = -1; y <= rows; y++) {
                // Create border blocks for side and bottom walls
                if (x === -1 || x === columns || y === -1 || y === rows) {
                    const mesh = new THREE.Mesh(borderBlockGeometry, borderBlockMaterial);
                    mesh.position.set(
                        (x - columns/2) * blockSize,
                        (y - rows/2) * blockSize,
                        0
                    );
                    borderBlocksGroup.add(mesh);
                }
            }
        }
    
        // Wire frame border remains the same
        const borderLineMaterial = new THREE.LineBasicMaterial({ color: "#919191" });
        const edgeGeometry = new THREE.BoxGeometry(columns, rows, blockSize);
        const edges = new THREE.EdgesGeometry(edgeGeometry);
        const borderLines = new THREE.LineSegments(edges, borderLineMaterial);
        
        borderLines.position.set(-0.5, -0.5, 0);
        borderBlocksGroup.add(borderLines);
    }
    createBorders();

    // Create background grid
    const gridGeometry = new THREE.BoxGeometry(columns, rows, 0.1);
    const gridMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x222222,
        transparent: true,
        opacity: 0.3
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    gridMesh.position.set(-0.5, -0.5, -0.1);
    boardGroup.add(gridMesh);

    // Create block geometry and materials
    const blockGeometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const materials = {};
    for (const [type, colorHex] of Object.entries(colors)) {
        materials[type] = new THREE.MeshPhongMaterial({ color: colorHex });
    }

    function createBlock(x, y, colorHex) {
        const material = new THREE.MeshPhongMaterial({ color: colorHex });
        const mesh = new THREE.Mesh(blockGeometry, material);
        mesh.position.set(
            (x - columns/2) * blockSize,
            (y - rows/2) * blockSize,
            0
        );
        return mesh;
    }

    function newTetromino() {
        const types = Object.keys(tetrominoes);
        const type = types[Math.floor(Math.random() * types.length)];
        
        currentTetromino = {
            shape: tetrominoes[type],
            x: Math.floor(columns / 2) - Math.floor(tetrominoes[type][0].length / 2),
            y: rows - 1, // Start from top
            type,
            blocks: new THREE.Group()
        };

        drawTetromino();
        boardGroup.add(currentTetromino.blocks);

        // Check for game over
        if (collisionDetected(currentTetromino.shape, currentTetromino.x, currentTetromino.y)) {
            isGameRunning = false;
            clearInterval(timerId);
            displayGameOver();
            return false;
        }
        return true;
    }

    function drawTetromino() {
        while (currentTetromino.blocks.children.length) {
            currentTetromino.blocks.remove(currentTetromino.blocks.children[0]);
        }
        
        currentTetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const block = createBlock(
                        x + currentTetromino.x,
                        currentTetromino.y - y, // Inverted y for correct vertical orientation
                        colors[currentTetromino.type]
                    );
                    currentTetromino.blocks.add(block);
                }
            });
        });
    }

    function updateBoard() {
        const blocksToRemove = [];
        boardGroup.children.forEach(child => {
            if (child instanceof THREE.Mesh && child !== gridMesh) {
                blocksToRemove.push(child);
            }
        });
        blocksToRemove.forEach(block => boardGroup.remove(block));

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                if (board[y][x]) {
                    const block = createBlock(x, y, board[y][x]);
                    boardGroup.add(block);
                }
            }
        }
    }

    function collisionDetected(tetromino, offsetX, offsetY) {
        return tetromino.some((row, y) => {
            return row.some((value, x) => {
                if (value) {
                    const newX = x + offsetX;
                    const newY = offsetY - y; // Inverted for vertical orientation
                    return (
                        newX < 0 || 
                        newX >= columns || 
                        newY < 0 || 
                        newY >= rows || 
                        (newY >= 0 && board[newY][newX])
                    );
                }
                return false;
            });
        });
    }

    function mergeTetromino() {
        currentTetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value) {
                    const boardY = currentTetromino.y - y; // Inverted for vertical orientation
                    if (boardY >= 0 && boardY < rows) {
                        board[boardY][x + currentTetromino.x] = colors[currentTetromino.type];
                    }
                }
            });
        });
        boardGroup.remove(currentTetromino.blocks);
        updateBoard();
        checkLines();
    }

    function moveLeft() {
        if (!collisionDetected(currentTetromino.shape, currentTetromino.x - 1, currentTetromino.y)) {
            currentTetromino.x--;
            drawTetromino();
        }
    }

    function moveRight() {
        if (!collisionDetected(currentTetromino.shape, currentTetromino.x + 1, currentTetromino.y)) {
            currentTetromino.x++;
            drawTetromino();
        }
    }

    function moveDown() {
        if (!collisionDetected(currentTetromino.shape, currentTetromino.x, currentTetromino.y - 1)) {
            currentTetromino.y--;
            drawTetromino();
            return true;
        } else {
            mergeTetromino();
            return newTetromino();
        }
    }

    function rotateMatrix(matrix) {
        const N = matrix.length;
        const M = matrix[0].length;
        return Array.from(
            {length: M},
            (_, i) => Array.from(
                {length: N},
                (_, j) => matrix[N - 1 - j][i]
            )
        );
    }

    function rotateTetromino() {
        const tempShape = rotateMatrix(currentTetromino.shape);
        if (!collisionDetected(tempShape, currentTetromino.x, currentTetromino.y)) {
            currentTetromino.shape = tempShape;
            drawTetromino();
        }
    }

    function checkLines() {
        const completedLines = [];
        for (let y = 0; y < rows; y++) {
            if (board[y].every(cell => cell)) {
                completedLines.push(y);
            }
        }
    
        if (completedLines.length > 0) {
            isGameRunning = false;
    
            let blinkCount = 0;
            const blinkInterval = setInterval(() => {
                completedLines.forEach(lineY => {
                    board[lineY] = board[lineY].map(cell => 
                        cell === 0x000 ? 0xFFFFFF : 0x000
                    );
                });
                updateBoard();
                
                blinkCount++;
                if (blinkCount >= 6) {
                    clearInterval(blinkInterval);
                    lineClearSound.play();
                    setTimeout(() => {
                        completedLines.sort((a, b) => b - a).forEach(lineY => {
                            board.splice(lineY, 1);
                            board.push(Array(columns).fill(0));
                        });
    
                        gameScore += completedLines.length * 100;
                        updateScore();
                        updateBoard();
                        isGameRunning = true;
                    }, 200);
                }
            }, 100);
        }
    }
    
    function createUIElement(text, isVisible = true) {
        const element = document.createElement('div');
        element.className = 'game-ui';
        element.style.position = 'absolute';
        element.style.top = '70%';
        element.style.left = '50%';
        element.style.transform = 'translate(-50%, -50%)';
        element.style.fontSize = '48px';
        element.style.color = 'white';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        element.style.padding = '20px 40px';
        element.style.borderRadius = '10px';
        element.style.zIndex = '1000';
        element.textContent = text;
        element.style.display = isVisible ? 'block' : 'none';
        document.body.appendChild(element);
        return element;
    }

    const startText = createUIElement('Press SPACE to Start');
    const gameOverText = createUIElement('GAME OVER', false);
    const restartText = createUIElement('Press SPACE to Restart', false);
    restartText.style.fontSize = '24px';
    restartText.style.top = '60%';

    function showStartScreen() {
        startText.style.display = 'block';
        gameOverText.style.display = 'none';
        restartText.style.display = 'none';
    }

    function showGameOverScreen() {
        startText.style.display = 'none';
        gameOverText.style.display = 'block';
        restartText.style.display = 'block';
    }

    function hideAllScreens() {
        startText.style.display = 'none';
        gameOverText.style.display = 'none';
        restartText.style.display = 'none';
    }

    function displayGameOver() {
        isGameRunning = false;
        
        // Convert all existing blocks to gray
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < columns; x++) {
                if (board[y][x]) {
                    board[y][x] = 0x808080;
                }
            }
        }
        
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;

        updateBoard();
        showGameOverScreen();
    }

    // Show start screen initially
    showStartScreen();


    function updateScore() {
        document.getElementById("score").innerHTML = gameScore;
    }

    function startGame() {
        // Clear board completely
        for (let y = 0; y < rows; y++) {
            board[y].fill(0);
        }
        
        // Remove all existing blocks from board group
        const blocksToRemove = [];
        boardGroup.children.forEach(child => {
            if (child instanceof THREE.Mesh && child !== gridMesh) {
                blocksToRemove.push(child);
            }
        });
        blocksToRemove.forEach(block => boardGroup.remove(block));
    
        hideAllScreens();
        isGameRunning = true;
        gameScore = 0;
        updateScore();

        updateBoard();
        
        // Clear any existing tetromino group
        if (currentTetromino && currentTetromino.blocks) {
            boardGroup.remove(currentTetromino.blocks);
        }
        
        if (newTetromino()) {
            clearInterval(timerId);
            timerId = setInterval(() => {
                if (isGameRunning) moveDown();
            }, 500);
        }
    }

    // Event listeners
    window.addEventListener("keydown", (e) => {
        if (e.key === " " || e.code === "Space") {
            if (!isGameRunning) {
                backgroundMusic.play();
                startGame();
            }
        }

        if (isGameRunning) {
            if (e.key === "ArrowLeft") moveLeft();
            if (e.key === "ArrowUp") rotateTetromino();
            if (e.key === "ArrowRight") moveRight();
            if (e.key === "ArrowDown") moveDown();
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
});