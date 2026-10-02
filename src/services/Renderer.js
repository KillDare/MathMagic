import {
    NodeTypes,
    getPrecedence
} from "../models/NodeTypes.js";

export class Renderer {

    constructor(container) {

        this.container = container;
    }


    // =========================================================
    // Renderização principal
    // =========================================================

    render(expression) {

        this.expression = expression;

        this.container.innerHTML = "";

        if (!expression || expression.isEmpty()) {
            this.renderEmpty();
            return;
        }

        const element = this.renderNode(expression.getRoot());

        this.container.appendChild(element);
    }


    // =========================================================
    // Renderiza um MathNode
    // =========================================================

    renderNode(node, parentNode = null, childIndex = -1) {

        if (!node) {
            return null;
        }


        const element = this.renderNodeElement(node);


        if (
            parentNode &&
            this.needsParentheses(
                node,
                parentNode,
                childIndex
            )
        ) {

            return this.wrapWithParentheses(element);
        }


        return element;
    }

    renderNodeElement(node) {

        switch (node.type) {

            case NodeTypes.NUMBER:
                return this.renderNumber(node);


            case NodeTypes.VARIABLE:
                return this.renderVariable(node);


            case NodeTypes.ADD:
                return this.renderBinaryOperation(node, "+");


            case NodeTypes.SUBTRACT:
                return this.renderBinaryOperation(node, "−");


            case NodeTypes.MULTIPLY:
                return this.renderBinaryOperation(node, "×");


            case NodeTypes.DIVIDE:
                return this.renderBinaryOperation(node, "÷");


            case NodeTypes.POWER:
                return this.renderPower(node);


            case NodeTypes.PARENTHESIS:
                return this.renderParenthesis(node);


            case NodeTypes.SLOT:
                return this.renderSlot(node);


            default:

                console.warn(
                    `Tipo de nó não suportado: ${node.type}`
                );

                return this.createElement(
                    "div",
                    "math-node math-unknown"
                );
        }
    }


    // =========================================================
    // Número
    // =========================================================

    renderNumber(node) {

        const element = this.createElement(
            "div",
            "math-node math-number"
        );

        element.textContent = node.value;

        this.setNodeData(element, node);

        return element;
    }


    // =========================================================
    // Variável
    // =========================================================

    renderVariable(node) {

        const element = this.createElement(
            "div",
            "math-node math-variable"
        );

        element.textContent = node.value;

        this.setNodeData(element, node);

        return element;
    }


    // =========================================================
    // Operações binárias
    // =========================================================

    renderBinaryOperation(node, operator) {

        const element = this.createElement(
            "div",
            "math-node math-binary-operation"
        );

        this.setNodeData(element, node);


        const left = this.renderNode(
            node.getChild(0),
            node,
            0
        );


        const operatorElement = this.createElement(
            "span",
            "math-operator"
        );

        operatorElement.textContent = operator;


        const right = this.renderNode(
            node.getChild(1),
            node,
            1
        );


        const leftContainer = this.createElement(
            "div",
            "math-child"
        );

        leftContainer.appendChild(left);


        const rightContainer = this.createElement(
            "div",
            "math-child"
        );

        rightContainer.appendChild(right);


        element.appendChild(leftContainer);

        element.appendChild(operatorElement);

        element.appendChild(rightContainer);


        return element;
    }

    // =========================================================
    // Potência
    // =========================================================

    renderPower(node) {

        const element = this.createElement(
            "div",
            "math-node math-power"
        );

        this.setNodeData(element, node);


        const base = this.renderNode(
            node.getChild(0)
        );

        const exponent = this.renderNode(
            node.getChild(1)
        );


        const baseContainer = this.createElement(
            "div",
            "math-power__base"
        );

        baseContainer.appendChild(base);


        const exponentContainer = this.createElement(
            "div",
            "math-power__exponent"
        );

        exponentContainer.appendChild(exponent);


        element.appendChild(baseContainer);

        element.appendChild(exponentContainer);


        return element;
    }


    // =========================================================
    // Parênteses
    // =========================================================

    renderParenthesis(node) {

        const element = this.createElement(
            "div",
            "math-node math-parenthesis"
        );

        this.setNodeData(element, node);


        const left = document.createElement("span");

        left.className = "math-parenthesis__symbol";
        left.textContent = "(";


        const child = this.renderNode(
            node.getChild(0)
        );


        const right = document.createElement("span");

        right.className = "math-parenthesis__symbol";
        right.textContent = ")";


        element.appendChild(left);

        element.appendChild(child);

        element.appendChild(right);


        return element;
    }


    // =========================================================
    // Slot
    // =========================================================

    renderSlot(node) {

        const element = this.createElement(
            "button",
            "math-node math-slot"
        );

        element.type = "button";

        element.textContent = "?";

        this.setNodeData(element, node);

        return element;
    }


    // =========================================================
    // Estado vazio
    // =========================================================

    renderEmpty() {

        const element = document.createElement("div");

        element.className = "expression-empty";

        element.innerHTML = `
            <span class="expression-empty__icon">
                +
            </span>

            <span class="expression-empty__text">
                Adicione uma operação para começar
            </span>
        `;

        this.container.appendChild(element);
    }


    // =========================================================
    // Utilitários
    // =========================================================

    createElement(tagName, className) {

        const element = document.createElement(tagName);

        element.className = className;

        return element;
    }


    setNodeData(element, node) {

        element.dataset.nodeId = node.id;

        element.dataset.nodeType = node.type;

        if (this.expression?.selectedNodeId === node.id) {
            element.dataset.selected = "true";
        }
    }

    needsParentheses(
        node,
        parentNode,
        childIndex
    ) {

        const nodePrecedence =
            getPrecedence(node.type);

        const parentPrecedence =
            getPrecedence(parentNode.type);


        // ---------------------------------------------------------
        // Menor precedência:
        //
        // 2 + (3 × 4)
        //
        // Não precisa mostrar parênteses.
        // ---------------------------------------------------------

        if (nodePrecedence > parentPrecedence) {
            return false;
        }


        // ---------------------------------------------------------
        // Menor precedência:
        //
        // (2 + 3) × 4
        //
        // Precisa mostrar parênteses.
        // ---------------------------------------------------------

        if (nodePrecedence < parentPrecedence) {
            return true;
        }


        // ---------------------------------------------------------
        // Mesma precedência
        // ---------------------------------------------------------

        if (
            parentNode.type === NodeTypes.SUBTRACT &&
            childIndex === 1
        ) {
            return true;
        }


        if (
            parentNode.type === NodeTypes.DIVIDE &&
            childIndex === 1
        ) {
            return true;
        }


        return false;
    }

    wrapWithParentheses(element) {

        const container = this.createElement(
            "div",
            "math-node math-auto-parenthesis"
        );


        const left = document.createElement("span");

        left.className =
            "math-parenthesis__symbol";

        left.textContent = "(";


        const right = document.createElement("span");

        right.className =
            "math-parenthesis__symbol";

        right.textContent = ")";


        container.appendChild(left);

        container.appendChild(element);

        container.appendChild(right);


        return container;
    }
}