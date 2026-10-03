import { NodeTypes } from "../models/NodeTypes.js";
import { MathNode } from "../models/MathNode.js";

export class ExpressionController {
    constructor(expression, renderer, container) {
        this.expression = expression;
        this.renderer = renderer;
        this.container = container;

        this.history = [];
        this.historyIndex = -1;

        this.onChange = null;

        this.saveState();
        this.bindEvents();
    }

    setOnChange(callback) {
        this.onChange = callback;
    }

    bindEvents() {
        this.container.addEventListener("click", (event) => {
            const nodeElement = event.target.closest("[data-node-id]");

            if (!nodeElement) {
                return;
            }

            const nodeId = nodeElement.dataset.nodeId;

            this.selectNode(nodeId);
        });

        document.addEventListener("keydown", (event) => {
            this.handleKeyboard(event);
        });
    }

    handleKeyboard(event) {
        const target = event.target;

        if (
            target instanceof HTMLInputElement ||
            target instanceof HTMLTextAreaElement ||
            target.isContentEditable
        ) {
            return;
        }

        const key = event.key;

        /*
         * Números
         */
        if (/^[0-9]$/.test(key)) {
            event.preventDefault();
            this.inputNumber(key);
            return;
        }

        /*
         * Operadores
         */
        const operators = {
            "+": NodeTypes.ADD,
            "-": NodeTypes.SUBTRACT,
            "*": NodeTypes.MULTIPLY,
            "x": NodeTypes.MULTIPLY,
            "X": NodeTypes.MULTIPLY,
            "/": NodeTypes.DIVIDE,
            "^": NodeTypes.POWER
        };

        if (operators[key]) {
            event.preventDefault();
            this.inputOperator(operators[key]);
            return;
        }

        /*
         * Parênteses
         */
        if (key === "(") {
            event.preventDefault();
            this.inputParenthesisOpen();
            return;
        }

        if (key === ")") {
            event.preventDefault();
            this.inputParenthesisClose();
            return;
        }

        /*
         * Decimal
         */
        if (key === "." || key === ",") {
            event.preventDefault();
            this.inputDecimal();
            return;
        }

        /*
         * Backspace
         */
        if (key === "Backspace") {
            event.preventDefault();
            this.backspace();
            return;
        }

        /*
         * Escape
         */
        if (key === "Escape") {
            event.preventDefault();
            this.clearSelection();
        }
    }

    inputNumber(value) {
        const root = this.expression.getRoot();

        if (!root || root.type === NodeTypes.SLOT) {
            const node = new MathNode(NodeTypes.NUMBER, {
                value
            });

            this.expression.setRoot(node);
            this.saveState();
            this.update();
            return;
        }

        const selectedNode = this.findNodeById(
            root,
            this.expression.selectedNodeId
        );

        if (selectedNode?.type === NodeTypes.NUMBER) {
            selectedNode.value = `${selectedNode.value}${value}`;

            this.saveState();
            this.update();
            return;
        }

        const slot = this.findFirstSlot(root);

        if (slot) {
            slot.type = NodeTypes.NUMBER;
            slot.value = value;
            slot.children = [];

            this.saveState();
            this.update();
        }
    }

    inputOperator(operatorType) {
        const root = this.expression.getRoot();

        if (!root) {
            return;
        }

        if (
            root.type === NodeTypes.NUMBER ||
            root.type === NodeTypes.VARIABLE
        ) {
            const operation = new MathNode(operatorType);

            operation.addChild(root);
            operation.addChild(
                new MathNode(NodeTypes.SLOT)
            );

            this.expression.setRoot(operation);

            this.saveState();
            this.update();
            return;
        }

        const slot = this.findFirstSlot(root);

        if (slot) {
            return;
        }

        const lastNumber = this.findLastNumber(root);

        if (!lastNumber) {
            return;
        }

        const parentInfo = this.findParent(root, lastNumber);

        if (!parentInfo) {
            return;
        }

        const operation = new MathNode(operatorType);

        operation.addChild(lastNumber);
        operation.addChild(
            new MathNode(NodeTypes.SLOT)
        );

        parentInfo.parent.setChild(
            parentInfo.index,
            operation
        );

        this.saveState();
        this.update();
    }

