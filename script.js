document.addEventListener("DOMContentLoaded",()=>{
    const canvas = document.querySelector("canvas");
    const ctx = canvas.getContext("2d");

    const displayMessage = (text)=>{
        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.75;
        ctx.fillRect(0, canvas.height/2-30, canvas.width, 60);

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#FFF";
        ctx.font = "36px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, canvas.width/2, canvas.height/2);
    };
    displayMessage("START GAME");
    
    const tetrominoes = {
        I: [
            [1,1,1,1]
        ],
        J: [
            [0,0,1],
            [1,1,1]
        ],
        L: [
            [1,0,0],
            [1,1,1]
        ],
        O: [
            [1,1],
            [1,1]
        ],
        S: [
            [0,1,1],
            [1,1,0]
        ],
        T: [
            [0,1,0],
            [1,1,1]
        ],
        Z: [
            [1,1,0],
            [0,1,1]
        ]
    };
    
    const colors = {
        I: "#01EDFA",
        J: "#2E2E84",
        L: "#FFC82E",
        O: "#FEFB34",
        S: "#53DA3F",
        T: "#DD0AB2",
        Z: "#FD3F59"
    };

    let isGameRunning = false;
    let gameScore = 0;
    let timerId = 0;
    let drawId = 0;

    const grid = 30;
    const rows = canvas.height / grid;
    const columns = canvas.width / grid;

    const board = Array.from({length: rows}, () => Array(columns).fill(0));


    window.addEventListener("keydown", (e)=>{
        if((e.key === " " || e.code === "Space") && !isGameRunning){
            isGameRunning = true;

            gameScore = 0;
            updateScore();
            board.forEach((row) => row.fill(0));
            newTetromino();
            drawId = setInterval(draw, 8);

            timerId = setInterval(gameLoop, 500);
        };

        if(isGameRunning){
            if(e.key === "ArrowLeft"){
                moveLeft();
          };
            if(e.key === "ArrowUp"){
                rotateTetromino();
            };
            if(e.key === "ArrowRight"){
                moveRight();
            };
            if(e.key === "ArrowDown"){
                moveDown();
            };
        }
    });

    function newTetromino(){
        const types = Object.keys(tetrominoes);
        const type = types[Math.floor(Math.random()*types.length)];
        
        currentTetromino = {
            shape: tetrominoes[type],
            x: Math.floor(columns / 2) - Math.floor(tetrominoes[type][0].length / 2),
            y: 0,
            type
        };

        console.log(currentTetromino);
    };

    function draw(){
        if(isGameRunning){
            drawBoard();
            
            drawTertromino(currentTetromino.shape, currentTetromino.x, currentTetromino.y);
        };
    };

    function drawBoard(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
        
        for (let y = 0; y < rows; y++){
            for (let x = 0; x < columns; x++){
                if (board[y][x]){
                    drawSquare(x, y, board[y][x]);
                };
            };
        };
    };

    function drawSquare(x,y,color){
        ctx.fillStyle = color;
        ctx.fillRect(x * grid, y * grid, grid, grid);
        ctx.strokeStyle = "#333";
        ctx.strokeRect(x * grid, y * grid, grid, grid);
    }

    function drawTertromino(tetromino, offSetX, offSetY){
        tetromino.forEach((row, y) => {
            row.forEach((value, x) => {
                if(value){
                    drawSquare(x + offSetX, y + offSetY, colors[currentTetromino.type]);
                    console.log(colors[currentTetromino.type]);  
                };
            });
        });
    };

    
    function gameLoop(){
      if(isGameRunning){
        moveDown();
      };  
    };

    function collisionDetected(tetromino, offSetX, offSetY){
        return tetromino.some((row, y) => {
            return row.some((value, x) => {
                if(value){
                    const newX = x + offSetX;
                    const newY = y + offSetY;
                    return(newX < 0 || newX >= columns || newY >= rows || board[newY][newX]);
                };
                return false;
            });
        });
    }

    function moveLeft(){
        if(!collisionDetected(currentTetromino.shape,currentTetromino.x - 1, currentTetromino.y)){
            currentTetromino.x--;
            console.log("Left");
        };
    };
    function moveRight(){
        if(!collisionDetected(currentTetromino.shape,currentTetromino.x + 1, currentTetromino.y)){
            currentTetromino.x++;
            console.log("Right");
        };
    };
    function moveDown(){
        if(!collisionDetected(currentTetromino.shape,currentTetromino.x, currentTetromino.y + 1)){
            currentTetromino.y++;
            console.log("Down");
        } else {
            mergeTetromino();
            newTetromino();

            if(collisionDetected(currentTetromino.shape, currentTetromino.x, currentTetromino.y)){
                isGameRunning = false;
                clearInterval(timerId);
                clearInterval(drawId);
                displayMessage("GAME OVER");
            };
        };
    };

    function rotateMatrix(matrix){
        return matrix[0].map((_,i) => matrix.map((row) => row[i]).reverse());
    }

    function rotateTetromino(){
        console.log("Up");
        const tempShape = currentTetromino.shape;
        currentTetromino.shape = rotateMatrix(tempShape);

        if(collisionDetected(currentTetromino.shape, currentTetromino.x, currentTetromino.y)){
            currentTetromino.shape = tempShape;
        }
    };

    function mergeTetromino(){
        currentTetromino.shape.forEach((row,y) => {
            row.forEach((value, x) => {
               if(value){
                    board[y + currentTetromino.y][x + currentTetromino.x] = colors[currentTetromino.type];
               }; 
            });
        });

        checkLines();
    };

    function checkLines(){
        for(let y = rows - 1; y > 0; y--){
            if(board[y].every((cell) => cell)){
                board.splice(y,1);
                board.unshift(Array(columns).fill(0));
                
                gameScore += 100;
                
                updateScore();

                y = rows;
            };
        };
    };

    function updateScore(){
        document.getElementById("score").innerHTML = gameScore;
    }
});