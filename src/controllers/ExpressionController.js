import { NodeTypes } from "../models/NodeTypes.js";
import { MathNode } from "../models/MathNode.js";

export class ExpressionController {
    constructor(
        expression,
        renderer,
        container
    ) {
        this.expression = expression;
        this.renderer = renderer;
        this.container = container;
        this.cursorNodeId = null;
        this.onChange = null;

        this.bindEvents();
    }

    setOnChange(callback) {
        this.onChange = callback;
    }

    bindEvents() {
        this.container.addEventListener(
            "click",
            event => {
                const nodeElement =
                    event.target.closest(
                        "[data-node-id]"
                    );

                if (!nodeElement) {
                    return;
                }

                this.selectNode(
                    nodeElement.dataset.nodeId
                );
            }
        );

        document.addEventListener(
            "keydown",
            event => {
                this.handleKeyboard(event);
            }
        );
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

        if (key === "ArrowLeft") {
            event.preventDefault();
            this.moveCursor(-1);
            return;
        }

        if (key === "ArrowRight") {
            event.preventDefault();
            this.moveCursor(1);
            return;
        }

        if (key === "ArrowUp") {
            event.preventDefault();
            this.selectParentNode();
            return;
        }

        if (key === "ArrowDown") {
            event.preventDefault();
            this.selectFirstChildNode();
            return;
        }

        if (/^[0-9]$/.test(key)) {
            event.preventDefault();
            this.inputNumber(key);
            return;
        }

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
            this.inputOperator(
                operators[key]
            );
            return;
        }

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

        if (
            key === "." ||
            key === ","
        ) {
            event.preventDefault();
            this.inputDecimal();
            return;
        }

        if (
            key === "Backspace" ||
            key === "Delete"
        ) {
            event.preventDefault();
            this.backspace();
            return;
        }

