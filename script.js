const header = document.querySelector("[data-header]");
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#site-menu");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const copyButton = document.querySelector("[data-copy-email]");
const copyStatus = document.querySelector("[data-copy-status]");
const yearNode = document.querySelector("[data-year]");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

const closeNavigation = () => {
  document.body.classList.remove("nav-open");
  navMenu?.classList.remove("is-open");
  navToggle?.setAttribute("aria-expanded", "false");
  navToggle?.setAttribute("aria-label", "Open navigation");
};

navToggle?.addEventListener("click", () => {
  const isOpen = navMenu?.classList.toggle("is-open");
  document.body.classList.toggle("nav-open", Boolean(isOpen));
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

navLinks.forEach((link) => {
  link.addEventListener("click", closeNavigation);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNavigation();
  }
});

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const activeLink = navLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        navLinks.forEach((link) => link.classList.toggle("is-active", link === activeLink));
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => navObserver.observe(section));
}

const revealItems = Array.from(document.querySelectorAll(".reveal"));

if ("IntersectionObserver" in window && revealItems.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const timelineToggle = document.querySelector("[data-timeline-toggle]");
const timelineEarlier = document.querySelector("[data-timeline-earlier]");
const timelineToggleLabel = document.querySelector("[data-toggle-label]");

timelineToggle?.addEventListener("click", () => {
  const isHidden = timelineEarlier.hidden;
  timelineEarlier.hidden = !isHidden;
  timelineToggle.classList.toggle("is-open", isHidden);
  timelineToggle.setAttribute("aria-expanded", String(isHidden));
  if (timelineToggleLabel) {
    timelineToggleLabel.textContent = isHidden ? "Hide earlier roles" : "Show 3 earlier roles (2009-2019)";
  }
  if (isHidden) {
    timelineEarlier.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
  }
});

copyButton?.addEventListener("click", async () => {
  const email = copyButton.dataset.copyEmail;
  if (!email) {
    return;
  }

  try {
    await navigator.clipboard.writeText(email);
    if (copyStatus) {
      copyStatus.textContent = "Email copied.";
    }
  } catch {
    if (copyStatus) {
      copyStatus.textContent = email;
    }
  }
});
