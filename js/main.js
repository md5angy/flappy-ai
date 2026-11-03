
/**
 * =============================================================================
 * MILLER LAB — EXPERIMENT #001: FLAPPY AI
 * =============================================================================
 *
 * DESCRIZIONE
 * -----------
 * Implementazione di un gioco ispirato a Flappy Bird, sviluppato in JavaScript
 * nativo, con due modalità operative:
 *
 * HUMAN:
 *   Il giocatore controlla un singolo uccellino premendo SPAZIO.
 *
 * TRAINING:
 *   Una popolazione di 100 uccellini viene controllata da altrettante reti
 *   neurali. Le reti vengono migliorate attraverso un algoritmo genetico.
 *
 *
 * OBIETTIVO DELL'ESPERIMENTO
 * -------------------------
 * Verificare se una popolazione di reti neurali inizialmente casuali possa
 * sviluppare una strategia efficace per superare i tubi, senza ricevere
 * istruzioni esplicite su quando saltare.
 *
 * Ogni rete riceve informazioni sullo stato del gioco e restituisce un valore
 * numerico che viene interpretato come decisione di salto.
 *
 * Le reti più efficaci vengono selezionate e utilizzate per produrre
 * le generazioni successive.
 *
 *
 * TECNOLOGIE E DIPENDENZE
 * ----------------------
 * - JavaScript nativo (ES6+)
 * - HTML5 Canvas 2D per il rendering
 * - requestAnimationFrame per il game loop
 * - HTMLAudioElement per gli effetti sonori
 * - Image API per caricare sprite e sfondi
 *
 * NON sono utilizzati:
 * - Framework di gioco (Phaser, PixiJS ecc.)
 * - Librerie di machine learning (TensorFlow.js, Brain.js ecc.)
 * - Librerie di fisica
 * - Backend o servizi esterni
 *
 * Tutta la logica viene eseguita nel browser.
 *
 * * AVVIO DEL PROGETTO
 * ------------------
 * 1. Aprire il terminale nella cartella contenente index.html.
 *
 * 2. Avviare il server locale:
 *
 *      python -m http.server 8000
 *
 * 3. Aprire il browser all'indirizzo:
 *
 *      http://localhost:8000
 *
 * 4. Premere SPAZIO per avviare il training.
 *
 * NOTA:
 * Python NON esegue la rete neurale.
 * Serve esclusivamente a rendere disponibili i file via HTTP.
 *
 * Tutta la simulazione, inclusa l'evoluzione genetica,
 * viene eseguita in JavaScript direttamente nel browser.
 *
 * PREREQUISITI HTML
 * ----------------
 * La pagina HTML deve contenere un elemento Canvas con id "game".
 *
 * Dimensioni di riferimento del progetto: 1280 x 720 pixel.
 *
 * Gli asset grafici e audio devono essere disponibili nelle cartelle:
 *
 * assets/
 *   background/
 *   bird/
 *   pipes/
 *   sounds/
 *
 * I percorsi effettivamente utilizzati sono definiti più avanti nel file.
 *
 *
 * ARCHITETTURA DEL PROGETTO
 * ------------------------
 *
 * 1. CONFIGURAZIONE
 *    Parametri di gioco, fisica, rete neurale ed evoluzione genetica.
 *
 * 2. RETE NEURALE
 *    Implementazione manuale di una rete feed-forward 4 -> 6 -> 1.
 *
 * 3. AMBIENTE
 *    Sfondi, terreno, tubi, collisioni e fisica degli uccellini.
 *
 * 4. MODALITÀ HUMAN
 *    Gestione di un singolo uccellino controllato dall'utente.
 *
 * 5. MODALITÀ TRAINING
 *    Simulazione parallela di una popolazione di reti neurali.
 *
 * 6. EVOLUZIONE GENETICA
 *    Valutazione, selezione, clonazione e mutazione dei cervelli.
 *
 * 7. RENDERING
 *    Disegno del gioco, visualizzatore neurale e dashboard delle metriche.
 *
 * 8. GAME LOOP E INPUT
 *    Aggiornamento continuo della simulazione e gestione della tastiera.
 *
 *
 * =============================================================================
 * COME FUNZIONA LA RETE NEURALE
 * =============================================================================
 *
 * Architettura:
 *
 *       INPUT             HIDDEN             OUTPUT
 *
 *       Bird Y --------\
 *       Velocity Y ------> 6 neuroni -------> 1 neurone
 *       Distance X ------> nascosti           Decisione
 *       Distance Y -----/                     di salto
 *
 * INPUT (4):
 *
 * 1. Y
 *    Posizione verticale normalizzata dell'uccellino.
 *
 * 2. VEL
 *    Velocità verticale normalizzata.
 *    Valori negativi indicano salita, positivi indicano discesa.
 *
 * 3. DX
 *    Distanza orizzontale normalizzata dal prossimo tubo.
 *
 * 4. DY
 *    Differenza verticale tra il centro del passaggio e l'uccellino.
 *
 * OUTPUT (1):
 *
 * Un valore compreso tra 0 e 1, ottenuto con la funzione sigmoid.
 *
 * Se output > 0.5 e il cooldown è terminato, l'uccellino salta.
 * Altrimenti continua la traiettoria determinata dalla fisica.
 *
 * IMPORTANTE:
 * Il valore di output NON è una probabilità calibrata di sopravvivenza.
 * È semplicemente il segnale numerico usato per decidere il salto.
 *
 *
 * =============================================================================
 * COME FUNZIONA L'APPRENDIMENTO
 * =============================================================================
 *
 * Non utilizziamo backpropagation, gradient descent o reinforcement learning
 * con aggiornamento dei pesi durante il singolo episodio.
 *
 * Utilizziamo un ALGORITMO GENETICO a topologia fissa.
 *
 * Ogni uccellino possiede una rete neurale con pesi e bias propri.
 *
 * CICLO EVOLUTIVO:
 *
 *   1. Creazione di 100 reti con pesi casuali.
 *
 *   2. Simulazione degli uccellini nello stesso ambiente.
 *
 *   3. Ogni rete prende decisioni indipendenti.
 *
 *   4. Gli uccellini accumulano tempo di sopravvivenza e punteggio.
 *
 *   5. Alla fine della generazione viene calcolata la fitness.
 *
 *   6. Gli uccellini vengono ordinati per fitness decrescente.
 *
 *   7. I 5 migliori cervelli vengono conservati senza mutazioni (elitismo).
 *
 *   8. Gli altri 95 cervelli vengono creati clonando e mutando
 *      genitori selezionati tra i migliori 20.
 *
 *   9. Inizia automaticamente una nuova generazione.
 *
 *   10. Il processo continua finché l'utente non lo interrompe.
 *
 * L'evoluzione NON garantisce un miglioramento a ogni generazione.
 *
 * Anche un cervello mediocre può ottenere un buon risultato per fortuna.
 * Per questo vengono tracciati sia i punteggi migliori sia quelli medi.
 *
 *
 * FITNESS
 * -------
 * La fitness attuale è:
 *
 *   fitness = survivalTime + score * pipeReward
 *
 * survivalTime:
 *   Tempo in secondi durante il quale l'uccellino rimane vivo.
 *
 * score:
 *   Numero di tubi superati dall'uccellino.
 *
 * pipeReward:
 *   Bonus assegnato per ogni tubo superato (attualmente 100).
 *
 * La fitness premia principalmente il superamento dei tubi,
 * ma utilizza anche il tempo di sopravvivenza per distinguere
 * uccellini con lo stesso punteggio.
 *
 *
 * =============================================================================
 * TUBI DETERMINISTICI E VALIDITÀ DELL'ESPERIMENTO
 * =============================================================================
 *
 * In modalità HUMAN le aperture dei tubi sono casuali.
 *
 * In modalità TRAINING viene utilizzata una sequenza prestabilita
 * di aperture, ripetuta a ogni generazione.
 *
 * VANTAGGIO:
 * Le generazioni affrontano lo stesso percorso, rendendo più semplice
 * confrontare i risultati dell'evoluzione.
 *
 * LIMITAZIONI:
 * - La sequenza si ripete ciclicamente.
 * - Gli uccellini partono da posizioni X/Y leggermente casuali.
 * - Una rete può specializzarsi sul percorso di addestramento.
 *
 * Per verificare la generalizzazione sarà necessario valutare
 * il miglior cervello anche su percorsi casuali mai incontrati.
 *
 *
 * =============================================================================
 * STATI DEL GIOCO
 * =============================================================================
 *
 * gameState:
 *
 * READY:
 *   Il gioco è inizializzato e attende SPAZIO.
 *
 * PLAYING:
 *   La simulazione è attiva.
 *
 * DYING:
 *   Stato utilizzato nella modalità HUMAN durante la morte.
 *
 * GAME_OVER:
 *   Partita HUMAN terminata.
 *
 * In TRAINING, la fine di una generazione provoca normalmente
 * il passaggio automatico alla generazione successiva.
 *
 *
 * STATI DEI SINGOLI AGENTI
 * ------------------------
 *
 * Ogni uccellino TRAINING possiede anche un proprio stato:
 *
 * ALIVE:
 *   È vivo, prende decisioni e accumula fitness.
 *
 * DYING:
 *   Ha colpito un tubo o il soffitto e sta eseguendo
 *   l'animazione di morte.
 *
 * DEAD:
 *   Ha raggiunto il terreno e non viene più aggiornato
 *   come agente attivo.
 *
 * Il campo booleano alive viene mantenuto per compatibilità
 * con la logica di selezione del visualizzatore neurale.
 *
 *
 * =============================================================================
 * WORKFLOW DI ESECUZIONE
 * =============================================================================
 *
 * AVVIO:
 *
 *   Caricamento script
 *       |
 *       v
 *   Inizializzazione Canvas e configurazioni
 *       |
 *       v
 *   Caricamento immagini e suoni
 *       |
 *       v
 *   Creazione della popolazione (TRAINING)
 *       |
 *       v
 *   gameState = READY
 *       |
 *       v
 *   L'utente preme SPAZIO
 *       |
 *       v
 *   gameState = PLAYING
 *
 *
 * OGNI FRAME:
 *
 *   requestAnimationFrame(gameLoop)
 *       |
 *       v
 *   Calcolo deltaTime
 *       |
 *       v
 *   update(deltaTime)
 *       |
 *       +-- HUMAN --> fisica e collisioni singolo bird
 *       |
 *       +-- TRAINING --> updateTraining(deltaTime)
 *                            |
 *                            +-- Movimento tubi
 *                            +-- Input delle reti
 *                            +-- Decisione di salto
 *                            +-- Fisica dei 100 agenti
 *                            +-- Collisioni
 *                            +-- Punteggi individuali
 *                            +-- Fine generazione
 *       |
 *       v
 *   draw()
 *       |
 *       +-- Sfondo
 *       +-- Tubi
 *       +-- Uccellini
 *       +-- Terreno
 *       +-- Score
 *       +-- Visualizzatore rete neurale
 *       +-- Dashboard training
 *       |
 *       v
 *   Frame successivo
 *
 *
 * =============================================================================
 * CONTROLLI
 * =============================================================================
 *
 * SPAZIO:
 *   HUMAN: avvia il gioco oppure fa saltare l'uccellino.
 *   TRAINING: avvia la prima generazione.
 *
 * R:
 *   HUMAN: ricomincia la partita.
 *   TRAINING: azzera generazioni e statistiche,
 *             creando nuove reti casuali.
 *
 *
 * =============================================================================
 * METRICHE
 * =============================================================================
 *
 * GENERATION:
 *   Numero della generazione attualmente in esecuzione.
 *
 * ALIVE:
 *   Numero di uccellini ancora vivi.
 *
 * BEST SCORE:
 *   Miglior punteggio della generazione corrente.
 *
 * BEST EVER:
 *   Miglior punteggio raggiunto durante l'esperimento.
 *
 * AVG SCORE:
 *   Media dei punteggi degli uccellini della generazione corrente.
 *
 * BEST FITNESS:
 *   Fitness migliore della generazione corrente.
 *
 * AVG FITNESS:
 *   Fitness media della generazione corrente.
 *
 * GEN TIME:
 *   Tempo trascorso dall'inizio della generazione corrente.
 *
 * generationHistory:
 *   Array contenente i risultati delle generazioni completate.
 *   I dati rimangono in memoria finché la pagina non viene ricaricata
 *   o l'esperimento non viene azzerato.
 *
 *
 * =============================================================================
 * NOTE TECNICHE IMPORTANTI
 * =============================================================================
 *
 * 1. deltaTime
 *    La fisica usa il tempo trascorso tra i frame, non un incremento
 *    fisso per ogni frame. Il valore viene limitato a 0.05 secondi
 *    per ridurre gli effetti di pause e rallentamenti del browser.
 *
 * 2. Coordinate Canvas
 *    L'origine (0, 0) si trova in alto a sinistra.
 *    X aumenta verso destra.
 *    Y aumenta verso il basso.
 *    Di conseguenza, un salto utilizza una velocità Y negativa.
 *
 * 3. Rendering pixel-art
 *    imageSmoothingEnabled = false evita che gli sprite
 *    vengano sfocati durante il ridimensionamento.
 *
 * 4. Parallasse
 *    I layer dello sfondo scorrono a velocità differenti
 *    per simulare la profondità.
 *
 * 5. Audio
 *    In TRAINING i normali effetti di salto e punteggio sono disabilitati.
 *    L'effetto di morte viene riprodotto con un cooldown per evitare
 *    troppi suoni simultanei.
 *    Il browser può richiedere un'interazione dell'utente prima
 *    di consentire la riproduzione audio.
 *
 * 6. Performance
 *    Il gioco aggiorna e disegna 100 agenti a ogni frame.
 *    L'algoritmo genetico viene eseguito solo al termine
 *    di una generazione, non a ogni frame.
 *
 * 7. Persistenza
 *    Non è ancora implementato il salvataggio dei cervelli.
 *    Ricaricando la pagina si perde l'addestramento corrente.
 *
 *
 * =============================================================================
 * LIMITAZIONI E POSSIBILI EVOLUZIONI
 * =============================================================================
 *
 * - Grafico storico dell'apprendimento.
 * - Salvataggio/caricamento del miglior cervello.
 * - Valutazione su sequenze di tubi mai viste.
 * - Modalità training accelerato.
 * - Controllo della velocità della simulazione.
 * - Parametri genetici modificabili dall'interfaccia.
 * - Crossover tra due genitori.
 * - Seed casuale riproducibile.
 * - Test automatici della fisica e dell'evoluzione.
 *
 * =============================================================================
 */

