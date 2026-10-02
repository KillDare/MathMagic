import { MathNode } from "./MathNode.js";
import { NodeTypes } from "./NodeTypes.js";

export class Expression {

    constructor() {

        this.root = null;

        this.selectedNodeId = null;


        // =====================================================
        // Histórico
        // =====================================================

        this.history = [];

        this.historyIndex = -1;

        this.isRestoringHistory = false;


        // Estado inicial da expressão
        this.saveHistory();
    }

    // =========================================================
    // Raiz
    // =========================================================

    setRoot(node, saveHistory = true) {
        this.root = node;
        this.selectedNodeId = node?.id ?? null;
        if (saveHistory && !this.isRestoringHistory) { this.saveHistory(); }
        return node;
    }

    getRoot() {
        return this.root;
    }

    // =========================================================
    // Estado vazio
    // =========================================================

    isEmpty() {

        return this.root === null;
    }


    // =========================================================
    // Seleção
    // =========================================================

    selectNode(nodeId) {

        this.selectedNodeId =
            nodeId ?? null;


        return this.getSelectedNode();
    }


    getSelectedNode() {

        if (!this.selectedNodeId) {
            return null;
        }


        return this.findNode(
            this.selectedNodeId
        );
    }


    clearSelection() {

        this.selectedNodeId = null;
    }


    // =========================================================
    // Busca na árvore
    // =========================================================

    findNode(
        nodeId,
        node = this.root
    ) {

        if (!node) {
            return null;
        }


        if (node.id === nodeId) {
            return node;
        }


        for (
            const child of node.children
        ) {

            const found =
                this.findNode(
                    nodeId,
                    child
                );


            if (found) {
                return found;
            }
        }


        return null;
    }


    findParent(
        nodeId,
        node = this.root
    ) {

        if (!node) {
            return null;
        }


        for (
            const child of node.children
        ) {

            if (child.id === nodeId) {
                return node;
            }


            const parent =
                this.findParent(
                    nodeId,
                    child
                );


            if (parent) {
                return parent;
            }
        }


        return null;
    }


    // =========================================================
    // Substituir nó
    // =========================================================

    replaceNode(
        nodeId,
        replacement,
        saveHistory = true
    ) {

        if (
            !nodeId ||
            !replacement
        ) {

            return false;
        }


        // -----------------------------------------------------
        // O próprio root está sendo substituído
        // -----------------------------------------------------

        if (
            this.root?.id === nodeId
        ) {

            this.root =
                replacement;


            this.selectedNodeId =
                replacement.id;


            if (
                saveHistory &&
                !this.isRestoringHistory
            ) {

                this.saveHistory();
            }


            return true;
        }


        // -----------------------------------------------------
        // Procuramos o pai
        // -----------------------------------------------------

        const parent =
            this.findParent(
                nodeId
            );


        if (!parent) {
            return false;
        }


        const index =
            parent.children.findIndex(
                child =>
                    child.id === nodeId
            );


        if (index === -1) {
            return false;
        }


        parent.setChild(
            index,
            replacement
        );


        this.selectedNodeId =
            replacement.id;


        if (
            saveHistory &&
            !this.isRestoringHistory
        ) {

            this.saveHistory();
        }


        return true;
    }

    // =========================================================
    // Remover nó
    // =========================================================

    removeNode(
        nodeId = this.selectedNodeId,
        saveHistory = true
    ) {

        if (!nodeId) {
            return false;
        }


        const node =
            this.findNode(
                nodeId
            );


        if (!node) {
            return false;
        }


        // ---------------------------------------------------------
        // Não faz sentido remover um SLOT.
        //
        // Ele representa justamente uma posição disponível
        // para receber um novo valor.
        // ---------------------------------------------------------

        if (
           node.type === NodeTypes.SLOT
        ) {

            this.clearSelection();

            return false;
        }


        // ---------------------------------------------------------
        // Se o próprio root for removido,
        // a expressão fica vazia.
        // ---------------------------------------------------------

        if (
            this.root?.id === nodeId
        ) {

            this.root = null;

            this.selectedNodeId = null;


            if (
                saveHistory &&
                !this.isRestoringHistory
            ) {

                this.saveHistory();
            }


            return true;
        }


        // ---------------------------------------------------------
        // Encontramos o pai do nó.
        // ---------------------------------------------------------

        const parent =
            this.findParent(
                nodeId
            );


        if (!parent) {
            return false;
        }


        const index =
            parent.children.findIndex(
                child =>
                    child.id === nodeId
            );


        if (index === -1) {
            return false;
        }


        // ---------------------------------------------------------
        // Em vez de simplesmente remover o filho,
        // colocamos um SLOT no lugar.
        //
        // Exemplo:
        //
        //     2 + 3
        //
        // removendo 3:
        //
        //     2 + □
        // ---------------------------------------------------------

        const slot =
            new MathNode(
                "slot"
            );


        parent.setChild(
            index,
            slot
        );


        this.selectedNodeId =
            slot.id;


        // ---------------------------------------------------------
        // Salva o estado DEPOIS da alteração.
        // ---------------------------------------------------------

        if (
            saveHistory &&
            !this.isRestoringHistory
        ) {

            this.saveHistory();
        }


        return true;
    }


