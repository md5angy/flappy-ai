
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const gameMode = "HUMAN"; // HUMAN oppure TRAINING

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

// scale: ingrandimento rispetto al PNG originale
// speed: velocità orizzontale in pixel al secondo
// bottomOffset: distanza verticale dalla superficie del terreno

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

    // Il terreno viene disegnato da groundY verso il basso.
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

    // Ordine: dal livello più lontano al più vicino
    drawBackgroundLayer(backgroundLayers[0]); // Nuvole
    drawBackgroundLayer(backgroundLayers[1]); // Grattacieli
    drawBackgroundLayer(backgroundLayers[2]); // Cespugli
}

function drawGround() {
    drawBackgroundLayer(backgroundLayers[3]);
}

// =========================
// CONFIGURAZIONE AUDIO
// =========================

const soundEnabled = true;
const soundVolume = 0.35;

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

let gameState = "READY";
let lastTime = null;
let pipeTimer = 0;
let score = 0;
let pipes = [];

const bird = {
    x: 200,
    y: 300,
    size: birdSize * birdHitboxRatio,
    velocityY: 0,
    deathVelocityY: 0,
    timeSinceFlap: 0
};

// =========================
// CREAZIONE TUBI
// =========================

function createPipe() {
    const margin = 65;
    const minGapY = margin;
    const maxGapY = groundY - pipeGap - margin;
    const gapY = minGapY + Math.random() * (maxGapY - minGapY);

    pipes.push({
        x: canvas.width,
        width: pipeWidth,
        gapY: gapY,
        gapHeight: pipeGap,
        scored: false
    });
}

// =========================
// COLLISIONI
// =========================

