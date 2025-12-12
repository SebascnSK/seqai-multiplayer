// server.js

const WebSocket = require('ws');

// Konfigurácia WebSocket Servera
const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log('WebSocket Server beží na porte ws://localhost:8080');
    console.log('Pripravený na real-time súboje!');
});

// Zoznam všetkých otázok
const ALL_QUESTIONS = [
    { q: "Ktorý chemický prvok má najvyššiu elektronegativitu?", a: ["Fluór", "Kyslík", "Uhlík", "Vodík"], correct: "Fluór" },
    { q: "Kedy bola podpísaná deklarácia nezávislosti USA?", a: ["1776", "1789", "1812", "1492"], correct: "1776" },
    { q: "Koľko planét je v slnečnej sústave?", a: ["8", "9", "7", "10"], correct: "8" },
    { q: "Ako sa volá najväčší ľudský orgán?", a: ["Koža", "Mozog", "Pečeň", "Srdce"], correct: "Koža" },
    { q: "Ako sa nazýva strach z výšok?", a: ["Akrofóbia", "Filofóbia", "Aviafóbia", "Musofóbia"], correct: "Akrofóbia" },
    { q: "Aká je hlavná zložka zemskej atmosféry?", a: ["Dusík", "Kyslík", "Argón", "Oxid uhličitý"], correct: "Dusík" },
    { q: "Kto napísal Rómea a Júliu?", a: ["William Shakespeare", "Charles Dickens", "Jane Austen", "George Orwell"], correct: "William Shakespeare" },
    { q: "Ktorá mena sa používa v Japonsku?", a: ["Jen", "Yuan", "Won", "Rupia"], correct: "Jen" },
    { q: "Koľko dní trvá obežná doba Mesiaca okolo Zeme?", a: ["27.3", "30", "28", "29.5"], correct: "27.3" },
    { q: "Kto namaľoval Monu Lízu?", a: ["Leonardo da Vinci", "Vincent van Gogh", "Pablo Picasso", "Claude Monet"], correct: "Leonardo da Vinci" }
];
const BATTLE_QUESTION_COUNT = 10;
const QUESTION_DURATION_MS = 8000;

// Fronta pre Matchmaking a aktívne zápasy
const matchmakingQueue = [];
const activeMatches = new Map(); // Map<matchId, Match>

// Trieda pre reprezentáciu hráča
class Player {
    constructor(ws, username, avatar) {
        this.ws = ws;
        this.username = username;
        this.avatar = avatar;
        this.score = 0;
        this.answered = false;
        this.time = Infinity;
        this.matchId = null;
    }
}

// Trieda pre reprezentáciu zápasu
class Match {
    constructor(player1, player2) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.player1 = player1;
        this.player2 = player2;
        this.players = [player1, player2];
        this.questions = this.selectQuestions(ALL_QUESTIONS, BATTLE_QUESTION_COUNT);
        this.currentQuestionIndex = 0;
        this.questionTimer = null;

