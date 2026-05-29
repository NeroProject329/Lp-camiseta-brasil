const PRODUCT_JSON_PATH = "data/produtos.json";
const WHATSAPP_NUMBER = "5500000000000";

const params = new URLSearchParams(window.location.search);
const requestedProduct =
  params.get("produto") ||
  params.get("camisa") ||
  "camiseta-amarela";

const aliases = {
  amarela: "camiseta-amarela",
  azul: "camiseta-azul",
  preta: "camiseta-preta"
};

let products = {};
let currentProduct = null;
let currentImageIndex = 0;

function getEl(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = getEl(id);
  if (element) element.textContent = value || "";
}

function setImage(id, src, alt) {
  const element = getEl(id);
  if (!element) return;

  element.src = src || "";
  element.alt = alt || "";
}

function normalizeProductId(value) {
  return aliases[value] || value || "camiseta-amarela";
}

function createWhatsAppLink(product) {
  const message = `Olá! Tenho interesse na ${product.shortName} por ${product.price}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function formatDescriptionText(text) {
  if (!text) return "";

  const cleanText = text
    .replace(/\s+/g, " ")
    .replace(/Detalhes do Produto/g, "\n\nDetalhes do Produto")
    .replace(/Detalhes do produto/g, "\n\nDetalhes do Produto")
    .replace(/Permaneça Seco/g, "\n\nPermaneça Seco")
    .replace(/Feito com os Profissionais em Mente/g, "\n\nFeito com os Profissionais em Mente")
    .replace(/Nome:/g, "\n\nNome:")
    .trim();

  return cleanText
    .split(/\n+/)
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.trim()}</p>`)
    .join("");
}

async function loadExternalDescription(product) {
  const descriptionBox = getEl("productDescription");

  if (!descriptionBox) return;

  descriptionBox.innerHTML = `<p>${product.description}</p>`;

  if (!product.descriptionFile) return;

  try {
    const response = await fetch(product.descriptionFile);

    if (!response.ok) return;

    const text = await response.text();
    const formatted = formatDescriptionText(text);

    if (formatted) {
      descriptionBox.innerHTML = formatted;
    }
  } catch (error) {
    console.warn("Descrição externa não carregada:", error);
  }
}

function renderThumbs(product) {
  const thumbs = getEl("productThumbs");
  const mainImage = getEl("mainProductImage");

  if (!thumbs || !mainImage) return;

  thumbs.innerHTML = "";

  product.images.forEach((image, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `product-thumb ${index === 0 ? "active" : ""}`;
    button.dataset.index = String(index);

    button.innerHTML = `
      <img src="${image}" alt="${product.shortName} imagem ${index + 1}">
    `;

    button.addEventListener("click", () => {
      currentImageIndex = index;
      updateGalleryImage(product);
    });

    thumbs.appendChild(button);
  });
}

function updateGalleryImage(product) {
  const image = product.images[currentImageIndex];

  setImage("mainProductImage", image, product.shortName);

  document.querySelectorAll(".product-thumb").forEach((thumb) => {
    thumb.classList.toggle(
      "active",
      Number(thumb.dataset.index) === currentImageIndex
    );
  });
}

function renderSizes(product) {
  const sizeButtons = getEl("sizeButtons");

  if (!sizeButtons) return;

  sizeButtons.innerHTML = "";

  product.sizes.forEach((size) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "size-button";
    button.textContent = size;

    if (size === product.defaultSize) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      document.querySelectorAll(".size-button").forEach((item) => {
        item.classList.remove("active");
      });

      button.classList.add("active");
    });

    sizeButtons.appendChild(button);
  });
}

function renderList(id, items) {
  const list = getEl(id);

  if (!list) return;

  list.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
}

function renderRelatedProducts(activeId) {
  const relatedGrid = getEl("relatedGrid");

  if (!relatedGrid) return;

  const related = Object.values(products).filter((product) => {
    return product.id !== activeId;
  });

  relatedGrid.innerHTML = related.map((product) => {
    return `
      <article class="related-card">
        <span class="related-card-badge">${product.badge}</span>

        <a href="produto.html?produto=${product.id}">
          <img src="${product.mainImage}" alt="${product.shortName}">
        </a>

        <h3>${product.name}</h3>

        <span class="related-old">${product.oldPrice}</span>
        <p>${product.price}</p>

        <a class="related-buy" href="produto.html?produto=${product.id}">
          Comprar
        </a>
      </article>
    `;
  }).join("");
}

function renderProduct(product) {
  currentProduct = product;
  currentImageIndex = 0;

  document.title = `${product.shortName} | Vaaai Brasil`;

  setText("breadcrumbName", product.shortName);
  setText("productDiscount", product.badge);
  setText("productCategory", product.category);
  setText("productName", product.name);
  setText("productBrand", product.brand);
  setText("productType", product.type);
  setText("productColor", product.color);
  setText("oldPrice", product.oldPrice);
  setText("productPrice", product.price);
  setText("cashPrice", product.cashPrice);
  setText("installments", product.installments);
  setText("stickyName", product.shortName);
  setText("stickyPrice", product.price);

  setImage("mainProductImage", product.mainImage, product.shortName);
  setImage("stickyImage", product.mainImage, product.shortName);

  const whatsappButton = getEl("whatsappButton");
  if (whatsappButton) {
    whatsappButton.href = createWhatsAppLink(product);
  }

  renderThumbs(product);
  renderSizes(product);
  renderList("productSpecs", product.specs);
  renderList("productWashing", product.washing);
  renderRelatedProducts(product.id);
  loadExternalDescription(product);
}

function setupGalleryArrows() {
  const prev = getEl("prevImage");
  const next = getEl("nextImage");

  if (!prev || !next) return;

  prev.addEventListener("click", () => {
    if (!currentProduct) return;

    currentImageIndex =
      currentImageIndex === 0
        ? currentProduct.images.length - 1
        : currentImageIndex - 1;

    updateGalleryImage(currentProduct);
  });

  next.addEventListener("click", () => {
    if (!currentProduct) return;

    currentImageIndex =
      currentImageIndex === currentProduct.images.length - 1
        ? 0
        : currentImageIndex + 1;

    updateGalleryImage(currentProduct);
  });
}

function setupQuantity() {
  const minus = getEl("minusQty");
  const plus = getEl("plusQty");
  const input = getEl("qtyInput");

  if (!minus || !plus || !input) return;

  minus.addEventListener("click", () => {
    const current = Number(input.value) || 1;
    input.value = Math.max(1, current - 1);
  });

  plus.addEventListener("click", () => {
    const current = Number(input.value) || 1;
    input.value = current + 1;
  });
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.tab;

      buttons.forEach((item) => item.classList.remove("active"));
      contents.forEach((item) => item.classList.remove("active"));

      button.classList.add("active");

      const content = getEl(target);
      if (content) content.classList.add("active");
    });
  });
}

async function loadProducts() {
  try {
    const response = await fetch(PRODUCT_JSON_PATH);

    if (!response.ok) {
      throw new Error("Não foi possível carregar data/produtos.json");
    }

    products = await response.json();

    const productId = normalizeProductId(requestedProduct);
    const product = products[productId] || products["camiseta-amarela"];

    renderProduct(product);
  } catch (error) {
    console.error(error);

    setText("productName", "Produto não encontrado");
  }
}

setupGalleryArrows();
setupQuantity();
setupTabs();
loadProducts();