function checkCollision(pipe) {
    const overlapX = bird.x < pipe.x + pipe.width && bird.x + bird.size > pipe.x;
    if (!overlapX) return false;

    const hitTop = bird.y < pipe.gapY;
    const hitBottom = bird.y + bird.size > pipe.gapY + pipe.gapHeight;

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

function updateBirdAnimation(deltaTime) {
    if (gameState === "READY" || gameState === "PLAYING") {
        birdAnimation.elapsed += deltaTime;

        while (birdAnimation.elapsed >= birdAnimation.frameDuration) {
            birdAnimation.elapsed -= birdAnimation.frameDuration;
            birdAnimation.sequenceIndex = (birdAnimation.sequenceIndex + 1) % birdFrameSequence.length;
        }
    }

    if (gameState === "READY") {
        birdAnimation.rotation = birdJumpAngle * Math.PI / 180;
        return;
    }

    if (gameState === "GAME_OVER") return;

    if (gameState === "PLAYING") bird.timeSinceFlap += deltaTime;

    let targetRotation;

    if (gameState === "PLAYING" && bird.timeSinceFlap < birdNoseDownDelay) {
        targetRotation = birdJumpAngle * Math.PI / 180;
    } else {
        const verticalSpeed = gameState === "DYING" ? bird.deathVelocityY : bird.velocityY;
        const fallFactor = Math.max(0, Math.min(1, verticalSpeed / 500));
        const startAngle = birdJumpAngle * Math.PI / 180;
        targetRotation = startAngle + (maxBirdRotation - startAngle) * fallFactor;
    }

    const smoothing = 1 - Math.exp(-birdRotationSpeed * deltaTime);
    birdAnimation.rotation += (targetRotation - birdAnimation.rotation) * smoothing;
}

// =========================
// UPDATE
// =========================

function update(deltaTime) {
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

    // Fisica uccellino
    bird.velocityY += gravity * deltaTime;
    bird.y += bird.velocityY * deltaTime;
    updateBirdAnimation(deltaTime);

    // Soffitto
    if (bird.y <= 0) {
        bird.y = 0;
        killBird();
        return;
    }

    // Collisione con la superficie del terreno
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
    for (const pipe of pipes) pipe.x -= pipeSpeed * deltaTime;

    // Prima controlliamo le collisioni
    for (const pipe of pipes) {
        if (checkCollision(pipe)) {
            killBird();
            break;
        }
    }

    // Punteggio soltanto se l'uccellino è ancora vivo
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

function drawBird() {
    let sprite;

    if (gameState === "DYING" || gameState === "GAME_OVER") {
        sprite = birdDeadSprite;
    } else {
        const frameIndex = birdFrameSequence[birdAnimation.sequenceIndex];
        sprite = birdFrames[frameIndex];
    }

    if (!sprite.complete || sprite.naturalWidth === 0) return;

    const centerX = bird.x + bird.size / 2;
    const centerY = bird.y + bird.size / 2;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(centerX, centerY);
    ctx.rotate(birdAnimation.rotation);
    ctx.drawImage(sprite, -birdSize / 2, -birdSize / 2, birdSize, birdSize);
    ctx.restore();
}

// =========================
// DRAW SINGOLO TUBO
// =========================

function drawSinglePipe(x, y, width, height) {
    if (!pipeSprite.complete || !pipeSprite.naturalWidth || height <= 0) return;

    x = Math.round(x);
    y = Math.round(y);
    width = Math.round(width);
    height = Math.round(height);

    const scale = width / pipeSourceWidth;
    const capHeight = Math.round(pipeSourceCapHeight * scale);
    const bodyHeight = Math.max(0, height - capHeight);
    const bodySourceX = pipeSourceBodyInset;
    const bodySourceY = pipeSourceCapHeight;
    const bodySourceWidth = pipeSourceWidth - pipeSourceBodyInset * 2;
    const bodySourceHeight = pipeSourceBodyEnd - pipeSourceCapHeight;
    const bodyX = Math.round(x + pipeSourceBodyInset * scale);
    const bodyWidth = Math.round(bodySourceWidth * scale);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Corpo allungato senza la riga nera finale del PNG
    if (bodyHeight > 0) {
        ctx.drawImage(pipeSprite, bodySourceX, bodySourceY, bodySourceWidth, bodySourceHeight, bodyX, y + capHeight, bodyWidth, bodyHeight);
    }

    // Testa del tubo
    if (height >= capHeight) {
        ctx.drawImage(pipeSprite, 0, 0, pipeSourceWidth, pipeSourceCapHeight, x, y, width, capHeight);
    } else {
        ctx.drawImage(pipeSprite, 0, 0, pipeSourceWidth, pipeSourceCapHeight * (height / capHeight), x, y, width, height);
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
        const bottomY = Math.round(pipe.gapY + pipe.gapHeight);

        // Tubo inferiore: termina alla superficie del terreno
        drawSinglePipe(x, bottomY, width, groundY - bottomY);

        // Tubo superiore: capovolto, testa verso il varco
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

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Cielo, nuvole, grattacieli, cespugli
    drawBackground();

    // 2. Tubi
    drawPipes();

    // 3. Uccellino
    drawBird();

    // 4. Terreno in primo piano
    drawGround();

    // 5. Interfaccia
    if (gameState !== "READY") drawScore();

   // ctx.fillStyle = "black";
   // ctx.font = "24px Arial";
    //ctx.textAlign = "left";
    //ctx.fillText("MILLER LAB - FLAPPY AI", 30, 40);

    if (gameState === "READY") {
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillText("PREMI SPAZIO PER INIZIARE", canvas.width / 2, canvas.height / 2 - 100);
    }

    if (gameState === "GAME_OVER") {
        const gameOverY = canvas.height / 2 - 80;

        ctx.textAlign = "center";
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 52px Arial";
        ctx.fillText("GAME OVER", canvas.width / 2, gameOverY);

        ctx.fillStyle = "black";
        ctx.font = "24px Arial";
        ctx.fillText("Premi R per ricominciare", canvas.width / 2, gameOverY + 45);
    }
}

// =========================
// RESET
// =========================

function resetGame() {
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
    score = 0;

    // Ripristina lo sfondo all'inizio
    for (const layer of backgroundLayers) layer.offset = 0;

    sounds.hit.pause();
    sounds.hit.onended = null;
    sounds.die.pause();

    gameState = "READY";
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
    if (event.code === "Space") {
        event.preventDefault();

        if (gameState === "READY" || gameState === "PLAYING") {
            if (gameState === "READY") gameState = "PLAYING";

            bird.velocityY = jumpStrength;
            bird.timeSinceFlap = 0;
            birdAnimation.rotation = birdJumpAngle * Math.PI / 180;

            playSound("flap");
        }
    }

    if (event.code === "KeyR") resetGame();
});

// =========================
// START
// =========================

requestAnimationFrame(gameLoop);