        player1.matchId = this.id;
        player2.matchId = this.id;
    }

    selectQuestions(source, count) {
        // Jednoduchá implementácia zamiešania a výberu prvých 'count' otázok
        const shuffled = [...source].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count).map(q => ({
            q: q.q,
            a: q.a,
            correct: q.correct
        }));
    }

    start() {
        activeMatches.set(this.id, this);
        this.sendToAll({
            type: 'match.found',
            payload: this.getMatchData(false)
        });
        this.sendNextQuestion();
    }

    getMatchData(includeAnswers) {
        const currentQ = this.questions[this.currentQuestionIndex];
        const questionData = {
            q: currentQ.q,
            a: currentQ.a,
            startTime: new Date().toISOString()
        };

        if (includeAnswers) {
            questionData.correct = currentQ.correct;
        }

        return {
            matchId: this.id,
            player1: { username: this.player1.username, avatar: this.player1.avatar },
            player2: { username: this.player2.username, avatar: this.player2.avatar },
            player1Score: this.player1.score,
            player2Score: this.player2.score,
            questionsCount: this.questions.length,
            currentQuestionIndex: this.currentQuestionIndex + 1,
            currentQuestion: questionData
        };
    }

    sendToAll(message) {
        const json = JSON.stringify(message);
        this.players.forEach(p => {
            if (p.ws.readyState === WebSocket.OPEN) {
                p.ws.send(json);
            }
        });
    }

    sendNextQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.end();
            return;
        }

        // Reset stavu odpovedí pre novú otázku
        this.players.forEach(p => {
            p.answered = false;
            p.time = Infinity;
        });

        this.sendToAll({
            type: 'match.next_question',
            payload: this.getMatchData(false)
        });

        // Nastavenie časovača na vyhodnotenie otázky
        this.questionTimer = setTimeout(() => {
            this.evaluateQuestion();
        }, QUESTION_DURATION_MS);
    }

    handleAnswer(player, answer, time) {
        if (player.answered) return;
        
        player.answered = true;
        player.time = time;

        const currentQ = this.questions[this.currentQuestionIndex];
        let isCorrect = (answer === currentQ.correct);
        
        if (isCorrect) {
            player.score++;
        }

        const opponent = player === this.player1 ? this.player2 : this.player1;
        
        this.sendScoreUpdate(player, isCorrect);
        
        // Ak je aj súper už odpovedal alebo prešiel čas, prejdeme na ďalšiu otázku
        if (opponent.answered || player.answered && opponent.answered) {
            clearTimeout(this.questionTimer);
            this.evaluateQuestion();
        }
    }
    
    sendScoreUpdate(player, isCorrect) {
         this.sendToAll({
            type: 'match.update',
            payload: {
                player1Score: this.player1.score,
                player2Score: this.player2.score,
                playerResult: player.username === this.player1.username ? (isCorrect ? 'Správne' : 'Nesprávne') : '?',
                opponentResult: player.username === this.player2.username ? (isCorrect ? 'Správne' : 'Nesprávne') : '?'
            }
        });
    }

    evaluateQuestion() {
        // Vyhodnotenie po uplynutí času (alebo rýchlej odpovedi oboch)
        
        // Final Score Update (pre prípad, že nejaký bod nebol odoslaný)
        this.sendToAll({
            type: 'match.update',
            payload: {
                player1Score: this.player1.score,
                player2Score: this.player2.score,
                playerResult: this.player1.answered ? (this.questions[this.currentQuestionIndex].correct === this.player1.answered ? 'Správne' : 'Nesprávne') : 'Timeout',
                opponentResult: this.player2.answered ? (this.questions[this.currentQuestionIndex].correct === this.player2.answered ? 'Správne' : 'Nesprávne') : 'Timeout'
            }
        });
        
        // Prechod na ďalšiu otázku
        this.currentQuestionIndex++;
        
        setTimeout(() => {
             this.sendNextQuestion();
        }, 1500); // 1.5 sekundy na zobrazenie výsledku
    }

    end() {
        clearTimeout(this.questionTimer);
        this.sendToAll({
            type: 'match.end',
            payload: {
                player1: { username: this.player1.username },
                player2: { username: this.player2.username },
                finalScores: {
                    player1Score: this.player1.score,
                    player2Score: this.player2.score
                }
            }
        });
        this.cleanup();
    }

    cleanup() {
        activeMatches.delete(this.id);
        this.players.forEach(p => p.matchId = null);
    }
}

// =======================================================
// --- Matchmaking Logic ---
// =======================================================

function tryMatchmaking(player) {
    if (matchmakingQueue.length > 0) {
        const opponent = matchmakingQueue.shift(); // Vyberieme prvého z fronty
        
        // Ak sa náhodou sám odpojil, preskočíme
        if (opponent.ws.readyState !== WebSocket.OPEN) {
            tryMatchmaking(player);
            return;
        }

        const match = new Match(player, opponent);
        match.start();

    } else {
        matchmakingQueue.push(player);
        player.ws.send(JSON.stringify({
            type: 'matchmaking.waiting',
            message: 'Čakám na súpera vo fronte...'
        }));
    }
}


wss.on('connection', (ws) => {
    let player = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        switch (data.type) {
            case 'matchmaking.request':
                if (!player) {
                    player = new Player(ws, data.username, data.avatar);
                    tryMatchmaking(player);
                }
                break;
            
            case 'match.answer':
                if (player && player.matchId) {
                    const match = activeMatches.get(player.matchId);
                    if (match) {
                        match.handleAnswer(player, data.answer, data.time);
                    }
                }
                break;
            
            case 'matchmaking.exit':
                // Hráč opustil matchmaking (napr. stlačil X)
                if (player) {
                    const index = matchmakingQueue.indexOf(player);
                    if (index > -1) {
                        matchmakingQueue.splice(index, 1);
                    }
                }
                break;
        }
    });

    ws.on('close', () => {
        // Odstránenie z matchmaking fronty
        if (player) {
            const index = matchmakingQueue.indexOf(player);
            if (index > -1) {
                matchmakingQueue.splice(index, 1);
            }

            // Oznam o odpojení súpera, ak bol v aktívnom zápase
            if (player.matchId) {
                const match = activeMatches.get(player.matchId);
                if (match) {
                    const opponent = match.player1 === player ? match.player2 : match.player1;
                    if (opponent.ws.readyState === WebSocket.OPEN) {
                        opponent.ws.send(JSON.stringify({
                            type: 'opponent.disconnect',
                            message: `${player.username} sa odpojil(a). Víťazstvo!`,
                        }));
                    }
                    match.cleanup(); // Odstránenie zápasu
                }
            }
        }
    });
});