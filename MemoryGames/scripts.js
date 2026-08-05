const { useEffect, useMemo, useRef, useState } = React;

const STORAGE_KEY = "carsMemoryGameSize";
const STORAGE_DECK_KEY = "carsMemoryGameDeck";
const DEFAULT_SIZE = "4x4";
const DEFAULT_DECK = "cars";
const BOARD_SIZES = [
  { value: "2x3", label: "2 x 3", rows: 2, columns: 3 },
  { value: "2x4", label: "2 x 4", rows: 2, columns: 4 },
  { value: "2x5", label: "2 x 5", rows: 2, columns: 5 },
  { value: "3x4", label: "3 x 4", rows: 3, columns: 4 },
  { value: "3x6", label: "3 x 6", rows: 3, columns: 6 },
  { value: "4x4", label: "4 x 4", rows: 4, columns: 4 },
  { value: "4x5", label: "4 x 5", rows: 4, columns: 5 },
  { value: "4x6", label: "4 x 6", rows: 4, columns: 6 },
  { value: "5x6", label: "5 x 6", rows: 5, columns: 6 },
];

const CAR_IMAGES = Array.from({ length: 16 }, (_, index) => ({
  id: `auto${index + 1}`,
  src: `img_cars/auto${index + 1}.jpg`,
  alt: `Auto ${index + 1}`,
}));

const ANIMAL_IMAGES = Array.from({ length: 16 }, (_, index) => ({
  id: `animal${index + 1}`,
  src: `img_animals/animal${index + 1}.jpg`,
  alt: `Állat ${index + 1}`,
}));

const DECKS = {
  cars: {
    label: "Autók",
    images: CAR_IMAGES,
    backFaceSrc: "img_cars/cars-front.jpg",
  },
  animals: {
    label: "Állatok",
    images: ANIMAL_IMAGES,
    backFaceSrc: "img_animals/animals-front.jpg",
  },
};

function getInitialBoardSize() {
  const savedSize = localStorage.getItem(STORAGE_KEY);
  return BOARD_SIZES.some((size) => size.value === savedSize) ? savedSize : DEFAULT_SIZE;
}

function getInitialDeck() {
  const savedDeck = localStorage.getItem(STORAGE_DECK_KEY);
  return savedDeck === "animals" ? "animals" : DEFAULT_DECK;
}

function shuffleCards(cards) {
  return [...cards]
    .map((card) => ({ card, sortValue: Math.random() }))
    .sort((a, b) => a.sortValue - b.sortValue)
    .map(({ card }) => card);
}

function createDeck(size, deckImages = DECKS[getInitialDeck()].images) {
  const cardCount = size.rows * size.columns;
  const pairCount = Math.floor(cardCount / 2);
  const pairedCards = deckImages.slice(0, pairCount).flatMap((image) => [
    { ...image, uniqueId: `${image.id}-a`, type: "pair" },
    { ...image, uniqueId: `${image.id}-b`, type: "pair" },
  ]);

  if (cardCount % 2 === 1) {
    const bonusImage = deckImages[pairCount];
    pairedCards.push({
      ...bonusImage,
      id: "bonus",
      uniqueId: "bonus-card",
      type: "single",
    });
  }

  return shuffleCards(pairedCards);
}

function MemoryCard({ card, isFlipped, isMatched, onFlip, backFaceSrc }) {
  const className = [
    "memory-card",
    "bg-color",
    isFlipped ? "flip" : "",
    isMatched ? "vibrationCard" : "",
  ].filter(Boolean).join(" ");

  return React.createElement(
    "button",
    {
      type: "button",
      className,
      onClick: () => onFlip(card),
      disabled: isMatched,
      "aria-label": isFlipped ? card.alt : "Rejtett kártya",
    },
    React.createElement("img", {
      className: "front-face",
      src: card.src,
      alt: card.alt,
    }),
    React.createElement("img", {
      className: "back-face",
      src: backFaceSrc,
      alt: "Kártya hátlap",
    }),
  );
}