import { NeuralNetwork as ModularNeuralNetwork } from "./ai/NeuralNetwork.js";
import { calculateFitness as modularFitness, evolvePopulation } from "./ai/GeneticAlgorithm.js";
import { createMenuController } from "./ui/Menu.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let gameMode = null; // HUMAN, TRAINING oppure null quando è aperto il menu
const populationSize = 100;

const evolutionConfig = {
    eliteCount: 5,
    parentPoolSize: 20,
    mutationRate: 0.15,
    mutationStrength: 0.35,
    pipeReward: 100,
    maxGenerationTime: 320
};

let generation = 1;
let generationTime = 0;
let bestScoreEver = 0;
let bestFitnessEver = 0;
let generationHistory = [];

function calculateFitness(agent) {
    return modularFitness(agent, evolutionConfig.pipeReward);
}




/**
 * Rappresenta il cervello di un singolo uccellino.
 *
 * La rete ha una topologia fissa:
 * - 4 neuroni di input
 * - 6 neuroni nascosti
 * - 1 neurone di output
 *
 * Non viene addestrata con backpropagation.
 * I pesi vengono modificati dall'algoritmo genetico.
 *
 * Ogni istanza contiene:
 * - weightsIH: matrice 6x4 input -> hidden
 * - biasH: 6 bias del livello nascosto
 * - weightsHO: 6 pesi hidden -> output
 * - biasO: bias del neurone di output
 *
 * predict(inputs):
 *   Esegue la forward propagation.
 *
 * clone():
 *   Crea una copia indipendente dei pesi.
 *   È fondamentale evitare che la mutazione di un figlio
 *   modifichi accidentalmente il cervello del genitore.
 *
 * mutate(rate, strength):
 *   Modifica casualmente una parte dei pesi e dei bias.
 *   rate controlla la probabilità di mutazione.
 *   strength controlla l'ampiezza massima della modifica.
 */

