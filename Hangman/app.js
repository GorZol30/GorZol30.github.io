(function () {
  document.addEventListener("contextmenu", (event) => event.preventDefault());
  document.addEventListener("selectstart", (event) => event.preventDefault());
  document.addEventListener("dragstart", (event) => event.preventDefault());

  const { useCallback, useEffect, useMemo, useState } = React;
  const h = React.createElement;

  const ALPHABET = [
    "A", "Á", "B", "C", "D", "E", "É", "F", "G", "H", "I", "Í",
    "J", "K", "L", "M", "N", "O", "Ó", "Ö", "Ő", "P", "Q", "R",
    "S", "T", "U", "Ú", "Ü", "Ű", "V", "W", "X", "Y", "Z"
  ];
  const VOWELS = new Set(["A", "Á", "E", "É", "I", "Í", "O", "Ó", "Ö", "Ő", "U", "Ú", "Ü", "Ű"]);
  const REVEALED_CHARS = new Set([" ", ".", "!", "?", ",", "-"]);
  const MAX_WRONG_GUESSES = 10;

  function getRowWidth() {
    if (window.innerWidth > 1000) return 15;
    if (window.innerWidth > 500) return 12;
    return 10;
  }

  function countGuessableLetters(text) {
    return Array.from(text).filter((char) => !REVEALED_CHARS.has(char)).length;
  }

  function chunkQuestion(text, rowWidth) {
    const words = text.split(" ");
    const rows = [];
    let row = "";

    words.forEach((word) => {
      const candidate = row ? `${row} ${word}` : word;
      if (candidate.length <= rowWidth || !row) {
        row = candidate;
      } else {
        rows.push(row);
        row = word;
      }
    });

    if (row) rows.push(row);
    return rows.map((line) => Array.from(line));
  }

  function pickRandomQuestion() {
    const questions = window.szolasok || [];
    if (!questions.length) return "NINCS BETÖLTVE FELADVÁNY.";
    return questions[Math.floor(Math.random() * questions.length)].toUpperCase();
  }

  function HangmanFigure({ wrongGuesses }) {
    const parts = [
      h("line", { key: "base", x1: 10, y1: 120, x2: 50, y2: 120 }),
      h("line", { key: "pole", x1: 30, y1: 20, x2: 30, y2: 120 }),
      h("line", { key: "top", x1: 30, y1: 20, x2: 70, y2: 20 }),
      h("line", { key: "rope", x1: 70, y1: 20, x2: 70, y2: 40 }),
      h("circle", { key: "head", cx: 70, cy: 50, r: 8 }),
      h("line", { key: "body", x1: 70, y1: 60, x2: 70, y2: 90 }),
      h("line", { key: "left-arm", x1: 69, y1: 65, x2: 55, y2: 85 }),
      h("line", { key: "right-arm", x1: 71, y1: 65, x2: 85, y2: 85 }),
      h("line", { key: "left-leg", x1: 69, y1: 85, x2: 60, y2: 110 }),
      h("line", { key: "right-leg", x1: 71, y1: 85, x2: 80, y2: 110 })
    ];

    return h(
      "div",
      { className: "hangman", "aria-hidden": "true" },
      h(
        "svg",
        { height: 140, width: 100, className: "figure-container" },
        parts.map((part, index) =>
          React.cloneElement(part, {
            className: index < wrongGuesses ? "figure-part" : undefined
          })
        )
      )
    );
  }

  function Message({ result, question, onClose }) {
    if (!result) return null;

    const isWin = result === "win";
    return h(
      "div",
      { className: "messageOverlay", role: "status", "aria-live": "polite" },
      h(
        "section",
        { className: `messageBox ${isWin ? "messageWin" : "messageLose"}` },
        h(
          "button",
          { className: "messageClose", type: "button", onClick: onClose, "aria-label": "Üzenet bezárása" },
          "×"
        ),
        h("h2", null, isWin ? "Gratulálok!" : "Sajnos ez most nem sikerült."),
        h("p", null, isWin ? "Ügyes játék volt." : "A feladvány ez volt:"),
        !isWin && h("strong", null, question)
      )
    );
  }

  function App() {
    const [question, setQuestion] = useState(() => pickRandomQuestion());
    const [guessedLetters, setGuessedLetters] = useState(() => new Set());
    const [wrongGuesses, setWrongGuesses] = useState(0);
    const [rowWidth, setRowWidth] = useState(() => getRowWidth());
    const [messageDismissed, setMessageDismissed] = useState(false);

    useEffect(() => {
      const onResize = () => setRowWidth(getRowWidth());
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, []);

    const rows = useMemo(() => chunkQuestion(question, rowWidth), [question, rowWidth]);
    const guessableLetters = useMemo(() => countGuessableLetters(question), [question]);
    const foundLetters = useMemo(
      () => Array.from(question).filter((char) => !REVEALED_CHARS.has(char) && guessedLetters.has(char)).length,
      [question, guessedLetters]
    );
    const result = wrongGuesses >= MAX_WRONG_GUESSES ? "lose" : foundLetters === guessableLetters ? "win" : null;
    const gameEnded = Boolean(result);

    const startNewGame = useCallback(() => {
      setQuestion(pickRandomQuestion());
      setGuessedLetters(new Set());
      setWrongGuesses(0);
      setMessageDismissed(false);
    }, []);

    const chooseLetter = useCallback(
      (letter) => {
        if (gameEnded || guessedLetters.has(letter)) return;

        const nextGuessedLetters = new Set(guessedLetters);
        nextGuessedLetters.add(letter);
        setGuessedLetters(nextGuessedLetters);

        if (!question.includes(letter)) {
          setWrongGuesses((current) => current + 1);
        }
      },
      [gameEnded, guessedLetters, question]
    );

    return h(
      "div",
      { className: "wrapper" },
      h("main", { className: "gameSurface" },
        h("h1", { className: "gameTitle" }, "Akasztófa-játék"),
        h(HangmanFigure, { wrongGuesses }),
        h("p", { id: "taskTipus" }, "S Z Ó L Á S"),
        h(
          "div",
          { className: "feladatCont", "aria-label": "Kitalálandó feladvány" },
          rows.map((row, rowIndex) =>
            h(
              "ul",
              { className: "taskLista", key: `${question}-${rowIndex}` },
              row.map((char, charIndex) => {
                const revealed = REVEALED_CHARS.has(char) || guessedLetters.has(char) || gameEnded;
                return h(
                  "li",
                  {
                    className: [
                      "taskBox",
                      REVEALED_CHARS.has(char) ? "taskBoxFix" : "",
                      revealed && !REVEALED_CHARS.has(char) ? "taskBoxShow" : ""
                    ].filter(Boolean).join(" "),
                    key: `${rowIndex}-${charIndex}`
                  },
                  h("span", { className: revealed ? "letterVisible" : "" }, char)
                );
              })
            )
          )
        ),
        h(
          "div",
          { className: "lettersCont", "aria-label": "Választható betűk" },
          h(
            "ul",
            { className: "betuLista" },
            ALPHABET.map((letter) => {
              const guessed = guessedLetters.has(letter);
              return h(
                "li",
                { key: letter },
                h(
                  "button",
                  {
                    className: [
                      "letterBox",
                      VOWELS.has(letter) ? "maganhangzoLetter" : "",
                      guessed ? "letterUsed" : ""
                    ].filter(Boolean).join(" "),
                    type: "button",
                    disabled: guessed || gameEnded,
                    onClick: () => chooseLetter(letter)
                  },
                  letter
                )
              );
            })
          )
        ),
        h(
          "div",
          { className: "gameActions" },
          h("button", { className: "gameBtn gameBtnGrad1", type: "button", onClick: startNewGame }, "Új játék")
        )
      ),
      h(Message, {
        result: messageDismissed ? null : result,
        question,
        onClose: () => setMessageDismissed(true)
      })
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();

