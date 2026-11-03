# Flappy AI Architecture

Project path: `experiments/001-flappy-ai`

Flappy AI is a browser game implemented with native JavaScript ES modules, HTML5 Canvas, CSS, image assets, and HTML audio. It has no framework, bundler, npm runtime, or external dependency. The application is served as static files, for example with:

```bash
python -m http.server 8000
```

The browser entry point is `experiments/001-flappy-ai/index.html`. It loads `js/main.js` as an ES module.

## Module structure

```text
experiments/001-flappy-ai/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── ai/
│   │   ├── NeuralNetwork.js
│   │   └── GeneticAlgorithm.js
│   └── ui/
│       └── Menu.js
└── assets/
    ├── background/
    ├── bird/
    ├── pipes/
    └── sounds/
```

`main.js` owns the application state, Canvas rendering, shared game physics, collisions, pipe generation, audio, input, mode transitions, and the single animation loop.

`ai/NeuralNetwork.js` exports the neural network used by each training bird. It contains the fixed 4 → 6 → 1 architecture, sigmoid activation, parameter initialization, prediction, cloning, and mutation.

`ai/GeneticAlgorithm.js` exports fitness calculation and population evolution. It contains ranking, three-candidate tournament selection, elitism, cloning, and mutation. There is no crossover and no weight persistence.

`ui/Menu.js` connects the menu buttons and validates the training settings. It does not own game state; it calls transition callbacks supplied by `main.js`.

The former `LegacyNeuralNetwork`, the obsolete inline parent-selection function, unreachable generation code, and the unused `main_human.js` entry point are not part of the current architecture.

## Application states and modes

The application uses a mode and a game state:

```text
mode:  null | HUMAN | TRAINING

state: MENU | READY | PLAYING | DYING | GAME_OVER
```

At page load, the state is `MENU` and no training population is created. The menu overlay is visible.

### HUMAN

Selecting HUMAN resets the single bird and starts a new human game in `READY`. SPACE or a Canvas click begins play or makes the bird flap. The mode uses the existing physics, random pipe gaps, collisions, score, animation, and audio.

Training settings have no effect on HUMAN. The simulation speed is reset to 1 for HUMAN.

### TRAINING

Selecting TRAINING validates the population and speed settings, stores them in the runtime configuration, resets the training session, creates the requested population, and starts the simulation immediately in `PLAYING`.

Each training bird has independent physical state, score, survival time, fitness, animation state, cooldown, and neural-network instance. All birds share the same pipe environment for a generation.

### Returning to the menu

ESC and the in-game MENU button stop the current session from advancing, stop the relevant sounds, reset the animation-loop timestamp, clear the speed accumulator, and show the menu. The existing single `requestAnimationFrame` loop remains alive, but no active simulation update is performed while the state is `MENU`.

## Configurable training population

The menu exposes a numeric bird-population field:

- Default: `100`.
- Minimum: `10`.
- Maximum: `500`.
- Integer values only.

`Menu.js` rejects blank, non-numeric, decimal, negative, zero, and out-of-range values. The error is displayed in the menu and the training session is not started.

The accepted value becomes the runtime `populationSize`. It controls the actual length of the population created by `resetTraining`, the number of brains produced by the genetic algorithm, and the population-dependent dashboard statistics. The dashboard displays the actual configured value in the `ALIVE` field.

The genetic parameters remain fixed:

```text
eliteCount       = 5
parentPoolSize   = 20
mutationRate     = 0.15
mutationStrength = 0.35
pipeReward       = 100
```

For a population smaller than the parent-pool size, parent selection uses `ranked.slice(0, parentPoolSize)`. Therefore a population of 10 uses 10 available candidates, not 20. The elite count remains 5, which is valid for every accepted population size.

## Neural network

Each training bird owns one independent feed-forward network:

```text
4 inputs → 6 hidden neurons → 1 output
```

The inputs are normalized in `main.js` and passed in this order:

1. Bird vertical position.
2. Vertical velocity.
3. Horizontal distance to the next pipe.
4. Vertical distance to the pipe-gap center.

Both layers use the sigmoid function:

```text
sigmoid(x) = 1 / (1 + exp(-x))
```

The output is interpreted in `main.js`: when it is greater than `0.5` and the bird's flap cooldown is zero, the training bird flaps.

`clone()` copies all matrices and biases. `mutate(rate, strength)` independently considers every weight and bias using the configured mutation rate and adds a random value in the configured strength range when selected.

## Genetic algorithm

At the end of a generation, `evolvePopulation()` performs the following operations:

1. Compute each agent's fitness:

   ```text
   fitness = survivalTime + score × pipeReward
   ```

