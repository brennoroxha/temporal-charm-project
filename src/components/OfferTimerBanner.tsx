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
    </>
  );
}


