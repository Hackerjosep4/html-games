// ============================================================
//  TRANSLATIONS LOADER (shared across all games)
// ============================================================
//  Loads translations from translations.txt (same folder as this script).
//  If the file cannot be fetched (e.g. file:// protocol),
//  a fallback with Catalan + English is used.
//
//  Usage: add <script src="../translations.js"></script> to your HTML
//         then call:  await loadTranslations()
//
//  After loading, use:
//    t('key')                  — get translated text
//    onLanguageChange(selectEl) — handle dropdown change
//    languages                 — array of { name, acronym }
//    currentLangIndex          — current language index
// ============================================================

// --- State ---
let translations = {};
let languages = [];
let currentLangIndex = 0;

// --- Determine base URL of this script (to find translations.txt next to it) ---
const _scriptSrc = document.currentScript ? document.currentScript.src : '';
const _scriptDir = _scriptSrc.substring(0, _scriptSrc.lastIndexOf('/') + 1);

// --- Fallback (CA + EN) ---
const FALLBACK_TRANSLATIONS = `key,Català,English
acronym,CA,EN
game_title,Tres en Ratlla,Tic-Tac-Toe
board_size,Mida del tauler,Board Size
players,Jugadors,Players
vs_ai,1 Jugador (vs IA),1 Player (vs AI)
vs_player,2 Jugadors,2 Players
difficulty,Dificultat,Difficulty
easy,Fàcil,Easy
medium,Mitjana,Medium
hard,Difícil,Hard
start_game,Començar Partida,Start Game
turn_of,Torn de,Turn of
ai_thinking,La IA està pensant,AI is thinking
draws,Empats,Draws
player1,Jugador 1,Player 1
player2,Jugador 2,Player 2
ai,IA,AI
victory,Victòria!,Victory!
draw,Empat!,Draw!
x_wins,X ha guanyat la partida!,X wins the game!
o_wins,O ha guanyat la partida!,O wins the game!
no_winner,No hi ha guanyador!,No winner!
menu,Menú,Menu
play_again,Tornar a jugar,Play Again
back_to_menu,Tornar al menú,Back to menu
you_win,Has guanyat!,You win!
you_lose,Has perdut!,You lose!
ai_wins,La IA ha guanyat!,AI wins!
congratulations,Felicitats!,Congratulations!
better_luck,Més sort la propera vegada!,Better luck next time!
snake_title,Serp,Snake
score,Puntuació,Score
high_score,Rècord,High Score
speed,Velocitat,Speed
slow,Lenta,Slow
normal,Normal,Normal
fast,Ràpida,Fast
game_over,Fi de la partida!,Game Over!
final_score,Puntuació final,Final Score
new_record,Nou rècord!,New Record!
press_to_start,Prem per començar,Press to Start
controls_arrows,Utilitza les fletxes o WASD,Use Arrow Keys or WASD
paused,Pausat,Paused
press_p_pause,Prem P per pausar,Press P to Pause
pacman_title,Pac-Man,Pac-Man
pacman_desc,El joc clàssic de Google Pac-Man,The classic Google Pac-Man game
pacman_tip,Usa les fletxes per moure el Pac-Man,Use arrow keys to move Pac-Man
fullscreen,Pantalla completa,Fullscreen`;

// --- CSV Parser ---
function parseCSV(csvText) {
    const lines = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
        const ch = csvText[i];
        if (ch === '"') {
            if (inQuotes && csvText[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === '\n' && !inQuotes) {
            lines.push(current);
            current = '';
        } else if (ch === '\r' && !inQuotes) {
            // skip CR
        } else {
            current += ch;
        }
    }
    if (current.trim()) lines.push(current);

    return lines.map(line => {
        const cells = [];
        let cell = '';
        let q = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (q && line[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    q = !q;
                }
            } else if (ch === ',' && !q) {
                cells.push(cell);
                cell = '';
            } else {
                cell += ch;
            }
        }
        cells.push(cell);
        return cells;
    });
}

// --- Apply parsed CSV data ---
function applyCSVData(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length < 2) return;

    const nameRow = rows[0];
    const acronymRow = rows[1];
    const langCount = nameRow.length - 1;

    languages = [];
    for (let i = 1; i <= langCount; i++) {
        languages.push({
            name: nameRow[i] ? nameRow[i].trim() : '',
            acronym: acronymRow[i] ? acronymRow[i].trim() : ''
        });
    }

    translations = {};
    for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        const key = row[0] ? row[0].trim() : '';
        if (!key) continue;
        translations[key] = {};
        for (let i = 0; i < langCount; i++) {
            translations[key][i] = row[i + 1] ? row[i + 1].trim() : '';
        }
    }

    populateLanguageDropdown();
    currentLangIndex = 0;
    applyTranslations();
}

// --- Load translations (fetch txt, fallback if it fails) ---
async function loadTranslations() {
    try {
        const url = _scriptDir + 'translations.txt';
        const response = await fetch(url);
        const csvText = await response.text();
        applyCSVData(csvText);
    } catch (err) {
        console.warn('Could not load translations.txt, using fallback (CA + EN):', err.message);
        applyCSVData(FALLBACK_TRANSLATIONS);
    }
}

// --- Get translated text ---
function t(key) {
    if (translations[key] && translations[key][currentLangIndex] !== undefined) {
        return translations[key][currentLangIndex];
    }
    return key;
}

// --- Apply translations to DOM ---
function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const text = t(key);
        if (text && text !== key) {
            el.textContent = text;
        }
    });

    const logo = document.getElementById('logo-text');
    if (logo) {
        const titleKey = logo.getAttribute('data-i18n') || 'game_title';
        logo.textContent = t(titleKey);
        document.title = t(titleKey);
    }

    if (typeof updatePlayerNames === 'function') {
        updatePlayerNames();
    }
}

// --- Populate language dropdown ---
function populateLanguageDropdown() {
    const select = document.getElementById('lang-select');
    if (!select) return;
    select.innerHTML = '';
    languages.forEach((lang, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${lang.acronym} — ${lang.name}`;
        select.appendChild(option);
    });
    select.value = currentLangIndex;
}

// --- Handle dropdown change ---
function onLanguageChange(selectEl) {
    currentLangIndex = parseInt(selectEl.value, 10);
    applyTranslations();
}
