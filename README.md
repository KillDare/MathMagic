# MathMagic 🧮✨

> Um editor de expressões matemáticas baseado em uma árvore de nós, desenvolvido para permitir a construção, edição e manipulação de expressões de forma visual e interativa.

🚧 **Projeto em desenvolvimento**

O **MathMagic** é um projeto experimental focado na criação de um editor matemático interativo para Web.

A proposta é permitir que o usuário construa expressões matemáticas visualmente, manipulando seus elementos individualmente, com suporte a seleção, edição, navegação por teclado, exclusão e histórico de alterações.

---

## ✨ Funcionalidades atuais

O editor já possui uma estrutura funcional de edição baseada em uma árvore de expressão.

### 🌳 Árvore de expressão

As expressões são representadas internamente como uma árvore de nós.

Cada elemento da expressão é um `MathNode`, permitindo representar diferentes tipos de componentes matemáticos e seus relacionamentos.

Exemplo:

```text
        ×
       / \
      +   4
     / \
    2   3
```

Representando:

```text
2 + 3 × 4
```

Essa estrutura permite que cada parte da expressão seja manipulada individualmente.

---

### 🖱️ Seleção de blocos

É possível selecionar individualmente os elementos da expressão através do mouse.

O elemento selecionado recebe um destaque visual, permitindo identificar qual bloco será manipulado.

---

### ⌨️ Navegação pelo teclado

A expressão também pode ser percorrida através das teclas direcionais:

| Tecla | Ação                         |
| ----- | ---------------------------- |
| `←`   | Seleciona o bloco anterior   |
| `→`   | Seleciona o próximo bloco    |
| `↑`   | Navega para o nó pai         |
| `↓`   | Navega para o primeiro filho |

A navegação utiliza a própria estrutura da árvore de expressão.

---

### 🗑️ Exclusão de blocos

É possível excluir o bloco atualmente selecionado utilizando:

```text
Delete
```

ou:

```text
Backspace
```

Ao invés de simplesmente remover o nó da árvore e deixar a expressão inconsistente, o editor substitui o elemento por um `SLOT`.

Exemplo:

```text
2 + 3
```

Após selecionar `3` e pressionar `Delete`:

```text
2 + □
```

Isso mantém a estrutura da expressão válida e permite que o espaço seja preenchido posteriormente.

---

### ↩️ Undo

O editor possui histórico de alterações.

Atalho:

```text
Ctrl + Z
```

As alterações realizadas na árvore são armazenadas como estados da expressão, permitindo retornar aos estados anteriores.

---

### ↪️ Redo

Também é possível refazer alterações:

```text
Ctrl + Y
```

O histórico mantém os estados necessários para navegar novamente entre as alterações realizadas.

---

### 🧩 Slots

Os `SLOT`s representam posições disponíveis dentro da expressão.

Por exemplo:

```text
2 + □
```

O `□` representa uma posição que pode receber um novo elemento.

Isso permite manter a árvore consistente mesmo durante a edição de uma expressão incompleta.

---

## 🏗️ Arquitetura

O projeto utiliza uma arquitetura baseada na separação entre modelo, controle, renderização e interface.

Estrutura conceitual:

```text
Expression
    │
    ├── MathNode
    │
    ├── NodeTypes
    │
    └── History
          │
          ▼
ExpressionController
          │
          ▼
      Renderer
          │
          ▼
        DOM
```

### Principais componentes

#### `Expression`

Responsável pela árvore da expressão e pelas operações sobre seus nós.

Entre suas responsabilidades estão:

* gerenciamento da raiz;
* seleção de nós;
* busca de nós;
* busca de nós pai;
* substituição de nós;
* remoção de nós;
* gerenciamento do histórico;
* Undo / Redo.

---

#### `MathNode`

Representa cada elemento individual da expressão.

Um nó pode possuir:

* identificador;
* tipo;
* valor;
* filhos.

Isso permite representar estruturas matemáticas de forma hierárquica.

---

#### `NodeTypes`

Centraliza os tipos de nós utilizados pelo editor.

Exemplo conceitual:

```javascript
NodeTypes.NUMBER
NodeTypes.SLOT
NodeTypes.ADD
NodeTypes.SUBTRACT
NodeTypes.MULTIPLY
NodeTypes.DIVIDE
NodeTypes.POWER
NodeTypes.PARENTHESIS
```

---

#### `ExpressionController`

Responsável pela interação do usuário com a expressão.

Atualmente controla:

* seleção por clique;
* seleção por teclado;
* navegação pela árvore;
* Delete;
* Backspace.

---

#### `ToolbarController`

Centraliza as operações de edição provenientes da interface.

É responsável por ações como:

* inserção de valores;
* criação de operações;
* criação de parênteses;
* limpeza da expressão;
* Undo;
* Redo.

---

#### `Renderer`

Responsável por transformar a árvore de expressão em elementos visuais no DOM.

A árvore lógica é separada da sua representação visual.

---

## 🛠️ Tecnologias

O projeto está sendo desenvolvido utilizando tecnologias Web:

* **HTML5**
* **CSS3**
* **JavaScript**
* **ES Modules**
* **DOM API**

O projeto não depende de um framework JavaScript para a estrutura principal do editor.

---

## 📁 Estrutura do projeto

A estrutura atual segue aproximadamente:

```text
MathMagic/
│
├── index.html
│
├── src/
│   │
│   ├── app.js
│   │
│   ├── controllers/
│   │   ├── ExpressionController.js
│   │   └── ToolbarController.js
│   │
│   ├── models/
│   │   ├── Expression.js
│   │   ├── MathNode.js
│   │   └── NodeTypes.js
│   │
│   ├── services/
│   │   └── Renderer.js
│   │
│   └── views/
│       └── ToolbarView.js
│
└── README.md
```

---

## 🚧 Roadmap

O projeto ainda está em desenvolvimento.

Algumas das próximas etapas planejadas incluem:

* [ ] Edição direta através do teclado
* [ ] Inserção de números pelo teclado
* [ ] Inserção de operadores pelo teclado
* [ ] Melhorias na navegação entre operandos
* [ ] Melhor gerenciamento de parênteses
* [ ] Motor de resolução matemática
* [ ] Step by Step da resolução
* [ ] Visualização das etapas de cálculo
* [ ] Melhorias na experiência de edição
* [ ] Novos tipos de operações matemáticas

O roadmap pode mudar conforme o desenvolvimento do projeto evoluir.

---

## 🎯 Objetivo do projeto

O objetivo do MathMagic não é apenas calcular uma expressão matemática.

A ideia é construir uma estrutura que permita **entender e manipular a expressão como uma árvore**, tornando possível futuramente apresentar não apenas o resultado, mas também **como a expressão chegou até ele**.

Por exemplo:

```text
2 + 3 × 4
```

poderá futuramente ser processado como:

```text
2 + 3 × 4

        ↓

2 + 12

        ↓

14
```

permitindo transformar a resolução matemática em uma sequência visual de etapas.

---

## 📌 Status

**Em desenvolvimento ativo.**

A estrutura básica de edição da expressão já está funcional, incluindo seleção, navegação, exclusão e histórico de alterações.

O próximo grande estágio do projeto será a evolução do editor para uma experiência de edição direta e, posteriormente, a implementação do sistema de resolução **Step by Step**.

---

## 👨‍💻 Autor

Desenvolvido por **KillDare**.

GitHub:

https://github.com/KillDare

---

## 📄 Licença

Ainda não definida.

## Testes e validação do núcleo

O projeto inclui testes automatizados com o runner nativo do Node.js. Com Node.js 18 ou superior, execute na raiz do projeto:

```bash
npm test
```

Os testes cobrem operações básicas, estrutura válida/inválida da árvore, divisão por zero e o histórico compartilhado entre `Expression` e `ExpressionController`.

### Decisões de estabilidade (0.1.1)

- `Expression` é a fonte única de verdade para o histórico de edição.
- Estados idênticos não são adicionados repetidamente ao histórico.
- O histórico é limitado a 100 estados e uma nova edição após Undo elimina o ramo de Redo.
- `MathEngine.isComplete()` valida a aridade das operações, folhas numéricas, parênteses e nós não suportados antes de permitir a resolução.
