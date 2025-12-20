import { useState, useEffect } from "react";


import pongImg from "./assets/pong.jpg";
import spaceinvaderImg from "./assets/spaceinvader.jpg";
import asteroidsImg from "./assets/asteroids.jpg";

import Pong from "./Pong";
import SpaceInvaders from "./SpaceInvaders";

type Game = {
  id: number;
  name: string;
  year: number;
  genre: string;
  image: string;
};

const atariGames: Game[] = [
  {
    id: 1,
    name: "Pong",
    year: 1972,
    genre: "Sports",
    image: pongImg,
  },
  {
    id: 2,
    name: "Space Invaders",
    year: 1980,
    genre: "Shooter",
    image: spaceinvaderImg,
  },
  {
    id: 3,
    name: "Asteroids",
    year: 1981,
    genre: "Shooter",
    image: asteroidsImg,
  },
];

export default function App() {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  useEffect(() => {
  const handleExitGame = () => {
    setSelectedGame(null);
  };

  window.addEventListener("exit-game", handleExitGame);

  return () => {
    window.removeEventListener("exit-game", handleExitGame);
  };
}, []);


  return (
    <div
      style={{
        backgroundColor: "#242424",
        color: "white",
        minHeight: "100vh",
        padding: "2rem",
      }}
    >
      {/* 🔙 Back button */}
      {selectedGame && (
        <button
          onClick={() => setSelectedGame(null)}
          style={{ marginBottom: "1rem" }}
        >
          ← Back
        </button>
      )}

      {/* 🏠 MENU */}
      {!selectedGame && (
        <>
          <h1>Atari Classics</h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
         {atariGames.map((game) => (
  <div
    key={game.id}
    onClick={() => setSelectedGame(game)}
    style={{
      cursor: "pointer",
      borderRadius: "12px",
      overflow: "hidden",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow =
        "0 0 0 3px #3b82f6, 0 10px 30px rgba(0,0,0,0.5)";
      e.currentTarget.style.transform = "scale(1.03)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "scale(1)";
    }}
  >

                <img
                  src={game.image}
                  alt={game.name}
                  style={{
                    width: "100%",
                    height: "180px",
                    objectFit: "cover",
                  }}
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* 🎮 GAME SCREEN */}
      {selectedGame && (
        <>
          <h1>{selectedGame.name}</h1>

          {selectedGame.name === "Pong" && <Pong />}

          {selectedGame.name === "Space Invaders" && <SpaceInvaders />}

          {selectedGame.name === "Asteroids" && (
            <>
              <img
                src={selectedGame.image}
                alt={selectedGame.name}
                style={{ width: "500px", borderRadius: "12px" }}
              />
              <p>
                {selectedGame.year} — {selectedGame.genre}
              </p>
              <p>Coming soon…</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