function App() {
  const [selectedDeck, setSelectedDeck] = useState(getInitialDeck);
  const [selectedSizeValue, setSelectedSizeValue] = useState(getInitialBoardSize);
  const selectedSize = useMemo(
    () => BOARD_SIZES.find((size) => size.value === selectedSizeValue) || BOARD_SIZES[2],
    [selectedSizeValue],
  );
  const [cards, setCards] = useState(() => createDeck(selectedSize, DECKS[selectedDeck].images));
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedIds, setMatchedIds] = useState([]);
  const [locked, setLocked] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [gameId, setGameId] = useState(0);
  const timeoutIds = useRef([]);

  function clearScheduledTimeouts() {
    timeoutIds.current.forEach((timeoutId) => clearTimeout(timeoutId));
    timeoutIds.current = [];
  }

  function scheduleTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      timeoutIds.current = timeoutIds.current.filter((id) => id !== timeoutId);
      callback();
    }, delay);

    timeoutIds.current.push(timeoutId);
  }

  function startNewGame(size = selectedSize, deckName = selectedDeck) {
    clearScheduledTimeouts();
    setCards(createDeck(size, DECKS[deckName].images));
    setFlippedCards([]);
    setMatchedIds([]);
    setLocked(false);
    setGameCompleted(false);
    setGameId((currentGameId) => currentGameId + 1);
  }

  function addMatchedCards(cardIds) {
    setMatchedIds((currentMatches) => {
      const nextMatches = [...currentMatches, ...cardIds];

      if (nextMatches.length === cards.length) {
        setGameCompleted(true);
      }

      return nextMatches;
    });
  }

  function handleDeckChange(event) {
    const nextDeck = event.target.value;
    setSelectedDeck(nextDeck);
    localStorage.setItem(STORAGE_DECK_KEY, nextDeck);
    startNewGame(selectedSize, nextDeck);
  }

  function handleSizeChange(event) {
    const nextSizeValue = event.target.value;
    const nextSize = BOARD_SIZES.find((size) => size.value === nextSizeValue);
    setSelectedSizeValue(nextSizeValue);
    localStorage.setItem(STORAGE_KEY, nextSizeValue);
    startNewGame(nextSize, selectedDeck);
  }

  function handleFlip(card) {
    if (locked || matchedIds.includes(card.uniqueId)) return;
    if (flippedCards.some((flippedCard) => flippedCard.uniqueId === card.uniqueId)) return;

    if (card.type === "single") {
      setFlippedCards([card]);
      addMatchedCards([card.uniqueId]);
      scheduleTimeout(() => setFlippedCards([]), 700);
      return;
    }

    const nextFlippedCards = [...flippedCards, card];
    setFlippedCards(nextFlippedCards);

    if (nextFlippedCards.length !== 2) return;

    const [firstCard, secondCard] = nextFlippedCards;

    if (firstCard.id === secondCard.id) {
      addMatchedCards([firstCard.uniqueId, secondCard.uniqueId]);
      setFlippedCards([]);
      return;
    }

    setLocked(true);
    scheduleTimeout(() => {
      setFlippedCards([]);
      setLocked(false);
    }, 1500);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, selectedSizeValue);
  }, [selectedSizeValue]);

  useEffect(() => {
    localStorage.setItem(STORAGE_DECK_KEY, selectedDeck);
  }, [selectedDeck]);

  useEffect(() => {
    if (!gameCompleted) return undefined;

    const timeoutId = setTimeout(() => {
      setGameCompleted(false);
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [gameCompleted]);

  useEffect(() => () => clearScheduledTimeouts(), []);

  const deckInfo = DECKS[selectedDeck];

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "header",
      { className: "fejlec" },
      React.createElement(
        "div",
        { className: "left-controls" },
        React.createElement(
          "div",
          { className: "selector-row" },
          React.createElement(
            "label",
            { className: "deck-picker" },
            React.createElement("span", null, "Kártyák:"),
            React.createElement(
              "select",
              {
                value: selectedDeck,
                onChange: handleDeckChange,
                "aria-label": "Kártyák",
              },
              Object.entries(DECKS).map(([deckKey, deck]) =>
                React.createElement("option", { key: deckKey, value: deckKey }, deck.label),
              ),
            ),
          ),
          React.createElement(
            "label",
            { className: "size-picker" },
            React.createElement("span", null, "Játék mérete:"),
            React.createElement(
              "select",
              {
                value: selectedSizeValue,
                onChange: handleSizeChange,
                "aria-label": "Játék mérete",
              },
              BOARD_SIZES.map((size) => (
                React.createElement("option", { key: size.value, value: size.value }, size.label)
              )),
            ),
          ),
        ),
      ),
      React.createElement("h1", null, "MEMÓRIA JÁTÉK"),
      React.createElement(
        "button",
        {
          id: "ujraBtn",
          type: "button",
          onClick: () => startNewGame(),
        },
        "Új játék",
      ),
    ),
    React.createElement(
      "main",
      {
        key: gameId,
        className: `memory-game${gameCompleted ? " completed" : ""}`,
        style: {
          "--rows": selectedSize.rows,
          "--columns": selectedSize.columns,
        },
      },
      cards.map((card) => {
        const isFlipped = flippedCards.some((flippedCard) => flippedCard.uniqueId === card.uniqueId);
        const isMatched = matchedIds.includes(card.uniqueId);

        return React.createElement(MemoryCard, {
          key: card.uniqueId,
          card,
          isFlipped: isFlipped || isMatched,
          isMatched,
          onFlip: handleFlip,
          backFaceSrc: deckInfo.backFaceSrc,
        });
      }),
    ),
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
