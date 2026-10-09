import { MathNode } from "../models/MathNode.js";

import {
    NodeTypes,
    getPrecedence
} from "../models/NodeTypes.js";


export class MathEngine {

    // =========================================================
    // Verifica se a expressão está completa
    // =========================================================

    isComplete(node) {
        if (!node || !Array.isArray(node.children)) {
            return false;
        }

        if (node.type === NodeTypes.SLOT) {
            return false;
        }

        if (node.type === NodeTypes.NUMBER) {
            if (node.children.length !== 0 || node.value === null || String(node.value).trim() === "") {
                return false;
            }

            return Number.isFinite(Number(node.value));
        }

        if (node.type === NodeTypes.VARIABLE) {
            return node.children.length === 0 && String(node.value ?? "").trim() !== "";
        }

        if (node.type === NodeTypes.PARENTHESIS) {
            return node.children.length === 1 && this.isComplete(node.children[0]);
        }

        const binaryOperators = new Set([
            NodeTypes.ADD,
            NodeTypes.SUBTRACT,
            NodeTypes.MULTIPLY,
            NodeTypes.DIVIDE,
            NodeTypes.POWER
        ]);

        if (!binaryOperators.has(node.type) || node.children.length !== 2) {
            return false;
        }

        return node.children.every(child => this.isComplete(child));
    }

    // =========================================================
    // Avaliação
    // =========================================================