class LegacyNeuralNetwork {
    constructor() {
        // 6 neuroni nascosti, ognuno con 4 pesi
        this.weightsIH = Array.from({ length: 6 }, () =>
            Array.from({ length: 4 }, () => Math.random() * 2 - 1)
        );

        // Un bias per ogni neurone nascosto
        this.biasH = Array.from(
            { length: 6 },
            () => Math.random() * 2 - 1
        );

        // 6 pesi verso il neurone di output
        this.weightsHO = Array.from(
            { length: 6 },
            () => Math.random() * 2 - 1
        );

        // Bias del neurone di output
        this.biasO = Math.random() * 2 - 1;
    }

    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    predict(inputs) {
        // INPUT -> HIDDEN
        const hidden = this.weightsIH.map((weights, i) => {
            const sum = weights.reduce(
                (total, weight, j) => total + weight * inputs[j],
                this.biasH[i]
            );

            return LegacyNeuralNetwork.sigmoid(sum);
        });

        // HIDDEN -> OUTPUT
        const sum = this.weightsHO.reduce(
            (total, weight, i) => total + weight * hidden[i],
            this.biasO
        );

        return LegacyNeuralNetwork.sigmoid(sum);
    }

    clone() {
        const copy = new LegacyNeuralNetwork();

        copy.weightsIH = this.weightsIH.map(row => [...row]);
        copy.biasH = [...this.biasH];
        copy.weightsHO = [...this.weightsHO];
        copy.biasO = this.biasO;

        return copy;
    }

    mutate(rate, strength) {
        const mutateValue = value => {
            if (Math.random() >= rate) return value;

            return value +
                (Math.random() * 2 - 1) * strength;
        };

        this.weightsIH = this.weightsIH.map(row =>
            row.map(mutateValue)
        );

        this.biasH = this.biasH.map(mutateValue);
        this.weightsHO = this.weightsHO.map(mutateValue);
        this.biasO = mutateValue(this.biasO);

        return this;
    }

}

// =========================
// INPUT DELLA RETE
// =========================

function getNextPipe(agent) {
    return pipes.find(
        pipe => pipe.x + pipe.width >= agent.x
    );
}


/**
 * Traduce lo stato del gioco nei quattro input della rete neurale.
 *
 * È il collegamento tra il mondo fisico del gioco e il modello AI.
 *
 * La rete non riceve direttamente coordinate in pixel senza controllo:
 * i valori vengono normalizzati per mantenerli in intervalli
 * numerici più gestibili.
 *
 * Ordine degli input:
 * [0] posizione Y normalizzata
 * [1] velocità Y normalizzata
 * [2] distanza X dal prossimo tubo
 * [3] differenza Y rispetto al centro dell'apertura
 *
 * IMPORTANTE:
 * L'ordine deve rimanere invariato perché i pesi della rete
 * sono associati a queste specifiche quattro caratteristiche.
 *
 * @param {Object} agent - Uccellino da osservare.
 * @returns {number[]} Array di quattro valori numerici.
 */

function getInputs(agent) {
    const nextPipe = getNextPipe(agent);

    const centerY = agent.y + agent.size / 2;

    const gapCenter = nextPipe
        ? nextPipe.gapY + nextPipe.gapHeight / 2
        : groundY / 2;

    return [
        // 1. Posizione verticale
        centerY / groundY,

        // 2. Velocità verticale
        Math.max(-1, Math.min(1, agent.velocityY / 600)),

        // 3. Distanza orizzontale dal prossimo tubo
        nextPipe
            ? Math.max(0, Math.min(1,
                (nextPipe.x - agent.x) / canvas.width
            ))
            : 1,

        // 4. Distanza verticale dal centro del passaggio
        Math.max(-1, Math.min(1,
            (gapCenter - centerY) / groundY
        ))
    ];
}


// =========================
// CONFIGURAZIONE GIOCO
// =========================

const gravity = 1600;
const jumpStrength = -450;

// =========================
// CONFIGURAZIONE TUBI
// =========================

const pipeWidth = 90;
const pipeGap = 220;
const pipeSpeed = 200;
const pipeInterval = 2.2;

// =========================
// CONFIGURAZIONE BIRD
// =========================

const birdSize = 56;
const birdHitboxRatio = 0.75;
const birdAnimationFPS = 8;
const birdFrameSequence = [0, 1, 2, 1];
const birdJumpAngle = -20;
const birdNoseDownDelay = 0.35;
const birdRotationSpeed = 7;
const maxBirdRotation = 70 * Math.PI / 180;

// =========================
// CONFIGURAZIONE SFONDO
// =========================

const skyColor = "#A9E3FA";
const groundHeight = 128;
const groundY = canvas.height - groundHeight;

const backgroundLayers = [
    { name: "clouds", src: "assets/background/bg_clouds.png", speed: 8, scale: 1.5, bottomOffset: 0, offset: 0 },
    { name: "city", src: "assets/background/sky_scrpers.png", speed: 20, scale: 2.2, bottomOffset: 0, offset: 0 },
    { name: "grass", src: "assets/background/grass.png", speed: 45, scale: 2, bottomOffset: 0, offset: 0 },
    { name: "ground", src: "assets/background/terrain.png", speed: pipeSpeed, scale: 4, bottomOffset: 0, offset: 0 }
];

for (const layer of backgroundLayers) {
    layer.image = new Image();
    layer.image.onerror = () => console.error("Impossibile caricare:", layer.src);
    layer.image.src = layer.src;
}

function updateBackground(deltaTime) {
    if (gameState !== "PLAYING") return;

    for (const layer of backgroundLayers) {
        if (!layer.image.naturalWidth) continue;

        const tileWidth = Math.round(layer.image.naturalWidth * layer.scale);
        layer.offset = (layer.offset + layer.speed * deltaTime) % tileWidth;
    }
}

function drawBackgroundLayer(layer) {
    const image = layer.image;
    if (!image.complete || !image.naturalWidth) return;

    const width = Math.round(image.naturalWidth * layer.scale);
    const height = Math.round(image.naturalHeight * layer.scale);
    const y = Math.round(groundY - height - layer.bottomOffset);
    const drawY = layer.name === "ground" ? groundY : y;

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    const startX = -Math.round(layer.offset);

    for (let x = startX; x < canvas.width; x += width) {
        ctx.drawImage(image, x, drawY, width, height);
    }

    ctx.restore();
}

function drawBackground() {
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBackgroundLayer(backgroundLayers[0]);
    drawBackgroundLayer(backgroundLayers[1]);
    drawBackgroundLayer(backgroundLayers[2]);
}

function drawGround() {
    drawBackgroundLayer(backgroundLayers[3]);
}

// =========================
// CONFIGURAZIONE AUDIO
// =========================

const soundEnabled = true;
const soundVolume = 0.35;
const trainingDeathSoundEnabled = true;
const trainingDeathSoundCooldown = 0.25; // Secondi
let lastTrainingDeathSound = -Infinity;

