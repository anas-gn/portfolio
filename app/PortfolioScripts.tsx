"use client";

import { useEffect } from "react";

const SCRIPTS = [
  "/vendor/three.min.js",
  "/vendor/GLTFLoader.js",
  "/js/images-config.js",
  "/js/i18n.js",
  "/js/main.js",
];

declare global {
  interface Window {
    __portfolioBooted?: boolean;
  }
}

function load(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Failed to load " + src));
    document.body.appendChild(el);
  });
}

export default function PortfolioScripts() {
  useEffect(() => {
    if (window.__portfolioBooted) return; // StrictMode runs effects twice in dev
    window.__portfolioBooted = true;
    (async () => {
      for (const src of SCRIPTS) await load(src);
    })().catch((e) => console.error(e));
  }, []);
  return null;
}
