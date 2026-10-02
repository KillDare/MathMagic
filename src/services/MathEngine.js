import { MathNode } from "../models/MathNode.js";
import {
    NodeTypes,
    getPrecedence
} from "../models/NodeTypes.js";

export class MathEngine {

    // =========================================================
    // Avaliação
    // =========================================================

    evaluate(node) {

        if (!node) {
            throw new Error("Não é possível calcular um nó vazio.");
        }


        switch (node.type) {

            case NodeTypes.NUMBER:

                return this.evaluateNumber(node);


            case NodeTypes.ADD:

                return (
                    this.evaluate(node.getChild(0)) +
                    this.evaluate(node.getChild(1))
                );


            case NodeTypes.SUBTRACT:

                return (
                    this.evaluate(node.getChild(0)) -
                    this.evaluate(node.getChild(1))
                );


            case NodeTypes.MULTIPLY:

                return (
                    this.evaluate(node.getChild(0)) *
                    this.evaluate(node.getChild(1))
                );


            case NodeTypes.DIVIDE:

                return this.evaluateDivision(node);


            case NodeTypes.POWER:

                return Math.pow(
                    this.evaluate(node.getChild(0)),
                    this.evaluate(node.getChild(1))
                );


            case NodeTypes.PARENTHESIS:

                return this.evaluate(
                    node.getChild(0)
                );


            case NodeTypes.VARIABLE:

                throw new Error(
                    `Não é possível calcular a variável "${node.value}".`
                );


            case NodeTypes.SLOT:

                throw new Error(
                    "A expressão ainda possui campos vazios."
                );


            default:

                throw new Error(
                    `Tipo de nó não suportado: ${node.type}`
                );
        }
    }


    // =========================================================
    // Número
    // =========================================================

    evaluateNumber(node) {

        const value = Number(node.value);


        if (!Number.isFinite(value)) {

            throw new Error(
                `Valor numérico inválido: ${node.value}`
            );
        }


        return value;
    }


    // =========================================================
    // Divisão
    // =========================================================

    evaluateDivision(node) {

        const divisor =
            this.evaluate(node.getChild(1));


        if (divisor === 0) {

            throw new Error(
                "Não é possível dividir por zero."
            );
        }


        return (
            this.evaluate(node.getChild(0)) /
            divisor
        );
    }


    // =========================================================
    // Geração dos passos
    // =========================================================

    generateSteps(root) {

        if (!root) {
            return [];
        }


        // Trabalhamos sempre sobre uma cópia.
        let current = this.cloneNode(root);


        const steps = [];


        // Primeiro passo:
        // a expressão original.
        steps.push({
            node: this.cloneNode(current),
            description: "Expressão inicial"
        });


        while (true) {

            const target =
                this.findNextOperation(current);


            if (!target) {
                break;
            }


            const replacement =
                this.reduceNode(target.node);


            if (!replacement) {
                break;
            }


            if (target.parent) {

                target.parent.setChild(
                    target.childIndex,
                    replacement
                );

            } else {

                current = replacement;
            }


            steps.push({
                node: this.cloneNode(current),
                description: target.description
            });
        }


        return steps;
    }


    // =========================================================
    // Localiza a próxima operação
    // =========================================================

