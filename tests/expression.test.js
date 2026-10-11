import assert from "node:assert/strict";
import test from "node:test";

import { Expression } from "../src/models/Expression.js";
import { MathNode } from "../src/models/MathNode.js";
import { NodeTypes } from "../src/models/NodeTypes.js";
import { ExpressionController } from "../src/controllers/ExpressionController.js";

function number(value) {
    return new MathNode(NodeTypes.NUMBER, { value });
}

function expressionText(expression) {
    const root = expression.getRoot();
    if (!root) return null;
    return `${root.type}:${root.value ?? ""}[${root.children.map(child => expressionNodeText(child)).join(",")}]`;
}

function expressionNodeText(node) {
    return `${node.type}:${node.value ?? ""}[${node.children.map(expressionNodeText).join(",")}]`;
}

test("Expression registra, desfaz e refaz alterações sem duplicar snapshots", () => {
    const expression = new Expression();
    const node = number("2");

    assert.equal(expression.history.length, 1);
    assert.equal(expression.setRoot(node), node);
    assert.equal(expression.history.length, 2);

    // Regravar o mesmo estado não deve criar uma nova entrada.
    assert.equal(expression.saveHistory(), false);
    assert.equal(expression.history.length, 2);

    assert.equal(expression.setNodeValue(node.id, "20"), true);
    assert.equal(expression.history.length, 3);

    assert.equal(expression.undo(), true);
    assert.equal(expression.getRoot().value, "2");
    assert.equal(expression.canRedo(), true);

    assert.equal(expression.redo(), true);
    assert.equal(expression.getRoot().value, "20");
});

test("nova alteração depois de undo invalida o redo", () => {
    const expression = new Expression();
    const node = number("1");

    expression.setRoot(node);
    expression.setNodeValue(node.id, "2");
    expression.setNodeValue(node.id, "3");

    assert.equal(expression.undo(), true);
    assert.equal(expression.getRoot().value, "2");

    expression.setNodeValue(expression.getRoot().id, "4");

    assert.equal(expression.canRedo(), false);
    assert.equal(expression.getRoot().value, "4");
});

test("histórico é limitado a 100 estados", () => {
    const expression = new Expression();
    const node = number("0");

    expression.setRoot(node);

    for (let i = 1; i <= 150; i++) {
        expression.setNodeValue(node.id, String(i));
    }

    assert.equal(expression.history.length, 100);
    assert.equal(expression.historyIndex, 99);
    assert.equal(expression.getRoot().value, "150");
});

test("ExpressionController grava no histórico central do Expression", () => {
    globalThis.document = {
        addEventListener() {}
    };

    const container = {
        addEventListener() {}
    };

    const renderer = {
        render() {}
    };

    const expression = new Expression();
    const controller = new ExpressionController(
        expression,
        renderer,
        container
    );

    controller.inputNumber("1");
    controller.inputNumber("2");

    assert.equal(expression.getRoot().value, "12");
    assert.equal(expression.history.length, 3);

    assert.equal(controller.undo(), true);
    assert.equal(expression.getRoot().value, "1");

    assert.equal(controller.redo(), true);
    assert.equal(expression.getRoot().value, "12");

    assert.equal(expressionText(expression), "number:12[]");
});

test("operações do teclado também entram no histórico central", () => {
    const container = { addEventListener() {} };
    const renderer = { render() {} };
    const expression = new Expression();

    const previousDocument = globalThis.document;
    globalThis.document = { addEventListener() {} };

    try {
        const controller = new ExpressionController(
            expression,
            renderer,
            container
        );

        controller.inputNumber("2");
        controller.inputOperator(NodeTypes.ADD);
        controller.inputNumber("3");

        assert.equal(expression.getRoot().type, NodeTypes.ADD);
        assert.equal(expression.getRoot().getChild(0).value, "2");
        assert.equal(expression.getRoot().getChild(1).value, "3");

        assert.equal(controller.undo(), true);
        assert.equal(expression.getRoot().getChild(1).type, NodeTypes.SLOT);

        assert.equal(controller.redo(), true);
        assert.equal(expression.getRoot().getChild(1).value, "3");
    } finally {
        globalThis.document = previousDocument;
    }
});

test("clear também pode ser desfeito", () => {
    const expression = new Expression();
    const node = number("42");
    expression.setRoot(node);

    expression.clear();
    assert.equal(expression.isEmpty(), true);

    assert.equal(expression.undo(), true);
    assert.equal(expression.getRoot().value, "42");

    assert.equal(expression.redo(), true);
    assert.equal(expression.isEmpty(), true);
});

import { MathEngine } from "../src/services/MathEngine.js";
import { ExpressionValidator } from "../src/services/ExpressionValidator.js";

test("frações aceitam expressões no numerador e calculam passo a passo", () => {
    const numerator = new MathNode(NodeTypes.ADD, {
        children: [number("2"), number("3")]
    });
    const fraction = new MathNode(NodeTypes.FRACTION, {
        children: [numerator, number("5")]
    });
    const engine = new MathEngine();

    assert.equal(engine.isComplete(fraction), true);
    assert.equal(engine.evaluate(fraction), 1);

    const steps = engine.generateSteps(fraction);
    assert.equal(steps.length, 3);
    assert.match(steps[1].description, /Somamos 2 \+ 3 = 5/);
    assert.match(steps[2].description, /fração 5 \/ 5 = 1/);
    assert.equal(steps.at(-1).node.type, NodeTypes.NUMBER);
});

test("frações incompletas são permitidas durante a edição, mas não na resolução", () => {
    const fraction = new MathNode(NodeTypes.FRACTION, {
        children: [new MathNode(NodeTypes.SLOT), number("4")]
    });
    const engine = new MathEngine();

    assert.equal(ExpressionValidator.validate(fraction, { allowSlots: true }).valid, true);
    assert.equal(ExpressionValidator.validate(fraction, { allowSlots: false }).valid, false);
    assert.equal(engine.isComplete(fraction), false);
    assert.deepEqual(engine.generateSteps(fraction), []);
});

test("frações com denominador zero geram erro explícito", () => {
    const fraction = new MathNode(NodeTypes.FRACTION, {
        children: [number("1"), number("0")]
    });
    const engine = new MathEngine();

    assert.throws(() => engine.evaluate(fraction), /denominador.*zero/i);
    assert.throws(() => engine.generateSteps(fraction), /denominador.*zero/i);
});

test("navegação contextual permite subir ao nó da fração e descer ao numerador", () => {
    const numerator = number("2");
    const denominator = number("3");
    const fraction = new MathNode(NodeTypes.FRACTION, {
        children: [numerator, denominator]
    });
    const expression = new Expression();
    expression.setRoot(fraction);

    const controller = new ExpressionController(
        expression,
        { render() {} },
        { addEventListener() {} }
    );

    controller.selectNode(numerator.id);
    controller.selectParentNode();
    assert.equal(expression.getSelectedNode().id, fraction.id);

    controller.selectFirstChildNode();
    assert.equal(expression.getSelectedNode().id, numerator.id);
});