const sounds = {
    flap: new Audio("assets/sounds/flap.wav"),
    point: new Audio("assets/sounds/point.wav"),
    hit: new Audio("assets/sounds/hit.wav"),
    die: new Audio("assets/sounds/die.wav")
};

Object.values(sounds).forEach(sound => {
    sound.volume = soundVolume;
    sound.preload = "auto";
});

function playSound(name) {
    if (!soundEnabled || gameMode === "TRAINING") return;

    const sound = sounds[name];
    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

function playDeathSounds() {
    if (!soundEnabled || gameMode === "TRAINING") return;

    const hit = sounds.hit;
    const die = sounds.die;

    hit.pause();
    hit.currentTime = 0;
    die.pause();
    die.currentTime = 0;

    hit.onended = () => playSound("die");
    hit.play().catch(() => {});
}

function playTrainingDeathSound() {
    if (!soundEnabled || !trainingDeathSoundEnabled) return;

    const now = performance.now() / 1000;

    if (now - lastTrainingDeathSound < trainingDeathSoundCooldown) {
        return;
    }

    lastTrainingDeathSound = now;

    // Nuova istanza per non interrompere i suoni precedenti
    const hit = sounds.hit.cloneNode();
    hit.volume = soundVolume * 0.5;

    hit.onended = () => {
        const die = sounds.die.cloneNode();
        die.volume = soundVolume * 0.5;
        die.play().catch(() => {});
    };

    hit.play().catch(() => {});
}

let audioUnlocked = false;


// =========================
// CARICAMENTO SPRITE BIRD
// =========================

const birdFrames = [
    "assets/bird/Sprite-0001.png",
    "assets/bird/Sprite-0002.png",
    "assets/bird/Sprite-0003.png"
].map(src => {
    const image = new Image();
    image.onerror = () => console.error("Impossibile caricare:", src);
    image.src = src;
    return image;
});

const birdDeadSprite = new Image();
birdDeadSprite.onerror = () => console.error("Impossibile caricare Sprite-0004.png");
birdDeadSprite.src = "assets/bird/Sprite-0004.png";

// =========================
// CARICAMENTO SPRITE TUBO
// =========================

const pipeSprite = new Image();
pipeSprite.onerror = () => console.error("Impossibile caricare pipe01.png");
pipeSprite.src = "assets/pipes/pipe01.png";

const trainingPipeSequence = [
    180, 240, 130, 280, 200,
    100, 260, 160, 230, 140
];

let trainingPipeIndex = 0;

const pipeSourceWidth = 52;
const pipeSourceHeight = 64;
const pipeSourceCapHeight = 14;
const pipeSourceBodyInset = 3;
const pipeSourceBodyEnd = 63;

// =========================
// ANIMAZIONE BIRD
// =========================

const birdAnimation = {
    sequenceIndex: 0,
    elapsed: 0,
    frameDuration: 1 / birdAnimationFPS,
    rotation: birdJumpAngle * Math.PI / 180
};

// =========================
// STATO DEL GIOCO
// =========================

let gameState = "MENU";
let lastTime = null;
let pipeTimer = 0;
let score = 0;
let pipes = [];


/**
 * Crea un nuovo uccellino con stato fisico e cervello indipendenti.
 *
 * In HUMAN viene utilizzata una posizione iniziale fissa.
 *
 * In TRAINING la posizione iniziale varia leggermente per rendere
 * visibili i 100 agenti, evitando che siano perfettamente sovrapposti.
 *
 * Questa dispersione introduce una variabile sperimentale:
 * due cervelli identici possono ottenere risultati differenti
 * partendo da coordinate diverse.
 *
 * Ogni agente mantiene separatamente:
 * - posizione e velocità
 * - stato di vita e animazione
 * - score e tempo di sopravvivenza
 * - fitness
 * - rete neurale
 * - cooldown dei salti
 * - identificativo dell'ultimo tubo conteggiato
 *
 * @returns {Object} Nuovo agente inizializzato.
 */

function createBird() {
    return {
        x: gameMode === "TRAINING" ? 200 + (Math.random() - 0.5) * 120 : 200,
        y: gameMode === "TRAINING" ? 300 + (Math.random() - 0.5) * 180 : 300,
        size: birdSize * birdHitboxRatio,

        velocityY: 0,
        deathVelocityY: 0,
        timeSinceFlap: 0,

        alive: true,
        state: "ALIVE", // ALIVE, DYING, DEAD
        score: 0,
        survivalTime: 0,
        fitness: 0,
        lastScoredPipeId: -1,

        // AI
        brain: new ModularNeuralNetwork(),
        flapCooldown: 0,
        lastDecision: 0,
        lastJumpTime: -Infinity,

        animation: {
            sequenceIndex: 0,
            elapsed: 0,
            frameDuration: 1 / birdAnimationFPS,
            rotation: birdJumpAngle * Math.PI / 180
        }
    };
}


const bird = createBird();
let population = [];
let nextPipeId = 0;

// =========================
// CREAZIONE TUBI
// =========================

function createPipe() {
    const margin = 65;
    const minGapY = margin;
    const maxGapY = groundY - pipeGap - margin;
    const gapY = gameMode === "TRAINING" ? Math.max(minGapY, Math.min(maxGapY, trainingPipeSequence[trainingPipeIndex++ % trainingPipeSequence.length])) : minGapY + Math.random() * (maxGapY - minGapY);

    pipes.push({
        x: canvas.width,
        width: pipeWidth,
        gapY: gapY,
        gapHeight: pipeGap,
        scored: false,
        id: nextPipeId++
    });
}

// =========================
// COLLISIONI
// =========================

function checkCollision(pipe, currentBird = bird) {
    const overlapX =
        currentBird.x < pipe.x + pipe.width &&
        currentBird.x + currentBird.size > pipe.x;

    if (!overlapX) return false;

    const hitTop = currentBird.y < pipe.gapY;
    const hitBottom =
        currentBird.y + currentBird.size > pipe.gapY + pipe.gapHeight;

    return hitTop || hitBottom;
}

// =========================
// MORTE
// =========================

function killBird() {
    if (gameState !== "PLAYING") return;

    playDeathSounds();
    gameState = "DYING";
    bird.deathVelocityY = -290;
}

function updateDeath(deltaTime) {
    bird.deathVelocityY += gravity * deltaTime;
    bird.y += bird.deathVelocityY * deltaTime;

    if (bird.y + bird.size >= groundY) {
        bird.y = groundY - bird.size;
        bird.deathVelocityY = 0;
        gameState = "GAME_OVER";
    }
}

// =========================
// ANIMAZIONE BIRD
// =========================

function updateBirdAnimation(
    deltaTime,
    currentBird = bird,
    animation = birdAnimation
) {
    if (gameState === "READY" || gameState === "PLAYING") {
        animation.elapsed += deltaTime;

        while (animation.elapsed >= animation.frameDuration) {
            animation.elapsed -= animation.frameDuration;
            animation.sequenceIndex =
                (animation.sequenceIndex + 1) % birdFrameSequence.length;
        }
    }

    if (gameState === "READY") {
        animation.rotation = birdJumpAngle * Math.PI / 180;
        return;
    }

    if (gameState === "GAME_OVER") return;

    if (gameState === "PLAYING") {
        currentBird.timeSinceFlap += deltaTime;
    }

    let targetRotation;

    if (
        gameState === "PLAYING" &&
        currentBird.timeSinceFlap < birdNoseDownDelay
    ) {
        targetRotation = birdJumpAngle * Math.PI / 180;
    } else {
        const verticalSpeed =
            gameState === "DYING"
                ? currentBird.deathVelocityY
                : currentBird.velocityY;

        const fallFactor = Math.max(
            0,
            Math.min(1, verticalSpeed / 500)
        );

        const startAngle = birdJumpAngle * Math.PI / 180;

        targetRotation =
            startAngle + (maxBirdRotation - startAngle) * fallFactor;
    }

    const smoothing = 1 - Math.exp(-birdRotationSpeed * deltaTime);

    animation.rotation +=
        (targetRotation - animation.rotation) * smoothing;
}

// =========================
// UPDATE
// =========================

function update(deltaTime) {
    if (gameMode === "TRAINING") {
        updateTraining(deltaTime);
        return;
    }

    updateBackground(deltaTime);

    if (gameState === "READY") {
        updateBirdAnimation(deltaTime);
        return;
    }

    if (gameState === "DYING") {
        updateDeath(deltaTime);
        updateBirdAnimation(deltaTime);
        return;
    }

    if (gameState !== "PLAYING") return;

    bird.velocityY += gravity * deltaTime;
    bird.y += bird.velocityY * deltaTime;

    updateBirdAnimation(deltaTime);

    // Soffitto
    if (bird.y <= 0) {
        bird.y = 0;
        killBird();
        return;
    }

    // Terreno
    if (bird.y + bird.size >= groundY) {
        bird.y = groundY - bird.size;
        killBird();
        return;
    }

    // Generazione tubi
    pipeTimer += deltaTime;

    while (pipeTimer >= pipeInterval) {
        createPipe();
        pipeTimer -= pipeInterval;
    }

    // Movimento tubi
    for (const pipe of pipes) {
        pipe.x -= pipeSpeed * deltaTime;
    }

    // Collisioni
    for (const pipe of pipes) {
        if (checkCollision(pipe)) {
            killBird();
            break;
        }
    }

    // Punteggio
    if (gameState === "PLAYING") {
        for (const pipe of pipes) {
            const birdPassedPipe = bird.x > pipe.x + pipe.width;

            if (!pipe.scored && birdPassedPipe) {
                pipe.scored = true;
                score++;
                playSound("point");
            }
        }
    }

    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);
}

