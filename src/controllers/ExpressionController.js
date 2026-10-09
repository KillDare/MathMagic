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
         * Navegação pela expressão
         */
        if (key === "ArrowLeft") {
            event.preventDefault();
            this.moveSelection(-1);
            return;
        }

        if (key === "ArrowRight") {
            event.preventDefault();
            this.moveSelection(1);
            return;
        }

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

        /*
         * Expressão vazia.
         */
        if (!root) {
            const node = new MathNode(
                NodeTypes.NUMBER,
                {
                    value
                }
            );

            this.expression.setRoot(node);
            this.expression.selectedNodeId = node.id;

            this.saveState();
            this.update();
            return;
        }
        const selectedNode = this.findNodeById(
            root,
            this.expression.selectedNodeId
        );

        if (
            selectedNode?.type === NodeTypes.NUMBER
        ) {
            selectedNode.value =
                `${selectedNode.value}${value}`;

            this.saveState();
            this.update();
            return;
        }

        if (
            selectedNode?.type === NodeTypes.SLOT
        ) {
            selectedNode.type =
                NodeTypes.NUMBER;

            selectedNode.value = value;
            selectedNode.children = [];

            this.expression.selectedNodeId =
                selectedNode.id;

            this.saveState();
            this.update();
            return;
        }

        const slot = this.findFirstSlot(root);

        if (slot) {
            slot.type = NodeTypes.NUMBER;
            slot.value = value;
            slot.children = [];

            this.expression.selectedNodeId =
                slot.id;

            this.saveState();
            this.update();
        }
    }

    inputOperator(operatorType) {
        const root = this.expression.getRoot();

        if (!root) {
            return;
        }

        /*
         * Descobre o nó atualmente selecionado.
         */
        let selectedNode = this.findNodeById(
            root,
            this.expression.selectedNodeId
        );

        /*
         * Se não existe seleção, usamos o último
         * valor da expressão.
         */
        if (!selectedNode) {
            selectedNode = this.findLastValue(root);
        }

        if (!selectedNode) {
            return;
        }

        if (selectedNode.type === NodeTypes.SLOT) {
            return;
        }

        if (
            selectedNode.type !== NodeTypes.NUMBER &&
            selectedNode.type !== NodeTypes.VARIABLE &&
            selectedNode.type !== NodeTypes.PARENTHESIS
        ) {
            return;
        }

        const parentInfo = this.findParent(
            root,
            selectedNode
        );

        const operation = new MathNode(
            operatorType
        );

        operation.addChild(
            selectedNode
        );

        const slot = new MathNode(
            NodeTypes.SLOT
        );

        operation.addChild(slot);

        if (!parentInfo) {
            this.expression.setRoot(
                operation
            );

            this.expression.selectedNodeId =
                slot.id;

            this.saveState();
            this.update();
            return;
        }

        parentInfo.parent.setChild(
            parentInfo.index,
            operation
        );

        this.expression.selectedNodeId =
            slot.id;

        this.saveState();
        this.update();
    }

    inputParenthesisOpen() {
        const root = this.expression.getRoot();

        if (!root) {
            const parenthesis = new MathNode(
                NodeTypes.PARENTHESIS
            );

            const slot = new MathNode(
                NodeTypes.SLOT
            );

            parenthesis.addChild(slot);

            this.expression.setRoot(
                parenthesis
            );

            this.expression.selectedNodeId =
                slot.id;

            this.saveState();
            this.update();
            return;
        }

        /*
         * Nó selecionado.
         */
        const selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        if (
            selectedNode?.type === NodeTypes.SLOT
        ) {
            selectedNode.type =
                NodeTypes.PARENTHESIS;

            selectedNode.value = null;

            const slot = new MathNode(
                NodeTypes.SLOT
            );

            selectedNode.children = [
                slot
            ];

            this.expression.selectedNodeId =
                slot.id;

            this.saveState();
            this.update();
            return;
        }

        if (
            selectedNode?.type === NodeTypes.NUMBER ||
            selectedNode?.type === NodeTypes.PARENTHESIS
        ) {
            const parentInfo =
                this.findParent(
                    root,
                    selectedNode
                );

            const parenthesis =
                new MathNode(
                    NodeTypes.PARENTHESIS
                );

            const slot =
                new MathNode(
                    NodeTypes.SLOT
                );

            parenthesis.addChild(slot);

            const multiplication =
                new MathNode(
                    NodeTypes.MULTIPLY
                );

            multiplication.addChild(
                selectedNode
            );

            multiplication.addChild(
                parenthesis
            );

            if (!parentInfo) {
                this.expression.setRoot(
                    multiplication
                );
            } else {
                parentInfo.parent.setChild(
                    parentInfo.index,
                    multiplication
                );
            }

            this.expression.selectedNodeId =
                slot.id;

            this.saveState();
            this.update();
            return;
        }

        /*
         * Fallback.
         */
        const slot = this.findFirstSlot(root);

        if (slot) {
            slot.type =
                NodeTypes.PARENTHESIS;

            slot.value = null;

            const child =
                new MathNode(
                    NodeTypes.SLOT
                );

            slot.children = [
                child
            ];

            this.expression.selectedNodeId =
                child.id;

            this.saveState();
            this.update();
        }
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

        const slot =
            this.findFirstSlot(
                openParenthesis
            );

        if (slot) {
            return;
        }

        this.expression.selectedNodeId =
            openParenthesis.id;

        this.renderer.render(
            this.expression
        );
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

        /*
         * Expressão vazia.
         */
        if (!root) {
            const node = new MathNode(
                NodeTypes.NUMBER,
                {
                    value: "0."
                }
            );

            this.expression.setRoot(node);
            this.expression.selectedNodeId = node.id;

            this.saveState();
            this.update();
            return;
        }

        const selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        /*
         * Número selecionado.
         */
        if (
            selectedNode?.type === NodeTypes.NUMBER
        ) {
            const value =
                String(selectedNode.value);

            if (value.includes(".")) {
                return;
            }

            selectedNode.value += ".";

            this.saveState();
            this.update();
            return;
        }

        /*
         * SLOT selecionado.
         */
        if (
            selectedNode?.type === NodeTypes.SLOT
        ) {
            selectedNode.type =
                NodeTypes.NUMBER;

            selectedNode.value = "0.";
            selectedNode.children = [];

            this.expression.selectedNodeId =
                selectedNode.id;

            this.saveState();
            this.update();
            return;
        }

        /*
         * Fallback.
         */
        const slot = this.findFirstSlot(root);

        if (slot) {
            slot.type = NodeTypes.NUMBER;
            slot.value = "0.";
            slot.children = [];

            this.expression.selectedNodeId =
                slot.id;

            this.saveState();
            this.update();
        }
    }

    backspace() {
        const root = this.expression.getRoot();

        if (!root) {
            return;
        }

        const selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        if (!selectedNode) {
            return;
        }

        if (
            selectedNode.type === NodeTypes.NUMBER
        ) {
            const value =
                String(selectedNode.value);

            if (value.length > 1) {
                selectedNode.value =
                    value.slice(0, -1);

                this.saveState();
                this.update();
                return;
            }

            selectedNode.type =
                NodeTypes.SLOT;

            selectedNode.value = null;
            selectedNode.children = [];

            this.saveState();
            this.update();
            return;
        }

        if (
            selectedNode.type === NodeTypes.SLOT
        ) {
            const slotInfo =
                this.findFirstSlotWithParent(
                    root
                );

            if (
                slotInfo?.slot !== selectedNode ||
                !slotInfo.parent
            ) {
                return;
            }

            const parent =
                slotInfo.parent;

            if (
                parent.children.length === 2 &&
                parent.getChild(1) === selectedNode
            ) {
                const left =
                    parent.getChild(0);

                const parentInfo =
                    this.findParent(
                        root,
                        parent
                    );

                if (!parentInfo) {
                    this.expression.setRoot(
                        left
                    );
                } else {
                    parentInfo.parent.setChild(
                        parentInfo.index,
                        left
                    );
                }

                this.expression.selectedNodeId =
                    left.id;

                this.saveState();
                this.update();
            }
        }
    }

    moveSelection(direction) {
        const root = this.expression.getRoot();

        if (!root) {
            return;
        }

        const nodes = this.getNavigableNodes(root);

        if (nodes.length === 0) {
            return;
        }

        let currentIndex = nodes.findIndex(
            node => node.id === this.expression.selectedNodeId
        );

        if (currentIndex === -1) {
            currentIndex = direction > 0
                ? 0
                : nodes.length - 1;
        } else {
            currentIndex += direction;
        }

        currentIndex = Math.max(
            0,
            Math.min(
                currentIndex,
                nodes.length - 1
            )
        );

        const node = nodes[currentIndex];

        this.expression.selectedNodeId = node.id;

        this.renderer.render(this.expression);
    }

    getNavigableNodes(node) {
        if (!node) {
            return [];
        }

        const nodes = [];

        const visit = current => {
            if (!current) {
                return;
            }

            if (
                current.type === NodeTypes.NUMBER ||
                current.type === NodeTypes.VARIABLE ||
                current.type === NodeTypes.SLOT
            ) {
                nodes.push(current);
                return;
            }

            for (const child of current.children) {
                visit(child);
            }
        };

        visit(node);

        return nodes;
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
        this.expression.saveHistory();
    }

    undo() {
        if (!this.expression.undo()) {
            return false;
        }

        this.update();
        return true;
    }

    redo() {
        if (!this.expression.redo()) {
            return false;
        }

        this.update();
        return true;
    }

    clear() {
        this.expression.clear();
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