    inputParenthesisOpen() {
        const root = this.expression.getRoot();

        /*
         * Expressão vazia:
         *
         * (
         *   SLOT
         * )
         */
        if (!root) {
            const parenthesis = new MathNode(
                NodeTypes.PARENTHESIS
            );

            parenthesis.addChild(
                new MathNode(NodeTypes.SLOT)
            );

            this.expression.setRoot(parenthesis);

            this.saveState();
            this.update();
            return;
        }

        /*
         * Se existe um SLOT, usamos o SLOT
         * como conteúdo do novo parêntese.
         */
        const slot = this.findFirstSlot(root);

        if (slot) {
            slot.type = NodeTypes.PARENTHESIS;
            slot.value = null;
            slot.children = [
                new MathNode(NodeTypes.SLOT)
            ];

            this.saveState();
            this.update();
            return;
        }

        const lastValue = this.findLastValue(root);

        if (!lastValue) {
            return;
        }

        const parentInfo =
            this.findParent(
                root,
                lastValue
            );

        const parenthesis =
            new MathNode(
                NodeTypes.PARENTHESIS
            );

        parenthesis.addChild(
            new MathNode(NodeTypes.SLOT)
        );

        const multiplication =
            new MathNode(
                NodeTypes.MULTIPLY
            );

        multiplication.addChild(
            lastValue
        );

        multiplication.addChild(
            parenthesis
        );

        if (!parentInfo) {
            this.expression.setRoot(
                multiplication
            );

            this.saveState();
            this.update();
            return;
        }

        parentInfo.parent.setChild(
            parentInfo.index,
            multiplication
        );

        this.saveState();
        this.update();
    }

    inputParenthesisClose() {
        const root = this.expression.getRoot();

        if (!root) {
            return;
        }

        const openParenthesis =
            this.findOpenParenthesis(root);

        if (!openParenthesis) {
            return;
        }

        const slot = this.findFirstSlot(
            openParenthesis
        );

        if (slot) {
            return;
        }

        this.expression.selectedNodeId =
            openParenthesis.id;

        this.saveState();
        this.update();
    }

    findOpenParenthesis(node) {
        if (!node) {
            return null;
        }

        for (let i = node.children.length - 1; i >= 0; i--) {
            const result = this.findOpenParenthesis(
                node.children[i]
            );

            if (result) {
                return result;
            }
        }

        if (node.type === NodeTypes.PARENTHESIS) {

            if (this.findFirstSlot(node)) {
                return node;
            }
        }

        return null;
    }

    inputDecimal() {
        const root = this.expression.getRoot();

        if (!root) {
            const node = new MathNode(
                NodeTypes.NUMBER,
                {
                    value: "0."
                }
            );

            this.expression.setRoot(node);

            this.saveState();
            this.update();
            return;
        }

        const selectedNode = this.findNodeById(
            root,
            this.expression.selectedNodeId
        );

        if (selectedNode?.type === NodeTypes.NUMBER) {
            const value = String(
                selectedNode.value
            );

            /*
             * Impede:
             *
             * 12.3.4
             */
            if (value.includes(".")) {
                return;
            }

            selectedNode.value += ".";

            this.saveState();
            this.update();
            return;
        }

        /*
         * Se existir SLOT, começa um número decimal.
         */
        const slot = this.findFirstSlot(root);

        if (slot) {
            slot.type = NodeTypes.NUMBER;
            slot.value = "0.";
            slot.children = [];

            this.saveState();
            this.update();
        }
    }