2. Sort the population by descending fitness.
3. Copy the top `eliteCount` brains without mutation.
4. Repeatedly select a parent using a three-candidate tournament from the top parent pool.
5. Clone the selected parent's brain and mutate the clone until the next population has the configured size.

There is no crossover. The next generation preserves the current generation's records and history; it does not reset experiment statistics.

## Training session lifecycle

Starting TRAINING from the menu calls `resetTrainingSession()`. This is different from the per-generation reset.

The new-session reset sets:

- `generation = 1`;
- `generationTime = 0`;
- `bestScoreEver = 0`;
- `bestFitnessEver = 0`;
- `generationHistory = []`;
- a new random population using the selected population size;
- the training pipe sequence index to zero;
- the pipe array, pipe timer, pipe IDs, score, and background offsets to their initial values;
- all newly created birds to their initial individual states.

The new population is created with random neural networks because `resetTrainingSession()` passes no inherited brains. The session then starts immediately.

When a generation ends, `createNextGeneration()` calls `evolvePopulation()`, records the generation statistics, increments the generation number, and calls `resetTraining(nextBrains, true)`. That reset creates the next population from the inherited brains while preserving the experiment records and history.

## Simulation speed and time management

The selected training speed is one of:

```text
1×  Normal
2×  Fast
5×  Very Fast
10× Maximum
```

The current speed is shown in the training dashboard as `SPEED`.

### 1× and HUMAN timing

At 1×, TRAINING uses the original variable-delta update path. The animation frame delta is measured from `requestAnimationFrame`, capped at `0.05` seconds, and passed directly to `update(deltaTime)`. HUMAN also uses this original variable-delta path regardless of the training setting.

This preserves the existing 1× behavior as closely as possible. The speed setting does not change gravity, jump strength, pipe speed, pipe interval, gap size, cooldowns, collision formulas, or neural-network calculations.

### Accelerated TRAINING timing

For TRAINING speeds greater than 1×, the loop separates wall-clock time from simulation time:

```text
fixedSimulationStep = 1 / 60 seconds
simulationAccumulator += cappedWallDelta × simulationSpeed
```

While the accumulator contains at least one fixed step, the loop calls `update(fixedSimulationStep)`. The simulation update includes physics, pipe movement and generation, neural-network decisions, collisions, scores, generation time, and training animations.

Rendering is separate: after all simulation steps for the current animation frame, `draw()` is called once. The browser therefore does not render one Canvas frame for every simulated step.

Audio is not time-stretched or played at an accelerated playback rate. Training death sounds continue to use the existing cooldown and browser-safe `play().catch()` handling.

### Safety limit and dropped simulation time

The loop allows at most `120` fixed simulation steps per animation frame. If the limit is reached, the remaining accumulated time is discarded by setting `simulationAccumulator` to zero.

This prevents a stalled or overloaded browser from entering an unbounded catch-up loop. The trade-off is that simulated time can be dropped under sustained load, so the requested 2×, 5×, or 10× rate is approximate in that situation. The browser remains responsive and the simulation does not execute an unlimited burst of updates.

Returning to the menu clears the accumulator. Starting a new mode therefore cannot inherit stale accumulated time from the previous session.

## Game update and rendering flow

```text
requestAnimationFrame(gameLoop)
        |
        +-- measure wall-clock delta and cap it at 0.05 s
        |
        +-- HUMAN or TRAINING at 1×
        |       `update(deltaTime)` once
        |
        +-- TRAINING above 1×
        |       add delta × speed to accumulator
        |       run up to 120 × update(1/60)
        |       discard excess if the limit is reached
        |
        +-- draw() once
        |
        `-- schedule the next animation frame
```

The `update()` dispatcher sends TRAINING to `updateTraining()`. HUMAN updates the single bird, pipes, collisions, score, and death state directly. `updateTraining()` advances the shared pipe environment and then updates each agent according to its state:

```text
ALIVE  → neural-network decision, physics, collisions, score
DYING  → death animation and falling physics
DEAD   → no further agent update
```

A generation ends when the maximum generation time is reached or when no agents remain alive or dying. The genetic algorithm then creates the next generation automatically.

## Persistence and external state

The current implementation does not persist neural-network weights to local storage, a file, or a server. Training state exists only in memory for the current page session. Returning to the menu does not save an incomplete generation, and starting a new TRAINING session intentionally discards the previous in-memory population and statistics.

## Current implementation notes

- There is one active `requestAnimationFrame` loop.
- Menu listeners are installed once by `Menu.js`.
- No additional interval, timeout, worker, or dependency is used for acceleration.
- The training settings are read only when a new TRAINING session starts.
- Population size and speed cannot be changed during an active session.
- The project uses static ES module imports and requires an HTTP server in normal browser use; opening the module entry point directly from `file://` may be blocked by browser module security rules.
