import { NodeTypes } from "../models/NodeTypes.js";
import { MathNode } from "../models/MathNode.js";


export class ToolbarController {

    constructor(
        expression,
        renderer,
        onExpressionChanged = null
    ) {

        this.expression = expression;

        this.renderer = renderer;

        this.onExpressionChanged =
            onExpressionChanged;
    }


    // =========================================================
    // Valores
    // =========================================================

    handleValue(value) {

        const selected =
            this.expression.getSelectedNode();


        // -----------------------------------------------------
        // Ainda não existe uma expressão.
        // -----------------------------------------------------

        if (!selected) {

            const node =
                new MathNode(
                    NodeTypes.NUMBER,
                    {
                        value
                    }
                );


            this.expression.setRoot(
                node
            );


            this.render();

            return node;
        }


        // -----------------------------------------------------
        // Um SLOT recebe o valor digitado.
        // -----------------------------------------------------

        if (
            selected.type ===
            NodeTypes.SLOT
        ) {

            const node =
                new MathNode(
                    NodeTypes.NUMBER,
                    {
                        value
                    }
                );


            this.expression.replaceNode(
                selected.id,
                node
            );


            this.render();

            return node;
        }


        // -----------------------------------------------------
        // Permite continuar digitando um número.
        // -----------------------------------------------------

        if (
            selected.type ===
                NodeTypes.NUMBER &&
            this.canAppendValue(
                selected.value,
                value
            )
        ) {

            const newValue =
                `${selected.value}${value}`;


            this.expression.setNodeValue(
                selected.id,
                newValue
            );


            this.render();

            return this.expression
                .getSelectedNode();
        }


        return selected;
    }


    canAppendValue(
        currentValue,
        value
    ) {

        if (value === ".") {

            return !String(
                currentValue
            ).includes(".");
        }


        return /^[0-9]$/.test(
            value
        );
    }


    // =========================================================
    // Operações
    // =========================================================

    handleOperation(operation) {

        const selected =
            this.expression.getSelectedNode();


        const nodeType =
            this.getOperationType(
                operation
            );


        if (!nodeType) {
            return null;
        }


        // -----------------------------------------------------
        // Sem expressão:
        // cria a operação com dois SLOTs.
        // -----------------------------------------------------

        if (!selected) {

            const node =
                this.createBinaryNode(
                    nodeType
                );


            this.expression.setRoot(
                node
            );


            this.selectFirstSlot(
                node
            );


            this.render();

            return node;
        }


        // -----------------------------------------------------
        // SLOT selecionado:
        // substitui o SLOT pela operação.
        // -----------------------------------------------------

        if (
            selected.type ===
            NodeTypes.SLOT
        ) {

            const node =
                this.createBinaryNode(
                    nodeType
                );


            this.expression.replaceNode(
                selected.id,
                node
            );


            this.selectFirstSlot(
                node
            );


            this.render();

            return node;
        }


        // -----------------------------------------------------
        // Nó existente:
        //
        //     2
        //
        // vira:
        //
        //     2 + SLOT
        // -----------------------------------------------------

        const node =
            new MathNode(
                nodeType,
                {
                    children: [
                        selected,
                        new MathNode(
                            NodeTypes.SLOT
                        )
                    ]
                }
            );


        this.expression.replaceNode(
            selected.id,
            node
        );


        this.expression.selectNode(
            node.getChild(1).id
        );


        this.render();

        return node;
    }


    // =========================================================
    // Parênteses
    // =========================================================

    handleParenthesis() {

        const selected =
            this.expression.getSelectedNode();


        // -----------------------------------------------------
        // Sem expressão
        // -----------------------------------------------------

        if (!selected) {

            const node =
                new MathNode(
                    NodeTypes.PARENTHESIS,
                    {
                        children: [
                            new MathNode(
                                NodeTypes.SLOT
                            )
                        ]
                    }
                );


            this.expression.setRoot(
                node
            );


            this.selectFirstSlot(
                node
            );


            this.render();

            return node;
        }


        // -----------------------------------------------------
        // SLOT
        // -----------------------------------------------------

        if (
            selected.type ===
            NodeTypes.SLOT
        ) {

            const node =
                new MathNode(
                    NodeTypes.PARENTHESIS,
                    {
                        children: [
                            new MathNode(
                                NodeTypes.SLOT
                            )
                        ]
                    }
                );


            this.expression.replaceNode(
                selected.id,
                node
            );


            this.selectFirstSlot(
                node
            );


            this.render();

            return node;
        }


        // -----------------------------------------------------
        // Expressão existente
        // -----------------------------------------------------

        const node =
            new MathNode(
                NodeTypes.PARENTHESIS,
                {
                    children: [
                        selected
                    ]
                }
            );


        this.expression.replaceNode(
            selected.id,
            node
        );


        this.expression.selectNode(
            node.id
        );


        this.render();

        return node;
    }


    // =========================================================
    // Ações
    // =========================================================

    clear() {

        this.expression.clear();

        this.render();
    }


    // =========================================================
    // Undo
    // =========================================================

    undo() {

        if (
            !this.expression.undo()
        ) {

            return false;
        }


        this.render();

        return true;
    }


    // =========================================================
    // Redo
    // =========================================================

    redo() {

        if (
            !this.expression.redo()
        ) {

            return false;
        }


        this.render();

        return true;
    }


    // =========================================================
    // Utilitários
    // =========================================================

    createBinaryNode(type) {

        return new MathNode(
            type,
            {
                children: [
                    new MathNode(
                        NodeTypes.SLOT
                    ),

                    new MathNode(
                        NodeTypes.SLOT
                    )
                ]
            }
        );
    }


    selectFirstSlot(node) {

        const slot =
            node.children.find(
                child =>
                    child.type ===
                    NodeTypes.SLOT
            );


        this.expression.selectNode(
            slot?.id ??
            node.id
        );
    }


    getOperationType(operation) {

        switch (operation) {

            case "add":
                return NodeTypes.ADD;


            case "subtract":
                return NodeTypes.SUBTRACT;


            case "multiply":
                return NodeTypes.MULTIPLY;


            case "divide":
                return NodeTypes.DIVIDE;


            case "power":
                return NodeTypes.POWER;


            default:
                return null;
        }
    }


    // =========================================================
    // Renderização
    // =========================================================

    render() {

        this.renderer.render(
            this.expression
        );


        if (
            this.onExpressionChanged
        ) {

            this.onExpressionChanged(
                this.expression
            );
        }
    }
}
