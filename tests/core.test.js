import test from 'node:test';
import assert from 'node:assert/strict';

import { Expression } from '../src/models/Expression.js';
import { MathNode } from '../src/models/MathNode.js';
import { NodeTypes as T } from '../src/models/NodeTypes.js';
import { MathEngine } from '../src/services/MathEngine.js';

function number(value) {
    return new MathNode(T.NUMBER, { value: String(value) });
}

function binary(type, left, right) {
    const node = new MathNode(type);
    node.addChild(left);
    if (right !== undefined) node.addChild(right);
    return node;
}

test('MathEngine avalia operações básicas e respeita a árvore', () => {
    const engine = new MathEngine();
    const expression = binary(T.ADD, number(2), binary(T.MULTIPLY, number(3), number(4)));
    assert.equal(engine.isComplete(expression), true);
    assert.equal(engine.evaluate(expression), 14);

    const grouped = binary(T.MULTIPLY, binary(T.PARENTHESIS, binary(T.ADD, number(2), number(3))), number(4));
    assert.equal(engine.evaluate(grouped), 20);
});

test('MathEngine rejeita operações binárias com operandos faltando ou extras', () => {
    const engine = new MathEngine();
    assert.equal(engine.isComplete(binary(T.ADD, number(2))), false);

    const extraChild = binary(T.ADD, number(2), number(3));
    extraChild.addChild(number(4));
    assert.equal(engine.isComplete(extraChild), false);
});

test('MathEngine valida números, folhas e parênteses', () => {
    const engine = new MathEngine();
    assert.equal(engine.isComplete(number('')), false);
    assert.equal(engine.isComplete(number('abc')), false);

    const numberWithChild = number(2);
    numberWithChild.addChild(number(3));
    assert.equal(engine.isComplete(numberWithChild), false);

    assert.equal(engine.isComplete(new MathNode(T.PARENTHESIS)), false);
    const invalidParenthesis = new MathNode(T.PARENTHESIS);
    invalidParenthesis.addChild(number(1));
    invalidParenthesis.addChild(number(2));
    assert.equal(engine.isComplete(invalidParenthesis), false);

    assert.equal(engine.isComplete(new MathNode(T.SLOT)), false);
    assert.equal(engine.isComplete(new MathNode('unknown-type')), false);
});

test('Expression centraliza histórico, desfaz e refaz edições', () => {
    const expression = new Expression();
    const root = number(1);
    expression.setRoot(root);

    // Um segundo registro do mesmo estado não deve criar uma etapa duplicada.
    const historyLength = expression.history.length;
    expression.saveHistory();
    assert.equal(expression.history.length, historyLength);

    expression.setNodeValue(root.id, '12');
    assert.equal(expression.getRoot().value, '12');
    assert.equal(expression.undo(), true);
    assert.equal(expression.getRoot().value, '1');
    assert.equal(expression.redo(), true);
    assert.equal(expression.getRoot().value, '12');
});

test('Expression descarta o ramo de Redo após uma nova edição', () => {
    const expression = new Expression();
    const root = number(1);
    expression.setRoot(root);
    expression.setNodeValue(root.id, '2');
    assert.equal(expression.undo(), true);
    expression.setNodeValue(root.id, '3');
    assert.equal(expression.canRedo(), false);
    assert.equal(expression.getRoot().value, '3');
});

test('MathEngine preserva erro claro para divisão por zero', () => {
    const engine = new MathEngine();
    const expression = binary(T.DIVIDE, number(4), number(0));
    assert.throws(() => engine.evaluate(expression), /dividir por zero/i);
});

test('ExpressionController usa o histórico compartilhado de Expression', async () => {
    const { ExpressionController } = await import('../src/controllers/ExpressionController.js');
    const expression = new Expression();
    const root = number(7);
    expression.setRoot(root);

    const controller = Object.create(ExpressionController.prototype);
    controller.expression = expression;
    controller.renderer = { render() {} };
    controller.onChange = null;

    expression.getRoot().value = '8';
    controller.saveState();
    assert.equal(expression.canUndo(), true);
    assert.equal(controller.undo(), true);
    assert.equal(expression.getRoot().value, '7');
    assert.equal(controller.redo(), true);
    assert.equal(expression.getRoot().value, '8');
});


test('Expression permite desfazer a primeira inserção até o estado vazio', () => {
    const expression = new Expression();
    expression.setRoot(number(9));
    assert.equal(expression.undo(), true);
    assert.equal(expression.getRoot(), null);
    assert.equal(expression.canRedo(), true);
    assert.equal(expression.redo(), true);
    assert.equal(expression.getRoot().value, '9');
});
