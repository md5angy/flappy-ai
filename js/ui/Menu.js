/** Wires the mode buttons without owning the game's state transitions. */
export function createMenuController({ onStartMode, onReturnToMenu }) {
    const modeMenu = document.getElementById("mode-menu");
    const menuButton = document.getElementById("menu-button");
    const humanButton = document.getElementById("human-button");
    const trainingButton = document.getElementById("training-button");

    humanButton.addEventListener("click", event => {
        event.stopPropagation();
        onStartMode("HUMAN");
    });
    trainingButton.addEventListener("click", event => {
        event.stopPropagation();
        onStartMode("TRAINING");
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
