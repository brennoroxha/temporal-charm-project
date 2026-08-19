import { useEffect, useState } from "react";

const START_SECONDS = 3 * 60 * 60 + 42 * 60 + 40;

const pad = (n: number) => String(n).padStart(2, "0");

export function OfferTimerBanner() {
  const [remaining, setRemaining] = useState(START_SECONDS);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  return (
    <div
      style={{
        width: "90%",
        margin: "10px auto",
        borderRadius: 8,
        background: "linear-gradient(to right, #011E51, #a52aad)",
        padding: "5px 10px",
        color: "#fff",
        textAlign: "center",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.25,
      }}
    >
      Oferta Disponível
      <span style={{ fontSize: 11, fontWeight: 500 }}>
        {" "}
        Tempo restante: <span>{pad(hours)}:{pad(minutes)}:{pad(seconds)} </span>
      </span>
    </div>
  );
}
