/** ACTIVE MENU */
document.addEventListener('click', function (evt) {
    const clickedNavLink = evt.target.closest('.navbar-nav .nav-link');
    if (clickedNavLink) {
        const currentActiveItem = document.querySelector('.navbar-nav .nav-item.active');
        if (currentActiveItem) currentActiveItem.classList.remove('active');

        const newActiveItem = clickedNavLink.closest('.nav-item');
        if (newActiveItem) newActiveItem.classList.add('active');
    }
});

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
        } else {
            console.warn(`ClearFlow Error: Component "${componentId}" or "#ModalContent" not found.`);
        }
    }
});