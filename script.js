// ==========================
// JOKENPÔ - script.js
// Integra áudio (win/lose/draw) e bloqueia escolhas enquanto o áudio toca.
// ==========================

// --------------------------
// Variáveis de estado do jogo
// --------------------------
let playerScore = 0, computerScore = 0, drawScore = 0;
let playerStreak = 0, computerStreak = 0;
const choices = { pedra: '✊', papel: '📄', tesoura: '✂️' };

// --------------------------
// Nomes padronizados para organização.
// --------------------------
const soundPaths = {
    win: 'audio-win.mp3',
    lose: 'audio-lose.mp3',
    draw: 'audio-draw.mp3'
};

// Cria objetos Audio
const audioWin = new Audio(soundPaths.win);
const audioLose = new Audio(soundPaths.lose);
const audioDraw = new Audio(soundPaths.draw);

// Tempo máximo de áudio (fallback) em ms — seus áudios têm até 3000ms
const AUDIO_FALLBACK_MS = 3500;

// Estado de bloqueio: impede jogadas enquanto true
let locked = false;

// --------------------------
// Inicialização: adiciona listeners aos elementos .choice e ao botão reset
// --------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Delegação de eventos para escolhas
    const choicesContainer = document.getElementById('choicesContainer') || document.querySelector('.choices');
    // Se não houver container (por qualquer motivo), pega elementos individuais
    if (choicesContainer) {
        choicesContainer.addEventListener('click', (e) => {
            if (locked) return; // não permitir jogada enquanto bloqueado
            const choiceEl = e.target.closest('.choice');
            if (!choiceEl) return;
            const playerChoice = choiceEl.dataset.choice;
            if (playerChoice) play(playerChoice);
        });

        // Permitir interação por teclado (Enter/Space)
        choicesContainer.addEventListener('keydown', (e) => {
            if (locked) return;
            if (e.key === 'Enter' || e.key === ' ') {
                const choiceEl = e.target.closest('.choice');
                if (!choiceEl) return;
                const playerChoice = choiceEl.dataset.choice;
                if (playerChoice) play(playerChoice);
            }
        });
    }

    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetGame);

    console.log('🎮 Jokenpô carregado com áudio. Boa sorte!');
});

// ===========================
// Função principal: executar uma jogada
// ===========================
function play(playerChoice) {
    if (locked) return; // bloqueio extra (proteção)
    lockChoices(true);    // bloqueia imediatamente para evitar cliques rápidos duplicados

    const computerChoice = getComputerChoice();

    // Mostra a área de batalha
    document.getElementById('battleArea').classList.remove('hidden');
    document.getElementById('playerChoice').textContent = choices[playerChoice];
    document.getElementById('computerChoice').textContent = choices[computerChoice];

    // Determina resultado e atualiza placar
    const result = determineWinner(playerChoice, computerChoice);
    updateScore(result);
    displayResult(result, playerChoice, computerChoice);

    // Toca o som correspondente e mantém o bloqueio enquanto o som acontece
    playResultAudio(result);
}

// ===========================
// Escolha aleatória do computador
// ===========================
function getComputerChoice() {
    const options = ['pedra', 'papel', 'tesoura'];
    return options[Math.floor(Math.random() * 3)];
}

// ===========================
// Determina vencedor
// ===========================
function determineWinner(player, computer) {
    if (player === computer) return 'draw';
    if (
        (player === 'pedra' && computer === 'tesoura') ||
        (player === 'papel' && computer === 'pedra') ||
        (player === 'tesoura' && computer === 'papel')
    ) return 'win';
    return 'lose';
}

// ===========================
// Atualiza o placar visual e streaks
// ===========================
function updateScore(result) {
    if (result === 'win') {
        playerScore++; playerStreak++; computerStreak = 0;
        document.getElementById('playerScore').textContent = playerScore;
    } else if (result === 'lose') {
        computerScore++; computerStreak++; playerStreak = 0;
        document.getElementById('computerScore').textContent = computerScore;
    } else {
        drawScore++; playerStreak = 0; computerStreak = 0;
        document.getElementById('drawScore').textContent = drawScore;
    }
}

// ===========================
// Mostra resultado textual e mensagens de streak
// ===========================
function displayResult(result, playerChoice, computerChoice) {
    const resultText = document.getElementById('resultText');
    const resultMessage = document.getElementById('resultMessage');
    const streakMessage = document.getElementById('streakMessage');

    if (result === 'win') {
        resultText.textContent = '🎉 Você Venceu!';
        resultText.style.color = '#27ae60';
        resultMessage.textContent = `Sua ${getChoiceName(playerChoice)} venceu a ${getChoiceName(computerChoice)}!`;
    } else if (result === 'lose') {
        resultText.textContent = '😢 Você Perdeu!';
        resultText.style.color = '#e74c3c';
        resultMessage.textContent = `${getChoiceName(computerChoice)} venceu sua ${getChoiceName(playerChoice)}!`;
    } else {
        resultText.textContent = '🤝 Empate!';
        resultText.style.color = '#f39c12';
        resultMessage.textContent = `Ambos escolheram ${getChoiceName(playerChoice)}!`;
    }

    streakMessage.innerHTML = '';
    if (playerStreak >= 2) {
        const msg = pickRandom(winMessages);
        streakMessage.innerHTML = `<div class="streak-message streak-win">✨ ${msg} (${playerStreak} vitórias seguidas!)</div>`;
    } else if (computerStreak >= 2) {
        const msg = pickRandom(loseMessages);
        streakMessage.innerHTML = `<div class="streak-message streak-lose">🎯 ${msg} (${computerStreak} derrotas seguidas)</div>`;
    }
}