    findNextOperation(
        node,
        parent = null,
        childIndex = -1
    ) {

        if (!node) {
            return null;
        }


        // ---------------------------------------------------------
        // Parênteses
        // ---------------------------------------------------------

        if (node.type === NodeTypes.PARENTHESIS) {

            const child = node.getChild(0);


            const inner =
                this.findNextOperation(
                    child,
                    node,
                    0
                );


            if (inner) {
                return inner;
            }


            if (
                child &&
                child.type === NodeTypes.NUMBER
            ) {

                return {
                    node,
                    parent,
                    childIndex,
                    description: "Removemos os parênteses"
                };
            }


            return null;
        }


        // ---------------------------------------------------------
        // Operação binária
        // ---------------------------------------------------------

        if (this.isBinaryOperation(node)) {

            const left = node.getChild(0);
            const right = node.getChild(1);


            // -----------------------------------------------------
            // Primeiro procuramos operações internas.
            // -----------------------------------------------------

            const leftOperation =
                this.findNextOperation(
                    left,
                    node,
                    0
                );


            const rightOperation =
                this.findNextOperation(
                    right,
                    node,
                    1
                );


            // -----------------------------------------------------
            // Se existem operações internas, precisamos escolher
            // aquela com maior precedência.
            // -----------------------------------------------------

            if (leftOperation && rightOperation) {

                const leftPrecedence =
                    getPrecedence(
                        leftOperation.node.type
                    );


                const rightPrecedence =
                    getPrecedence(
                        rightOperation.node.type
                    );


                if (
                    rightPrecedence >
                    leftPrecedence
                ) {
                    return rightOperation;
                }


                return leftOperation;
            }


            if (leftOperation) {
                return leftOperation;
            }


            if (rightOperation) {
                return rightOperation;
            }


            // -----------------------------------------------------
            // Se os dois lados são números, a própria operação
            // pode ser executada.
            // -----------------------------------------------------

            if (
                this.canEvaluate(left) &&
                this.canEvaluate(right)
            ) {

                return {
                    node,
                    parent,
                    childIndex,
                    description:
                        this.getOperationDescription(node)
                };
            }
        }


        return null;
    }


    // =========================================================
    // Executa uma operação individual
    // =========================================================

    reduceNode(node) {

        if (!node) {
            return null;
        }


        // -----------------------------------------------------
        // Parênteses
        // -----------------------------------------------------

        if (
            node.type === NodeTypes.PARENTHESIS
        ) {

            const child = node.getChild(0);


            if (
                child &&
                child.type === NodeTypes.NUMBER
            ) {

                return this.cloneNode(child);
            }


            return null;
        }


        // -----------------------------------------------------
        // Operações binárias
        // -----------------------------------------------------

        if (this.isBinaryOperation(node)) {

            const value = this.evaluate(node);


            return new MathNode(
                NodeTypes.NUMBER,
                {
                    value: this.formatNumber(value)
                }
            );
        }


        return null;
    }


    // =========================================================
    // Verifica se uma operação pode ser calculada
    // =========================================================

    canEvaluate(node) {

        if (!node) {
            return false;
        }


        switch (node.type) {

            case NodeTypes.NUMBER:

                return true;


            case NodeTypes.PARENTHESIS:

                return this.canEvaluate(
                    node.getChild(0)
                );


            default:

                return false;
        }
    }


    // =========================================================
    // Operações binárias
    // =========================================================

    isBinaryOperation(node) {

        if (!node) {
            return false;
        }


        return (
            node.type === NodeTypes.ADD ||
            node.type === NodeTypes.SUBTRACT ||
            node.type === NodeTypes.MULTIPLY ||
            node.type === NodeTypes.DIVIDE ||
            node.type === NodeTypes.POWER
        );
    }


    // =========================================================
    // Descrição do passo
    // =========================================================

    getOperationDescription(node) {

        switch (node.type) {

            case NodeTypes.ADD:
                return "Efetuamos a soma";


            case NodeTypes.SUBTRACT:
                return "Efetuamos a subtração";


            case NodeTypes.MULTIPLY:
                return "Efetuamos a multiplicação";


            case NodeTypes.DIVIDE:
                return "Efetuamos a divisão";


            case NodeTypes.POWER:
                return "Calculamos a potência";


            default:
                return "Efetuamos a operação";
        }
    }


    // =========================================================
    // Clonagem
    // =========================================================

    cloneNode(node) {

        if (!node) {
            return null;
        }


        const clone =
            new MathNode(
                node.type,
                {
                    value: node.value
                }
            );


        for (const child of node.children) {

            clone.addChild(
                this.cloneNode(child)
            );
        }


        return clone;
    }


    // =========================================================
    // Formatação numérica
    // =========================================================

    formatNumber(value) {

        if (Number.isInteger(value)) {
            return String(value);
        }


        return String(
            Number(
                value.toFixed(12)
            )
        );
    }
}