// =========================
// DRAW BIRD
// =========================

function drawBird(
    currentBird = bird,
    animation = birdAnimation,
    dead = false
) {
    let sprite;

    if (
        dead ||
        (gameMode === "HUMAN" &&
            (gameState === "DYING" || gameState === "GAME_OVER"))
    ) {
        sprite = birdDeadSprite;
    } else {
        const frameIndex = birdFrameSequence[animation.sequenceIndex];
        sprite = birdFrames[frameIndex];
    }

    if (!sprite.complete || sprite.naturalWidth === 0) return;

    const centerX = currentBird.x + currentBird.size / 2;
    const centerY = currentBird.y + currentBird.size / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(centerX, centerY);
    ctx.rotate(animation.rotation);

    ctx.drawImage(
        sprite,
        -birdSize / 2,
        -birdSize / 2,
        birdSize,
        birdSize
    );

    ctx.restore();
}

// =========================
// DRAW SINGOLO TUBO
// =========================

function drawSinglePipe(x, y, width, height) {
    if (
        !pipeSprite.complete ||
        !pipeSprite.naturalWidth ||
        height <= 0
    ) return;

    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    const scale = width / pipeSourceWidth;
    const capHeight = Math.round(pipeSourceCapHeight * scale);
    const bodyHeight = Math.max(0, height - capHeight);

    const bodySourceX = pipeSourceBodyInset;
    const bodySourceY = pipeSourceCapHeight;
    const bodySourceWidth =
        pipeSourceWidth - pipeSourceBodyInset * 2;
    const bodySourceHeight =
        pipeSourceBodyEnd - pipeSourceCapHeight;

    const bodyX = Math.round(
        x + pipeSourceBodyInset * scale
    );
    const bodyWidth = Math.round(
        bodySourceWidth * scale
    );

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (bodyHeight > 0) {
        ctx.drawImage(
            pipeSprite,
            bodySourceX,
            bodySourceY,
            bodySourceWidth,
            bodySourceHeight,
            bodyX,
            y + capHeight,
            bodyWidth,
            bodyHeight
        );
    }

    if (height >= capHeight) {
        ctx.drawImage(
            pipeSprite,
            0,
            0,
            pipeSourceWidth,
            pipeSourceCapHeight,
            x,
            y,
            width,
            capHeight
        );
    } else {
        ctx.drawImage(
            pipeSprite,
            0,
            0,
            pipeSourceWidth,
            pipeSourceCapHeight * (height / capHeight),
            x,
            y,
            width,
            height
        );
    }

    ctx.restore();
}

// =========================
// DRAW TUBI
// =========================

function drawPipes() {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    for (const pipe of pipes) {
        const x = Math.round(pipe.x);
        const width = Math.round(pipe.width);
        const gapY = Math.round(pipe.gapY);
        const bottomY = Math.round(
            pipe.gapY + pipe.gapHeight
        );

        drawSinglePipe(
            x,
            bottomY,
            width,
            groundY - bottomY
        );

        ctx.save();
        ctx.translate(0, gapY);
        ctx.scale(1, -1);

        drawSinglePipe(x, 0, width, gapY);

        ctx.restore();
    }

    ctx.restore();
}

// =========================
// DRAW SCORE
// =========================

function drawScore() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "bold 64px Arial";
    ctx.strokeStyle = "#202020";
    ctx.lineWidth = 7;
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";

    const x = canvas.width / 2;
    const y = 35;

    ctx.strokeText(score, x, y);
    ctx.fillText(score, x, y);

    ctx.restore();
}

// =========================
// DRAW
// =========================


/**
 * Visualizza il funzionamento della rete neurale di un agente vivo.
 *
 * Seleziona un agente osservabile tra quelli ancora vivi,
 * privilegiando il punteggio maggiore.
 *
 * Il pannello mostra:
 * - 4 neuroni di input
 * - 6 neuroni nascosti
 * - 1 neurone di output
 * - collegamenti tra neuroni
 * - intensità e segno dei segnali
 * - valore numerico dell'output
 * - indicazione JUMP / WAIT
 *
 * Il colore e lo spessore dei collegamenti rappresentano
 * il contributo numerico del segnale.
 *
 * Le attivazioni vengono ricalcolate usando gli stessi pesi
 * della rete osservata.
 *
 * La scritta JUMP viene mantenuta per un breve intervallo
 * dopo il salto effettivo, per migliorarne la leggibilità.
 *
 * Questo visualizzatore è uno strumento diagnostico:
 * permette di osservare le decisioni, ma non modifica
 * in alcun modo i pesi della rete.
 */