// ===========================
// Toca o áudio correspondente ao resultado
// ===========================
function playResultAudio(result) {
    // Escolhe o objeto Audio
    let audio;
    if (result === 'win') audio = audioWin;
    else if (result === 'lose') audio = audioLose;
    else audio = audioDraw;

    // Se outro áudio estiver tocando, para e substitui (evita sobreposição)
    [audioWin, audioLose, audioDraw].forEach(a => {
        try { if (a !== audio && !a.paused) { a.pause(); a.currentTime = 0; } } catch(e) {}
    });

    // Bloqueia escolhas (classe .disabled aplica estilos e pointer-events:none)
    lockChoices(true);

    // Play e handlers
    let ended = false;
    // Handler que reativa ao terminar
    const onEnded = () => {
        ended = true;
        cleanupAudioHandlers();
        lockChoices(false);
    };

    // Cleanup (remove listeners e garante desbloqueio após fallback)
    const cleanupAudioHandlers = () => {
        try { audio.removeEventListener('ended', onEnded); } catch(e){}
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    };

    // Fallback: caso 'ended' não ocorra (por política do navegador ou erro), usar timeout
    let fallbackTimer = setTimeout(() => {
        if (!ended) {
            try { audio.pause(); audio.currentTime = 0; } catch(e){}
            cleanupAudioHandlers();
            lockChoices(false);
        }
    }, AUDIO_FALLBACK_MS);

    // Adiciona listener e dispara
    try {
        audio.addEventListener('ended', onEnded);
        // Tentar carregar e tocar
        audio.currentTime = 0;
        const playPromise = audio.play();
        // play() retorna Promise em alguns browsers - tratamos rejeição para não travar
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                // Se não for possível tocar (autoplay policy?), ainda devemos desbloquear após fallback
                console.warn('Não foi possível reproduzir o áudio automaticamente:', err);
            });
        }
    } catch (e) {
        console.warn('Erro ao tentar reproduzir áudio:', e);
        // Em caso de erro imediato, desbloqueia via fallback (o timer já vai reativar)
    }
}

// ===========================
// Bloqueia ou desbloqueia as escolhas do jogador
// - adiciona/remova classe 'disabled' ao container .choices
// - marca aria-disabled nos elementos para acessibilidade
// ===========================
function lockChoices(shouldLock) {
    locked = shouldLock;
    const choicesContainer = document.getElementById('choicesContainer') || document.querySelector('.choices');
    if (!choicesContainer) return;
    if (shouldLock) {
        choicesContainer.classList.add('disabled');
        // marca cada botão
        choicesContainer.querySelectorAll('.choice').forEach(ch => {
            ch.setAttribute('aria-disabled', 'true');
            ch.setAttribute('tabindex', '-1');
        });
    } else {
        choicesContainer.classList.remove('disabled');
        choicesContainer.querySelectorAll('.choice').forEach(ch => {
            ch.setAttribute('aria-disabled', 'false');
            ch.setAttribute('tabindex', '0');
        });
    }
}

// ===========================
// Utilitários
// ===========================
function getChoiceName(choice) {
    return { pedra: 'Pedra', papel: 'Papel', tesoura: 'Tesoura' }[choice] || choice;
}
function pickRandom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

// Mensagens (reaproveitadas)
const winMessages = [
    'Você está em chamas! 🔥', 'Imparável! Continue assim! 💪', 'Você é uma máquina de vencer! 🏆',
    'Está dominando o jogo! 🎯', 'Impressionante! Série de vitórias! ⭐'
];
const loseMessages = [
    'Eita... tá difícil hein? 😅', 'Computador tá mandando bem! 🤖', 'Hora de revidar! Não desista! 💪',
    'Opa, tomou uma sequência! 😬', 'Calma, ainda dá pra virar! 🎮'
];

// ===========================
// Função de reset do jogo
// ===========================
function resetGame() {
    playerScore = computerScore = drawScore = playerStreak = computerStreak = 0;
    document.getElementById('playerScore').textContent = '0';
    document.getElementById('computerScore').textContent = '0';
    document.getElementById('drawScore').textContent = '0';
    document.getElementById('resultText').textContent = 'Escolha sua jogada!';
    document.getElementById('resultText').style.color = '#2c3e50';
    document.getElementById('resultMessage').textContent = 'Pedra ganha de Tesoura • Papel ganha de Pedra • Tesoura ganha de Papel';
    document.getElementById('streakMessage').innerHTML = '';
    document.getElementById('battleArea').classList.add('hidden');

    // Para qualquer áudio em execução e reseta
    [audioWin, audioLose, audioDraw].forEach(a => {
        try { a.pause(); a.currentTime = 0; } catch(e){}
    });

    // Reativa caso tenha quedado bloqueado
    lockChoices(false);
}
// ===========================
// Acessibilidade por teclado
// ===========================
document.addEventListener("keydown", (event) => {
    if (locked) return;  // respeita bloqueio por áudio

    const tecla = event.key.toLowerCase();

    if (tecla === "1") {
        play("pedra");
    } 
    else if (tecla === "2") {
        play("papel");
    } 
    else if (tecla === "3") {
        play("tesoura");
    }
    else if (tecla === "r") {
        resetGame();
    }
});
