// server.js

const WebSocket = require('ws');

// Konfigurácia WebSocket Servera
const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log('WebSocket Server beží na porte 8080');
});

// =======================================================
// --- BANKA OTÁZOK ---
// =======================================================
const ALL_QUESTIONS = [
    { q: "Ako sa nazýva najväčšia tepna ľudského tela?", a: ["Aorta", "Vena", "Kapilára", "Pľúcnica"], correct: "Aorta" },
    { q: "Ktorá farba má najkratšiu vlnovú dĺžku vo viditeľnom spektre?", a: ["Fialová", "Červená", "Zelená", "Žltá"], correct: "Fialová" },
    { q: "Ktorý slávny film režíroval Alfred Hitchcock?", a: ["Psycho", "Vertigo", "Okno", "Provokácia"], correct: "Psycho" },
    { q: "Ako sa volá súbor pravidiel, ktoré spravujú štát?", a: ["Ústava", "Zákon", "Dekrét", "Nariadenie"], correct: "Ústava" },
    { q: "Ktorý boh bol v gréckej mytológii vládcom morí a oceánov?", a: ["Poseidón", "Zeus", "Hádés", "Ares"], correct: "Poseidón" },
    { q: "Ktorý americký štát je najväčší podľa rozlohy?", a: ["Aljaška", "Texas", "Kalifornia", "Florida"], correct: "Aljaška" },
    { q: "Ako sa nazýva poplatok za požičanie peňazí?", a: ["Úrok", "Kapitál", "Dividenda", "Akcia"], correct: "Úrok" },
    { q: "Aký je chemický vzorec vody?", a: ["H2O", "CO2", "NaCl", "CH4"], correct: "H2O" },
    { q: "Ktorý kanál spája Atlantický a Tichý oceán?", a: ["Panamský", "Suezský", "Korintský", "Kielský"], correct: "Panamský" },
    { q: "Ako sa nazýva najmenšia funkčná jednotka obličky?", a: ["Nefrón", "Neurón", "Hepatocyt", "Alveola"], correct: "Nefrón" },
    { q: "Ktorý americký štát má prezývku 'Golden State'?", a: ["Kalifornia", "Texas", "Florida", "New York"], correct: "Kalifornia" },
    { q: "Aká je jednotka merania tlaku?", a: ["Pascal", "Joule", "Watt", "Ohm"], correct: "Pascal" },
    { q: "Ktorý architektonický štýl je charakteristický oblúkmi?", a: ["Románsky", "Gotický", "Barokový", "Moderný"], correct: "Románsky" },
    { q: "Ako sa volá hlavné mesto Fínska?", a: ["Helsinki", "Turku", "Tampere", "Espoo"], correct: "Helsinki" },
    { q: "Ktorý hudobný kľúč sa používa najčastejšie?", a: ["Husľový", "Basový", "Altový", "Tenorový"], correct: "Husľový" },
    { q: "Ako sa volá písmo pre nevidiacich?", a: ["Braillovo", "Latinka", "Cyrilika", "Runy"], correct: "Braillovo" },
    { q: "V ktorom športe sa používa kimono?", a: ["Judo", "Karate", "Sumo", "Aikido"], correct: "Judo" },
    { q: "Čo je najmenšou základnou stavebnou časticou všetkých prvkov?", a: ["Atóm", "Molekula", "Ión", "Elektrón"], correct: "Atóm" },
    { q: "Ktorý z týchto hudobných žánrov vznikol v USA?", a: ["Jazz", "Reggae", "Flamenco", "Samba"], correct: "Jazz" },
    { q: "Ktorý plyn sa používa na hasenie požiaru?", a: ["CO2", "O2", "H2", "N2"], correct: "CO2" },
    { q: "Ktorá planéta má najdlhší deň?", a: ["Venuša", "Urán", "Jupiter", "Neptún"], correct: "Venuša" },
    { q: "Ako sa volá proces tvorby mlieka u cicavcov?", a: ["Laktácia", "Gestácia", "Ovulácia", "Oxidácia"], correct: "Laktácia" },
    { q: "Ktorý vitamín je rozpustný v tukoch?", a: ["A", "B", "C", "D"], correct: "A" },
    { q: "Ktorý orgán sa podieľa na imunitnom systéme?", a: ["Slezina", "Pečeň", "Pankreas", "Žlčník"], correct: "Slezina" },
    { q: "Ktorý minerál je základom soli?", a: ["Halit", "Sodík", "Draslík", "Vápnik"], correct: "Halit" },
    { q: "Akú skratku má svetová zdravotnícka organizácia?", a: ["WHO", "UNICEF", "FAO", "IMF"], correct: "WHO" },
    { q: "Ktorý politický systém má prezidenta aj parlament?", a: ["Republika", "Monarchia", "Diktatúra", "Autokracia"], correct: "Republika" },
    { q: "Ako sa volá najväčší mesiac Saturna?", a: ["Titan", "Ganymed", "Callisto", "Io"], correct: "Titan" },
    { q: "Čo tvorí najväčší ekosystém na Zemi?", a: ["Oceány", "Pohoria", "Púšte", "Pralesy"], correct: "Oceány" },
    { q: "Ktorá sociálna sieť používala ako logo modrého vtáka?", a: ["Twitter", "Facebook", "Instagram", "Messenger"], correct: "Twitter" },
    { q: "Ako sa volá najprestížnejšie filmové ocenenie?", a: ["Oscar", "Emmy", "Grammy", "Tony"], correct: "Oscar" },
    { q: "V ktorom meste sídli Európsky parlament?", a: ["Štrasburg", "Brusel", "Frankfurt", "Mníchov"], correct: "Štrasburg" },
    { q: "Ako sa nazýva lekár, ktorý sa špecializuje na ochorenia obličiek?", a: ["Nefrológ", "Proktológ", "Onkológ", "Hepatológ"], correct: "Nefrológ" },
    { q: "Ktorý chemický prvok má najvyššiu elektrickú vodivosť?", a: ["Striebro", "Meď", "Zlato", "Hliník"], correct: "Striebro" },
    { q: "Ako sa v programovaní nazýva textový reťazec v kóde?", a: ["String", "Integer", "Boolean", "Float"], correct: "String" },
    { q: "Ktorý plyn je hlavnou zložkou zemného plynu?", a: ["Metán", "Propán", "Bután", "Etán"], correct: "Metán" },
    { q: "Ako sa nazýva zadná časť lode?", a: ["Korma", "Prova", "Sťažeň", "Kýl"], correct: "Korma" },
    { q: "Ktorá časť oka je zodpovedná za farebné videnie?", a: ["Čapíky", "Tyčinky", "Rohovka", "Šošovka"], correct: "Čapíky" },
    { q: "Ako sa nazýva dlhodobý pokles celkovej cenovej hladiny?", a: ["Deflácia", "Inflácia", "Stagnácia", "Recesia"], correct: "Deflácia" },
    { q: "Ktorý mýtický vták sa podľa legendy znovuzrodí z popola?", a: ["Fénix", "Gryf", "Pegas", "Kraken"], correct: "Fénix" },
    { q: "Ako sa odborne nazýva znalec vína?", a: ["Someliér", "Vinár", "Barman", "Gurmán"], correct: "Someliér" },
    { q: "Ako sa nazýva veda o pôvode a vývoji slov?", a: ["Etymológia", "Syntax", "Fonetika", "Lexika"], correct: "Etymológia" },
    { q: "Ktorá zložka potravy má najvyššiu energetickú hodnotu na gram?", a: ["Tuky", "Cukry", "Bielkoviny", "Vláknina"], correct: "Tuky" },
    { q: "Ktorý slávny fyzik objavil zákon o lome svetla?", a: ["Snell", "Newton", "Hertz", "Pascal"], correct: "Snell" },
    { q: "Čo je najväčším kĺbom v ľudskom tele?", a: ["Koleno", "Bedro", "Rameno", "Lakeť"], correct: "Koleno" },
    { q: "Ako sa v práve nazýva vedomé porušenie zákona?", a: ["Delikt", "Prečin", "Imunita", "Kaucia"], correct: "Delikt" },
    { q: "Ako sa nazýva prístroj na meranie vlhkosti vzduchu?", a: ["Vlhkomer", "Barometer", "Teplomer", "Smerovník"], correct: "Vlhkomer" },
    { q: "Ako sa nazýva proces, ktorým sa tekutina mení na plyn?", a: ["Odparovanie", "Kondenzácia", "Topenie", "Sublimácia"], correct: "Odparovanie" }
];

