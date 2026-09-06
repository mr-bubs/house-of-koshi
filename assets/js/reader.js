const GITHUB_USER = "mr-bubs";
const GITHUB_REPO = "graphic-novels";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function getParams() {
  return new URLSearchParams(window.location.search);
}

function getBookKey() {
  return getParams().get("book");
}

function getRequestedChapter() {
  const value = getParams().get("chapter");
  return value ? Number(value) : null;
}

function getBook() {
  return KOSHI_BOOKS[getBookKey()];
}

function getChapterIndexForPage(book, pageNum) {
  let currentIndex = 0;

  book.chapters.forEach((chapter, index) => {
    if (pageNum >= chapter.startPage) {
      currentIndex = index;
    }
  });

  return currentIndex;
}

function updateUrlChapter(chapterIndex) {
  const params = getParams();
  params.set("chapter", String(chapterIndex + 1));

  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, "", newUrl);
}

async function loadReader() {
  const book = getBook();

  const titleEl = document.getElementById("reader-title");
  const backLink = document.getElementById("reader-back");
  const sourceLink = document.getElementById("reader-source");
  const chapterSelect = document.getElementById("chapter-select");
  const pagesEl = document.getElementById("reader-pages");
  const statusEl = document.getElementById("reader-status");
  const endEl = document.getElementById("reader-end");
  const endLabel = document.getElementById("reader-end-label");
  const endLink = document.getElementById("reader-end-link");

  if (!book) {
    titleEl.textContent = "Book not found";
    statusEl.style.display = "block";
    statusEl.textContent = "This production could not be found.";
    chapterSelect.style.display = "none";
    return;
  }

  titleEl.textContent = book.title;
  document.title = `${book.title} — House of Koshi`;

  backLink.href = book.productionUrl;
  backLink.setAttribute("aria-label", `Back to ${book.title}`);

  endLink.href = book.productionUrl;

  if (book.credit) {
    sourceLink.href = book.credit.url;
    sourceLink.title = book.credit.text;
    sourceLink.setAttribute("aria-label", book.credit.text);
    sourceLink.style.display = "inline-flex";
  }

  book.chapters.forEach((chapter, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = chapter.label;
    chapterSelect.appendChild(option);
  });

  try {
    statusEl.style.display = "block";
    statusEl.textContent = "Loading production…";

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${book.folder}`
    );

    if (!response.ok) {
      throw new Error("Could not load pages folder");
    }

    const files = await response.json();

    const images = files
      .filter(file =>
        IMAGE_EXTENSIONS.some(ext =>
          file.name.toLowerCase().endsWith(ext)
        )
      )
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true })
      );

    if (!images.length) {
      statusEl.textContent = "No pages are available yet.";
      return;
    }

    statusEl.style.display = "none";

    images.forEach((file, index) => {
      const img = document.createElement("img");

      img.src = file.download_url;
      img.alt = `${book.title} — page ${index + 1}`;
      img.loading = index < 2 ? "eager" : "lazy";
      img.decoding = "async";
      img.dataset.pageNum = index + 1;

      pagesEl.appendChild(img);
    });

    if (book.complete) {
      endLabel.textContent = "The End";
    } else {
      const lastChapter = book.chapters[book.chapters.length - 1];
      endLabel.textContent = lastChapter
        ? `End of ${lastChapter.label}`
        : "End";
    }

    endEl.style.display = "block";

    setupChapterNavigation(book);
    setupChapterTracking(book);
    openRequestedChapter(book);

  } catch (error) {
    console.error(error);
    statusEl.style.display = "block";
    statusEl.textContent =
      "The reader could not load this production. Check the repository folder configuration.";
  }
}

function setupChapterNavigation(book) {
  const chapterSelect = document.getElementById("chapter-select");

  chapterSelect.addEventListener("change", () => {
    const chapterIndex = Number(chapterSelect.value);
    const chapter = book.chapters[chapterIndex];

    if (!chapter) return;

    const target = document.querySelector(
      `img[data-page-num="${chapter.startPage}"]`
    );

    if (target) {
      updateUrlChapter(chapterIndex);

      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  });
}

function openRequestedChapter(book) {
  const requestedChapter = getRequestedChapter();

  if (!requestedChapter) {
    document.getElementById("chapter-select").value = "0";
    return;
  }

  const chapterIndex = requestedChapter - 1;
  const chapter = book.chapters[chapterIndex];

  if (!chapter) return;

  const select = document.getElementById("chapter-select");
  select.value = String(chapterIndex);

  const target = document.querySelector(
    `img[data-page-num="${chapter.startPage}"]`
  );

  if (!target) return;

  requestAnimationFrame(() => {
    setTimeout(() => {
      target.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    }, 100);
  });
}

function setupChapterTracking(book) {
  const select = document.getElementById("chapter-select");

  const observer = new IntersectionObserver(
    entries => {
      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visibleEntries.length) return;

      const pageNum = Number(
        visibleEntries[0].target.dataset.pageNum
      );

      const chapterIndex = getChapterIndexForPage(book, pageNum);

      if (select.value !== String(chapterIndex)) {
        select.value = String(chapterIndex);
        updateUrlChapter(chapterIndex);
      }
    },
    {
      rootMargin: "-20% 0px -65% 0px",
      threshold: [0, 0.1, 0.25, 0.5],
    }
  );

  document.querySelectorAll("#reader-pages img").forEach(img => {
    observer.observe(img);
  });
}

loadReader();
