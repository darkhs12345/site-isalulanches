/* ============================================================
   ISALU LANCHES — main.js
   Descrição: Troca de abas + Carrinho de pedidos + Envio pro WhatsApp
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ============================================================
     CONFIGURAÇÃO — troque aqui se mudar o número
  ============================================================ */
  const WHATSAPP_NUMERO = '5582991875632';

  /* ============================================================
     1. TROCA DE ABAS DO CARDÁPIO
  ============================================================ */
  const tabs = document.querySelectorAll('.tab');
  const categories = document.querySelectorAll('.menu-category');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      categories.forEach(c => c.classList.remove('visible'));

      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('visible');
    });
  });

  /* ============================================================
     2. CARRINHO DE PEDIDOS
     Estrutura: { "nome-do-item": { name, price, qty } }
  ============================================================ */
  let cart = {};

  // Pega todos os cartões do cardápio que tem preço (ignora "Sabores Tradicionais")
  const menuCards = document.querySelectorAll('.menu-card[data-price]');

  menuCards.forEach(card => {
    const name  = card.dataset.name;
    const price = parseFloat(card.dataset.price);

    // Cria o controle de quantidade (botões - e +) dentro do cartão
    const qtyControl = document.createElement('div');
    qtyControl.className = 'qty-control';
    qtyControl.innerHTML = `
      <button type="button" class="qty-btn qty-minus" aria-label="Remover ${name}">−</button>
      <span class="qty-value">0</span>
      <button type="button" class="qty-btn qty-plus" aria-label="Adicionar ${name}">+</button>
    `;
    card.appendChild(qtyControl);

    const qtyValueEl = qtyControl.querySelector('.qty-value');
    const minusBtn   = qtyControl.querySelector('.qty-minus');
    const plusBtn    = qtyControl.querySelector('.qty-plus');

    plusBtn.addEventListener('click', () => {
      const currentQty = (cart[name]?.qty || 0) + 1;
      cart[name] = { name, price, qty: currentQty };
      qtyValueEl.textContent = currentQty;
      card.classList.add('in-cart');
      updateCartUI();
    });

    minusBtn.addEventListener('click', () => {
      if (!cart[name]) return;
      const currentQty = cart[name].qty - 1;

      if (currentQty <= 0) {
        delete cart[name];
        qtyValueEl.textContent = 0;
        card.classList.remove('in-cart');
      } else {
        cart[name].qty = currentQty;
        qtyValueEl.textContent = currentQty;
      }
      updateCartUI();
    });
  });

  /* ============================================================
     3. ATUALIZA A BARRA FLUTUANTE DO CARRINHO
  ============================================================ */
  const cartBar      = document.getElementById('cart-bar');
  const cartCountEl  = document.getElementById('cart-count');
  const cartTotalEl  = document.getElementById('cart-total');

  function getCartTotal() {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getCartCount() {
    return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
  }

  function updateCartUI() {
    const count = getCartCount();
    const total = getCartTotal();

    cartCountEl.textContent = count;
    cartTotalEl.textContent = formatPrice(total);
  }

  function formatPrice(value) {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ============================================================
     4. MODAL DE FINALIZAÇÃO DE PEDIDO
  ============================================================ */
  const modal          = document.getElementById('checkout-modal');
  const openModalBtn    = document.getElementById('cart-bar');
  const closeModalBtn   = document.getElementById('close-modal');
  const modalItemsList  = document.getElementById('modal-items-list');
  const modalTotalEl    = document.getElementById('modal-total');
  const checkoutForm    = document.getElementById('checkout-form');

  openModalBtn.addEventListener('click', () => {
    if (getCartCount() === 0) return;
    renderModalItems();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  closeModalBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

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
     5. ENVIO DO PEDIDO PARA O WHATSAPP
  ============================================================ */
  checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const nome     = document.getElementById('cliente-nome').value.trim();
    const endereco = document.getElementById('cliente-endereco').value.trim();
    const tipo     = document.querySelector('input[name="tipo-entrega"]:checked').value;
    const obs      = document.getElementById('cliente-obs').value.trim();

    if (!nome) {
      alert('Por favor, digite seu nome 🙂');
      return;
    }
    if (tipo === 'entrega' && !endereco) {
      alert('Por favor, digite o endereço de entrega 📍');
      return;
    }

    const mensagem = montarMensagemWhatsApp(nome, endereco, tipo, obs);
    const url = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;

    window.open(url, '_blank');

    // Limpa o carrinho depois de enviar
    cart = {};
    updateCartUI();
    document.querySelectorAll('.qty-value').forEach(el => el.textContent = '0');
    document.querySelectorAll('.menu-card.in-cart').forEach(el => el.classList.remove('in-cart'));
    checkoutForm.reset();
    closeModal();
  });

  function montarMensagemWhatsApp(nome, endereco, tipo, obs) {
    let msg = `Olá! Vi o perfil da Isalu Lanches e gostaria de fazer o seguinte pedido:\n\n`;
    msg += `*MEU PEDIDO*\n`;

    Object.values(cart).forEach(item => {
      msg += `• ${item.qty}x ${item.name} — R$ ${formatPrice(item.price * item.qty)}\n`;
    });

    msg += `\n*Total: R$ ${formatPrice(getCartTotal())}*\n\n`;
    msg += `*Cliente:* ${nome}\n`;
    msg += `*Forma:* ${tipo === 'entrega' ? 'Entrega' : 'Retirada no local'}\n`;

    if (tipo === 'entrega') {
      msg += `*Endereço:* ${endereco}\n`;
    }

    if (obs) {
      msg += `*Observações:* ${obs}\n`;
    }

    return msg;
  }

  /* ============================================================
     6. MOSTRA/ESCONDE CAMPO DE ENDEREÇO CONFORME O TIPO
  ============================================================ */
  const tipoRadios = document.querySelectorAll('input[name="tipo-entrega"]');
  const enderecoGroup = document.getElementById('endereco-group');

  tipoRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'entrega' && radio.checked) {
        enderecoGroup.style.display = 'block';
      } else if (radio.value === 'retirada' && radio.checked) {
        enderecoGroup.style.display = 'none';
      }
    });
  });

});