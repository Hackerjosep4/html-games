// ===== GAME-SPECIFIC TRANSLATIONS =====
function updatePlayerNames() {
    const xName = document.getElementById('player-x-name');
    const oName = document.getElementById('player-o-name');
    if (xName) xName.textContent = `${t('player1')} (X)`;
    if (oName) {
        if (gameConfig.players === 1) {
            oName.textContent = `${t('ai')} (O)`;
        } else {
            oName.textContent = `${t('player2')} (O)`;
        }
    }
}


// ===== GAME STATE =====
const gameConfig = {
    boardSize: 3,
    players: 1,
    difficulty: 'easy'
};

let board = [];
let currentPlayer = 'X';
let gameOver = false;
let scores = { X: 0, O: 0, draw: 0 };
let aiIsThinking = false;


// ===== SETUP FUNCTIONS =====
function selectOption(group, value, btnEl) {
    gameConfig[group] = value;

    const parent = btnEl.parentElement;
    parent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btnEl.classList.add('selected');

    if (group === 'players') {
        const diffSection = document.getElementById('difficulty-section');
        if (value === 1) {
            diffSection.classList.add('visible');
        } else {
            diffSection.classList.remove('visible');
        }
    }
}

function startGame() {
    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('game-area').classList.add('visible');
    scores = { X: 0, O: 0, draw: 0 };
    updateScoreDisplay();
    updatePlayerNames();
    newRound();
}

function backToMenu() {
    document.getElementById('setup-panel').style.display = '';
    document.getElementById('game-area').classList.remove('visible');
    document.getElementById('result-overlay').classList.remove('visible');
    gameOver = true;
}

function playAgain() {
    document.getElementById('result-overlay').classList.remove('visible');
    newRound();
}

function newRound() {
    const size = gameConfig.boardSize;
    board = Array(size * size).fill(null);
    currentPlayer = 'X';
    gameOver = false;
    aiIsThinking = false;
    renderBoard();
    updateTurnDisplay();
}


// ===== BOARD RENDERING =====
function renderBoard() {
    const boardEl = document.getElementById('board');
    const size = gameConfig.boardSize;
    boardEl.className = `board size-${size}`;
    boardEl.innerHTML = '';

    for (let i = 0; i < size * size; i++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.id = `cell-${i}`;
        cell.setAttribute('data-index', i);
        cell.addEventListener('click', () => handleCellClick(i));

        const mark = document.createElement('span');
        mark.className = 'mark';
        mark.id = `mark-${i}`;
        cell.appendChild(mark);

        boardEl.appendChild(cell);
    }
}

function updateCellDisplay(index) {
    const cell = document.getElementById(`cell-${index}`);
    const mark = document.getElementById(`mark-${index}`);
    const value = board[index];

    if (value) {
        cell.classList.add('taken');
        mark.textContent = value;
        mark.className = `mark ${value === 'X' ? 'x-mark' : 'o-mark'}`;
        requestAnimationFrame(() => {
            mark.classList.add('visible');
        });
    }
}


// ===== GAME LOGIC =====
function handleCellClick(index) {
    if (gameOver || board[index] || aiIsThinking) return;
    if (gameConfig.players === 1 && currentPlayer === 'O') return;
    makeMove(index);
}