        if (key === "Escape") {
            event.preventDefault();
            this.clearSelection();
        }
    }

    inputNumber(value) {
        const root =
            this.expression.getRoot();

        if (!root) {
            const node =
                new MathNode(
                    NodeTypes.NUMBER,
                    { value }
                );

            this.expression.setRoot(node);

            this.cursorNodeId =
                node.id;

            this.expression.selectNode(
                node.id
            );

            this.update();

            return;
        }

        const selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        if (
            selectedNode?.type ===
            NodeTypes.NUMBER
        ) {
            this.expression.setNodeValue(
                selectedNode.id,
                `${selectedNode.value}${value}`
            );

            this.cursorNodeId =
                selectedNode.id;

            this.update();

            return;
        }

        if (
            selectedNode?.type ===
            NodeTypes.SLOT
        ) {
            this.expression.mutate(() => {
                selectedNode.type =
                    NodeTypes.NUMBER;

                selectedNode.value =
                    value;

                selectedNode.children = [];
            });

            this.cursorNodeId =
                selectedNode.id;

            this.expression.selectNode(
                selectedNode.id
            );

            this.update();

            return;
        }

        const slot =
            this.findFirstSlot(root);

        if (slot) {
            this.expression.mutate(() => {
                slot.type =
                    NodeTypes.NUMBER;

                slot.value =
                    value;

                slot.children = [];
            });

            this.cursorNodeId =
                slot.id;

            this.expression.selectNode(
                slot.id
            );

            this.update();
        }
    }

    inputOperator(operatorType) {
        const root =
            this.expression.getRoot();

        if (!root) {
            return;
        }

        let selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        if (!selectedNode) {
            selectedNode =
                this.findLastValue(root);
        }

        if (
            !selectedNode ||
            selectedNode.type ===
            NodeTypes.SLOT ||
            ![
                NodeTypes.NUMBER,
                NodeTypes.VARIABLE,
                NodeTypes.PARENTHESIS
            ].includes(selectedNode.type)
        ) {
            return;
        }

        const parentInfo =
            this.findParent(
                root,
                selectedNode
            );

        const slot =
            new MathNode(
                NodeTypes.SLOT
            );

        const operation =
            new MathNode(
                operatorType,
                {
                    children: [
                        selectedNode,
                        slot
                    ]
                }
            );

        if (!parentInfo) {
            this.expression.setRoot(
                operation
            );
        } else {
            this.expression.mutate(() => {
                parentInfo.parent.setChild(
                    parentInfo.index,
                    operation
                );
            });
        }

        this.cursorNodeId =
            slot.id;

        this.expression.selectNode(
            slot.id
        );

        this.update();
    }

    inputParenthesisOpen() {
        const root =
            this.expression.getRoot();

        if (!root) {
            const slot =
                new MathNode(
                    NodeTypes.SLOT
                );

            const parenthesis =
                new MathNode(
                    NodeTypes.PARENTHESIS,
                    {
                        children: [slot]
                    }
                );

            this.expression.setRoot(
                parenthesis
            );

            this.cursorNodeId =
                slot.id;

            this.expression.selectNode(
                slot.id
            );

            this.update();

            return;
        }

        const selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        if (
            selectedNode?.type ===
            NodeTypes.SLOT
        ) {
            const slot =
                new MathNode(
                    NodeTypes.SLOT
                );

            this.expression.mutate(() => {
                selectedNode.type =
                    NodeTypes.PARENTHESIS;

                selectedNode.value =
                    null;

                selectedNode.children = [
                    slot
                ];
            });

            this.cursorNodeId =
                slot.id;

            this.expression.selectNode(
                slot.id
            );

            this.update();

            return;
        }

        if (
            selectedNode?.type ===
            NodeTypes.NUMBER ||
            selectedNode?.type ===
            NodeTypes.PARENTHESIS
        ) {
            const parentInfo =
                this.findParent(
                    root,
                    selectedNode
                );

            const slot =
                new MathNode(
                    NodeTypes.SLOT
                );

            const parenthesis =
                new MathNode(
                    NodeTypes.PARENTHESIS,
                    {
                        children: [slot]
                    }
                );

            const multiplication =
                new MathNode(
                    NodeTypes.MULTIPLY,
                    {
                        children: [
                            selectedNode,
                            parenthesis
                        ]
                    }
                );

            if (!parentInfo) {
                this.expression.setRoot(
                    multiplication
                );
            } else {
                this.expression.mutate(() => {
                    parentInfo.parent.setChild(
                        parentInfo.index,
                        multiplication
                    );
                });
            }

            this.cursorNodeId =
                slot.id;

            this.expression.selectNode(
                slot.id
            );

            this.update();

            return;
        }

        const slot =
            this.findFirstSlot(root);

        if (slot) {
            const child =
                new MathNode(
                    NodeTypes.SLOT
                );

            this.expression.mutate(() => {
                slot.type =
                    NodeTypes.PARENTHESIS;

                slot.value =
                    null;

                slot.children = [
                    child
                ];
            });

            this.cursorNodeId =
                child.id;

            this.expression.selectNode(
                child.id
            );

            this.update();
        }
    }

    inputParenthesisClose() {
        const root =
            this.expression.getRoot();

        if (!root) {
            return;
        }

        const openParenthesis =
            this.findOpenParenthesis(
                root
            );

        if (
            !openParenthesis ||
            this.findFirstSlot(
                openParenthesis
            )
        ) {
            return;
        }

        this.cursorNodeId =
            openParenthesis.id;

        this.expression.selectNode(
            openParenthesis.id
        );

        this.update();
    }

    findOpenParenthesis(node) {
        if (!node) {
            return null;
        }

        for (
            let i = node.children.length - 1;
            i >= 0;
            i--
        ) {
            const result =
                this.findOpenParenthesis(
                    node.children[i]
                );

            if (result) {
                return result;
            }
        }

        if (
            node.type ===
            NodeTypes.PARENTHESIS &&
            this.findFirstSlot(node)
        ) {
            return node;
        }

        return null;
    }

    inputDecimal() {
        const root =
            this.expression.getRoot();

        if (!root) {
            const node =
                new MathNode(
                    NodeTypes.NUMBER,
                    {
                        value: "0."
                    }
                );

            this.expression.setRoot(node);

            this.cursorNodeId =
                node.id;

            this.expression.selectNode(
                node.id
            );

            this.update();

            return;
        }

        const selectedNode =
            this.findNodeById(
                root,
                this.expression.selectedNodeId
            );

        if (
            selectedNode?.type ===
            NodeTypes.NUMBER
        ) {
            if (
                String(
                    selectedNode.value
                ).includes(".")
            ) {
                return;
            }

            this.expression.setNodeValue(
                selectedNode.id,
                `${selectedNode.value}.`
            );

            this.cursorNodeId =
                selectedNode.id;

            this.update();

            return;
        }

        if (
            selectedNode?.type ===
            NodeTypes.SLOT
        ) {
            this.expression.mutate(() => {
                selectedNode.type =
                    NodeTypes.NUMBER;

                selectedNode.value =
                    "0.";

                selectedNode.children = [];
            });

            this.cursorNodeId =
                selectedNode.id;

            this.expression.selectNode(
                selectedNode.id
            );

            this.update();

            return;
        }

        const slot =
            this.findFirstSlot(root);

        if (slot) {
            this.expression.mutate(() => {
                slot.type =
                    NodeTypes.NUMBER;

                slot.value =
                    "0.";

                slot.children = [];
            });

            this.cursorNodeId =
                slot.id;

            this.expression.selectNode(
                slot.id
            );

            this.update();
        }
    }

    backspace() {
        const root =
            this.expression.getRoot();

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
            selectedNode.type ===
            NodeTypes.NUMBER
        ) {
            const value =
                String(
                    selectedNode.value
                );

            if (value.length > 1) {
                this.expression.setNodeValue(
                    selectedNode.id,
                    value.slice(0, -1)
                );

                this.cursorNodeId =
                    selectedNode.id;

                this.update();

                return;
            }

            this.expression.mutate(() => {
                selectedNode.type =
                    NodeTypes.SLOT;

                selectedNode.value =
                    null;

                selectedNode.children = [];
            });

            this.cursorNodeId =
                selectedNode.id;

            this.expression.selectNode(
                selectedNode.id
            );

            this.update();

            return;
        }

        if (
            selectedNode.type !==
            NodeTypes.SLOT
        ) {
            return;
        }

        const parentInfo =
            this.findParent(
                root,
                selectedNode
            );

        if (!parentInfo?.parent) {
            return;
        }

        const parent =
            parentInfo.parent;

        if (
            parent.children.length !== 2 ||
            parent.getChild(1) !== selectedNode
        ) {
            return;
        }

        const left =
            parent.getChild(0);

        const grandParentInfo =
            this.findParent(
                root,
                parent
            );

        if (!grandParentInfo) {
            this.expression.setRoot(
                left
            );
        } else {
            this.expression.mutate(() => {
                grandParentInfo.parent.setChild(
                    grandParentInfo.index,
                    left
                );
            });
        }

        this.cursorNodeId =
            left.id;

        this.expression.selectNode(
            left.id
        );

        this.update();
    }

    moveCursor(direction) {
        const root =
            this.expression.getRoot();

        if (!root) {
            return;
        }

        const nodes =
            this.getCursorNodes(root);

        if (!nodes.length) {
            return;
        }

        let currentIndex =
            nodes.findIndex(
                node =>
                    node.id ===
                    this.cursorNodeId
            );

        if (currentIndex === -1) {
            currentIndex =
                direction > 0
                    ? 0
                    : nodes.length - 1;
        } else {
            currentIndex += direction;
        }

        currentIndex =
            Math.max(
                0,
                Math.min(
                    currentIndex,
                    nodes.length - 1
                )
            );

        const node =
            nodes[currentIndex];

        this.cursorNodeId =
            node.id;

        this.expression.selectNode(
            node.id
        );

        this.renderer.render(
            this.expression
        );
    }

    getCursorNodes(node) {
        if (!node) {
            return [];
        }

        const nodes = [];

        const visit = current => {
            if (!current) {
                return;
            }

            if (
                current.type ===
                NodeTypes.NUMBER ||
                current.type ===
                NodeTypes.VARIABLE ||
                current.type ===
                NodeTypes.SLOT
            ) {
                nodes.push(current);
                return;
            }

            if (
                current.type ===
                NodeTypes.ADD ||
                current.type ===
                NodeTypes.SUBTRACT ||
                current.type ===
                NodeTypes.MULTIPLY ||
                current.type ===
                NodeTypes.DIVIDE ||
                current.type ===
                NodeTypes.POWER ||
                current.type ===
                NodeTypes.FRACTION ||
                current.type ===
                NodeTypes.PARENTHESIS
            ) {
                nodes.push(current);
            }

            for (
                const child of current.children
            ) {
                visit(child);
            }
        };

        visit(node);

        return nodes;
    }

    selectParentNode() {
        const selected = this.expression.getSelectedNode();
        if (!selected) return;
        const parent = this.expression.findParent(selected.id);
        if (parent) this.selectNode(parent.id);
    }

    selectFirstChildNode() {
        const selected = this.expression.getSelectedNode();
        if (!selected || !selected.children.length) return;
        this.selectNode(selected.children[0].id);
    }

    selectNode(nodeId) {
        this.cursorNodeId =
            nodeId;

        this.expression.selectNode(
            nodeId
        );

        this.update();
    }

    clearSelection() {
        this.cursorNodeId = null;

        this.expression.clearSelection();

        this.renderer.render(
            this.expression
        );
    }

    findNodeById(node, id) {
        if (!node || !id) {
            return null;
        }

        if (node.id === id) {
            return node;
        }

        for (const child of node.children) {
            const result =
                this.findNodeById(
                    child,
                    id
                );

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

        if (
            node.type ===
            NodeTypes.SLOT
        ) {
            return node;
        }

        for (
            const child of node.children
        ) {
            const result =
                this.findFirstSlot(
                    child
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
            node.type ===
            NodeTypes.NUMBER ||
            node.type ===
            NodeTypes.VARIABLE ||
            node.type ===
            NodeTypes.PARENTHESIS
        ) {
            return node;
        }

        return null;
    }

    findParent(
        root,
        target,
        parent = null
    ) {
        if (!root) {
            return null;
        }

        if (root === target) {
            return parent;
        }

        for (
            let i = 0;
            i < root.children.length;
            i++
        ) {
            const child =
                root.children[i];

            if (child === target) {
                return {
                    parent: root,
                    index: i
                };
            }

            const result =
                this.findParent(
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

    undo() {
        if (!this.expression.undo()) {
            return false;
        }

        this.cursorNodeId = null;

        this.update();

        return true;
    }

    redo() {
        if (!this.expression.redo()) {
            return false;
        }

        this.cursorNodeId = null;

        this.update();

        return true;
    }

    update() {
        this.renderer.render(
            this.expression
        );

        if (this.onChange) {
            this.onChange(
                this.expression
            );
        }
    }
}