function drawNeuralNetworkVisualizer() {
    if (gameMode !== "TRAINING") return;

    // Seguiamo l'agente vivo con lo score più alto.
    const agent = population
        .filter(b => b.alive)
        .sort((a, b) => b.score - a.score)[0];

    if (!agent) return;

    const inputs = getInputs(agent);
    const brain = agent.brain;

    // Ricostruiamo le attivazioni REALI della rete.
    const hidden = brain.weightsIH.map((weights, i) => {
        const sum = weights.reduce(
            (total, weight, j) => total + weight * inputs[j],
            brain.biasH[i]
        );

        return ModularNeuralNetwork.sigmoid(sum);
    });

    const output = brain.predict(inputs);

    // Posizione e dimensioni del pannello
    const panelX = canvas.width - 385;
    const panelY = 20;
    const panelW = 365;
    const panelH = 285;

    const inputX = panelX + 65;
    const hiddenX = panelX + 185;
    const outputX = panelX + 300;

    const inputY = [75, 119, 163, 207].map(y => panelY + y);
    const hiddenY = [60, 94, 128, 162, 196, 230].map(y => panelY + y);
    const outputY = panelY + 145;

    const radius = 10;

    ctx.save();

    // Pannello semitrasparente
    ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();

    ctx.font = "bold 16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    ctx.fillText("NEURAL NETWORK  4 → 6 → 1", panelX + 15, panelY + 25);

    // Connessioni input -> hidden
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 4; j++) {
            const weight = brain.weightsIH[i][j];
            const signal = inputs[j] * weight;

            ctx.beginPath();
            ctx.moveTo(inputX, inputY[j]);
            ctx.lineTo(hiddenX, hiddenY[i]);

            ctx.strokeStyle = signal >= 0
                ? "rgba(74, 222, 128, 0.8)"
                : "rgba(248, 113, 113, 0.8)";

            ctx.globalAlpha = Math.max(
                0.12,
                Math.min(1, Math.abs(signal) * 1.5)
            );

            ctx.lineWidth = 1 + Math.min(3, Math.abs(signal) * 3);
            ctx.stroke();
        }
    }

    // Connessioni hidden -> output
    for (let i = 0; i < 6; i++) {
        const signal = hidden[i] * brain.weightsHO[i];

        ctx.beginPath();
        ctx.moveTo(hiddenX, hiddenY[i]);
        ctx.lineTo(outputX, outputY);

        ctx.strokeStyle = signal >= 0
            ? "#4ade80"
            : "#f87171";

        ctx.globalAlpha = Math.max(
            0.12,
            Math.min(1, Math.abs(signal) * 1.5)
        );

        ctx.lineWidth = 1 + Math.min(3, Math.abs(signal) * 3);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Disegna un neurone con luminosità
    // proporzionale alla sua attivazione.
    function drawNeuron(x, y, activation) {
        const value = Math.max(0, Math.min(1, activation));

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);

        const green = Math.round(70 + value * 185);
        const blue = Math.round(60 + value * 60);

        ctx.fillStyle = `rgb(35, ${green}, ${blue})`;
        ctx.fill();

        ctx.strokeStyle = "#e2e8f0";
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    // Input: luminosità proporzionale
    // al valore assoluto normalizzato.
    for (let i = 0; i < 4; i++) {
        drawNeuron(inputX, inputY[i], Math.abs(inputs[i]));
    }

    // Hidden layer
    for (let i = 0; i < 6; i++) {
        drawNeuron(hiddenX, hiddenY[i], hidden[i]);
    }

    // Output: verde brillante quando decide di saltare
    drawNeuron(outputX, outputY, output);

    // Evidenziamo la decisione
    if (output > 0.5) {
        ctx.beginPath();
        ctx.arc(outputX, outputY, 17, 0, Math.PI * 2);
        ctx.strokeStyle = "#4ade80";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    // Etichette input
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px Arial";
    ctx.textAlign = "right";

    const labels = ["Y", "VEL", "DX", "DY"];

    for (let i = 0; i < labels.length; i++) {
        ctx.fillText(labels[i], inputX - 18, inputY[i] + 4);
    }

    // Output numerico
    const jumpDisplayDuration = 250; // millisecondi
    const showJump = performance.now() - agent.lastJumpTime < jumpDisplayDuration;

    ctx.textAlign = "center";
    ctx.font = "bold 13px Arial";
    ctx.fillStyle = output > 0.5 ? "#4ade80" : "#ffffff";

    ctx.fillText(
        showJump ? "JUMP" : "WAIT",
        outputX,
        outputY + 32
    );

    ctx.fillText(output.toFixed(2), outputX, outputY - 25);

    // Score dell'agente osservato
    ctx.textAlign = "left";
    ctx.font = "12px Arial";
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText(
        `Observed bird | Score: ${agent.score}`,
        panelX + 15,
        panelY + panelH - 12
    );

    ctx.restore();
}



/**
 * Disegna la dashboard orizzontale nella parte inferiore del Canvas.
 *
 * La dashboard utilizza i dati della popolazione corrente
 * e quelli storici dell'esperimento.
 *
 * È collocata nella fascia inferiore del terreno per non
 * coprire gli uccellini, i tubi o il visualizzatore neurale.
 *
 * Le statistiche correnti vengono ricalcolate durante il rendering.
 *
 * NOTA:
 * BEST FITNESS e AVG FITNESS si riferiscono alla generazione
 * attualmente in esecuzione.
 *
 * BEST EVER rappresenta invece il record storico (tubi superati).
 *
 * generationHistory contiene i risultati delle generazioni
 * completate e potrà essere usato per disegnare un grafico.
 *
 * Questa funzione si occupa esclusivamente della presentazione:
 * non deve modificare fitness, cervelli o generazioni.
 */

function drawTrainingMetrics() {
    if (gameMode !== "TRAINING") return;

    const aliveCount = population.filter(
        agent => agent.state === "ALIVE"
    ).length;

    const currentBestScore = population.length
        ? Math.max(...population.map(agent => agent.score))
        : 0;

    const currentBestFitness = population.length
        ? Math.max(
            ...population.map(agent => calculateFitness(agent))
        )
        : 0;

    const currentAverageFitness = population.length
        ? population.reduce(
            (sum, agent) => sum + calculateFitness(agent),
            0
        ) / population.length
        : 0;

    const currentAverageScore = population.length
        ? population.reduce(
            (sum, agent) => sum + agent.score,
            0
        ) / population.length
        : 0;

    // Barra orizzontale nella fascia inferiore
    const panelX = 15;
    const panelY = groundY + 55;
    const panelW = canvas.width - 30;
    const panelH = Math.min(75, canvas.height - panelY - 5);

    const metrics = [
        ["GENERATION", generation],
        ["ALIVE", `${aliveCount}/${populationSize}`],
        ["BEST SCORE", currentBestScore],
        ["BEST EVER", Math.max(bestScoreEver, currentBestScore)],
        ["AVG SCORE", currentAverageScore.toFixed(2)],
        ["BEST FITNESS", currentBestFitness.toFixed(1)],
        ["AVG FITNESS", currentAverageFitness.toFixed(1)],
        ["GEN TIME", `${generationTime.toFixed(1)}s`]
    ];

    ctx.save();

    // Sfondo color sabbia, coordinato con il terreno.
    // Il pannello viene disegnato nella fascia inferiore del Canvas.
    ctx.fillStyle = "#DDDEA0"; // Sabbia chiara, simile al ground
    ctx.beginPath();
    ctx.roundRect(
        panelX, panelY, panelW, panelH, 10
    );
    ctx.fill();

    const columns = metrics.length;
    const columnWidth = panelW / columns;

    for (let i = 0; i < metrics.length; i++) {
        const [label, value] = metrics[i];

        const centerX =
            panelX + columnWidth * (i + 0.5);

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.font = "bold 11px Arial";
        ctx.fillStyle = "#687044"; // Etichette verde oliva
        ctx.fillText(
            label,
            centerX,
            panelY + 27
        );

        ctx.font = "bold 22px Arial";
        ctx.fillStyle = i === 3
        ? "#278B37"  // Record in verde
        : "#30351F"; // Valori scuri

        ctx.fillText(
            String(value),
            centerX,
            panelY + 58
        );

        // Separatore verticale leggero
        if (i > 0) {
            ctx.strokeStyle = "rgba(255,255,255,0.15)";
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(
                panelX + columnWidth * i,
                panelY + 16
            );
            ctx.lineTo(
                panelX + columnWidth * i,
                panelY + panelH - 16
            );
            ctx.stroke();
        }
    }

    ctx.restore();
}


function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawPipes();

    
    if (gameMode === "TRAINING") {
        for (const agent of population) {

            // Gli agenti vivi continuano a volare
            if (agent.state === "ALIVE") {
                drawBird(agent, agent.animation);
            }

            // Gli agenti in caduta mostrano
            // lo sprite di morte originale
            if (agent.state === "DYING") {
                drawBird(agent, agent.animation, true);
            }

            // Gli agenti DEAD non vengono disegnati
        }
    } else {
        drawBird();
    }

    drawGround();

        
    if (gameMode === "TRAINING" && gameState === "READY") {
        ctx.save();

        ctx.textAlign = "center";
        ctx.fillStyle = "#202020";
        ctx.font = "bold 32px Arial";

        ctx.fillText(
            "PREMI SPAZIO PER AVVIARE L'AI",
            canvas.width / 2,
            canvas.height / 2 - 100
        );

        ctx.restore();
    }


    if (gameState !== "READY") {
        if (gameMode === "TRAINING") {
            // Mostra il punteggio migliore della generazione.
            score = population.length
                ? Math.max(...population.map(agent => agent.score))
                : 0;
        }

        drawScore();
    }


    if (gameMode === "HUMAN" && gameState === "READY") {
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";

        ctx.fillText(
            "PREMI SPAZIO PER INIZIARE",
            canvas.width / 2,
            canvas.height / 2 - 100
        );
    }

    if (gameMode === "HUMAN" && gameState === "GAME_OVER") {
        const gameOverY = canvas.height / 2 - 80;

        ctx.textAlign = "center";
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 52px Arial";

        ctx.fillText(
            "GAME OVER",
            canvas.width / 2,
            gameOverY
        );

        ctx.fillStyle = "black";
        ctx.font = "24px Arial";

        ctx.fillText(
            "Premi R per ricominciare",
            canvas.width / 2,
            gameOverY + 45
        );

    }
    // AI-03B: visualizzazione rete neurale
    drawNeuralNetworkVisualizer();
    drawTrainingMetrics();
}

