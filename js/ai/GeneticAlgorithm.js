/** Fitness = survival time plus a fixed reward for each passed pipe. */
export function calculateFitness(agent, pipeReward) {
    return agent.survivalTime + agent.score * pipeReward;
}

/** Selects a parent by the existing three-candidate tournament. */
function selectParent(ranked, parentPoolSize) {
    const pool = ranked.slice(0, parentPoolSize);
    let winner = null;

    for (let i = 0; i < 3; i++) {
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        if (!winner || candidate.fitness > winner.fitness) winner = candidate;
    }

    return winner;
}

/**
 * Evaluates, ranks and breeds a population using the existing algorithm.
 * There is no crossover in the real implementation, so none is introduced.
 */
export function evolvePopulation(population, config) {
    for (const agent of population) {
        agent.fitness = calculateFitness(agent, config.pipeReward);
    }

    const ranked = [...population].sort((a, b) => b.fitness - a.fitness);
    const best = ranked[0];
    const bestScore = Math.max(...population.map(agent => agent.score));
    const avgScore = population.reduce(
        (sum, agent) => sum + agent.score,
        0
    ) / population.length;
    const avgFitness = population.reduce(
        (sum, agent) => sum + agent.fitness,
        0
    ) / population.length;

    const nextBrains = [];
    for (let i = 0; i < config.eliteCount; i++) {
        nextBrains.push(ranked[i].brain.clone());
    }

    while (nextBrains.length < population.length) {
        const parent = selectParent(ranked, config.parentPoolSize);
        nextBrains.push(parent.brain.clone().mutate(
            config.mutationRate,
            config.mutationStrength
        ));
    }

    return {
        nextBrains,
        bestScore,
        avgScore,
        bestFitness: best.fitness,
        avgFitness
    };
}
