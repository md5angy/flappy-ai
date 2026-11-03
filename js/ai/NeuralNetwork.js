/** Feed-forward 4 -> 6 -> 1 network used by a training bird. */
export class NeuralNetwork {
    constructor() {
        this.weightsIH = Array.from({ length: 6 }, () =>
            Array.from({ length: 4 }, () => Math.random() * 2 - 1)
        );
        this.biasH = Array.from({ length: 6 }, () => Math.random() * 2 - 1);
        this.weightsHO = Array.from({ length: 6 }, () => Math.random() * 2 - 1);
        this.biasO = Math.random() * 2 - 1;
    }

    /** Sigmoid activation used by the hidden and output layers. */
    static sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    /** @param {number[]} inputs Ordered as Y, velocity, distance X, distance Y. */
    predict(inputs) {
        const hidden = this.weightsIH.map((weights, i) => {
            const sum = weights.reduce(
                (total, weight, j) => total + weight * inputs[j],
                this.biasH[i]
            );
            return NeuralNetwork.sigmoid(sum);
        });

        const sum = this.weightsHO.reduce(
            (total, weight, i) => total + weight * hidden[i],
            this.biasO
        );
        return NeuralNetwork.sigmoid(sum);
    }

    /** Returns an independent copy of all parameters. */
    clone() {
        const copy = new NeuralNetwork();
        copy.weightsIH = this.weightsIH.map(row => [...row]);
        copy.biasH = [...this.biasH];
        copy.weightsHO = [...this.weightsHO];
        copy.biasO = this.biasO;
        return copy;
    }

    /** Applies the existing per-parameter mutation probability and strength. */
    mutate(rate, strength) {
        const mutateValue = value => {
            if (Math.random() >= rate) return value;
            return value + (Math.random() * 2 - 1) * strength;
        };

        this.weightsIH = this.weightsIH.map(row => row.map(mutateValue));
        this.biasH = this.biasH.map(mutateValue);
        this.weightsHO = this.weightsHO.map(mutateValue);
        this.biasO = mutateValue(this.biasO);
        return this;
    }
}
