import { MathNode } from "./MathNode.js";
import { NodeTypes } from "./NodeTypes.js";

export class Expression {
    constructor() {
        this.root = null;
        this.selectedNodeId = null;
        this.history = [];
        this.historyIndex = -1;
        this.isRestoringHistory = false;

        this.commit();
    }

    setRoot(node, saveHistory = true) {
        this.root = node;
        this.selectedNodeId = node?.id ?? null;

        if (saveHistory) {
            this.commit();
        }

        return node;
    }

    getRoot() {
        return this.root;
    }

    isEmpty() {
        return this.root === null;
    }

    selectNode(nodeId) {
        this.selectedNodeId = nodeId ?? null;
        return this.getSelectedNode();
    }

    getSelectedNode() {
        return this.selectedNodeId
            ? this.findNode(this.selectedNodeId)
            : null;
    }

    clearSelection() {
        this.selectedNodeId = null;
    }

    findNode(nodeId, node = this.root) {
        if (!node) {
            return null;
        }

        if (node.id === nodeId) {
            return node;
        }

        for (const child of node.children) {
            const found = this.findNode(nodeId, child);

            if (found) {
                return found;
            }
        }

        return null;
    }

    findParent(nodeId, node = this.root) {
        if (!node) {
            return null;
        }

        for (const child of node.children) {
            if (child.id === nodeId) {
                return node;
            }

            const parent = this.findParent(nodeId, child);

            if (parent) {
                return parent;
            }
        }

        return null;
    }

    replaceNode(nodeId, replacement, saveHistory = true) {
        if (!nodeId || !replacement) {
            return false;
        }

        if (this.root?.id === nodeId) {
            this.root = replacement;
            this.selectedNodeId = replacement.id;

            if (saveHistory) {
                this.commit();
            }

            return true;
        }

        const parent = this.findParent(nodeId);

        if (!parent) {
            return false;
        }

        const index = parent.children.findIndex(
            child => child.id === nodeId
        );

        if (index === -1) {
            return false;
        }

        parent.setChild(index, replacement);
        this.selectedNodeId = replacement.id;

        if (saveHistory) {
            this.commit();
        }

        return true;
    }

    removeNode(nodeId = this.selectedNodeId, saveHistory = true) {
        if (!nodeId) {
            return false;
        }

        const node = this.findNode(nodeId);

        if (!node) {
            return false;
        }

        if (node.type === NodeTypes.SLOT) {
            this.clearSelection();
            return false;
        }

        if (this.root?.id === nodeId) {
            this.root = null;
            this.selectedNodeId = null;

            if (saveHistory) {
                this.commit();
            }

            return true;
        }

        const parent = this.findParent(nodeId);

        if (!parent) {
            return false;
        }

        const index = parent.children.findIndex(
            child => child.id === nodeId
        );

        if (index === -1) {
            return false;
        }

        const slot = new MathNode(NodeTypes.SLOT);

        parent.setChild(index, slot);
        this.selectedNodeId = slot.id;

        if (saveHistory) {
            this.commit();
        }

        return true;
    }

    setNodeValue(nodeId, value, saveHistory = true) {
        const node = this.findNode(nodeId);

        if (!node) {
            return false;
        }

        node.value = value;
        this.selectedNodeId = node.id;

        if (saveHistory) {
            this.commit();
        }

        return true;
    }

    mutate(mutator, saveHistory = true) {
        const result = mutator(this.root);

        if (saveHistory) {
            this.commit();
        }

        return result;
    }

    commit() {
        if (this.isRestoringHistory) {
            return false;
        }

        const snapshot = this.cloneNode(this.root);
        const current = this.history[this.historyIndex];

        if (
            JSON.stringify(snapshot) ===
            JSON.stringify(current)
        ) {
            return false;
        }

        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(
                0,
                this.historyIndex + 1
            );
        }

        this.history.push(snapshot);

        if (this.history.length > 100) {
            this.history.shift();
        }

        this.historyIndex =
            this.history.length - 1;

        return true;
    }

    saveHistory() {
        return this.commit();
    }

    undo() {
        if (this.historyIndex <= 0) {
            return false;
        }

        this.historyIndex--;
        this.isRestoringHistory = true;

        try {
            this.root = this.restoreNode(
                this.history[this.historyIndex]
            );

            this.selectedNodeId = null;

            return true;
        } finally {
            this.isRestoringHistory = false;
        }
    }

    redo() {
        if (
            this.historyIndex >=
            this.history.length - 1
        ) {
            return false;
        }

        this.historyIndex++;
        this.isRestoringHistory = true;

        try {
            this.root = this.restoreNode(
                this.history[this.historyIndex]
            );

            this.selectedNodeId = null;

            return true;
        } finally {
            this.isRestoringHistory = false;
        }
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return (
            this.historyIndex <
            this.history.length - 1
        );
    }

    clear(saveHistory = true) {
        this.root = null;
        this.selectedNodeId = null;

        if (saveHistory) {
            this.commit();
        }
    }

    cloneNode(node) {
        if (!node) {
            return null;
        }

        return {
            id: node.id,
            type: node.type,
            value: node.value,
            children: node.children.map(
                child => this.cloneNode(child)
            )
        };
    }

    restoreNode(snapshot) {
        if (!snapshot) {
            return null;
        }

        const node = new MathNode(
            snapshot.type,
            {
                id: snapshot.id,
                value: snapshot.value
            }
        );

        for (const child of snapshot.children) {
            node.addChild(
                this.restoreNode(child)
            );
        }

        return node;
    }
}