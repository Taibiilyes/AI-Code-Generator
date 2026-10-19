/* جسمي من الداخل — تحميل الرسوم المتجهية وتشغيل قلب البطاقة */

const $ = (sel) => document.querySelector(sel);

/** يجعل أبعاد SVG مرنة داخل الحاوية مع الحفاظ على viewBox */
function responsive(svg) {
  const vb = svg.getAttribute("viewBox") || "0 0 400 800";
  svg.removeAttribute("width");
  svg.removeAttribute("height");
  if (!svg.getAttribute("viewBox")) svg.setAttribute("viewBox", vb);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.style.width = "100%";
  svg.style.height = "auto";
  svg.style.display = "block";
  return svg;
}

async function inlineSvg(target) {
  const url = target.dataset.svg;
  if (!url) return;
  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    const markup = await res.text();
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) throw new Error("svg");
    target.replaceChildren(document.importNode(svg, true));
    responsive(target.querySelector("svg"));
  } catch (err) {
    // بديل: صورة عادية إن تعذّر تحميل الملف
    const img = document.createElement("img");
    img.src = url;
    img.alt = "";
    img.style.width = "100%";
    img.style.height = "auto";
    target.replaceChildren(img);
    console.warn("تعذّر تضمين", url, err);
  }
}

function wireFlip() {
  const flip = $("#flip");
  const hint = $("#flip-hint");
  if (!flip) return;

  const labels = [
    "الوجه الأول: من الخارج",
    "الوجه الثاني: من الداخل",
  ];

  const toggle = () => {
    flip.classList.toggle("flipped");
    flip.setAttribute(
      "aria-pressed",
      flip.classList.contains("flipped") ? "true" : "false"
    );
    if (hint) hint.textContent = labels[flip.classList.contains("flipped") ? 1 : 0];
  };

  flip.addEventListener("click", toggle);
  flip.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });

  $("#btn-flip-demo")?.addEventListener("click", () => {
    flip.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(toggle, 260);
  });
}

function wirePrint() {
  $("#btn-print")?.addEventListener("click", () => window.print());
}

/* ---------- تبديل المجموعة (وليد / نور) ---------- */
function wireTabs() {
  const tabs = [...document.querySelectorAll(".tab")];
  const groups = [...document.querySelectorAll(".group")];
  if (!tabs.length) return;

  const select = (set) => {
    tabs.forEach((t) => {
      const on = t.dataset.set === set;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-pressed", on ? "true" : "false");
    });
    groups.forEach((g) => {
      g.hidden = g.dataset.set !== set;
    });
  };

  tabs.forEach((t) => t.addEventListener("click", () => select(t.dataset.set)));
}

document.querySelectorAll("[data-svg]").forEach(inlineSvg);
wireFlip();
wirePrint();
wireTabs();
