/* ============================================================
   ISALU LANCHES — main.js
   Descrição: Cardápio por seções verticais + Monte seu Pastel + Carrinho
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const WHATSAPP_NUMERO = '5582991875632';

  /* ============================================================
     1. SCROLL SUAVE AO CLICAR NAS CATEGORIAS
  ============================================================ */
  const catBtns = document.querySelectorAll('.cat-btn');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ============================================================
     2. CARRINHO
  ============================================================ */
  let cart = {};

  function formatPrice(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function getCartTotal() {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getCartCount() {
    return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  }

  function addToCart(key, name, price) {
    if (cart[key]) {
      cart[key].qty++;
    } else {
      cart[key] = { name, price, qty: 1 };
    }
    updateCartUI();
  }

  function removeFromCart(key) {
    if (!cart[key]) return;
    cart[key].qty--;
    if (cart[key].qty <= 0) delete cart[key];
    updateCartUI();
  }

  /* ============================================================
     3. BOTÕES + / - NOS CARDS NORMAIS
  ============================================================ */
  const menuCards = document.querySelectorAll('.menu-card[data-price]');
  menuCards.forEach(card => {
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);
    const key   = name;

    const qtyControl = document.createElement('div');
    qtyControl.className = 'qty-control';
    qtyControl.innerHTML = `
      <button type="button" class="qty-btn qty-minus" aria-label="Remover">−</button>
      <span class="qty-value">0</span>
      <button type="button" class="qty-btn qty-plus" aria-label="Adicionar">+</button>
    `;
    card.appendChild(qtyControl);

    const qtyValueEl = qtyControl.querySelector('.qty-value');

    qtyControl.querySelector('.qty-plus').addEventListener('click', () => {
      addToCart(key, name, price);
      qtyValueEl.textContent = cart[key]?.qty || 0;
      card.classList.add('in-cart');
    });

    qtyControl.querySelector('.qty-minus').addEventListener('click', () => {
      removeFromCart(key);
      const qty = cart[key]?.qty || 0;
      qtyValueEl.textContent = qty;
      if (qty === 0) card.classList.remove('in-cart');
    });
  });

  /* ============================================================
     4. MONTE SEU PASTEL — sabores livres, preço calculado
  ============================================================ */
  const pastelSection    = document.getElementById('monte-pastel');
  let selectedSabores    = [];
  let selectedAdicionais = [];

  // calcula preço baseado na quantidade de sabores
  function calcPastelPrice(numSabores) {
    if (numSabores <= 0) return 0;
    if (numSabores <= 2) return 12;
    if (numSabores === 3) return 14;
    return 14 + (numSabores - 3) * 2; // R$2 por cada sabor extra acima de 3
  }

  function updatePastelUI() {
    const saborBtns = pastelSection.querySelectorAll('.sabor-btn');
    saborBtns.forEach(btn => {
      btn.classList.toggle('active', selectedSabores.includes(btn.dataset.sabor));
      btn.classList.remove('disabled'); // sem limite — todos sempre clicáveis
    });

    const resumoEl = document.getElementById('pastel-resumo');
    const precoEl  = document.getElementById('pastel-preco');
    const addBtn   = document.getElementById('pastel-add-btn');

    const numSabores = selectedSabores.length;
    const basePrice  = calcPastelPrice(numSabores);

    // adiciona preço dos adicionais
    let totalPrice = basePrice;
    selectedAdicionais.forEach(a => {
      const btn = pastelSection.querySelector(`.adicional-btn[data-adicional="${a}"]`);
      if (btn) totalPrice += parseFloat(btn.dataset.price);
    });

    if (numSabores === 0) {
      resumoEl.textContent = 'Escolha os sabores acima';
      precoEl.textContent  = 'R$ —';
      addBtn.disabled = true;
    } else {
      resumoEl.textContent = selectedSabores.join(' + ');
      precoEl.textContent  = `R$ ${formatPrice(totalPrice)}`;
      addBtn.disabled = false;
    }

    // atualiza visuais dos adicionais
    pastelSection.querySelectorAll('.adicional-btn').forEach(btn => {
      btn.classList.toggle('active', selectedAdicionais.includes(btn.dataset.adicional));
    });
  }

  // clique nos sabores — sem limite
  pastelSection.querySelectorAll('.sabor-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sabor = btn.dataset.sabor;
      if (selectedSabores.includes(sabor)) {
        selectedSabores = selectedSabores.filter(s => s !== sabor);
      } else {
        selectedSabores.push(sabor);
      }
      updatePastelUI();
    });
  });

  // clique nos adicionais
  pastelSection.querySelectorAll('.adicional-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const adicional = btn.dataset.adicional;
      if (selectedAdicionais.includes(adicional)) {
        selectedAdicionais = selectedAdicionais.filter(a => a !== adicional);
      } else {
        selectedAdicionais.push(adicional);
      }
      updatePastelUI();
    });
  });

  // adicionar ao carrinho
  document.getElementById('pastel-add-btn').addEventListener('click', () => {
    if (selectedSabores.length === 0) return;

    const numSabores = selectedSabores.length;
    let totalPrice   = calcPastelPrice(numSabores);
    let name         = `Pastel (${selectedSabores.join(' + ')})`;

    if (selectedAdicionais.length > 0) {
      name += ` + ${selectedAdicionais.join(', ')}`;
      selectedAdicionais.forEach(a => {
        const btn = pastelSection.querySelector(`.adicional-btn[data-adicional="${a}"]`);
        if (btn) totalPrice += parseFloat(btn.dataset.price);
      });
    }

    const key = name + '_' + Date.now();
    cart[key] = { name, price: totalPrice, qty: 1 };
    updateCartUI();

    // feedback visual
    const addBtn = document.getElementById('pastel-add-btn');
    addBtn.textContent = '✓ Adicionado!';
    addBtn.style.background = '#25D366';
    setTimeout(() => {
      addBtn.innerHTML = '🛒 Adicionar ao Pedido';
      addBtn.style.background = '';
    }, 1500);

    // reseta seleção
    selectedSabores    = [];
    selectedAdicionais = [];
    updatePastelUI();
  });

  updatePastelUI();

  /* ============================================================
     5. ATUALIZA BARRA DO CARRINHO
  ============================================================ */
  const cartBar     = document.getElementById('cart-bar');
  const cartCountEl = document.getElementById('cart-count');
  const cartTotalEl = document.getElementById('cart-total');

  function updateCartUI() {
    const count = getCartCount();
    const total = getCartTotal();
    cartCountEl.textContent = count;
    cartTotalEl.textContent = formatPrice(total);
    cartBar.classList.toggle('visible', count > 0);
  }

  /* ============================================================
     6. MODAL DE FINALIZAÇÃO
  ============================================================ */
  const modal         = document.getElementById('checkout-modal');
  const closeModalBtn = document.getElementById('close-modal');
  const modalItemsList= document.getElementById('modal-items-list');
  const modalTotalEl  = document.getElementById('modal-total');
  const checkoutForm  = document.getElementById('checkout-form');

  cartBar.addEventListener('click', () => {
    if (getCartCount() === 0) return;
    renderModalItems();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function renderModalItems() {
    modalItemsList.innerHTML = '';
    Object.values(cart).forEach(item => {
      const row = document.createElement('div');
      row.className = 'modal-item-row';
      row.innerHTML = `
        <span class="modal-item-qty">${item.qty}x</span>
        <span class="modal-item-name">${item.name}</span>
        <span class="modal-item-price">R$ ${formatPrice(item.price * item.qty)}</span>
      `;
      modalItemsList.appendChild(row);
    });
    modalTotalEl.textContent = formatPrice(getCartTotal());
  }

  /* ============================================================
     7. ENVIO PARA WHATSAPP
  ============================================================ */
  checkoutForm.addEventListener('submit', e => {
    e.preventDefault();
    const nome     = document.getElementById('cliente-nome').value.trim();
    const endereco = document.getElementById('cliente-endereco').value.trim();
    const tipo     = document.querySelector('input[name="tipo-entrega"]:checked').value;
    const obs      = document.getElementById('cliente-obs').value.trim();

    if (!nome) { alert('Por favor, digite seu nome 🙂'); return; }
    if (tipo === 'entrega' && !endereco) { alert('Por favor, digite o endereço 📍'); return; }

    let msg = `Olá! Gostaria de fazer um pedido da Isalu Lanches:\n\n*MEU PEDIDO*\n`;
    Object.values(cart).forEach(item => {
      msg += `• ${item.qty}x ${item.name} — R$ ${formatPrice(item.price * item.qty)}\n`;
    });
    msg += `\n*Total: R$ ${formatPrice(getCartTotal())}*\n\n`;
    msg += `*Cliente:* ${nome}\n`;
    msg += `*Forma:* ${tipo === 'entrega' ? 'Entrega' : 'Retirada no local'}\n`;
    if (tipo === 'entrega') msg += `*Endereço:* ${endereco}\n`;
    if (obs) msg += `*Observações:* ${obs}\n`;

    window.open(`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`, '_blank');

    // limpa tudo
    cart = {};
    updateCartUI();
    document.querySelectorAll('.qty-value').forEach(el => el.textContent = '0');
    document.querySelectorAll('.menu-card.in-cart').forEach(el => el.classList.remove('in-cart'));
    checkoutForm.reset();
    closeModal();
  });

  /* ============================================================
     9. CAMPO ENDEREÇO CONDICIONAL
  ============================================================ */
  document.querySelectorAll('input[name="tipo-entrega"]').forEach(radio => {
    radio.addEventListener('change', () => {
      document.getElementById('endereco-group').style.display =
        radio.value === 'entrega' && radio.checked ? 'block' : 'none';
    });
  });

  /* ============================================================
     MELHORIA 1 — STATUS AO VIVO (ABERTO / FECHADO)
     Horário: Ter–Domingo, 18h às 23h
  ============================================================ */
  function updateStatus() {
    const bar = document.getElementById('status-bar');
    if (!bar) return;
    const agora    = new Date();
    const dia      = agora.getDay();   // 0=Dom, 6=Sáb
    const hora     = agora.getHours();
    const minuto   = agora.getMinutes();
    const aberto   = dia >= 2 && dia <= 7 &&
                     (hora > 18 || (hora === 18 && minuto >= 0)) && hora < 23;
    bar.className  = `status-bar ${aberto ? 'open' : 'closed'}`;
    bar.innerHTML  = `
      <span class="status-dot"></span>
      ${aberto
        ? '🟢 Aberto agora · Fecha às 23h'
        : '🔴 Fechado agora · Abre às 18h (Ter–Domingo)'}
    `;
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ============================================================
     MELHORIA 2 — TOAST NOTIFICATION
  ============================================================ */
  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  /* ============================================================
     MELHORIA 3 — COMPARTILHAR CARDÁPIO
  ============================================================ */
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      const dados = {
        title: 'Isalu Lanches 🔥',
        text: 'Pastéis, coxinhas e salgados irresistíveis! Veja o cardápio:',
        url: window.location.href
      };
      if (navigator.share) {
        navigator.share(dados);
      } else {
        navigator.clipboard.writeText(window.location.href)
          .then(() => showToast('🔗 Link copiado! Cole onde quiser.'))
          .catch(() => showToast('🔗 Copie o link da barra do navegador!'));
      }
    });
  }

  /* ============================================================
     MELHORIA 4 — BUSCA NO CARDÁPIO
  ============================================================ */
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const searchEmpty = document.getElementById('search-empty');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      searchClear.style.display = query ? 'block' : 'none';

      const cards = document.querySelectorAll('.menu-card[data-name]');
      let found = 0;
      cards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const desc = card.querySelector('.menu-card-desc')?.textContent.toLowerCase() || '';
        const match = !query || name.includes(query) || desc.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) found++;
      });
      searchEmpty.style.display = found === 0 && query ? 'block' : 'none';
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.style.display = 'none';
      document.querySelectorAll('.menu-card[data-name]').forEach(c => c.style.display = '');
      searchEmpty.style.display = 'none';
    });
  }

  /* ============================================================
     MELHORIA 5 — TOAST AO ADICIONAR ITEM (integrado ao carrinho)
     Já chamado dentro do addToCart abaixo — redefine a função
  ============================================================ */
  const _addToCartOriginal = addToCart;
  function addToCartWithToast(key, name, price) {
    _addToCartOriginal(key, name, price);
    showToast(`✅ ${name} adicionado!`);
  }

  /* aplica nos botões de + */
  document.querySelectorAll('.menu-card[data-price]').forEach(card => {
    const plusBtn = card.querySelector('.qty-plus');
    if (plusBtn) {
      const originalClick = plusBtn.onclick;
      plusBtn.addEventListener('click', () => {
        showToast(`✅ ${card.dataset.name} adicionado!`);
      });
    }
  });

  /* ============================================================
     MELHORIA 6 — SCROLL REVEAL
     Cards animam ao entrar na tela
  ============================================================ */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.menu-card, .highlight-card, .cat-btn, .promo-banner').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

});