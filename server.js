// server.js

const WebSocket = require('ws');

// Konfigurácia WebSocket Servera
const wss = new WebSocket.Server({ port: 8080 }, () => {
    // !!! DÔLEŽITÉ: Ak testujete lokálne, v home.html musíte zmeniť 'wss://seqai-ws-server.onrender.com' na 'ws://localhost:8080'
    console.log('WebSocket Server beží na porte ws://localhost:8080');
    console.log('Pripravený na real-time súboje!');
});

// =======================================================
// --- ROZŠÍRENÁ BANKA OTÁZOK (Min. 20) ---
// =======================================================
const ALL_QUESTIONS = [
    { q: "Ktoré zviera je najväčšie na Zemi?", a: ["Velryba modrá", "Slon africký", "Žirafa", "Nosorožec biely"], correct: "Velryba modrá" },
    { q: "Aký je chemický symbol zlata?", a: ["Au", "Ag", "Fe", "Cu"], correct: "Au" },
    { q: "Ktorý kontinent je najväčší podľa rozlohy?", a: ["Ázia", "Afrika", "Severná Amerika", "Európa"], correct: "Ázia" },
    { q: "Ktoré mesto je hlavné mesto Austrálie?", a: ["Canberra", "Sydney", "Melbourne", "Perth"], correct: "Canberra" },
    { q: "Koľko bitov má jeden byte?", a: ["8", "16", "32", "64"], correct: "8" },
    { q: "Ktorá je najdlhšia rieka na svete?", a: ["Níl", "Amazonka", "Jang-c’-ťiang", "Mississippi"], correct: "Amazonka" },
    { q: "Kto objavil Ameriku v roku 1492?", a: ["Krištof Kolumbus", "Ferdinand Magellan", "Marco Polo", "Vasco da Gama"], correct: "Krištof Kolumbus" },
    { q: "Akú farbu má smaragd?", a: ["Zelenú", "Červenú", "Modrú", "Žltú"], correct: "Zelenú" },
    { q: "Ktorá krajina je známa ako Zem vychádzajúceho slnka?", a: ["Japonsko", "Čína", "Južná Kórea", "Vietnam"], correct: "Japonsko" },
    { q: "Čo je Fibonacciho postupnosť?", a: ["Súčet predchádzajúcich dvoch", "Násobenie dvomi", "Delenie tromi", "Odmocnina"], correct: "Súčet predchádzajúcich dvoch" },
    { q: "Ktorá planéta je najbližšie k Slnku?", a: ["Merkúr", "Venuša", "Mars", "Jupiter"], correct: "Merkúr" },
    { q: "Ktorý plyn tvorí väčšinu zemskej atmosféry?", a: ["Dusík", "Kyslík", "Argón", "Oxid uhličitý"], correct: "Dusík" },
    { q: "Koľko trvá obeh Zeme okolo Slnka?", a: ["365.25 dňa", "360 dní", "365 dní", "365.5 dňa"], correct: "365.25 dňa" },
    { q: "Ktorý orgán detoxikuje krv?", a: ["Pečeň", "Obličky", "Srdce", "Pľúca"], correct: "Pečeň" },
    { q: "Ako sa nazýva najvyšší vrch Afriky?", a: ["Kilimandžáro", "Mount Kenya", "Elbrus", "Mont Blanc"], correct: "Kilimandžáro" },
    { q: "Ktorá je hlavná zložka skla?", a: ["Oxid kremičitý", "Uhličitan vápenatý", "Oxid hlinitý", "Sodík"], correct: "Oxid kremičitý" },
    { q: "Kto namaľoval 'Monu Lízu'?", a: ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Claude Monet"], correct: "Leonardo da Vinci" },
    { q: "Ktorý prvok má atómové číslo 1?", a: ["Vodík", "Hélium", "Kyslík", "Uhlík"], correct: "Vodík" },
    { q: "Čo je 'blockchain'?", a: ["Decentralizovaná databáza", "Typ meny", "Počítačový vírus", "Herný engine"], correct: "Decentralizovaná databáza" },
    { q: "Ako sa nazýva hudobný nástroj so 4 strunami, najmenší zo sláčikových?", a: ["Husle", "Viola", "Violončelo", "Kontrabas"], correct: "Husle" }
];

const BATTLE_QUESTION_COUNT = 10;
const QUESTION_DURATION_MS = 8000;

const matchmakingQueue = [];
const activeMatches = new Map(); 

function shuffleArray(array) {
    // Vytvorí kľúče, zoradí ich náhodne a vráti pôvodné hodnoty v novom poradí
    const shuffled = array.map(v => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(o => o.v);
    
    return shuffled;
}

class Player {
    constructor(ws, username, avatar) {
        this.ws = ws;
        this.username = username;
        this.avatar = avatar;
        this.score = 0;
        this.answered = false;
        this.time = Infinity;
        this.matchId = null;
        this.lastAnswer = null;
        this.status = '?'; // '?', 'Odpovedané', 'Správne', 'Nesprávne'
    }
}

class Match {
    constructor(player1, player2) {
        this.id = Math.random().toString(36).substring(2, 9);
        this.player1 = player1;
        this.player2 = player2;
        this.players = [player1, player2];
        this.questions = this.selectQuestions(ALL_QUESTIONS, BATTLE_QUESTION_COUNT);
        this.currentQuestionIndex = 0;
        this.questionTimer = null;
        this.currentQuestionStartTime = Date.now(); 

        player1.matchId = this.id;
        player2.matchId = this.id;
    }

    selectQuestions(source, count) {
        // Vytvorenie kópie, náhodné zamiešanie a výber top 'count'
        const shuffledQuestions = shuffleArray(source).slice(0, count); 
        
        // Randomizácia odpovedí v rámci vybraných otázok
        return shuffledQuestions.map(q => {
            
            // Naklonujeme pole odpovedí
            const answers = [...q.a];
            
            // Randomizujeme pole odpovedí pre túto konkrétnu otázku
            const randomizedAnswers = shuffleArray(answers);

            // Vrátime otázku s randomizovanými odpoveďami
            return {
                q: q.q,
                a: randomizedAnswers, 
                correct: q.correct // Správna odpoveď zostane pre vyhodnotenie
            };
        });
    }

    start() {
        activeMatches.set(this.id, this);
        this.sendToAll({
            type: 'match.found',
            payload: this.getMatchData()
        });
        this.sendNextQuestion();
    }

    getMatchData() {
        const currentQ = this.questions[this.currentQuestionIndex];
        
        // Odstránime "correct" pred odoslaním na klienta
        const questionData = {
            q: currentQ.q,
            a: currentQ.a, // Randomizované odpovede
            startTime: this.currentQuestionStartTime 
        };

        return {
            matchId: this.id,
            player1: { username: this.player1.username, avatar: this.player1.avatar },
            player2: { username: this.player2.username, avatar: this.player2.avatar },
            player1Score: this.player1.score,
            player2Score: this.player2.score,
            questionsCount: this.questions.length,
            currentQuestionIndex: this.currentQuestionIndex + 1,
            currentQuestion: questionData,
            player1Status: this.player1.status, 
            player2Status: this.player2.status 
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
        
        this.currentQuestionStartTime = Date.now(); 

        this.players.forEach(p => {
            p.answered = false;
            p.time = Infinity;
            p.lastAnswer = null;
            p.status = '?'; // Reset statusu na '?' (Čakám)
        });

        this.sendToAll({
            type: 'match.next_question',
            payload: this.getMatchData()
        });

        this.questionTimer = setTimeout(() => {
            this.evaluateQuestion();
        }, QUESTION_DURATION_MS);
    }

    handleAnswer(player, answer, time) {
        if (player.answered) return;

        player.answered = true;
        player.time = time;
        player.lastAnswer = answer;
        player.status = 'Odpovedané'; 
        
        this.sendAnswerStatusUpdate(); 

        const opponent = player === this.player1 ? this.player2 : this.player1;
        
        if (opponent.answered) {
            clearTimeout(this.questionTimer);
            this.evaluateQuestion();
        }
    }
    
    sendAnswerStatusUpdate() {
        this.sendToAll({
            type: 'match.status_update',
            payload: {
                matchId: this.id,
                player1Status: this.player1.status, 
                player2Status: this.player2.status  
            }
        });
    }

    evaluateQuestion() {
        
        const currentQ = this.questions[this.currentQuestionIndex];
        let correctP1 = false;
        let correctP2 = false;
        
        // 1. Vypočítanie finálnych statusov
        this.players.forEach(p => {
            if (p.status === '?') {
                // Timeout - ostane '?'
            } else if (p.status === 'Odpovedané') {
                // Skontrolujeme odpoveď len u tých, ktorí odpovedali
                if (p.lastAnswer === currentQ.correct) {
                    p.status = 'Správne';
                    if (p === this.player1) correctP1 = true;
                    else correctP2 = true;
                } else {
                    p.status = 'Nesprávne';
                }
            }
        });

        // 2. Pripočítanie bodov: Ak obaja správne, obaja dostanú bod
        if (correctP1) {
            this.player1.score += 1;
        } 
        if (correctP2) {
            this.player2.score += 1;
        }

        // 3. Odoslanie finálneho stavu
        this.sendToAll({
            type: 'match.update',
            payload: {
                ...this.getMatchData(), 
                correctAnswer: currentQ.correct, 
                player1Status: this.player1.status, // Bude 'Správne', 'Nesprávne', alebo '?' (Timeout)
                player2Status: this.player2.status
            }
        });
        
        // 4. Prechod na ďalšiu otázku
        this.currentQuestionIndex++;
        
        // Čakáme 1.5 sekundy na zobrazenie výsledku
        setTimeout(() => {
             this.sendNextQuestion();
        }, 1500); 
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
// --- Matchmaking Logic (Bezo zmien) ---
// =======================================================

function tryMatchmaking(player) {
    if (matchmakingQueue.length > 0) {
        const opponent = matchmakingQueue.shift(); 
        
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
                        
                        // Zabezpečenie: kontrola, že čas neuplynul
                        const timeElapsed = Date.now() - match.currentQuestionStartTime; 
                        
                        if (timeElapsed < QUESTION_DURATION_MS) {
                             match.handleAnswer(player, data.answer, data.time);
                        } else if (!player.answered) {
                             console.log(`Hráč ${player.username} odpovedal po limite. Ignorujem.`);
                        }
                    }
                }
                break;
            
            case 'matchmaking.exit':
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
        if (player) {
            const index = matchmakingQueue.indexOf(player);
            if (index > -1) {
                matchmakingQueue.splice(index, 1);
            }

            if (player.matchId) {
                const match = activeMatches.get(player.matchId);
                if (match) {
                    clearTimeout(match.questionTimer); 
                    
                    const opponent = match.player1 === player ? match.player2 : match.player1;
                    if (opponent.ws.readyState === WebSocket.OPEN) {
                        // Poslať správu o víťazstve (Opponent disconnect)
                        opponent.ws.send(JSON.stringify({
                            type: 'opponent.disconnect',
                            message: `${player.username} sa odpojil(a). Víťazstvo!`,
                        }));
                    }
                    match.cleanup(); 
                }
            }
        }
    });
});