// =========================
// RESET
// =========================

function resetGame() {
    if (gameMode === "TRAINING") {
        generation = 1;
        generationTime = 0;
        bestScoreEver = 0;
        bestFitnessEver = 0;
        generationHistory = [];

        resetTraining();
        return;
    }

    bird.x = 200;
    bird.y = 300;
    bird.velocityY = 0;
    bird.deathVelocityY = 0;
    bird.timeSinceFlap = 0;

    birdAnimation.sequenceIndex = 0;
    birdAnimation.elapsed = 0;
    birdAnimation.rotation = birdJumpAngle * Math.PI / 180;

    pipes = [];
    pipeTimer = 0;
    nextPipeId = 0;
    score = 0;

    for (const layer of backgroundLayers) {
        layer.offset = 0;
    }

    sounds.hit.pause();
    sounds.hit.onended = null;
    sounds.die.pause();

    gameState = "READY";
}

// =========================
// MENU E CAMBIO MODALITÀ
// =========================

const menu = createMenuController({
    onStartMode: startMode,
    onReturnToMenu: returnToMenu
});

function updateMenuVisibility() {
    menu.updateVisibility(gameState);
}

function stopSounds() {
    sounds.hit.pause();
    sounds.hit.onended = null;
    sounds.die.pause();
}

function returnToMenu() {
    stopSounds();
    gameState = "MENU";
    lastTime = null;
    updateMenuVisibility();
}

function startMode(mode) {
    gameMode = mode;

    if (mode === "TRAINING") {
        // La popolazione viene creata soltanto entrando in TRAINING.
        resetTraining(null, true);
    } else {
        resetGame();
    }

    updateMenuVisibility();
}

// =========================
// GAME LOOP
// =========================

function gameLoop(timestamp) {
    if (lastTime === null) lastTime = timestamp;

    let deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    deltaTime = Math.min(deltaTime, 0.05);

    update(deltaTime);
    draw();

    requestAnimationFrame(gameLoop);
}

// =========================
// INPUT
// =========================


document.addEventListener("keydown", function(event) {

    if (event.code === "Escape") {
        event.preventDefault();
        if (gameState !== "MENU") returnToMenu();
        return;
    }

    if (gameState === "MENU") return;

    if (event.code === "Space") {
        event.preventDefault();

        if (gameMode === "TRAINING") {

            // Avvia il training dopo un'interazione
            // esplicita dell'utente.
            if (gameState === "READY") {
                gameState = "PLAYING";
                console.log("Training avviato!");
            }

            return;
        }

        // Modalità HUMAN: comportamento originale
        if (
            gameState === "READY" ||
            gameState === "PLAYING"
        ) {
            if (gameState === "READY") {
                gameState = "PLAYING";
            }

            bird.velocityY = jumpStrength;
            bird.timeSinceFlap = 0;
            birdAnimation.rotation =
                birdJumpAngle * Math.PI / 180;

            playSound("flap");
        }
    }

    if (event.code === "KeyR") {
        resetGame();
    }
});

canvas.addEventListener("click", function(event) {
    if (gameState === "MENU" || gameMode !== "HUMAN") return;

    if (gameState === "READY" || gameState === "PLAYING") {
        event.preventDefault();
        if (gameState === "READY") gameState = "PLAYING";
        bird.velocityY = jumpStrength;
        bird.timeSinceFlap = 0;
        birdAnimation.rotation = birdJumpAngle * Math.PI / 180;
        playSound("flap");
    }
});



function selectParent(ranked) {
    const pool = ranked.slice(
        0,
        evolutionConfig.parentPoolSize
    );

    // Selezione a torneo: tra tre candidati
    // casuali scegliamo quello con fitness maggiore.
    let winner = null;

    for (let i = 0; i < 3; i++) {
        const candidate = pool[
            Math.floor(Math.random() * pool.length)
        ];

        if (!winner || candidate.fitness > winner.fitness) {
            winner = candidate;
        }
    }

    return winner;
}



/**
 * Esegue una transizione evolutiva tra due generazioni.
 *
 * Viene chiamata quando:
 * - tutti gli agenti sono morti e le animazioni sono terminate;
 * - oppure è stato raggiunto il limite temporale.
 *
 * FASI:
 *
 * 1. Calcolo fitness finale.
 * 2. Ordinamento degli agenti dal migliore al peggiore.
 * 3. Calcolo delle statistiche.
 * 4. Aggiornamento dei record storici.
 * 5. Registrazione dei risultati in generationHistory.
 * 6. Conservazione dei migliori 5 cervelli senza modifiche.
 * 7. Creazione di altri 95 cervelli tramite clonazione e mutazione.
 * 8. Incremento del numero della generazione.
 * 9. Reset dell'ambiente e avvio automatico.
 *
 * ELITISMO:
 * I migliori 5 cervelli non vengono mutati.
 * Questo permette di conservarne i parametri anche se
 * le mutazioni dei discendenti producono risultati peggiori.
 *
 * SELEZIONE:
 * I genitori vengono scelti con un torneo casuale
 * tra i migliori 20 agenti.
 *
 * ATTENZIONE:
 * L'elitismo conserva i pesi, non garantisce lo stesso punteggio
 * nella generazione successiva, perché le condizioni iniziali
 * degli agenti possono essere differenti.
 */

function createNextGeneration() {
    const result = evolvePopulation(population, evolutionConfig);

    bestScoreEver = Math.max(bestScoreEver, result.bestScore);
    bestFitnessEver = Math.max(bestFitnessEver, result.bestFitness);
    generationHistory.push({
        generation,
        bestScore: result.bestScore,
        avgScore: result.avgScore,
        bestFitness: result.bestFitness,
        avgFitness: result.avgFitness
    });

    console.log(
        `GEN ${generation} | ` +
        `Best score: ${result.bestScore} | ` +
        `Avg score: ${result.avgScore.toFixed(2)} | ` +
        `Best fitness: ${result.bestFitness.toFixed(1)}`
    );

    generation++;
    resetTraining(result.nextBrains, true);
    return;

    // Valutazione finale dei 100 uccellini.
    for (const agent of population) {
        agent.fitness = calculateFitness(agent);
    }

    const ranked = [...population].sort(
        (a, b) => b.fitness - a.fitness
    );

    const best = ranked[0];

    const bestScore = Math.max(
        ...population.map(agent => agent.score)
    );

    const avgScore = population.reduce(
        (sum, agent) => sum + agent.score, 0
    ) / population.length;

    const avgFitness = population.reduce(
        (sum, agent) => sum + agent.fitness, 0
    ) / population.length;

    bestScoreEver = Math.max(bestScoreEver, bestScore);
    bestFitnessEver = Math.max(bestFitnessEver, best.fitness);

    generationHistory.push({
        generation: generation,
        bestScore: bestScore,
        avgScore: avgScore,
        bestFitness: best.fitness,
        avgFitness: avgFitness
    });

    console.log(
        `GEN ${generation} | ` +
        `Best score: ${bestScore} | ` +
        `Avg score: ${avgScore.toFixed(2)} | ` +
        `Best fitness: ${best.fitness.toFixed(1)}`
    );

    // Conserviamo i 5 migliori cervelli senza mutazioni.
    const nextBrains = [];

    for (let i = 0; i < evolutionConfig.eliteCount; i++) {
        nextBrains.push(ranked[i].brain.clone());
    }

    // Gli altri 95 derivano da genitori selezionati.
    while (nextBrains.length < populationSize) {
        const parent = selectParent(ranked);

        const childBrain = parent.brain
            .clone()
            .mutate(
                evolutionConfig.mutationRate,
                evolutionConfig.mutationStrength
            );

        nextBrains.push(childBrain);
    }

    generation++;

    // Nuova generazione, partenza automatica.
    resetTraining(nextBrains, true);
}