    evaluate(node) {

        if (!node) {

            throw new Error(
                "Não é possível calcular um nó vazio."
            );
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

        if (Number.isNaN(value)) {
            throw new Error(
                `Número inválido: ${node.value}`
            );
        }

        return value;
    }

    // =========================================================
    // Divisão
    // =========================================================

    evaluateDivision(node) {

        const divisor =
            this.evaluate(
                node.getChild(1)
            );


        if (
            divisor === 0
        ) {

            throw new Error(
                "Não é possível dividir por zero."
            );
        }


        return (
            this.evaluate(
                node.getChild(0)
            ) /
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


        // ---------------------------------------------------------
        // Não resolve expressões incompletas.
        // ---------------------------------------------------------

        if (
            !this.isComplete(root)
        ) {

            return [];
        }


        // ---------------------------------------------------------
        // Trabalhamos sempre com uma cópia.
        // ---------------------------------------------------------

        let current =
            this.cloneNode(root);


        const steps = [];


        // ---------------------------------------------------------
        // Primeiro passo
        // ---------------------------------------------------------

        steps.push({

            node:
                this.cloneNode(current),

            description:
                "Expressão inicial",

            type:
                "initial"
        });


        // ---------------------------------------------------------
        // Redução progressiva
        // ---------------------------------------------------------

        while (true) {

            const target =
                this.findNextOperation(
                    current
                );


            if (!target) {
                break;
            }

            const before =
                this.cloneNode(
                    current
                );


            const highlightedNodeId =
                target.node.id;


            const replacement =
                this.reduceNode(
                    target.node
                );


            if (!replacement) {
                break;
            }


            if (
                target.parent
            ) {

                target.parent.setChild(
                    target.childIndex,
                    replacement
                );

            } else {

                current =
                    replacement;
            }

            steps.push({

                before,

                node:
                    this.cloneNode(
                        current
                    ),

                highlightedNodeId,

                description:
                    target.description,

                type:
                    "operation"
            });
        }


        // ---------------------------------------------------------
        // Último passo
        // ---------------------------------------------------------

        if (
            steps.length > 1
        ) {

            steps[
                steps.length - 1
            ].type = "result";
        }


        // ---------------------------------------------------------
        // Se o motor não conseguiu resolver a expressão
        // ---------------------------------------------------------

        if (
            steps.length === 1 &&
            current.type !== NodeTypes.NUMBER
        ) {

            throw new Error(
                "O MathMagic ainda não consegue resolver esta expressão."
            );
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


        // -----------------------------------------------------
        // Parênteses
        // -----------------------------------------------------

        if (
            node.type ===
            NodeTypes.PARENTHESIS
        ) {

            const child =
                node.getChild(0);


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
                child.type ===
                NodeTypes.NUMBER
            ) {

                return {

                    node,

                    parent,

                    childIndex,

                    description:
                        `Removemos os parênteses: ${this.nodeToText(node)}`
                };
            }


            return null;
        }


        // -----------------------------------------------------
        // Operações binárias
        // -----------------------------------------------------

        if (
            this.isBinaryOperation(node)
        ) {

            const left =
                node.getChild(0);


            const right =
                node.getChild(1);


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

            if (
                leftOperation &&
                rightOperation
            ) {

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


            if (
                leftOperation
            ) {

                return leftOperation;
            }


            if (
                rightOperation
            ) {

                return rightOperation;
            }


            if (
                this.canEvaluate(left) &&
                this.canEvaluate(right)
            ) {

                const result =
                    this.evaluate(node);


                return {

                    node,

                    parent,

                    childIndex,

                    description:
                        this.getOperationDescription(
                            node,
                            result
                        )
                };
            }
        }


        return null;
    }


    // =========================================================
    // Executa uma operação
    // =========================================================

    reduceNode(node) {

        if (!node) {
            return null;
        }


        // -----------------------------------------------------
        // Parênteses
        // -----------------------------------------------------

        if (
            node.type ===
            NodeTypes.PARENTHESIS
        ) {

            const child =
                node.getChild(0);


            if (
                child &&
                child.type ===
                NodeTypes.NUMBER
            ) {

                return this.cloneNode(
                    child
                );
            }


            return null;
        }


        // -----------------------------------------------------
        // Operações
        // -----------------------------------------------------

        if (
            this.isBinaryOperation(node)
        ) {

            const value =
                this.evaluate(node);


            return new MathNode(
                NodeTypes.NUMBER,
                {
                    value:
                        this.formatNumber(
                            value
                        )
                }
            );
        }


        return null;
    }


    // =========================================================
    // Verifica se um nó pode ser calculado
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
    // Descrição detalhada da operação
    // =========================================================

    getOperationDescription(
        node,
        result
    ) {

        const left =
            this.nodeToText(
                node.getChild(0)
            );


        const right =
            this.nodeToText(
                node.getChild(1)
            );


        const resultText =
            this.formatNumber(
                result
            );


        switch (node.type) {

            case NodeTypes.ADD:

                return `Somamos ${left} + ${right} = ${resultText}`;


            case NodeTypes.SUBTRACT:

                return `Subtraímos ${left} − ${right} = ${resultText}`;


            case NodeTypes.MULTIPLY:

                return `Multiplicamos ${left} × ${right} = ${resultText}`;


            case NodeTypes.DIVIDE:

                return `Dividimos ${left} ÷ ${right} = ${resultText}`;


            case NodeTypes.POWER:

                return `Calculamos ${left}^${right} = ${resultText}`;


            default:

                return "Efetuamos a operação";
        }
    }


    // =========================================================
    // Converte um nó para texto matemático
    // =========================================================

    nodeToText(node) {

        if (!node) {
            return "?";
        }


        switch (node.type) {

            case NodeTypes.NUMBER:

                return String(
                    node.value
                );


            case NodeTypes.VARIABLE:

                return String(
                    node.value
                );


            case NodeTypes.PARENTHESIS:

                return `(${this.nodeToText(
                    node.getChild(0)
                )})`;


            case NodeTypes.ADD:

                return `${this.nodeToText(
                    node.getChild(0)
                )} + ${this.nodeToText(
                    node.getChild(1)
                )}`;


            case NodeTypes.SUBTRACT:

                return `${this.nodeToText(
                    node.getChild(0)
                )} − ${this.nodeToText(
                    node.getChild(1)
                )}`;


            case NodeTypes.MULTIPLY:

                return `${this.nodeToText(
                    node.getChild(0)
                )} × ${this.nodeToText(
                    node.getChild(1)
                )}`;


            case NodeTypes.DIVIDE:

                return `${this.nodeToText(
                    node.getChild(0)
                )} ÷ ${this.nodeToText(
                    node.getChild(1)
                )}`;


            case NodeTypes.POWER:

                return `${this.nodeToText(
                    node.getChild(0)
                )}^${this.nodeToText(
                    node.getChild(1)
                )}`;


            case NodeTypes.SLOT:

                return "□";


            default:

                return "?";
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
                    value:
                        node.value,

                    id:
                        node.id
                }
            );


        for (
            const child of node.children
        ) {

            clone.addChild(
                this.cloneNode(
                    child
                )
            );
        }


        return clone;
    }


    // =========================================================
    // Formatação numérica
    // =========================================================

    formatNumber(value) {
        if (!Number.isFinite(value)) {
            return String(value);
        }

        if (Number.isInteger(value)) {
            return String(value);
        }

        return String(
            Number(value.toFixed(10))
        );
    }
}