    backspace() {
        const root = this.expression.getRoot();

        if (!root) {
            return;
        }

        const selectedNode = this.findNodeById(
            root,
            this.expression.selectedNodeId
        );

        /*
         * Apagar um dígito de um número.
         */
        if (selectedNode?.type === NodeTypes.NUMBER) {
            const value = String(selectedNode.value);

            if (value.length > 1) {
                selectedNode.value = value.slice(0, -1);

                this.saveState();
                this.update();
                return;
            }

            /*
             * Número de apenas um dígito:
             * transforma novamente em SLOT.
             */
            selectedNode.type = NodeTypes.SLOT;
            selectedNode.value = null;

            this.saveState();
            this.update();
            return;
        }

        /*
         * Se houver SLOT, tenta remover
         * a operação correspondente.
         */
        const slotInfo = this.findFirstSlotWithParent(root);

        if (slotInfo?.parent) {
            const parent = slotInfo.parent;

            if (
                parent.children.length === 2 &&
                parent.getChild(1) === slotInfo.slot
            ) {
                const left = parent.getChild(0);

                const parentInfo = this.findParent(root, parent);

                if (!parentInfo) {
                    this.expression.setRoot(left);
                } else {
                    parentInfo.parent.setChild(
                        parentInfo.index,
                        left
                    );
                }

                this.saveState();
                this.update();
            }
        }
    }

    selectNode(nodeId) {
        this.expression.selectedNodeId = nodeId;

        this.renderer.render(this.expression);

        this.update();
    }

    clearSelection() {
        this.expression.selectedNodeId = null;

        this.renderer.render(this.expression);
    }

    findNodeById(node, id) {
        if (!node || !id) {
            return null;
        }

        if (node.id === id) {
            return node;
        }

        for (const child of node.children) {
            const result = this.findNodeById(child, id);

            if (result) {
                return result;
            }
        }

        return null;
    }

    findFirstSlot(node) {
        if (!node) {
            return null;
        }

        if (node.type === NodeTypes.SLOT) {
            return node;
        }

        for (const child of node.children) {
            const result = this.findFirstSlot(child);

            if (result) {
                return result;
            }
        }

        return null;
    }

    findFirstSlotWithParent(node, parent = null) {
        if (!node) {
            return null;
        }

        if (node.type === NodeTypes.SLOT) {
            return {
                slot: node,
                parent
            };
        }

        for (const child of node.children) {
            const result = this.findFirstSlotWithParent(
                child,
                node
            );

            if (result) {
                return result;
            }
        }

        return null;
    }

    findLastValue(node) {
        if (!node) {
            return null;
        }

        for (
            let i = node.children.length - 1;
            i >= 0;
            i--
        ) {
            const result =
                this.findLastValue(
                    node.children[i]
                );

            if (result) {
                return result;
            }
        }

        if (
            node.type === NodeTypes.NUMBER ||
            node.type === NodeTypes.PARENTHESIS
        ) {
            return node;
        }

        return null;
    }

    findParent(root, target, parent = null) {
        if (!root) {
            return null;
        }

        if (root === target) {
            return parent;
        }

        for (let i = 0; i < root.children.length; i++) {
            const child = root.children[i];

            if (child === target) {
                return {
                    parent: root,
                    index: i
                };
            }

            const result = this.findParent(
                child,
                target,
                root
            );

            if (result) {
                return result;
            }
        }

        return null;
    }

    saveState() {
        const state = this.cloneTree(
            this.expression.getRoot()
        );

        this.history = this.history.slice(
            0,
            this.historyIndex + 1
        );

        this.history.push(state);
        this.historyIndex++;

        if (this.history.length > 100) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex <= 0) {
            return;
        }

        this.historyIndex--;

        const state = this.history[this.historyIndex];

        this.expression.setRoot(
            this.cloneTree(state)
        );

        this.expression.selectedNodeId = null;

        this.update();
    }

    redo() {
        if (
            this.historyIndex >=
            this.history.length - 1
        ) {
            return;
        }

        this.historyIndex++;

        const state = this.history[this.historyIndex];

        this.expression.setRoot(
            this.cloneTree(state)
        );

        this.expression.selectedNodeId = null;

        this.update();
    }

    clear() {
        this.expression.setRoot(null);

        this.expression.selectedNodeId = null;

        this.saveState();
        this.update();
    }

    cloneTree(node) {
        if (!node) {
            return null;
        }

        const clone = new MathNode(node.type, {
            id: node.id,
            value: node.value
        });

        clone.children = node.children.map(
            child => this.cloneTree(child)
        );

        return clone;
    }

    update() {
        this.renderer.render(this.expression);

        if (this.onChange) {
            this.onChange(this.expression);
        }
    }
}