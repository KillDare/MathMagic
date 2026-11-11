import { NodeTypes } from "../models/NodeTypes.js";

export class ExpressionValidator {

    static validate(node, options = {}) {
        const allowSlots =
            options.allowSlots ?? true;

        if (!node) {
            return {
                valid: true,
                error: null
            };
        }

        const result =
            this.validateNode(
                node,
                allowSlots
            );

        return result;
    }

    static validateNode(node, allowSlots) {

        if (!node) {
            return {
                valid: false,
                error: "A árvore contém um nó vazio."
            };
        }

        if (!node.id) {
            return {
                valid: false,
                error: "O nó não possui identificador."
            };
        }

        if (!Array.isArray(node.children)) {
            return {
                valid: false,
                error:
                    `O nó "${node.id}" possui filhos inválidos.`
            };
        }

        switch (node.type) {

            case NodeTypes.NUMBER:
                return this.validateNumber(node);

            case NodeTypes.VARIABLE:
                return this.validateVariable(node);

            case NodeTypes.SLOT:

                if (!allowSlots) {
                    return {
                        valid: false,
                        error:
                            "A expressão contém campos vazios."
                    };
                }

                return this.validateSlot(node);

            case NodeTypes.ADD:
            case NodeTypes.SUBTRACT:
            case NodeTypes.MULTIPLY:
            case NodeTypes.DIVIDE:
            case NodeTypes.POWER:
                return this.validateBinaryOperation(
                    node,
                    allowSlots
                );
            case NodeTypes.NEGATE:
            case NodeTypes.RADICAL:
                return this.validateUnaryOperation(
                    node,
                    allowSlots
                );

            case NodeTypes.FRACTION:
                return this.validateFraction(node, allowSlots);

            case NodeTypes.PARENTHESIS:
                return this.validateParenthesis(
                    node,
                    allowSlots
                );

            default:
                return {
                    valid: false,
                    error:
                        `Tipo de nó desconhecido: ${node.type}`
                };
        }
    }

    static validateNumber(node) {

        if (node.children.length !== 0) {
            return {
                valid: false,
                error:
                    "Um número não pode possuir filhos."
            };
        }

        if (
            node.value === null ||
            node.value === undefined ||
            String(node.value).trim() === ""
        ) {
            return {
                valid: false,
                error:
                    "Um número precisa possuir um valor."
            };
        }

        if (
            !/^\d+(\.\d*)?$/.test(
                String(node.value)
            )
        ) {
            return {
                valid: false,
                error:
                    `Número inválido: ${node.value}`
            };
        }

        return {
            valid: true,
            error: null
        };
    }

    static validateVariable(node) {

        if (node.children.length !== 0) {
            return {
                valid: false,
                error:
                    "Uma variável não pode possuir filhos."
            };
        }

        if (
            node.value === null ||
            node.value === undefined ||
            String(node.value).trim() === ""
        ) {
            return {
                valid: false,
                error:
                    "Uma variável precisa possuir um valor."
            };
        }

        return {
            valid: true,
            error: null
        };
    }

    static validateSlot(node) {

        if (node.children.length !== 0) {
            return {
                valid: false,
                error:
                    "Um SLOT não pode possuir filhos."
            };
        }

        return {
            valid: true,
            error: null
        };
    }

    static validateBinaryOperation(
        node,
        allowSlots
    ) {

        if (node.children.length !== 2) {
            return {
                valid: false,
                error:
                    `A operação "${node.type}" precisa possuir exatamente dois operandos.`
            };
        }

        const left =
            this.validateNode(
                node.children[0],
                allowSlots
            );

        if (!left.valid) {
            return left;
        }

        const right =
            this.validateNode(
                node.children[1],
                allowSlots
            );

        if (!right.valid) {
            return right;
        }

        return {
            valid: true,
            error: null
        };
    }

    static validateUnaryOperation(
        node,
        allowSlots
    ) {

        if (node.children.length !== 1) {
            return {
                valid: false,
                error:
                    `A operação "${node.type}" precisa possuir exatamente um operando.`
            };
        }

        return this.validateNode(
            node.getChild(0),
            allowSlots
        );
    }

    static validateFraction(node, allowSlots) {
        if (node.children.length !== 2) {
            return {
                valid: false,
                error: "Uma fração precisa possuir numerador e denominador."
            };
        }

        const numerator = this.validateNode(node.children[0], allowSlots);
        if (!numerator.valid) return numerator;

        return this.validateNode(node.children[1], allowSlots);
    }

    static validateParenthesis(
        node,
        allowSlots
    ) {

        if (node.children.length !== 1) {
            return {
                valid: false,
                error:
                    "Parênteses precisam possuir exatamente um conteúdo."
            };
        }

        return this.validateNode(
            node.children[0],
            allowSlots
        );
    }
}