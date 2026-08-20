import { useEffect, useState } from "react";
import bannerAsset from "@/assets/bannermx.png.asset.json";

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
    <>
      <div
        style={{
          width: "100%",
          background: "#FFE600",
          textAlign: "center",
          lineHeight: 0,
        }}
      >
        <img 
          src={bannerAsset.url} 
          alt="Banner Aniversário 25 Anos" 
          style={{ width: "100%", maxWidth: "1200px", height: "auto", display: "inline-block" }} 
        />
      </div>
      <div
        style={{
          width: "100%",
          background: "#FFE600",
          padding: "10px 0 10px 0",
          color: "#000",
          textAlign: "center",
          fontSize: "16px",
          fontWeight: 400,
          lineHeight: 1.25,
          boxShadow: "inset 0 6px 6px -4px rgba(0,0,0,.18)",
        }}
      >
        <div style={{ fontSize: "17px", color: "#333" }}>
          Tempo restante:{" "}
          <span style={{ fontWeight: 600 }}>
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </span>
        </div>
      </div>
    </>
  );
}


