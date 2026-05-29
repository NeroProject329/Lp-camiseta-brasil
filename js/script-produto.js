const PRODUCT_JSON_PATH = "data/produtos.json";
const WHATSAPP_NUMBER = "5500000000000";
const CART_STORAGE_KEY = "vaaaiBrasilCart";

const EXTRA_NAME_CENTS = 2500;
const EXTRA_NUMBER_CENTS = 2500;

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

function moneyToCents(value) {
  if (!value) return 0;

  const clean = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  return Math.round((Number(clean) || 0) * 100);
}

function formatMoney(cents) {
  return (Number(cents) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartBadges();
  renderCart();
}

function getCartQuantity() {
  return getCart().reduce((total, item) => total + item.qty, 0);
}

function updateCartBadges() {
  const total = getCartQuantity();

  document.querySelectorAll(".cart-count, .product-cart span, .header-cart span, .cart-button span").forEach((badge) => {
    badge.textContent = total;
  });

  setText("cartDrawerCount", total === 1 ? "1 item" : `${total} itens`);
}

function createWhatsAppLinkFromProduct(product) {
  const details = getCurrentSelection();

  const message = [
    `Olá! Tenho interesse na ${product.shortName}.`,
    `Tamanho: ${details.size}`,
    details.customName ? `Nome: ${details.customName}` : "",
    details.customNumber ? `Número: ${details.customNumber}` : "",
    `Quantidade: ${details.qty}`,
    `Valor unitário: ${formatMoney(details.unitPriceCents)}`
  ].filter(Boolean).join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function createWhatsAppLinkFromCart() {
  const cart = getCart();

  if (!cart.length) {
    return `https://wa.me/${WHATSAPP_NUMBER}`;
  }

  const lines = cart.map((item, index) => {
    return [
      `${index + 1}. ${item.shortName}`,
      `Tamanho: ${item.size}`,
      item.customName ? `Nome: ${item.customName}` : "",
      item.customNumber ? `Número: ${item.customNumber}` : "",
      `Qtd: ${item.qty}`,
      `Unitário: ${formatMoney(item.unitPriceCents)}`,
      `Total: ${formatMoney(item.unitPriceCents * item.qty)}`
    ].filter(Boolean).join("\n");
  });

  const subtotal = cart.reduce((total, item) => {
    return total + item.unitPriceCents * item.qty;
  }, 0);

  const message = [
    "Olá! Quero finalizar meu pedido:",
    "",
    ...lines,
    "",
    `Subtotal: ${formatMoney(subtotal)}`
  ].join("\n");

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

  if (!thumbs) return;

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
      updateWhatsappButton();
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

function getSelectedSize() {
  const selected = document.querySelector(".size-button.active");
  return selected ? selected.textContent.trim() : "";
}

function getCustomization() {
  const nameInput = getEl("customName");
  const numberInput = getEl("customNumber");

  return {
    customName: nameInput ? nameInput.value.trim().toUpperCase() : "",
    customNumber: numberInput ? numberInput.value.trim() : ""
  };
}

function getCurrentSelection() {
  const qtyInput = getEl("qtyInput");
  const qty = Math.max(1, Number(qtyInput?.value) || 1);
  const { customName, customNumber } = getCustomization();

  const basePriceCents = moneyToCents(currentProduct?.price);
  const nameExtra = customName ? EXTRA_NAME_CENTS : 0;
  const numberExtra = customNumber ? EXTRA_NUMBER_CENTS : 0;
  const unitPriceCents = basePriceCents + nameExtra + numberExtra;

  return {
    qty,
    size: getSelectedSize(),
    customName,
    customNumber,
    basePriceCents,
    unitPriceCents
  };
}

function updatePersonalizationPreview() {
  const { customName, customNumber } = getCustomization();

  const preview = getEl("shirtPreview");
  const previewName = getEl("shirtPreviewName");
  const previewNumber = getEl("shirtPreviewNumber");

  if (!preview || !previewName || !previewNumber) return;

  previewName.textContent = customName;
  previewNumber.textContent = customNumber;

  preview.classList.toggle("active", Boolean(customName || customNumber));
}

function updateWhatsappButton() {
  const whatsappButton = getEl("whatsappButton");

  if (whatsappButton && currentProduct) {
    whatsappButton.href = createWhatsAppLinkFromProduct(currentProduct);
  }
}

function setupCustomizationFields() {
  const nameInput = getEl("customName");
  const numberInput = getEl("customNumber");

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      nameInput.value = nameInput.value
        .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
        .slice(0, 12)
        .toUpperCase();

      updatePersonalizationPreview();
      updateWhatsappButton();
    });
  }

  if (numberInput) {
    numberInput.addEventListener("input", () => {
      numberInput.value = numberInput.value
        .replace(/\D/g, "")
        .slice(0, 2);

      updatePersonalizationPreview();
      updateWhatsappButton();
    });
  }
}

