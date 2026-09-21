"use client";

import { Maximize, Shrink } from "lucide-react";
import { useState, useEffect } from "react";
import { buttonVariants } from "../ui/button";

export default function FullscreenToggle() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync state if user exits via ESC key or browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen mode on the entire page
        await document.documentElement.requestFullscreen();
      } else {
        // Exit fullscreen mode
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen mode:", error);
    }
  };

  return (
     <button
      onClick={toggleFullscreen}
      aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      className={buttonVariants({
        variant: "ghost",
        size: "icon-sm",
        className: "group/full-screen-toggle",
      })}
    >
      {isFullscreen ? (
        <>
          <Shrink className="h-5 w-5" />
          
        </>
      ) : (
        <>
          <Maximize className="h-5 w-5" />
          
        </>
      )}
    </button>
  );
}
