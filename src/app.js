import { Expression } from "./models/Expression.js";

import { Renderer } from "./services/Renderer.js";

import {
    ExpressionController
} from "./controllers/ExpressionController.js";

import {
    ToolbarController
} from "./controllers/ToolbarController.js";

import { ToolbarView } from "./views/ToolbarView.js";


// =========================================================
// Elementos
// =========================================================

const expressionContainer =
    document.querySelector(
        "#expression"
    );


const toolbarContainer =
    document.querySelector(
        ".toolbar"
    );


const clearButton =
    document.querySelector(
        "#btnClear"
    );


// =========================================================
// Núcleo
// =========================================================

const expression =
    new Expression();


const renderer =
    new Renderer(
        expressionContainer
    );


// =========================================================
// Atualização
// =========================================================

function expressionChanged(
    expression
) {

    // Por enquanto o callback existe apenas
    // para manter o fluxo centralizado.
    //
    // O MathEngine/StepView poderá ser ligado
    // aqui novamente conforme a resolução evoluir.
}


// =========================================================
// Controllers
// =========================================================

new ExpressionController(
    expression,
    renderer,
    expressionContainer
);


const toolbarController =
    new ToolbarController(
        expression,
        renderer,
        expressionChanged
    );


// =========================================================
// View
// =========================================================

new ToolbarView(
    toolbarContainer,
    toolbarController
);


// =========================================================
// Limpar
// =========================================================

clearButton.addEventListener(
    "click",
    () => {

        toolbarController.clear();
    }
);


// =========================================================
// Undo / Redo
// =========================================================

document.addEventListener(
    "keydown",
    event => {

        // -----------------------------------------------------
        // Ctrl + Z
        // -----------------------------------------------------

        if (
            event.ctrlKey &&
            !event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();


            toolbarController.undo();

            return;
        }


        // -----------------------------------------------------
        // Ctrl + Y
        // -----------------------------------------------------

        if (
            event.ctrlKey &&
            event.key.toLowerCase() === "y"
        ) {

            event.preventDefault();


            toolbarController.redo();

            return;
        }


        // -----------------------------------------------------
        // Ctrl + Shift + Z
        //
        // Alguns programas utilizam esta combinação
        // para Redo.
        // -----------------------------------------------------

        if (
            event.ctrlKey &&
            event.shiftKey &&
            event.key.toLowerCase() === "z"
        ) {

            event.preventDefault();


            toolbarController.redo();
        }
    }
);


// =========================================================
// Inicialização
// =========================================================

renderer.render(
    expression
);