function createCartItemId(product, selection) {
  return [
    product.id,
    selection.size,
    selection.customName || "sem-nome",
    selection.customNumber || "sem-numero"
  ].join("__").toLowerCase();
}

function addCurrentProductToCart() {
  if (!currentProduct) return;

  const selection = getCurrentSelection();

  if (!selection.size) {
    showToast("Escolha um tamanho antes de comprar.");
    return;
  }

  const cart = getCart();
  const itemId = createCartItemId(currentProduct, selection);

  const existingItem = cart.find((item) => item.id === itemId);

  if (existingItem) {
    existingItem.qty += selection.qty;
  } else {
    cart.push({
      id: itemId,
      productId: currentProduct.id,
      name: currentProduct.name,
      shortName: currentProduct.shortName,
      image: currentProduct.mainImage,
      size: selection.size,
      customName: selection.customName,
      customNumber: selection.customNumber,
      qty: selection.qty,
      basePriceCents: selection.basePriceCents,
      unitPriceCents: selection.unitPriceCents
    });
  }

  saveCart(cart);
  openCart();
  showToast("Produto adicionado ao carrinho.");
}

function renderCart() {
  const cartItems = getEl("cartItems");
  const cartEmpty = getEl("cartEmpty");
  const subtotalElement = getEl("cartSubtotal");

  if (!cartItems || !cartEmpty || !subtotalElement) return;

  const cart = getCart();

  if (!cart.length) {
    cartItems.innerHTML = "";
    cartEmpty.classList.add("active");
    subtotalElement.textContent = formatMoney(0);
    return;
  }

  cartEmpty.classList.remove("active");

  const subtotal = cart.reduce((total, item) => {
    return total + item.unitPriceCents * item.qty;
  }, 0);

  subtotalElement.textContent = formatMoney(subtotal);

  cartItems.innerHTML = cart.map((item) => {
    return `
      <article class="cart-mobile-item">
        <div class="cart-mobile-image">
          <img src="${item.image}" alt="${item.shortName}">
        </div>

        <div class="cart-mobile-info">
          <div class="cart-mobile-item-top">
            <h3>${item.shortName}</h3>
            <span class="cart-mobile-qty">${item.qty}</span>
          </div>

          <div class="cart-mobile-meta">
            <p>- Tamanho: ${item.size}</p>
            ${item.customName ? `<p>- Nome: ${item.customName}</p>` : ""}
            ${item.customNumber ? `<p>- Número: ${item.customNumber}</p>` : ""}
          </div>

          <strong class="cart-mobile-price">
            ${formatMoney(item.unitPriceCents * item.qty)}
          </strong>

          <button
            class="cart-mobile-remove"
            type="button"
            data-cart-action="remove"
            data-cart-id="${item.id}"
            aria-label="Remover item"
          >
            ×
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function changeCartItemQuantity(itemId, action) {
  const cart = getCart();
  const item = cart.find((cartItem) => cartItem.id === itemId);

  if (!item) return;

  if (action === "increase") {
    item.qty += 1;
  }

  if (action === "decrease") {
    item.qty -= 1;
  }

  const updatedCart = cart.filter((cartItem) => cartItem.qty > 0);

  saveCart(updatedCart);
}

function removeCartItem(itemId) {
  const cart = getCart().filter((item) => item.id !== itemId);
  saveCart(cart);
}

function openCart() {
  const drawer = getEl("cartDrawer");
  const overlay = getEl("cartOverlay");

  if (!drawer || !overlay) {
    console.warn("Carrinho não encontrado no HTML.");
    return;
  }

  renderCart();

  drawer.classList.add("active");
  overlay.classList.add("active");
  document.body.classList.add("cart-open");
}

function closeCart() {
  const drawer = getEl("cartDrawer");
  const overlay = getEl("cartOverlay");

  drawer?.classList.remove("active");
  overlay?.classList.remove("active");
  document.body.classList.remove("cart-open");
}

function clearCart() {
  saveCart([]);
  showToast("Carrinho limpo.");
}

function showToast(message) {
  let toast = document.querySelector(".cart-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className = "cart-toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("active");

  window.clearTimeout(showToast.timeout);

  showToast.timeout = window.setTimeout(() => {
    toast.classList.remove("active");
  }, 2200);
}

function setupCartEvents() {
  const openButtons = document.querySelectorAll(".js-open-cart, #openCartButton, .product-cart");
  const closeButton = getEl("closeCartButton");
  const overlay = getEl("cartOverlay");
  const addButton = getEl("addToCartButton");
  const stickyButton = getEl("stickyAddToCart");
  const clearButton = getEl("clearCartButton");
  const cartItems = getEl("cartItems");
  const whatsappButton = getEl("cartWhatsappButton");
  const continueShoppingButton = getEl("continueShoppingButton");


  openButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openCart();
    });
  });

  closeButton?.addEventListener("click", closeCart);
  overlay?.addEventListener("click", closeCart);
  continueShoppingButton?.addEventListener("click", closeCart);

  addButton?.addEventListener("click", addCurrentProductToCart);
  stickyButton?.addEventListener("click", addCurrentProductToCart);
  clearButton?.addEventListener("click", clearCart);

  cartItems?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cart-action]");
    if (!button) return;

    const action = button.dataset.cartAction;
    const itemId = button.dataset.cartId;

    if (action === "increase" || action === "decrease") {
      changeCartItemQuantity(itemId, action);
    }

    if (action === "remove") {
      removeCartItem(itemId);
    }
  });

  whatsappButton?.addEventListener("click", () => {
      window.location.href = "finalizar-compra.html";
  });
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

  renderThumbs(product);
  renderSizes(product);
  renderList("productSpecs", product.specs);
  renderList("productWashing", product.washing);
  renderRelatedProducts(product.id);
  loadExternalDescription(product);
  updatePersonalizationPreview();
  updateWhatsappButton();
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
    updateWhatsappButton();
  });

  plus.addEventListener("click", () => {
    const current = Number(input.value) || 1;
    input.value = current + 1;
    updateWhatsappButton();
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
setupCustomizationFields();
setupCartEvents();
updateCartBadges();
renderCart();
loadProducts();

/* =========================================================
   FINALIZAR COMPRA
========================================================= */

const CHECKOUT_PRODUCT_JSON = "data/produtos.json";
const CHECKOUT_CART_KEY = "vaaaiBrasilCart";

function checkoutGetEl(id) {
  return document.getElementById(id);
}

function checkoutGetCart() {
  try {
    return JSON.parse(localStorage.getItem(CHECKOUT_CART_KEY)) || [];
  } catch {
    return [];
  }
}

function checkoutSaveCart(cart) {
  localStorage.setItem(CHECKOUT_CART_KEY, JSON.stringify(cart));
  checkoutRenderCart();
}

function checkoutFormatMoney(cents) {
  return (Number(cents) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function checkoutGetSubtotal(cart) {
  return cart.reduce((total, item) => {
    return total + item.unitPriceCents * item.qty;
  }, 0);
}

function checkoutRenderCart() {
  const list = checkoutGetEl("checkoutCartList");
  const empty = checkoutGetEl("checkoutEmpty");
  const subtotalEl = checkoutGetEl("checkoutSubtotal");
  const totalEl = checkoutGetEl("checkoutTotal");
  const installmentsEl = checkoutGetEl("checkoutInstallments");

  if (!list || !empty || !subtotalEl || !totalEl) return;

  const cart = checkoutGetCart();
  const subtotal = checkoutGetSubtotal(cart);

  subtotalEl.textContent = checkoutFormatMoney(subtotal);
  totalEl.textContent = checkoutFormatMoney(subtotal);

  if (installmentsEl) {
    const boleto = Math.round(subtotal * 0.9);
    const oneCard = subtotal;
    const twelve = Math.round(subtotal / 12);

    installmentsEl.innerHTML = `
      ${checkoutFormatMoney(boleto)} no boleto com desconto<br>
      ou 5x sem juros de ${checkoutFormatMoney(Math.round(subtotal / 5))} no cartão de crédito<br>
      ou 12x de ${checkoutFormatMoney(twelve)} no cartão de crédito
    `;
  }

  if (!cart.length) {
    list.innerHTML = "";
    empty.classList.add("active");
    return;
  }

  empty.classList.remove("active");

  list.innerHTML = cart.map((item) => {
    return `
      <article class="checkout-cart-item">
        <div class="checkout-cart-image">
          <img src="${item.image}" alt="${item.shortName}">
        </div>

        <div class="checkout-cart-info">
          <h3>${item.name || item.shortName}</h3>
          <p>Tamanho ${item.size}</p>
          ${item.customName ? `<p>Nome: ${item.customName}</p>` : ""}
          ${item.customNumber ? `<p>Número: ${item.customNumber}</p>` : ""}
        </div>

        <div class="checkout-cart-qty">
          <button type="button" data-checkout-action="decrease" data-checkout-id="${item.id}">−</button>
          <span>${item.qty}</span>
          <button type="button" data-checkout-action="increase" data-checkout-id="${item.id}">+</button>
        </div>

        <strong class="checkout-cart-price">
          ${checkoutFormatMoney(item.unitPriceCents * item.qty)}
        </strong>

        <button class="checkout-cart-remove" type="button" data-checkout-action="remove" data-checkout-id="${item.id}">
          🗑
        </button>
      </article>
    `;
  }).join("");
}

function checkoutChangeQty(itemId, action) {
  const cart = checkoutGetCart();
  const item = cart.find((cartItem) => cartItem.id === itemId);

  if (!item) return;

  if (action === "increase") item.qty += 1;
  if (action === "decrease") item.qty -= 1;

  checkoutSaveCart(cart.filter((cartItem) => cartItem.qty > 0));
}

function checkoutRemoveItem(itemId) {
  const cart = checkoutGetCart().filter((item) => item.id !== itemId);
  checkoutSaveCart(cart);
}

function checkoutCreateWhatsAppLink() {
  const cart = checkoutGetCart();

  const lines = cart.map((item, index) => {
    return [
      `${index + 1}. ${item.shortName}`,
      `Tamanho: ${item.size}`,
      item.customName ? `Nome: ${item.customName}` : "",
      item.customNumber ? `Número: ${item.customNumber}` : "",
      `Qtd: ${item.qty}`,
      `Total: ${checkoutFormatMoney(item.unitPriceCents * item.qty)}`
    ].filter(Boolean).join("\n");
  });

  const subtotal = checkoutGetSubtotal(cart);
  const cep = checkoutGetEl("checkoutCep")?.value || "";

  const message = [
    "Olá! Quero finalizar minha compra:",
    "",
    ...lines,
    "",
    cep ? `CEP: ${cep}` : "",
    `Total: ${checkoutFormatMoney(subtotal)}`
  ].filter(Boolean).join("\n");

  return `https://wa.me/5500000000000?text=${encodeURIComponent(message)}`;
}

async function checkoutRenderRecommendations() {
  const wrapper = checkoutGetEl("checkoutProducts");
  const dots = checkoutGetEl("checkoutDots");

  if (!wrapper) return;

  try {
    const response = await fetch(CHECKOUT_PRODUCT_JSON);
    const products = await response.json();

    const list = Object.values(products).slice(0, 4);

    wrapper.innerHTML = list.map((product) => {
      return `
        <article class="checkout-product-card">
          <a class="checkout-product-image" href="produto.html?produto=${product.id}">
            <img src="${product.mainImage}" alt="${product.shortName}">
          </a>

          <div class="checkout-product-info">
            <h3>${product.name}</h3>

            <span class="checkout-product-old">${product.oldPrice}</span>
            <strong>${product.price}</strong>

            <a class="checkout-product-button" href="produto.html?produto=${product.id}">
              Ver produto
            </a>
          </div>
        </article>
      `;
    }).join("");

    if (dots) {
      dots.innerHTML = list.map((_, index) => {
        return `<span class="${index === 0 ? "active" : ""}"></span>`;
      }).join("");
    }
  } catch (error) {
    console.warn("Não foi possível carregar recomendações:", error);
  }
}

function checkoutSetupEvents() {
  const list = checkoutGetEl("checkoutCartList");

  list?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-checkout-action]");
    if (!button) return;

    const action = button.dataset.checkoutAction;
    const itemId = button.dataset.checkoutId;

    if (action === "increase" || action === "decrease") {
      checkoutChangeQty(itemId, action);
    }

    if (action === "remove") {
      checkoutRemoveItem(itemId);
    }
  });

  checkoutGetEl("checkoutCepButton")?.addEventListener("click", () => {
    const cep = checkoutGetEl("checkoutCep")?.value || "";
    const result = checkoutGetEl("checkoutShippingResult");

    if (!result) return;

    if (cep.trim().length < 8) {
      result.textContent = "Digite um CEP válido para consultar o frete.";
      return;
    }

    result.textContent = "Frete grátis disponível para sua região.";
  });

