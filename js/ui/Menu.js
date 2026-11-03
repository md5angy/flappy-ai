/** Wires the mode buttons without owning the game's state transitions. */
export function createMenuController({ onStartMode, onReturnToMenu }) {
    const modeMenu = document.getElementById("mode-menu");
    const menuButton = document.getElementById("menu-button");
    const humanButton = document.getElementById("human-button");
    const trainingButton = document.getElementById("training-button");
    const populationInput = document.getElementById("population-input");
    const speedInput = document.getElementById("speed-input");
    const settingsError = document.getElementById("settings-error");

    humanButton.addEventListener("click", event => {
        event.stopPropagation();
        onStartMode("HUMAN");
    });
    trainingButton.addEventListener("click", event => {
        event.stopPropagation();
        const population = Number(populationInput.value);
        const speed = Number(speedInput.value);

        if (!/^\d+$/.test(populationInput.value.trim()) || !Number.isInteger(population) || population < 10 || population > 500) {
            settingsError.textContent = "Bird population must be an integer from 10 to 500.";
            populationInput.focus();
            return;
        }

        if (![1, 2, 5, 10].includes(speed)) {
            settingsError.textContent = "Choose a simulation speed from the list.";
            speedInput.focus();
            return;
        }

        settingsError.textContent = "";
        onStartMode("TRAINING", {
            populationSize: population,
            simulationSpeed: speed
        });
    });
    menuButton.addEventListener("click", event => {
        event.stopPropagation();
        onReturnToMenu();
    });

    return {
        /** Updates the overlay and gameplay button visibility. */
        updateVisibility(gameState) {
            const menuOpen = gameState === "MENU";
            modeMenu.hidden = !menuOpen;
            menuButton.hidden = menuOpen;
        }
    };
}
