// server.js

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Konfigurácia WebSocket a HTTP Servera
const port = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
    // Basic static file server
    let filePath = '.' + req.url;
    if (filePath === './') {
        filePath = './home.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code == 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 Not Found', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

const wss = new WebSocket.Server({ server });

server.listen(port, () => {
    console.log(`Server (HTTP + WS) beží na porte ${port}`);
});

// =======================================================
// --- BANKA OTÁZOK ---
// =======================================================

const QUESTIONS_DB = [
    { q: "Ako sa volá najväčšia tepna ľudského tela?", a: ["Aorta", "Vena", "Kapilára", "Pľúcnica"], correct: "Aorta", category: "science", type: "text" },
    { q: "Ktorá farba má najkratšiu vlnovú dĺžku vo viditeľnom spektre?", a: ["Fialová", "Červená", "Zelená", "Žltá"], correct: "Fialová", category: "science", type: "text" },
    { q: "Ktorý slávny film režíroval Alfred Hitchcock?", a: ["Psycho", "Vertigo", "Okno", "Provokácia"], correct: "Psycho", category: "mix", type: "text" },
    { q: "Ako sa volá súbor pravidiel, ktoré spravujú štát?", a: ["Ústava", "Zákon", "Dekrét", "Nariadenie"], correct: "Ústava", category: "mix", type: "text" },
    { q: "Ktorý boh bol v gréckej mytológii vládcom mora?", a: ["Poseidón", "Zeus", "Hádés", "Ares"], correct: "Poseidón", category: "history", type: "text" },
    { q: "Aký je najväčší štát USA podľa rozlohy?", a: ["Aljaška", "Texas", "Kalifornia", "Florida"], correct: "Aljaška", category: "geography", type: "text" },
    { q: "Ako sa nazýva poplatok za požičanie peňazí?", a: ["Úrok", "Kapitál", "Dividenda", "Akcia"], correct: "Úrok", category: "mix", type: "text" },
    { q: "Aký je chemický vzorec vody?", a: ["H2O", "CO2", "NaCl", "CH4"], correct: "H2O", category: "science", type: "text" },
    { q: "Ktorý kanál spája Atlantický a Tichý oceán?", a: ["Panamský", "Suezský", "Korintský", "Kielský"], correct: "Panamský", category: "geography", type: "text" },
    { q: "Ako sa nazýva najmenšia funkčná jednotka obličky?", a: ["Nefrón", "Neurón", "Hepatocyt", "Alveola"], correct: "Nefrón", category: "science", type: "text" },
    { q: "Čo je formálny systém na štúdium správneho usudzovania?", a: ["Logika", "Etika", "Estetika", "Metafyzika"], correct: "Logika", category: "science", type: "text" },
    { q: "Ktorý štát USA má prezývku 'Golden State'?", a: ["Kalifornia", "Texas", "Florida", "New York"], correct: "Kalifornia", category: "geography", type: "text" },
    { q: "Aká je jednotka merania tlaku?", a: ["Pascal", "Joule", "Watt", "Ohm"], correct: "Pascal", category: "science", type: "text" },
    { q: "Ktorý architektonický štýl je charakteristický oblúkmi?", a: ["Románsky", "Gotický", "Barokový", "Moderný"], correct: "Románsky", category: "history", type: "text" },
    { q: "Ako sa volá hlavné mesto Fínska?", a: ["Helsinki", "Turku", "Tampere", "Espoo"], correct: "Helsinki", category: "geography", type: "text" },
    { q: "Ktorý hudobný kľúč sa používa najčastejšie?", a: ["Husľový", "Basový", "Altový", "Tenorový"], correct: "Husľový", category: "mix", type: "text" },
    { q: "Ako sa volá písmo pre nevidiacich?", a: ["Braillovo", "Latinka", "Cyrilika", "Runy"], correct: "Braillovo", category: "mix", type: "text" },
    { q: "V ktorom športe sa používa kimono?", a: ["Judo", "Karate", "Sumo", "Aikido"], correct: "Judo", category: "sport", type: "text" },
    { q: "Čo je najmenšou základnou stavebnou časticou všetkých prvkov?", a: ["Atóm", "Molekula", "Ión", "Elektrón"], correct: "Atóm", category: "science", type: "text" },
    { q: "Ktorý z týchto hudobných žánrov vznikol v USA?", a: ["Jazz", "Reggae", "Flamenco", "Samba"], correct: "Jazz", category: "history", type: "text" },
    { q: "Ktorý plyn sa používa na hasenie požiaru?", a: ["CO2", "O2", "H2", "N2"], correct: "CO2", category: "science", type: "text" },
    { q: "Ktorá planéta má najdlhší deň?", a: ["Venuša", "Urán", "Jupiter", "Neptún"], correct: "Venuša", category: "science", type: "text" },
    { q: "Ako sa volá proces tvorby mlieka u cicavcov?", a: ["Laktácia", "Gestácia", "Ovulácia", "Oxidácia"], correct: "Laktácia", category: "science", type: "text" },
    { q: "Ktorý vitamín je rozpustný v tukoch?", a: ["A", "B", "C", "D"], correct: "A", category: "science", type: "text" },
    { q: "Ktorý orgán sa podieľa na imunitnom systéme?", a: ["Slezina", "Pečeň", "Pankreas", "Žlčník"], correct: "Slezina", category: "science", type: "text" },
    { q: "Ktorý minerál je základom soli?", a: ["Halit", "Sodík", "Draslík", "Vápnik"], correct: "Halit", category: "science", type: "text" },
    { q: "Akú skratku má svetová zdravotnícka organizácia?", a: ["WHO", "UNICEF", "FAO", "IMF"], correct: "WHO", category: "mix", type: "text" },
    { q: "Ktorý politický systém má prezidenta aj parlament?", a: ["Republika", "Monarchia", "Diktatúra", "Autokracia"], correct: "Republika", category: "mix", type: "text" },
    { q: "Ako sa volá najväčší mesiac Saturna?", a: ["Titan", "Ganymed", "Callisto", "Io"], correct: "Titan", category: "science", type: "text" },
    { q: "Čo tvorí najväčší ekosystém na Zemi?", a: ["Oceány", "Pohoria", "Púšte", "Pralesy"], correct: "Oceány", category: "geography", type: "text" },
    { q: "Ako sa nazýva proces, ktorým sa tekutina mení na plyn?", a: ["Odparovanie", "Kondenzácia", "Topenie", "Sublimácia"], correct: "Odparovanie", category: "science", type: "text" },
    { q: "Kto napísal Rómea a Júliu?", a: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"], correct: "William Shakespeare", category: "history", type: "text" },
    { q: "Ktorá rieka je najdlhšia na svete?", a: ["Níl", "Amazonka", "Jang-c’-ťiang", "Mississippi"], correct: "Níl", category: "geography", type: "text" },
    { q: "Koľko hráčov je v hokejovom tíme na ľade?", a: ["6", "5", "7", "11"], correct: "6", category: "sport", type: "text" },
    { q: "Kde sa konali prvé moderné olympijské hry?", a: ["Atény", "Paríž", "Londýn", "Rím"], correct: "Atény", category: "sport", type: "text" },
    { q: "Ktorý z týchto štátov nehraničí so Slovenskom?", a: ["Nemecko", "Poľsko", "Rakúsko", "Maďarsko"], correct: "Nemecko", category: "geography", type: "text" },
    { q: "Ako sa volá najvyšší vrch sveta?", a: ["Mount Everest", "K2", "Kangčendžonga", "Lhoce"], correct: "Mount Everest", category: "geography", type: "text" },
    
    // Obrazkove otazky
    { q: "Aké mesto je na obrázku?", img: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=400&q=80", a: ["Paríž", "Rím", "Londýn", "New York"], correct: "Paríž", category: "geography", type: "image" },
    { q: "Aký šport je na obrázku?", img: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80", a: ["Futbal", "Basketbal", "Tenis", "Hokej"], correct: "Futbal", category: "sport", type: "image" },
    { q: "Aké zviera je na obrázku?", img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=400&q=80", a: ["Lev", "Tiger", "Slon", "Gepard"], correct: "Lev", category: "science", type: "image" },
    { q: "Aká pamiatka je na obrázku?", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=400&q=80", a: ["Koloseum", "Eiffelova veža", "Socha slobody", "Taj Mahal"], correct: "Koloseum", category: "history", type: "image" },
    { q: "Aké auto je na obrázku?", img: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=400&q=80", a: ["Športové", "Rodinné", "Kamión", "Traktor"], correct: "Športové", category: "mix", type: "image" },
    { q: "Aká tekutina je v pohári?", img: "https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=400&q=80", a: ["Káva", "Čaj", "Voda", "Džús"], correct: "Káva", category: "mix", type: "image" }
];


const BATTLE_QUESTION_COUNT = 10;
const QUESTION_DURATION_MS = 10000; // 10 sekúnd
const INTRO_ANIMATION_DELAY = 8500; // Čas na animáciu (musí sedieť s klientom VS_ANIMATION_DURATION_MS)

const matchmakingQueue = [];
const activeMatches = new Map();
const activeParties = new Map(); 

function shuffleArray(array) {
    const shuffled = array.map(v => ({ v, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(o => o.v);
    return shuffled;
}

class Player {
    constructor(ws, username, avatar, extras = {}) {
        this.ws = ws;
        this.username = username;
        this.avatar = avatar;
        this.extras = extras;
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
        this.questions = this.selectQuestions(QUESTIONS_DB, BATTLE_QUESTION_COUNT, "mix", "text");
        this.currentQuestionIndex = 0;
        this.questionTimer = null;
        this.currentQuestionStartTime = 0;

        player1.matchId = this.id;
        player2.matchId = this.id;
    }

    selectQuestions(source, count, category = 'mix', type = 'text') {
        let filtered = source;
        if (category && category !== 'mix') {
            filtered = filtered.filter(q => q.category === category);
        }
        if (type === 'classic') type = 'text'; if (type) {
            filtered = filtered.filter(q => q.type === type);
        }
        
        // Ak nemame dost otazok daneho typu/kategorie, doplnime mixom
        if (filtered.length === 0) {
            filtered = source.filter(q => q.type === type);
            if (filtered.length === 0) {
                filtered = source;
            }
        }
        
        const shuffledQuestions = shuffleArray(filtered).slice(0, count); 
        return shuffledQuestions.map(q => {
            const answers = [...q.a];
            const randomizedAnswers = shuffleArray(answers);
            return {
                q: q.q,
                img: q.img,
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


function leaveParty(ws, player) {
    if (player && player.partyCode) {
        const pCode = player.partyCode;
        const pty = activeParties.get(pCode);
        if (pty) {
            if (pty.host === player.username) {
                // Host left, destroy the room
                pty.players.forEach(p => {
                    if (p.ws !== ws && p.ws.readyState === 1 /* WebSocket.OPEN */) {
                        p.ws.send(JSON.stringify({ 
                            type: 'party.closed', 
                            message: 'Hostiteľ sa odpojil a miestnosť bola zrušená.' 
                        }));
                    }
                });
                activeParties.delete(pCode);
            } else {
                // Regular player left
                pty.players = pty.players.filter(p => p.ws !== ws);
                if (pty.players.length === 0) {
                    activeParties.delete(pCode);
                } else {
                    pty.players.forEach(p => {
                        if (p.ws.readyState === 1 /* WebSocket.OPEN */) {
                            p.ws.send(JSON.stringify({ 
                                type: 'party.update', 
                                payload: { players: pty.players.map(p => ({username: p.username, avatar: p.avatar, isHost: p.username === pty.host})) } 
                            }));
                        }
                    });
                }
            }
        }
        player.partyCode = null;
    }
}

wss.on('connection', (ws) => { console.log('NEW WS CONNECTION');
    let player = null;
    ws.isAlive = true;

    ws.on('pong', () => {
        ws.isAlive = true;
    });

    ws.on('message', (message) => {
        const data = JSON.parse(message.toString());

        switch (data.type) {
                        case 'party.create':
                leaveParty(ws, player);
                const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
                const roomName = data.roomName || 'Párty';
                const newParty = {
                    code: roomCode,
                    name: roomName,
                    host: data.username,
                    players: [{ ws, username: data.username, avatar: data.avatar }],
                    state: 'lobby'
                };
                activeParties.set(roomCode, newParty);
                if (!player) player = new Player(ws, data.username, data.avatar, {});
                player.partyCode = roomCode;
                ws.send(JSON.stringify({ type: 'party.joined', payload: { code: roomCode, name: roomName, isHost: true, players: newParty.players.map(p => ({username: p.username, avatar: p.avatar, isHost: p.username === newParty.host})) } }));
                break;
                        case 'party.join':
                leaveParty(ws, player);
                const codeToJoin = (data.code || '').toUpperCase();
                const partyToJoin = activeParties.get(codeToJoin);
                if (partyToJoin) {
                    if (partyToJoin.players.length >= 10) {
                        ws.send(JSON.stringify({ type: 'party.error', message: 'Miestnosť je plná.' }));
                        return;
                    }
                    if (partyToJoin.state !== 'lobby') {
                        ws.send(JSON.stringify({ type: 'party.error', message: 'Hra už prebieha.' }));
                        return;
                    }
                    if (!player) player = new Player(ws, data.username, data.avatar, {});
                    player.partyCode = codeToJoin;
                    partyToJoin.players.push({ ws, username: data.username, avatar: data.avatar });
                    ws.send(JSON.stringify({ type: 'party.joined', payload: { code: codeToJoin, name: partyToJoin.name, isHost: false, players: partyToJoin.players.map(p => ({username: p.username, avatar: p.avatar, isHost: p.username === partyToJoin.host})) } }));
                    
                    // Broadcast update
                    partyToJoin.players.forEach(p => {
                        if (p.ws.readyState === WebSocket.OPEN && p.ws !== ws) {
                            p.ws.send(JSON.stringify({ type: 'party.update', payload: { players: partyToJoin.players.map(p => ({username: p.username, avatar: p.avatar, isHost: p.username === partyToJoin.host})) } }));
                        }
                    });
                } else {
                    ws.send(JSON.stringify({ type: 'party.error', message: 'Miestnosť sa nenašla.' }));
                }
                break;
            case 'party.leave':
                leaveParty(ws, player);
                break;

            
            case 'party.start':
                if (player && player.partyCode) {
                    const pCode = player.partyCode;
                    const pty = activeParties.get(pCode);
                    if (pty && pty.host === player.username) {
                        pty.state = 'playing';
                        pty.players.forEach(p => {
                            if (p.ws.readyState === 1 /* WebSocket.OPEN */) {
                                p.ws.send(JSON.stringify({ type: 'party.started', message: 'Hra začína! (Pripravuje sa...)' }));
                            }
                        });
                    }
                }
                break;

            case 'matchmaking.request':
                if (!player) {
                    player = new Player(ws, data.username, data.avatar, data.extras || {});
                    tryMatchmaking(player);
                }
                break;
            
            case 'matchmaking.reconnect':
                if (!player) {
                    const existingMatch = Array.from(activeMatches.values()).find(m => 
                        m.player1.username === data.username || m.player2.username === data.username
                    );
                    if (existingMatch) {
                        player = existingMatch.player1.username === data.username ? existingMatch.player1 : existingMatch.player2;
                        player.ws = ws;
                        
                        const matchData = existingMatch.getMatchData();
                        ws.send(JSON.stringify({
                            type: 'match.found',
                            payload: matchData
                        }));
                        
                        setTimeout(() => {
                            if (existingMatch.players.every(p => p.status !== '?')) {
                                ws.send(JSON.stringify({
                                    type: 'match.update',
                                    payload: {
                                        ...existingMatch.getMatchData(),
                                        correctAnswer: existingMatch.questions[existingMatch.currentQuestionIndex - 1]?.correct
                                    }
                                }));
                            } else {
                                ws.send(JSON.stringify({
                                    type: 'match.next_question',
                                    payload: existingMatch.getMatchData()
                                }));
                            }
                        }, 100);
                    } else {
                        ws.send(JSON.stringify({ type: 'matchmaking.error', message: 'Nenašiel sa aktívny duel na obnovenie.' }));
                    }
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
                
            case 'matchmaking.quit_match':
                if (player && player.matchId) {
                    const match = activeMatches.get(player.matchId);
                    if (match) {
                        clearTimeout(match.questionTimer);
                        const opponent = match.player1 === player ? match.player2 : match.player1;
                        if (opponent.ws.readyState === WebSocket.OPEN) {
                            opponent.ws.send(JSON.stringify({
                                type: 'opponent.disconnect',
                                message: `Protihráč <span class="text-sky-500 font-extrabold">${player.username}</span> odstúpil z duelu.`
                            }));
                        }
                        match.cleanup();
                    }
                }
                break;
                
            
        }
    });

    ws.on('close', () => {
        leaveParty(ws, player);
        if (player) {
            const index = matchmakingQueue.indexOf(player);
            if (index > -1) {
                matchmakingQueue.splice(index, 1);
            }
        }
    });
});

const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 3000);

wss.on('close', () => {
    clearInterval(interval);
});