checkoutGetEl("checkoutContinueTop")?.addEventListener("click", () => {
  window.location.href = "finalizar-pedido.html";
});

checkoutGetEl("checkoutContinueBottom")?.addEventListener("click", () => {
  window.location.href = "finalizar-pedido.html";
});

  checkoutGetEl("checkoutScrollTop")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function checkoutInit() {
  if (!document.body.classList.contains("checkout-page")) return;

  checkoutRenderCart();
  checkoutRenderRecommendations();
  checkoutSetupEvents();
}

checkoutInit();


/* =========================================================
   FINALIZAR PEDIDO - ETAPAS
========================================================= */

const FP_CART_KEY = "vaaaiBrasilCart";
const FP_WHATSAPP = "5500000000000";

function fpEl(id) {
  return document.getElementById(id);
}

function fpCart() {
  try {
    return JSON.parse(localStorage.getItem(FP_CART_KEY)) || [];
  } catch {
    return [];
  }
}

function fpMoney(cents) {
  return (Number(cents) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function fpSubtotal() {
  return fpCart().reduce((total, item) => {
    return total + item.unitPriceCents * item.qty;
  }, 0);
}

let fpState = {
  personal: false,
  address: false,
  shipping: false,
  payment: null,
  discountPercent: 0
};

function fpOpenStep(stepNumber) {
  document.querySelectorAll(".fp-step").forEach((step) => {
    step.classList.remove("fp-step-active");
  });

  fpEl(`fpStep${stepNumber}`)?.classList.remove("fp-step-locked");
  fpEl(`fpStep${stepNumber}`)?.classList.add("fp-step-active");
}

function fpRenderCart() {
  const cart = fpCart();
  const list = fpEl("fpProductList");
  const count = fpEl("fpProductCount");

  if (!list || !count) return;

  count.textContent = `(${cart.length})`;

  list.innerHTML = cart.map((item) => {
    return `
      <article class="fp-product-item">
        <img src="${item.image}" alt="${item.shortName}">

        <div>
          <h3>${item.shortName}</h3>
          ${item.customName ? `<p>Nome: ${item.customName}</p>` : ""}
          ${item.customNumber ? `<p>Número: ${item.customNumber}</p>` : ""}
          <p>Tamanho ${item.size}</p>
        </div>

        <strong>${fpMoney(item.unitPriceCents * item.qty)}</strong>
      </article>
    `;
  }).join("");

  fpUpdateSummary();
}

function fpUpdateSummary() {
  const subtotal = fpSubtotal();
  const discount = Math.round(subtotal * (fpState.discountPercent / 100));
  const total = subtotal - discount;

  if (fpEl("fpSubtotal")) fpEl("fpSubtotal").textContent = fpMoney(subtotal);
  if (fpEl("fpDiscount")) fpEl("fpDiscount").textContent = `-${fpMoney(discount)}`;
  if (fpEl("fpTotal")) fpEl("fpTotal").textContent = fpMoney(total);

  const discountLine = fpEl("fpDiscountLine");
  if (discountLine) {
    discountLine.style.display = discount > 0 ? "flex" : "none";
  }

  const finishButton = fpEl("fpFinishOrder");
  if (finishButton) {
    finishButton.disabled = !(fpState.personal && fpState.address && fpState.shipping && fpState.payment);
  }
}

function fpValidatePersonal() {
  const email = fpEl("fpEmail")?.value.trim();
  const name = fpEl("fpName")?.value.trim();
  const cpf = fpEl("fpCpf")?.value.trim();
  const phone = fpEl("fpPhone")?.value.trim();

  return Boolean(email && name && cpf && phone);
}

function fpSavePersonal() {
  if (!fpValidatePersonal()) {
    alert("Preencha suas informações pessoais para continuar.");
    return;
  }

  fpState.personal = true;

  fpEl("fpPersonalSummary").innerHTML = `
    <span>${fpEl("fpName").value}</span>
    <span>${fpEl("fpCpf").value}</span>
    <span>${fpEl("fpEmail").value}</span>
  `;

  fpEl("fpStep1")?.classList.remove("fp-step-active");
  fpEl("fpStep2")?.classList.remove("fp-step-locked");
  fpOpenStep(2);
  fpUpdateSummary();
}

function fpValidateAddress() {
  const numberField = fpEl("fpNumber")?.closest(".fp-field-errorable");
  const required = [
    "fpCep",
    "fpStreet",
    "fpNumber",
    "fpDistrict",
    "fpCity",
    "fpState"
  ];

  const valid = required.every((id) => fpEl(id)?.value.trim());

  if (numberField) {
    numberField.classList.toggle("fp-error", !fpEl("fpNumber")?.value.trim());
  }

  return valid;
}

function fpSaveAddress() {
  if (!fpValidateAddress()) {
    return;
  }

  fpState.address = true;

  fpEl("fpAddressSummary").innerHTML = `
    <span>${fpEl("fpCep").value}</span>
    <span>${fpEl("fpStreet").value}</span>
    <span>${fpEl("fpNumber").value}</span>
  `;

  fpEl("fpShippingSummary").textContent = "Transportadora";
  fpEl("fpStep3")?.classList.remove("fp-step-locked");
  fpOpenStep(3);
  fpUpdateSummary();
}

function fpSaveShipping() {
  fpState.shipping = true;
  fpEl("fpShippingSummary").textContent = "Transportadora";
  fpEl("fpPaymentSummary").textContent = "";
  fpEl("fpStep4")?.classList.remove("fp-step-locked");
  fpOpenStep(4);
  fpUpdateSummary();
}

function fpSelectPayment(input) {
  fpState.payment = input.value;
  fpState.discountPercent = Number(input.dataset.discount || 0);

  const label = input.closest(".fp-payment-option");
  const title = label?.querySelector("strong")?.textContent || "";

  fpEl("fpPaymentSummary").textContent = title;

  document.querySelectorAll(".fp-payment-option").forEach((item) => {
    item.classList.remove("selected");
  });

  label?.classList.add("selected");

  fpUpdateSummary();
}

function fpFinishOrder() {
  if (!(fpState.personal && fpState.address && fpState.shipping && fpState.payment)) {
    return;
  }

  const cart = fpCart();
  const subtotal = fpSubtotal();
  const discount = Math.round(subtotal * (fpState.discountPercent / 100));
  const total = subtotal - discount;

  const products = cart.map((item, index) => {
    return [
      `${index + 1}. ${item.shortName}`,
      `Tamanho: ${item.size}`,
      item.customName ? `Nome: ${item.customName}` : "",
      item.customNumber ? `Número: ${item.customNumber}` : "",
      `Qtd: ${item.qty}`,
      `Total: ${fpMoney(item.unitPriceCents * item.qty)}`
    ].filter(Boolean).join("\n");
  }).join("\n\n");

  const message = `
Olá! Quero finalizar meu pedido:

${products}

Dados:
Nome: ${fpEl("fpName").value}
E-mail: ${fpEl("fpEmail").value}
CPF: ${fpEl("fpCpf").value}
Telefone: ${fpEl("fpPhone").value}

Endereço:
CEP: ${fpEl("fpCep").value}
Rua: ${fpEl("fpStreet").value}
Número: ${fpEl("fpNumber").value}
Complemento: ${fpEl("fpComplement").value || "-"}
Bairro: ${fpEl("fpDistrict").value}
Cidade: ${fpEl("fpCity").value}
Estado: ${fpEl("fpState").value}

Envio: Transportadora grátis
Pagamento: ${fpState.payment}
Subtotal: ${fpMoney(subtotal)}
Desconto: ${fpMoney(discount)}
Total: ${fpMoney(total)}
`.trim();

  window.open(`https://wa.me/${FP_WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank");
}

function fpSetupMasks() {
  const cpf = fpEl("fpCpf");
  const phone = fpEl("fpPhone");
  const cep = fpEl("fpCep");
  const state = fpEl("fpState");

  cpf?.addEventListener("input", () => {
    cpf.value = cpf.value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  });

  phone?.addEventListener("input", () => {
    phone.value = phone.value
      .replace(/\D/g, "")
      .slice(0, 11)
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2");
  });

  cep?.addEventListener("input", () => {
    cep.value = cep.value
      .replace(/\D/g, "")
      .slice(0, 8)
      .replace(/(\d{5})(\d)/, "$1-$2");
  });

  state?.addEventListener("input", () => {
    state.value = state.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  });
}

function fpInit() {
  if (!document.body.classList.contains("finalizar-pedido-page")) return;

  fpRenderCart();
  fpSetupMasks();
  fpSetupCepFinder();

  fpEl("fpSavePersonal")?.addEventListener("click", fpSavePersonal);
  fpEl("fpSaveAddress")?.addEventListener("click", fpSaveAddress);
  fpEl("fpSaveShipping")?.addEventListener("click", fpSaveShipping);
  fpEl("fpFinishOrder")?.addEventListener("click", fpFinishOrder);

  document.querySelectorAll('input[name="payment"]').forEach((input) => {
    input.addEventListener("change", () => fpSelectPayment(input));
  });
}

fpInit();

/* =========================================================
   BUSCADOR AUTOMÁTICO DE CEP - FINALIZAR PEDIDO
========================================================= */

function onlyNumbers(value) {
  return String(value || "").replace(/\D/g, "");
}

function setFieldValue(id, value) {
  const field = fpEl(id);
  if (field) field.value = value || "";
}

function setCepLoading(isLoading) {
  const cepInput = fpEl("fpCep");
  const saveButton = fpEl("fpSaveAddress");

  if (cepInput) {
    cepInput.classList.toggle("fp-loading", isLoading);
  }

  if (saveButton && isLoading) {
    saveButton.textContent = "Buscando endereço...";
  }

  if (saveButton && !isLoading) {
    saveButton.textContent = "Verifique os itens pendentes acima.";
  }
}

async function fpBuscarCep() {
  const cepInput = fpEl("fpCep");
  if (!cepInput) return;

  const cep = onlyNumbers(cepInput.value);

  if (cep.length !== 8) {
    return;
  }

  setCepLoading(true);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await response.json();

    if (data.erro) {
      alert("CEP não encontrado. Verifique e tente novamente.");
      setCepLoading(false);
      return;
    }

    setFieldValue("fpCep", data.cep || cepInput.value);
    setFieldValue("fpStreet", data.logradouro || "");
    setFieldValue("fpDistrict", data.bairro || "");
    setFieldValue("fpCity", data.localidade || "");
    setFieldValue("fpState", data.uf || "");

    const numberInput = fpEl("fpNumber");
    if (numberInput) {
      numberInput.focus();
    }

    fpValidateAddress();
  } catch (error) {
    console.error("Erro ao buscar CEP:", error);
    alert("Não foi possível buscar o CEP agora. Preencha o endereço manualmente.");
  } finally {
    setCepLoading(false);
  }
}

function fpSetupCepFinder() {
  const cepInput = fpEl("fpCep");

  if (!cepInput) return;

  cepInput.addEventListener("input", () => {
    const numbers = onlyNumbers(cepInput.value).slice(0, 8);

    cepInput.value = numbers.replace(/(\d{5})(\d)/, "$1-$2");

    if (numbers.length === 8) {
      fpBuscarCep();
    }
  });

  cepInput.addEventListener("blur", () => {
    fpBuscarCep();
  });
}

fpSetupCepFinder();

/* Move o botão Finalizar Pedido para baixo das etapas no mobile */
function fpMoveFinishButtonMobile() {
  if (!document.body.classList.contains("finalizar-pedido-page")) return;

  const finishButton = document.getElementById("fpFinishOrder");
  const steps = document.querySelector(".fp-steps");
  const sidebar = document.querySelector(".fp-sidebar");

  if (!finishButton || !steps || !sidebar) return;

  if (window.innerWidth <= 900) {
    steps.insertAdjacentElement("afterend", finishButton);
    finishButton.classList.add("fp-finish-button-mobile");
  } else {
    sidebar.appendChild(finishButton);
    finishButton.classList.remove("fp-finish-button-mobile");
  }
}

window.addEventListener("load", fpMoveFinishButtonMobile);
window.addEventListener("resize", fpMoveFinishButtonMobile);