const BATTLE_QUESTION_COUNT = 10;
const QUESTION_DURATION_MS = 10000; // 10 sekúnd
const INTRO_ANIMATION_DELAY = 4600; // Čas na animáciu

const matchmakingQueue = [];
const activeMatches = new Map(); 

function shuffleArray(array) {
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
        this.currentQuestionStartTime = 0;

        player1.matchId = this.id;
        player2.matchId = this.id;
    }

    selectQuestions(source, count) {
        const shuffledQuestions = shuffleArray(source).slice(0, count); 
        return shuffledQuestions.map(q => {
            const answers = [...q.a];
            const randomizedAnswers = shuffleArray(answers);
            return {
                q: q.q,
                a: randomizedAnswers, 
                correct: q.correct 
            };
        });
    }

    start() {
        activeMatches.set(this.id, this);
        this.sendToAll({
            type: 'match.found',
            payload: this.getMatchData()
        });

        setTimeout(() => {
            this.sendNextQuestion();
        }, INTRO_ANIMATION_DELAY);
    }

    getMatchData() {
        const currentQ = this.questions[this.currentQuestionIndex];
        const questionData = {
            q: currentQ.q,
            a: currentQ.a, 
            startTime: Date.now() 
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
            p.status = '?'; 
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
        
        this.players.forEach(p => {
            if (p.status === '?') {
                p.status = '?'; 
            } else if (p.status === 'Odpovedané') {
                if (p.lastAnswer === currentQ.correct) {
                    p.status = 'Správne';
                    if (p === this.player1) correctP1 = true;
                    else correctP2 = true;
                } else {
                    p.status = 'Nesprávne';
                }
            }
        });

        if (correctP1) this.player1.score += 1;
        if (correctP2) this.player2.score += 1;

        this.sendToAll({
            type: 'match.update',
            payload: {
                ...this.getMatchData(), 
                correctAnswer: currentQ.correct, 
                player1Status: this.player1.status,
                player2Status: this.player2.status
            }
        });
        
        this.currentQuestionIndex++;
        
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
                        const timeElapsed = Date.now() - match.currentQuestionStartTime; 
                        if (timeElapsed < QUESTION_DURATION_MS + 500) { 
                             match.handleAnswer(player, data.answer, data.time);
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
                        // UPRAVENÁ SPRÁVA: HTML zvýraznenie mena
                        opponent.ws.send(JSON.stringify({
                            type: 'opponent.disconnect',
                            message: `Protihráč <span class="text-yellow-400 font-extrabold">${player.username}</span> sa odpojil.`,
                        }));
                    }
                    match.cleanup(); 
                }
            }
        }
    });
});



