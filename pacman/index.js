// ============================================================
//  PAC-MAN — Google Doodle iframe wrapper
// ============================================================

const PACMAN_URL = 'https://www.google.com/logos/2010/pacman10-i.html';

document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();

    const frame = document.getElementById('pacman-frame');
    const msg = document.getElementById('offline-msg');

    // Check if we're on file:// — iframe to https won't work
    if (window.location.protocol === 'file:') {
        showFallback();
        return;
    }

    // Check connectivity
    if (!navigator.onLine) { showFallback(); return; }
    window.addEventListener('offline', showFallback);
    window.addEventListener('online', hideFallback);

    // Double-check: if iframe fails to load after timeout
    let loaded = false;
    frame.addEventListener('load', () => { loaded = true; });
    setTimeout(() => {
        if (!loaded) showFallback();
    }, 5000);
});

function showFallback() {
    document.getElementById('pacman-frame').style.display = 'none';
    document.getElementById('offline-msg').style.display = '';
}

function hideFallback() {
    document.getElementById('offline-msg').style.display = 'none';
    document.getElementById('pacman-frame').style.display = '';
}

function openPacman() {
    window.open(PACMAN_URL, '_blank');
}

function toggleFS() {
    const wrap = document.querySelector('.game-wrap');
    if (!document.fullscreenElement) {
        (wrap.requestFullscreen || wrap.webkitRequestFullscreen || wrap.msRequestFullscreen).call(wrap);
    } else {
        (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
    }
}
