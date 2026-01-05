// oneko.js — Vencord-ready scaled version
(function oneko() {
  // Prevent multiple instances
  if (document.getElementById("oneko")) return;

  const nekoEl = document.createElement("div");

  let nekoPosX = 32;
  let nekoPosY = 32;

  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;

  let clickSound = null;

  const nekoSpeed = 10;

  // Original sprite frames
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

  // Scale factor for your upscaled sprite (1024x512 vs original 256x128)
  const scale = 4; // 1024/256 = 4, 512/128 = 4
  const frameSize = 32 * scale; // each frame is 32x32 in original units

  function init() {
    // Reduced motion check
    const isReducedMotion =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isReducedMotion) return;

    // Cat div setup
    nekoEl.id = "oneko";
    nekoEl.ariaHidden = true;
    nekoEl.style.width = `${frameSize}px`;
    nekoEl.style.height = `${frameSize}px`;
    nekoEl.style.position = "fixed";
    nekoEl.style.pointerEvents = "auto";
    nekoEl.style.imageRendering = "pixelated";
    nekoEl.style.left = `${nekoPosX - frameSize / 2}px`;
    nekoEl.style.top = `${nekoPosY - frameSize / 2}px`;
    nekoEl.style.zIndex = 2147483647;

    // Load click sound
    fetch("https://cdn.jsdelivr.net/gh/Smuray255/onefufu@main/meow.mp3")
      .then(r => r.blob())
      .then(blob => {
        clickSound = new Audio(URL.createObjectURL(blob));
        clickSound.volume = 0.4;
        clickSound.preload = "auto";
      })
      .catch(() => {});

    // Click sound + reset idle
    nekoEl.addEventListener("click", () => {
      if (clickSound) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
      }
      idleAnimation = "alert";
      idleAnimationFrame = 0;
      idleTime = 0;
    });

    // Cat sprite GIF (original link)
    const nekoFile =
      "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif";
    nekoEl.style.backgroundImage = `url(${nekoFile})`;

    document.body.appendChild(nekoEl);

    document.addEventListener("mousemove", event => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp = 0;
  const frameInterval = 1000 / 15; // ~15 FPS original timing

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;

    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;

    if (timestamp - lastFrameTimestamp >= frameInterval) {
      lastFrameTimestamp = timestamp;
      frame();
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * frameSize}px ${sprite[1] * frameSize}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      idleAnimation === null
    ) {
      const availableIdle = ["sleeping", "scratchSelf"];
      if (nekoPosX < frameSize) availableIdle.push("scratchWallW");
      if (nekoPosY < frameSize) availableIdle.push("scratchWallN");
      if (nekoPosX > window.innerWidth - frameSize) availableIdle.push("scratchWallE");
      if (nekoPosY > window.innerHeight - frameSize) availableIdle.push("scratchWallS");
      idleAnimation = availableIdle[Math.floor(Math.random() * availableIdle.length)];
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

    nekoPosX = Math.min(Math.max(frameSize / 2, nekoPosX), window.innerWidth - frameSize / 2);
    nekoPosY = Math.min(Math.max(frameSize / 2, nekoPosY), window.innerHeight - frameSize / 2);

    nekoEl.style.left = `${nekoPosX - frameSize / 2}px`;
    nekoEl.style.top = `${nekoPosY - frameSize / 2}px`;
  }

  init();
})();