function makeMove(index) {
    board[index] = currentPlayer;
    updateCellDisplay(index);

    const winResult = checkWin(board, gameConfig.boardSize);
    if (winResult) {
        gameOver = true;
        highlightWin(winResult.cells);
        setTimeout(() => showResult(currentPlayer), 700);
        return;
    }

    if (board.every(c => c !== null)) {
        gameOver = true;
        setTimeout(() => showResult(null), 500);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    updateTurnDisplay();

    // AI turn
    if (gameConfig.players === 1 && currentPlayer === 'O' && !gameOver) {
        aiIsThinking = true;
        document.getElementById('ai-thinking').classList.add('visible');
        document.getElementById('turn-indicator').style.display = 'none';

        setTimeout(() => {
            const aiMove = getAIMove();
            aiIsThinking = false;
            document.getElementById('ai-thinking').classList.remove('visible');
            document.getElementById('turn-indicator').style.display = '';
            if (aiMove !== -1 && !gameOver) {
                makeMove(aiMove);
            }
        }, 400 + Math.random() * 300);
    }
}

function updateTurnDisplay() {
    const turnSymbol = document.getElementById('turn-symbol');
    const scoreX = document.getElementById('score-x');
    const scoreO = document.getElementById('score-o');

    turnSymbol.textContent = currentPlayer;
    turnSymbol.className = `turn-symbol ${currentPlayer === 'X' ? 'x-sym' : 'o-sym'}`;

    scoreX.classList.toggle('active-turn', currentPlayer === 'X');
    scoreO.classList.toggle('active-turn', currentPlayer === 'O');
}

function updateScoreDisplay() {
    document.getElementById('score-x-val').textContent = scores.X;
    document.getElementById('score-o-val').textContent = scores.O;
    document.getElementById('score-draw-val').textContent = scores.draw;
}


// ===== WIN DETECTION =====
function checkWin(bd, size) {
    const winLen = size;
    const lines = getAllLines(size, winLen);

    for (const line of lines) {
        const first = bd[line[0]];
        if (first && line.every(idx => bd[idx] === first)) {
            return { winner: first, cells: line };
        }
    }
    return null;
}

function getAllLines(size, winLen) {
    const lines = [];

    // Rows
    for (let r = 0; r < size; r++) {
        for (let c = 0; c <= size - winLen; c++) {
            const line = [];
            for (let k = 0; k < winLen; k++) line.push(r * size + c + k);
            lines.push(line);
        }
    }

    // Columns
    for (let c = 0; c < size; c++) {
        for (let r = 0; r <= size - winLen; r++) {
            const line = [];
            for (let k = 0; k < winLen; k++) line.push((r + k) * size + c);
            lines.push(line);
        }
    }

    // Diagonals ↘
    for (let r = 0; r <= size - winLen; r++) {
        for (let c = 0; c <= size - winLen; c++) {
            const line = [];
            for (let k = 0; k < winLen; k++) line.push((r + k) * size + (c + k));
            lines.push(line);
        }
    }

    // Diagonals ↙
    for (let r = 0; r <= size - winLen; r++) {
        for (let c = winLen - 1; c < size; c++) {
            const line = [];
            for (let k = 0; k < winLen; k++) line.push((r + k) * size + (c - k));
            lines.push(line);
        }
    }

    return lines;
}

function highlightWin(cells) {
    cells.forEach(idx => {
        document.getElementById(`cell-${idx}`).classList.add('win-cell');
    });
}


// ===== RESULT DISPLAY =====
function showResult(winner) {
    const overlay = document.getElementById('result-overlay');
    const icon = document.getElementById('result-icon');
    const title = document.getElementById('result-title');
    const subtitle = document.getElementById('result-subtitle');

    if (winner) {
        if (winner === 'X') scores.X++;
        else scores.O++;

        if (gameConfig.players === 1) {
            if (winner === 'X') {
                icon.textContent = '🏆';
                title.textContent = t('you_win');
                subtitle.textContent = t('congratulations');
            } else {
                icon.textContent = '😔';
                title.textContent = t('you_lose');
                subtitle.textContent = t('better_luck');
            }
        } else {
            icon.textContent = '🏆';
            title.textContent = t('victory');
            subtitle.textContent = winner === 'X' ? t('x_wins') : t('o_wins');
        }

        if (!(gameConfig.players === 1 && winner === 'O')) {
            spawnConfetti();
        }
    } else {
        scores.draw++;
        icon.textContent = '🤝';
        title.textContent = t('draw');
        subtitle.textContent = t('no_winner');
    }

    updateScoreDisplay();
    overlay.classList.add('visible');
}


// ===== AI ENGINE =====
function getAIMove() {
    const size = gameConfig.boardSize;
    const difficulty = gameConfig.difficulty;
    const emptyCells = board.map((v, i) => v === null ? i : -1).filter(i => i !== -1);

    if (emptyCells.length === 0) return -1;

    if (difficulty === 'easy') return aiEasy(emptyCells, size);
    if (difficulty === 'medium') return aiMedium(emptyCells, size);
    return aiHard(emptyCells, size);
}

function aiEasy(emptyCells, size) {
    if (Math.random() < 0.15) {
        const smartMove = findImmediateMove(board, size, 'O') || findImmediateMove(board, size, 'X');
        if (smartMove !== null) return smartMove;
    }
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function aiMedium(emptyCells, size) {
    const winMove = findImmediateMove(board, size, 'O');
    if (winMove !== null) return winMove;

    const blockMove = findImmediateMove(board, size, 'X');
    if (blockMove !== null) return blockMove;

    if (Math.random() < 0.5) {
        const depth = size === 3 ? 4 : (size === 4 ? 3 : 2);
        return minimaxBestMove(board, size, depth);
    }

    const center = Math.floor(size / 2);
    const centerIdx = center * size + center;
    if (board[centerIdx] === null) return centerIdx;

    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function aiHard(emptyCells, size) {
    if (size === 3) {
        return minimaxBestMove(board, size, Infinity);
    } else if (size === 4) {
        const winMove = findImmediateMove(board, size, 'O');
        if (winMove !== null) return winMove;
        const blockMove = findImmediateMove(board, size, 'X');
        if (blockMove !== null) return blockMove;
        const emptyCount = emptyCells.length;
        const depth = emptyCount > 12 ? 5 : (emptyCount > 8 ? 7 : 9);
        return minimaxBestMove(board, size, depth);
    } else {
        const winMove = findImmediateMove(board, size, 'O');
        if (winMove !== null) return winMove;
        const blockMove = findImmediateMove(board, size, 'X');
        if (blockMove !== null) return blockMove;
        const emptyCount = emptyCells.length;
        const depth = emptyCount > 20 ? 3 : (emptyCount > 15 ? 4 : (emptyCount > 10 ? 5 : 6));
        return minimaxBestMove(board, size, depth);
    }
}

function findImmediateMove(bd, size, player) {
    const emptyCells = bd.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
    for (const idx of emptyCells) {
        bd[idx] = player;
        if (checkWin(bd, size)) {
            bd[idx] = null;
            return idx;
        }
        bd[idx] = null;
    }
    return null;
}

function minimaxBestMove(bd, size, maxDepth) {
    let bestScore = -Infinity;
    let bestMoves = [];
    const emptyCells = bd.map((v, i) => v === null ? i : -1).filter(i => i !== -1);

    const center = Math.floor(size / 2);
    emptyCells.sort((a, b) => {
        const distA = Math.abs(Math.floor(a / size) - center) + Math.abs(a % size - center);
        const distB = Math.abs(Math.floor(b / size) - center) + Math.abs(b % size - center);
        return distA - distB;
    });

    for (const idx of emptyCells) {
        bd[idx] = 'O';
        const score = minimax(bd, size, 0, false, -Infinity, Infinity, maxDepth);
        bd[idx] = null;

        if (score > bestScore) {
            bestScore = score;
            bestMoves = [idx];
        } else if (score === bestScore) {
            bestMoves.push(idx);
        }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function minimax(bd, size, depth, isMaximizing, alpha, beta, maxDepth) {
    const result = checkWin(bd, size);
    if (result) {
        if (result.winner === 'O') return 1000 - depth;
        if (result.winner === 'X') return -1000 + depth;
    }

    if (bd.every(c => c !== null) || depth >= maxDepth) {
        return evaluateBoard(bd, size);
    }

    const emptyCells = bd.map((v, i) => v === null ? i : -1).filter(i => i !== -1);
    const center = Math.floor(size / 2);
    emptyCells.sort((a, b) => {
        const distA = Math.abs(Math.floor(a / size) - center) + Math.abs(a % size - center);
        const distB = Math.abs(Math.floor(b / size) - center) + Math.abs(b % size - center);
        return distA - distB;
    });

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const idx of emptyCells) {
            bd[idx] = 'O';
            const val = minimax(bd, size, depth + 1, false, alpha, beta, maxDepth);
            bd[idx] = null;
            maxEval = Math.max(maxEval, val);
            alpha = Math.max(alpha, val);
            if (beta <= alpha) break;
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const idx of emptyCells) {
            bd[idx] = 'X';
            const val = minimax(bd, size, depth + 1, true, alpha, beta, maxDepth);
            bd[idx] = null;
            minEval = Math.min(minEval, val);
            beta = Math.min(beta, val);
            if (beta <= alpha) break;
        }
        return minEval;
    }
}

function evaluateBoard(bd, size) {
    let score = 0;
    const lines = getAllLines(size, size);

    for (const line of lines) {
        const values = line.map(i => bd[i]);
        const oCount = values.filter(v => v === 'O').length;
        const xCount = values.filter(v => v === 'X').length;

        if (oCount > 0 && xCount === 0) score += Math.pow(10, oCount);
        if (xCount > 0 && oCount === 0) score -= Math.pow(10, xCount);
    }

    const center = Math.floor(size / 2);
    const centerIdx = center * size + center;
    if (bd[centerIdx] === 'O') score += 5;
    else if (bd[centerIdx] === 'X') score -= 5;

    return score;
}


// ===== CONFETTI =====
function spawnConfetti() {
    const colors = ['#ff3d71', '#00d9ff', '#7c5cfc', '#ffd166', '#06d6a0', '#ff6b9d'];
    for (let i = 0; i < 60; i++) {
        const piece = document.createElement('div');
        piece.className = 'confetti-piece';
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.top = '-10px';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.width = `${6 + Math.random() * 8}px`;
        piece.style.height = `${6 + Math.random() * 8}px`;
        piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        piece.style.animation = `confettiFall ${1.5 + Math.random() * 2}s ease-out forwards`;
        piece.style.animationDelay = `${Math.random() * 0.5}s`;
        document.body.appendChild(piece);
        setTimeout(() => piece.remove(), 4000);
    }
}


// ===== PARTICLES =====
function createParticles() {
    const container = document.getElementById('particles');
    const colors = ['rgba(124, 92, 252, 0.5)', 'rgba(0, 217, 255, 0.4)', 'rgba(255, 61, 113, 0.3)'];

    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        p.style.width = `${2 + Math.random() * 3}px`;
        p.style.height = p.style.width;
        p.style.animationDuration = `${8 + Math.random() * 15}s`;
        p.style.animationDelay = `${Math.random() * 10}s`;
        container.appendChild(p);
    }
}


// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
    createParticles();
    await loadTranslations();

    // Hide loading overlay
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
    }
});
