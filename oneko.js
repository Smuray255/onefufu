// oneko.js — Vencord-ready, single-size-variable version
(function oneko() {
  // Prevent multiple instances
  if (document.getElementById("oneko")) return;

  const nekoEl = document.createElement("div");

  // ---------------- CONFIG ----------------
  const kittySize = 64; // Change this to resize the cat
  const fps = 15;       // Change this to adjust FPS
  const nekoSpeed = 10; // Movement speed
  const clickSoundUrl = "https://cdn.jsdelivr.net/gh/Smuray255/onefufu@main/meow.mp3";
  const nekoGifUrl = "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif";
  // ----------------------------------------

  let nekoPosX = 32;
  let nekoPosY = 32;
  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  // Sound setup
  const clickSound = new Audio(clickSoundUrl);
  clickSound.volume = 0.4;
  clickSound.preload = "auto";

  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function init() {
    // Reduced motion check
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return;

    // Cat div setup
    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = `${kittySize}px`;
    nekoEl.style.height = `${kittySize}px`;
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "auto";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - kittySize / 2}px`;
    nekoEl.style.top = `${nekoPosY - kittySize / 2}px`;
    nekoEl.style.zIndex = 2147483647;

    // Click sound + reset idle
    nekoEl.addEventListener("click", () => {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {});
      idleAnimation = "alert";
      idleAnimationFrame = 0;
      idleTime = 0;
    });

    nekoEl.style.backgroundImage = `url(${nekoGifUrl})`;

    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp = 0;

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;

    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;

    if (timestamp - lastFrameTimestamp > 1000 / fps) {
      lastFrameTimestamp = timestamp;
      frame();
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (idleTime > 10 && Math.floor(Math.random() * 200) === 0 && idleAnimation === null) {
      const avalibleIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < kittySize) avalibleIdleAnimations.push("scratchWallW");
      if (nekoPosY < kittySize) avalibleIdleAnimations.push("scratchWallN");
      if (nekoPosX > window.innerWidth - kittySize) avalibleIdleAnimations.push("scratchWallE");
      if (nekoPosY > window.innerHeight - kittySize) avalibleIdleAnimations.push("scratchWallS");

      idleAnimation = avalibleIdleAnimations[Math.floor(Math.random() * avalibleIdleAnimations.length)];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) setSprite("tired", 0);
        else setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;

      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;

      default:
        setSprite("idle", 0);
        return;
    }
    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;
    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = "";
    direction += diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(kittySize / 2, nekoPosX), window.innerWidth - kittySize / 2);
    nekoPosY = Math.min(Math.max(kittySize / 2, nekoPosY), window.innerHeight - kittySize / 2);

    nekoEl.style.left = `${nekoPosX - kittySize / 2}px`;
    nekoEl.style.top = `${nekoPosY - kittySize / 2}px`;
  }

  init();
})();