    setNodeValue(
        nodeId,
        value,
        saveHistory = true
    ) {

        const node =
            this.findNode(
                nodeId
            );


        if (!node) {
            return false;
        }


        node.value = value;


        this.selectedNodeId =
            node.id;


        if (
            saveHistory &&
            !this.isRestoringHistory
        ) {

            this.saveHistory();
        }


        return true;
    }

    // =========================================================
    // Histórico
    // =========================================================

    saveHistory() {
        if (this.isRestoringHistory) { return; } const snapshot = this.cloneNode(this.root);
        if (this.historyIndex < this.history.length - 1) { this.history = this.history.slice(0, this.historyIndex + 1); }
        this.history.push(snapshot); this.historyIndex = this.history.length - 1;
    }

    // =========================================================
    // Undo
    // =========================================================

    undo() {

        if (
            this.historyIndex <= 0
        ) {

            return false;
        }


        this.historyIndex--;


        this.isRestoringHistory =
            true;


        try {

            this.root =
                this.restoreNode(
                    this.history[
                    this.historyIndex
                    ]
                );


            this.selectedNodeId =
                null;


            return true;

        } finally {

            this.isRestoringHistory =
                false;
        }
    }
    // =========================================================
    // Redo
    // =========================================================

    redo() {

        if (
            this.historyIndex >=
            this.history.length - 1
        ) {

            return false;
        }


        this.historyIndex++;


        this.isRestoringHistory =
            true;


        try {

            this.root =
                this.restoreNode(
                    this.history[
                    this.historyIndex
                    ]
                );


            this.selectedNodeId =
                null;


            return true;

        } finally {

            this.isRestoringHistory =
                false;
        }
    }

    // =========================================================
    // Verificações
    // =========================================================

    canUndo() {

        return (
            this.historyIndex > 0
        );
    }

    canRedo() {

        return (
            this.historyIndex <
            this.history.length - 1
        );
    }


    // =========================================================
    // Limpar
    // =========================================================

    clear(saveHistory = true) {

        this.root = null;

        this.selectedNodeId = null;


        if (
            saveHistory &&
            !this.isRestoringHistory
        ) {

            this.saveHistory();
        }
    }

    // =========================================================
    // Clonagem
    // =========================================================

    cloneNode(node) {

        if (!node) {
            return null;
        }


        const clone = {

            id: node.id,

            type: node.type,

            value: node.value,

            children: []
        };


        for (
            const child of node.children
        ) {

            clone.children.push(
                this.cloneNode(
                    child
                )
            );
        }


        // -----------------------------------------------------
        // O histórico é apenas uma fotografia da árvore.
        // Na restauração, reconstruiremos MathNodes.
        // -----------------------------------------------------

        return clone;
    }


    // =========================================================
    // Reconstrói um snapshot como MathNode
    // =========================================================

    restoreNode(snapshot) {

        if (!snapshot) {
            return null;
        }


        // Importação dinâmica não é necessária aqui porque
        // o MathNode é simples. A criação é feita pelo helper
        // abaixo.
        return this.createNodeFromSnapshot(
            snapshot
        );
    }


    createNodeFromSnapshot(snapshot) {

        if (!snapshot) {
            return null;
        }


        // Usa o construtor do MathNode através do prototype
        // da árvore atual quando possível.
        const node =
            this.createMathNode(
                snapshot
            );


        for (
            const child of snapshot.children
        ) {

            node.addChild(
                this.createNodeFromSnapshot(
                    child
                )
            );
        }


        return node;
    }


    createMathNode(snapshot) {

        // MathNode está disponível globalmente através
        // do import abaixo.
        return new MathNode(
            snapshot.type,
            {
                id: snapshot.id,
                value: snapshot.value
            }
        );
    }
}
