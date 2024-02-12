const totalNoOfGrids = 15;
const gameGrid = document.querySelector('.game-grid');
const snake = document.querySelector('#snake');
const snakeHead = document.querySelector('.snake-head')
const apple = document.querySelector('#apple');
const scoreArea = document.querySelector('.score-value');
const highScoreArea = document.querySelector('.high-score-value');

let singleGridWidth  = gameGrid.clientWidth/totalNoOfGrids;
let singleGridHeight = gameGrid.clientHeight/totalNoOfGrids;
const snakePosition = { x: 0, y: 0};
const applePosition = { x: 0, y: 0};
const lastPos = {x:0, y:0};
const snakeParts = [];
let snakeDirection = 'ArrowRight';
const allDirections = [snakeDirection];
let score = 0;
let isGameOver = false;
let isCollision = false;
let snakePositionsMap = new Map();
const appleEatAudio = new Audio();

const initialGroundSetup = () => {
  for(let i=1; i<=225; i++) {
      const gridEle = document.createElement('div');
      if(i%2 !== 0) {
          gridEle.classList.add('white-grid-item');
      } else {
          gridEle.classList.add('black-grid-item');
      }
      gameGrid.appendChild(gridEle);
  }

  appleEatAudio.src = 'assets/eat-audio.mp3';
  appleEatAudio.preload = 'auto';
  scoreArea.innerText = 0;
  if(window.localStorage.getItem('HIGH_SCORE')) {
      highScoreArea.innerText = window.localStorage.getItem('HIGH_SCORE');
  } else {
      highScoreArea.innerText = 0;
  }
  snakePosition.x = 0;
  snakePosition.y = singleGridHeight * Math.floor(totalNoOfGrids/2);
  snakeHead.style.top = `${snakePosition.y}px`;

  snakeParts.push({x: snakePosition.x , y: snakePosition.y, targetDirection: snakeDirection, ref: snakeHead});
  snakePositionsMap.set(`x:${snakePosition.x}, y:${snakePosition.y}`, 1);
  applePosition.x = singleGridWidth * 8;
  applePosition.y = snakePosition.y;
  apple.style.left = `${applePosition.x}px`;
  apple.style.top = `${applePosition.y}px`;
}

document.body.addEventListener('keydown', (event) => {
    const keyType = event.code
    if(!isReverseDirection(keyType) && (keyType === "ArrowUp" || keyType === "ArrowRight" || keyType === "ArrowDown" || keyType === "ArrowLeft")) {
        allDirections.push(keyType);
    }
});

const isReverseDirection = (keyType) => {
    return (snakeDirection === "ArrowUp" && keyType === "ArrowDown" ||
        snakeDirection === "ArrowLeft" && keyType === "ArrowRight" ||
        snakeDirection === "ArrowDown" && keyType === "ArrowUp" ||
        snakeDirection === "ArrowRight" && keyType === "ArrowLeft");
}

const setNewApplePos = () => {
    applePosition.x = Math.floor(Math.random() * 15) * singleGridWidth;
    applePosition.y = Math.floor(Math.random() * 15) * singleGridHeight;
    const key = `x:${applePosition.x}, y:${applePosition.y}`;
    if(!snakePositionsMap.has(key)) {
        apple.style.left = `${applePosition.x}px`;
        apple.style.top = `${applePosition.y}px`;
    } else {
        setNewApplePos();
    }
}

const detectCollisions = () => {
    const snakeHeaderPart = snakeParts[0];
    snakePosition.x = snakeHeaderPart.x;
    snakePosition.y = snakeHeaderPart.y;
    if(snakeHeaderPart.targetDirection === "ArrowRight") {
        snakePosition.x += singleGridWidth;
    } else if(snakeHeaderPart.targetDirection === "ArrowDown") {
        snakePosition.y += singleGridHeight;
    } else if(snakeHeaderPart.targetDirection === "ArrowLeft") {
        snakePosition.x -= singleGridWidth;
    } else if (snakeHeaderPart.targetDirection === "ArrowUp") {
        snakePosition.y -= singleGridHeight;
    }
    return snakePositionsMap.has(`x:${snakePosition.x}, y:${snakePosition.y}`)  || !checkSnakeRange();
}

const updateSnakePosition = (defaultPos) => {
    if(snakeHead.offsetLeft % singleGridWidth === 0 && snakeHead.offsetTop % singleGridHeight === 0) {
        const lastSnakePart = snakeParts[snakeParts.length - 1];
        lastPos.x = lastSnakePart.x;
        lastPos.y = lastSnakePart.y;

        snakePositionsMap = new Map();

        for(let i=snakeParts.length - 1;i >=0; i--) {
            if(i > 0) {
                snakeParts[i].targetDirection = snakeParts[i-1].targetDirection;
            }
            snakePositionsMap.set(`x:${snakeParts[i].x}, y:${snakeParts[i].y}`, 1);
        }

        const newDirection = allDirections.length ? allDirections.shift() : snakeDirection;

        if(snakeDirection !== newDirection) {
            snakeDirection = newDirection;
            snakeParts[0].targetDirection = snakeDirection;
        }

        isCollision = detectCollisions();
    }
    if(!isCollision) {
        for(const part of snakeParts) {
            switch (part.targetDirection) {
                case 'ArrowUp':
                    part.ref.style.transform = 'rotate(270deg)';
                    part.y -= defaultPos.y;
                    break;
                case 'ArrowRight':
                    part.ref.style.transform = 'rotate(0)';
                    part.x += defaultPos.x;
                    break;
                case 'ArrowDown':
                    part.ref.style.transform = 'rotate(90deg)';
                    part.y += defaultPos.y;
                    break;
                case 'ArrowLeft':
                    part.ref.style.transform = 'rotate(180deg)';
                    part.x -= defaultPos.x;
                    break;
                default:
            }

            part.ref.style.left = `${part.x}px`;
            part.ref.style.top = `${part.y}px`;
        }
    } else {
        isGameOver = true;
    }

    if(snakeHead.offsetLeft === apple.offsetLeft && snakeHead.offsetTop === apple.offsetTop) {
        playAudio();
        score++;
        scoreArea.innerText = score;
        const tail = document.createElement('div');
        tail.classList.add('tail');
        tail.style.left = `${lastPos.x}px`;
        tail.style.top = `${lastPos.y}px`
        snakeParts.push({x: lastPos.x, y: lastPos.y, ref: tail, targetDirection: ''})
        snake.appendChild(tail);
        setNewApplePos();
    }
    isGameOver ? gameOver() : moveSnake(defaultPos);
}

const playAudio = () => {
    let promise = appleEatAudio.play();
    if (promise !== undefined) {
        promise.then(() => {
        }).catch(error => {
            appleEatAudio.play();
        });
    }
}

const checkSnakeRange = () => {
   return snakePosition.x < gameGrid.clientWidth && snakePosition.x >= 0 && snakePosition.y < gameGrid.clientHeight  && snakePosition.y >= 0;
}

const gameOver = () => {
    if(!window.localStorage.getItem('HIGH_SCORE') || window.localStorage.getItem('HIGH_SCORE') < score) {
        window.localStorage.setItem('HIGH_SCORE', score)
    }
};

const moveSnake = (defaultPos) => {
    requestAnimationFrame(() => {
        updateSnakePosition(defaultPos);
    });
}


const startGame = () => {
    initialGroundSetup();
    moveSnake({x: 5, y: 5});
}

startGame();