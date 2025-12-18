// server.js
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log('WebSocket Server beží na porte ws://localhost:8080');
});

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
    return array.map(v => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(o => o.v);
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
        this.status = '?'; 
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
        const shuffled = shuffleArray(source).slice(0, count); 
        return shuffled.map(q => {
            const answers = shuffleArray([...q.a]);
            return { q: q.q, a: answers, correct: q.correct };
        });
    }

    start() {
        activeMatches.set(this.id, this);
        this.sendToAll({ type: 'match.found', payload: this.getMatchData() });
        this.sendNextQuestion();
    }

    getMatchData() {
        const currentQ = this.questions[this.currentQuestionIndex];
        return {
            matchId: this.id,
            player1: { username: this.player1.username, avatar: this.player1.avatar },
            player2: { username: this.player2.username, avatar: this.player2.avatar },
            player1Score: this.player1.score,
            player2Score: this.player2.score,
            questionsCount: this.questions.length,
            currentQuestionIndex: this.currentQuestionIndex + 1,
            currentQuestion: { q: currentQ.q, a: currentQ.a, startTime: this.currentQuestionStartTime },
            player1Status: this.player1.status, 
            player2Status: this.player2.status 
        };
    }

    sendToAll(message) {
        const json = JSON.stringify(message);
        this.players.forEach(p => { if (p.ws.readyState === WebSocket.OPEN) p.ws.send(json); });
    }

    sendNextQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) { this.end(); return; }
        this.currentQuestionStartTime = Date.now(); 
        this.players.forEach(p => { p.answered = false; p.time = Infinity; p.lastAnswer = null; p.status = '?'; });
        this.sendToAll({ type: 'match.next_question', payload: this.getMatchData() });
        this.questionTimer = setTimeout(() => this.evaluateQuestion(), QUESTION_DURATION_MS);
    }

    handleAnswer(player, answer, time) {
        if (player.answered) return;
        player.answered = true;
        player.time = time;
        player.lastAnswer = answer;
        player.status = 'Odpovedané'; 
        this.sendAnswerStatusUpdate(); 
        const opponent = player === this.player1 ? this.player2 : this.player1;
        if (opponent.answered) { clearTimeout(this.questionTimer); this.evaluateQuestion(); }
    }
    
    sendAnswerStatusUpdate() {
        this.sendToAll({
            type: 'match.status_update',
            payload: { matchId: this.id, player1Status: this.player1.status, player2Status: this.player2.status }
        });
    }

    evaluateQuestion() {
        const currentQ = this.questions[this.currentQuestionIndex];
        this.players.forEach(p => {
            if (p.status === 'Odpovedané') {
                if (p.lastAnswer === currentQ.correct) { p.status = 'Správne'; p.score++; }
                else p.status = 'Nesprávne';
            }
        });
        this.sendToAll({ type: 'match.update', payload: { ...this.getMatchData(), correctAnswer: currentQ.correct } });
        this.currentQuestionIndex++;
        setTimeout(() => this.sendNextQuestion(), 1500); 
    }

    end() {
        clearTimeout(this.questionTimer);
        this.sendToAll({
            type: 'match.end',
            payload: {
                player1: { username: this.player1.username },
                player2: { username: this.player2.username },
                finalScores: { player1Score: this.player1.score, player2Score: this.player2.score }
            }
        });
        this.cleanup();
    }

    cleanup() {
        activeMatches.delete(this.id);
        this.players.forEach(p => p.matchId = null);
    }
}

function tryMatchmaking(player) {
    if (matchmakingQueue.length > 0) {
        const opponent = matchmakingQueue.shift(); 
        if (opponent.ws.readyState !== WebSocket.OPEN) { tryMatchmaking(player); return; }
        const match = new Match(player, opponent);
        match.start();
    } else {
        matchmakingQueue.push(player);
        player.ws.send(JSON.stringify({ type: 'matchmaking.waiting', message: 'Hľadá sa protihráč...' }));
    }
}

wss.on('connection', (ws) => {
    let player = null;
    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());
        switch (data.type) {
            case 'matchmaking.request':
                if (!player) { player = new Player(ws, data.username, data.avatar); tryMatchmaking(player); }
                break;
            case 'match.answer':
                if (player && player.matchId) {
                    const match = activeMatches.get(player.matchId);
                    if (match && (Date.now() - match.currentQuestionStartTime < QUESTION_DURATION_MS)) {
                        match.handleAnswer(player, data.answer, data.time);
                    }
                }
                break;
            case 'matchmaking.exit':
                if (player) {
                    const idx = matchmakingQueue.indexOf(player);
                    if (idx > -1) matchmakingQueue.splice(idx, 1);
                }
                break;
        }
    });

    ws.on('close', () => {
        if (player) {
            const idx = matchmakingQueue.indexOf(player);
            if (idx > -1) matchmakingQueue.splice(idx, 1);
            if (player.matchId) {
                const match = activeMatches.get(player.matchId);
                if (match) {
                    clearTimeout(match.questionTimer); 
                    const opponent = match.player1 === player ? match.player2 : match.player1;
                    if (opponent.ws.readyState === WebSocket.OPEN) {
                        // UPRAVENÁ SPRÁVA A FIXNÉ SKÓRE 10:0
                        opponent.ws.send(JSON.stringify({
                            type: 'opponent.disconnect',
                            message: `Protihráč ${player.username} sa odpojil.`,
                            localScore: 10,
                            opponentScore: 0
                        }));
                    }
                    match.cleanup(); 
                }
            }
        }
    });
});
