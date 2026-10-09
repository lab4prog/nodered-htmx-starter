/** ACTIVE MENU */
// The link whose href matches the current URL gets the "active" class
function updateActiveMenu() {
    document.querySelectorAll('nav a[href]').forEach(link => {
        const isActive = link.getAttribute('href') === location.pathname;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
}

updateActiveMenu();
document.addEventListener('htmx:pushedIntoHistory', updateActiveMenu);
document.addEventListener('htmx:historyRestore', updateActiveMenu);

/** NOTIFICATION */
document.body.addEventListener("showToast", (event) => {
    const { message, type } = event.detail;

    const decodedMessage = decodeURIComponent(message);

    showToastNotification(decodedMessage, type);
});

function showToastNotification(message, type) {
    const container = document.getElementById("toastPlacement");
    if (!container) return;

    const allowedTypes = {
        'success': 'toast-template-success',
        'error': 'toast-template-error',
        'info': 'toast-template-info'
    };

    const templateId = allowedTypes[type] || 'toast-template-info';
    const template = document.getElementById(templateId);
    if (!template) return;
    const toastClone = template.content.cloneNode(true);
    const toastElement = toastClone.querySelector('.toast');
    const textNode = toastElement.querySelector('.toast-text');
    if (textNode) {
        textNode.textContent = message;
    }
    container.appendChild(toastElement);

    toastElement.classList.add('show');
    setTimeout(() => {
        toastElement.remove();
    }, 3000);
}

// Close button inside a toast
document.addEventListener('click', function (e) {
    const closeBtn = e.target.closest('.toast .btn-close');
    if (closeBtn) closeBtn.closest('.toast').remove();
});

/* MODAL */
const modal = document.getElementById('Modal');

function openModal() {
    modal.classList.add('show');
    const focusTarget = modal.querySelector('[autofocus]');
    if (focusTarget) focusTarget.focus();
}

function closeModal() {
    modal.classList.remove('show');
}

// Content loaded by HTMX into #ModalContent opens the modal
document.addEventListener('htmx:afterSwap', function (e) {
    if (e.detail.target.id === 'ModalContent') openModal();
});

// A successful request sent from inside the modal (e.g. form submit) closes it
document.addEventListener('htmx:afterRequest', function (e) {
    if (e.detail.successful && modal.contains(e.detail.elt)) closeModal();
});

// Close: [data-modal-close] button, click on the backdrop, Escape
document.addEventListener('click', function (e) {
    if (e.target.closest('[data-modal-close]') || e.target === modal) closeModal();
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

/* MODAL COMPONENTS */
document.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-modal-component]');

    if (btn) {
        const componentId = btn.getAttribute('data-modal-component');
        const template = document.getElementById(componentId);
        const modalContent = document.getElementById('ModalContent');

        if (template && modalContent) {
            modalContent.innerHTML = template.innerHTML;
            htmx.process(modalContent);
            openModal();
        } else {
            console.warn(`ClearFlow Error: Component "${componentId}" or "#ModalContent" not found.`);
        }
    }
});