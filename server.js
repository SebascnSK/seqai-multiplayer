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
    { q: "Ako sa volá najväčšia tepna ľudského tela?", a: ["Aorta", "Vena", "Kapilára", "Pľúcnica"], correct: "Aorta" },
    { q: "Ktorá farba má najkratšiu vlnovú dĺžku vo viditeľnom spektre?", a: ["Fialová", "Červená", "Zelená", "Žltá"], correct: "Fialová" },
    { q: "Ktorý slávny film režíroval Alfred Hitchcock?", a: ["Psycho", "Vertigo", "Okno", "Provokácia"], correct: "Psycho" },
    { q: "Ako sa volá súbor pravidiel, ktoré spravujú štát?", a: ["Ústava", "Zákon", "Dekrét", "Nariadenie"], correct: "Ústava" },
    { q: "Ktorá plynná planéta je známa svojimi prstencami?", a: ["Saturn", "Jupiter", "Urán", "Neptún"], correct: "Saturn" },
    { q: "Kto sformuloval tri základné zákony pohybu?", a: ["Newton", "Einstein", "Galilei", "Kepler"], correct: "Newton" },
    { q: "Čo je hlavná zložka kostí a zubov?", a: ["Vápnik", "Sodík", "Železo", "Draslík"], correct: "Vápnik" },
    { q: "Ktorý plyn tvorí ozónovú vrstvu?", a: ["Kyslík", "Dusík", "Vodík", "Argón"], correct: "Kyslík" },
    { q: "Aká je základná jednotka meny v Japonsku?", a: ["Jen", "Yuan", "Won", "Rupia"], correct: "Jen" },
    { q: "Ktorý boh bol v gréckej mytológii vládcom mora?", a: ["Poseidón", "Zeus", "Hádés", "Ares"], correct: "Poseidón" },
    { q: "Aký je najväčší štát USA podľa rozlohy?", a: ["Aljaška", "Texas", "Kalifornia", "Florida"], correct: "Aljaška" },
    { q: "Ako sa nazýva poplatok za požičanie peňazí?", a: ["Úrok", "Kapitál", "Dividenda", "Akcia"], correct: "Úrok" },
    { q: "Aký je chemický vzorec vody?", a: ["H2O", "CO2", "NaCl", "CH4"], correct: "H2O" },
    { q: "Ktorý kanál spája Atlantický a Tichý oceán?", a: ["Panamský", "Suezský", "Korintský", "Kielský"], correct: "Panamský" },
    { q: "Ako sa nazýva najmenšia funkčná jednotka obličky?", a: ["Nefrón", "Neurón", "Hepatocyt", "Alveola"], correct: "Nefrón" },
    { q: "Čo je formálny systém na štúdium správneho usudzovania?", a: ["Logika", "Etika", "Estetika", "Metafyzika"], correct: "Logika" },
    { q: "Ktorý štát USA má prezývku 'Golden State'?", a: ["Kalifornia", "Texas", "Florida", "New York"], correct: "Kalifornia" },
    { q: "Aká je jednotka merania tlaku?", a: ["Pascal", "Joule", "Watt", "Ohm"], correct: "Pascal" },
    { q: "Aká je skratka pre bezpilotné vzdušné prostriedky?", a: ["UAV", "BVP", "IFF", "PVOS"], correct: "UAV" },
    { q: "Ktorá z uvedených vojenských hodností je najvyššia?", a: ["Plukovník", "Kapitán", "Major", "Poručík"], correct: "Plukovník"},
    { q: "Ako sa nazýva proces, ktorým sa tekutina mení na plyn?", a: ["Odparovanie", "Kondenzácia", "Topenie", "Sublimácia"], correct: "Odparovanie" }
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
            message: 'Hľadá sa protihráč...'
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
                            message: `Protihráč ${player.username} sa odpojil(a).`,
                        }));
                    }
                    match.cleanup(); 
                }
            }
        }
    });
});



