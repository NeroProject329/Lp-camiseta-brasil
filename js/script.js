const mobileMenuButton = document.getElementById("mobileMenuButton");
const mobileNav = document.getElementById("mobileNav");

if (mobileMenuButton && mobileNav) {
  mobileMenuButton.addEventListener("click", () => {
    mobileNav.classList.toggle("active");
  });
}

const navLinks = document.querySelectorAll(".mobile-nav a");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("active");
  });
});


const countdown = document.querySelector("[data-countdown]");

if (countdown) {
  const daysEl = countdown.querySelector("[data-days]");
  const hoursEl = countdown.querySelector("[data-hours]");
  const minutesEl = countdown.querySelector("[data-minutes]");
  const secondsEl = countdown.querySelector("[data-seconds]");

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 2);
  deadline.setHours(deadline.getHours() + 14);
  deadline.setMinutes(deadline.getMinutes() + 37);
  deadline.setSeconds(deadline.getSeconds() + 58);

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function updateCountdown() {
    const now = new Date();
    const diff = deadline - now;

    if (diff <= 0) {
      daysEl.textContent = "00";
      hoursEl.textContent = "00";
      minutesEl.textContent = "00";
      secondsEl.textContent = "00";
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}


/* =========================================
   SCROLL REVEAL — ENTRADA E SAÍDA DAS SEÇÕES
========================================= */

const sectionsToAnimate = document.querySelectorAll(
  ".why-section, .combos-section, .countdown-section, .site-footer"
);

let lastScrollY = window.scrollY;
let scrollDirection = "down";

window.addEventListener(
  "scroll",
  () => {
    const currentScrollY = window.scrollY;

    scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
    lastScrollY = currentScrollY;
  },
  { passive: true }
);

sectionsToAnimate.forEach((section, index) => {
  section.classList.add("scroll-reveal-section");

  if (index === 0) {
    section.classList.add("is-visible");
  }
});

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const section = entry.target;

      if (entry.isIntersecting && entry.intersectionRatio > 0.18) {
        section.classList.add("is-visible");
        section.classList.remove("is-before", "is-after");
      } else {
        section.classList.remove("is-visible");

        if (scrollDirection === "down") {
          section.classList.add("is-after");
          section.classList.remove("is-before");
        } else {
          section.classList.add("is-before");
          section.classList.remove("is-after");
        }
      }
    });
  },
  {
    threshold: [0, 0.18, 0.35, 0.55],
    rootMargin: "-12% 0px -12% 0px",
  }
);

sectionsToAnimate.forEach((section) => {
  sectionObserver.observe(section);
});

/* =========================================
   HERO — LOAD STAGGER ANIMATION
========================================= */

/* =========================================
   HERO — LOAD STAGGER ANIMATION
========================================= */

const heroLoadItems = [
  document.querySelector(".site-header"),
  document.querySelector(".hero-logo-title"),
  document.querySelector(".hero-text p"),
  ...document.querySelectorAll(".hero-benefit"),
  document.querySelector(".primary-button"),
  document.querySelector(".hero-product"),
].filter(Boolean);

heroLoadItems.forEach((item) => {
  item.classList.add("hero-load-item");
});

window.addEventListener("load", () => {
  document.body.classList.add("site-loaded");

  heroLoadItems.forEach((item, index) => {
    const delay = 220 + 135 * index;

    setTimeout(() => {
      item.classList.add("is-hero-visible");
    }, delay);
  });

  const heroLoadTotalTime = 220 + 135 * heroLoadItems.length + 1000;

  setTimeout(() => {
    document.body.classList.add("hero-load-complete");
  }, heroLoadTotalTime);
});

/* =========================================
   CAMISETA AZUL — STAGGER PORTA DE CORRER
========================================= */

const blueSection = document.querySelector(".blue-shirt-section");

if (blueSection) {
  const blueRevealItems = [
    blueSection.querySelector(".blue-shirt-img"),
    blueSection.querySelector(".blue-stars"),
    blueSection.querySelector(".blue-shirt-text h2"),
    blueSection.querySelector(".blue-edition"),
    blueSection.querySelector(".blue-shirt-text p"),
    ...blueSection.querySelectorAll(".blue-shirt-feature"),
    blueSection.querySelector(".blue-button"),
  ].filter(Boolean);

  blueRevealItems.forEach((item, index) => {
    item.classList.add("blue-reveal-item");
    item.style.setProperty("--blue-delay", index);
  });

  const blueObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.28) {
          blueSection.classList.add("is-blue-visible");
        } else {
          blueSection.classList.remove("is-blue-visible");
        }
      });
    },
    {
      threshold: [0, 0.28, 0.45],
      rootMargin: "-8% 0px -12% 0px",
    }
  );

  blueObserver.observe(blueSection);
}


/* =========================================
   CAMISETA PRETA — STAGGER PORTA DE CORRER
   Da esquerda para a direita
========================================= */

const blackSection = document.querySelector(".black-shirt-section");

if (blackSection) {
  const blackRevealItems = [
    blackSection.querySelector(".black-shirt-img"),
    blackSection.querySelector(".black-shirt-text h2"),
    blackSection.querySelector(".black-stars"),
    blackSection.querySelector(".black-shirt-text p"),
    ...blackSection.querySelectorAll(".black-benefits > div"),
    blackSection.querySelector(".black-button"),
  ].filter(Boolean);

  blackRevealItems.forEach((item, index) => {
    item.classList.add("black-reveal-item");
    item.style.setProperty("--black-delay", index);
  });

  const blackObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.28) {
          blackSection.classList.add("is-black-visible");
        } else {
          blackSection.classList.remove("is-black-visible");
        }
      });
    },
    {
      threshold: [0, 0.28, 0.45],
      rootMargin: "-8% 0px -12% 0px",
    }
  );

  blackObserver.observe(blackSection);
}

/* =========================================
   HERO — SUMIR AO DESCER E VOLTAR AO SUBIR
   Só depois do load completo
========================================= */

const heroSection = document.querySelector(".hero-section");

if (heroSection) {
  let heroExitTicking = false;

  function updateHeroExit() {
    if (!document.body.classList.contains("hero-load-complete")) {
      heroExitTicking = false;
      return;
    }

    const shouldHideHero = window.scrollY > 140;

    if (shouldHideHero) {
      heroSection.classList.add("is-hero-exiting");
    } else {
      heroSection.classList.remove("is-hero-exiting");
    }

    heroExitTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!heroExitTicking) {
        window.requestAnimationFrame(updateHeroExit);
        heroExitTicking = true;
      }
    },
    { passive: true }
  );
}