// =========================
// TRAINING - MILESTONE AI-01/02
// Nessuna rete neurale:
// gli agenti non saltano ancora.
// =========================

function resetTraining(brains = null, autoStart = false) {
    population = Array.from(
        { length: populationSize },
        (_, index) => {
            const agent = createBird();

            if (brains) {
                agent.brain = brains[index];
            }

            return agent;
        }
    );

    trainingPipeIndex = 0;
    pipes = [];
    pipeTimer = 0;
    nextPipeId = 0;
    score = 0;
    generationTime = 0;

    for (const layer of backgroundLayers) {
        layer.offset = 0;
    }

    gameState = autoStart ? "PLAYING" : "READY";
}



function killTrainingBird(agent) {
    if (agent.state !== "ALIVE") return;

    agent.alive = false;
    agent.state = "DYING";

    // Stesso rimbalzo del gioco originale
    agent.deathVelocityY = -290;

     // Effetto sonoro della collisione
    playTrainingDeathSound();
}

function updateTrainingDeath(agent, deltaTime) {
    if (agent.state !== "DYING") return;

    // Gravità durante la morte
    agent.deathVelocityY += gravity * deltaTime;
    agent.y += agent.deathVelocityY * deltaTime;

    // Rotazione durante la caduta
    const startAngle = birdJumpAngle * Math.PI / 180;

    const fallFactor = Math.max(
        0,
        Math.min(1, agent.deathVelocityY / 500)
    );

    const targetRotation =
        startAngle + (maxBirdRotation - startAngle) * fallFactor;

    const smoothing = 1 - Math.exp(
        -birdRotationSpeed * deltaTime
    );

    agent.animation.rotation +=
        (targetRotation - agent.animation.rotation) * smoothing;

    // Arresto sul terreno
    if (agent.y + agent.size >= groundY) {
        agent.y = groundY - agent.size;
        agent.deathVelocityY = 0;
        agent.state = "DEAD";
    }
}


/**
 * Aggiorna un frame della simulazione AI.
 *
 * È il cuore della modalità TRAINING.
 *
 * WORKFLOW:
 *
 * 1. Verifica che la simulazione sia attiva.
 * 2. Aggiorna il tempo della generazione.
 * 3. Aggiorna lo sfondo.
 * 4. Genera e sposta i tubi condivisi.
 * 5. Scorre tutti gli agenti della popolazione.
 *
 * Per ciascun agente:
 *
 * - DYING: aggiorna soltanto l'animazione di morte.
 * - DEAD: non esegue ulteriori aggiornamenti.
 * - ALIVE: esegue la logica completa.
 *
 * Per un agente vivo:
 *
 *   a. Accumula tempo di sopravvivenza.
 *   b. Calcola i quattro input della rete.
 *   c. Esegue la forward propagation.
 *   d. Interpreta l'output come decisione di salto.
 *   e. Applica gravità e velocità.
 *   f. Aggiorna l'animazione.
 *   g. Verifica collisioni.
 *   h. Aggiorna il punteggio individuale.
 *
 * 6. Rimuove i tubi usciti dallo schermo.
 * 7. Verifica se la generazione è terminata.
 * 8. Se necessario chiama createNextGeneration().
 *
 * Tutti gli agenti condividono i tubi, ma possiedono
 * stato fisico e cervello indipendenti.
 *
 * @param {number} deltaTime - Tempo trascorso in secondi.
 */

function updateTraining(deltaTime) {
    if (gameState !== "PLAYING") return;

    generationTime += deltaTime;

    updateBackground(deltaTime);

    // Generazione tubi
    pipeTimer += deltaTime;

    while (pipeTimer >= pipeInterval) {
        createPipe();
        pipeTimer -= pipeInterval;
    }

    // Movimento tubi condivisi
    for (const pipe of pipes) {
        pipe.x -= pipeSpeed * deltaTime;
    }

    let aliveCount = 0;
    let dyingCount = 0;

    for (const agent of population) {

        // =========================
        // UCCELLINO IN CADUTA
        // =========================

        if (agent.state === "DYING") {
            updateTrainingDeath(agent, deltaTime);

            if (agent.state === "DYING") {
                dyingCount++;
            }

            continue;
        }

        // Già morto e fermo sul terreno
        if (agent.state === "DEAD") {
            continue;
        }

        // =========================
        // DECISIONE RETE NEURALE
        // =========================
        agent.survivalTime += deltaTime;

        agent.flapCooldown = Math.max(
            0,
            agent.flapCooldown - deltaTime
        );

        const inputs = getInputs(agent);
        const output = agent.brain.predict(inputs);

        agent.lastDecision = output;

        if (
            output > 0.5 &&
            agent.flapCooldown === 0
        ) {
            agent.velocityY = jumpStrength;
            agent.timeSinceFlap = 0;
            agent.lastJumpTime = performance.now();

            agent.animation.rotation =
                birdJumpAngle * Math.PI / 180;

            agent.flapCooldown = 0.18;
        }

        // =========================
        // FISICA
        // =========================

        agent.velocityY += gravity * deltaTime;
        agent.y += agent.velocityY * deltaTime;

        updateBirdAnimation(
            deltaTime,
            agent,
            agent.animation
        );

        // =========================
        // COLLISIONI
        // =========================

        const hitCeiling = agent.y <= 0;

        const hitGround =
            agent.y + agent.size >= groundY;

        const hitPipe = pipes.some(
            pipe => checkCollision(pipe, agent)
        );

        if (hitCeiling || hitGround || hitPipe) {

            // Se ha toccato il terreno,
            // fermiamo direttamente la caduta.
            if (hitGround) {
                agent.y = groundY - agent.size;
                agent.alive = false;
                agent.state = "DEAD";

                playTrainingDeathSound();
            } else {
                // Collisione con tubo o soffitto:
                // rimbalzo e caduta.
                killTrainingBird(agent);
                dyingCount++;
            }

            continue;
        }

        // =========================
        // PUNTEGGIO INDIVIDUALE
        // =========================

        for (const pipe of pipes) {
            if (
                pipe.id > agent.lastScoredPipeId &&
                agent.x > pipe.x + pipe.width
            ) {
                agent.score++;
                agent.lastScoredPipeId = pipe.id;
            }
        }

        aliveCount++;
    }

    // Rimozione tubi fuori schermo
    pipes = pipes.filter(
        pipe => pipe.x + pipe.width > 0
    );

    // Termina soltanto quando tutti gli agenti
    // sono morti e tutte le cadute sono finite.
    
    const generationExpired =
        generationTime >= evolutionConfig.maxGenerationTime;

    if (
        generationExpired ||
        (aliveCount === 0 && dyingCount === 0)
    ) {
        createNextGeneration();
    }

}



updateMenuVisibility();


// =========================
// START
// =========================

requestAnimationFrame(gameLoop);
