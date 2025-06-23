const container = document.querySelector('.container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const errorMessageElement = document.getElementById('error');
const successMessageElement = document.getElementById('mensaje');

// --- Funciones de Utilidad ---

// Función para mostrar mensajes
function showMessage(element, message, type) {
    if (element) { // Asegurarse de que el elemento existe
        element.textContent = message;
        element.style.display = 'block';
        // Opcional: Ocultar el mensaje después de un tiempo
        setTimeout(() => {
            element.textContent = '';
            element.style.display = 'none';
        }, 8000); // Mensaje visible por 8 segundos
    }
}

// Función para alternar la visibilidad de los paneles
function togglePanels(showLoginPanel) {
    if (container) {
        if (showLoginPanel) {
            container.classList.remove('active'); // Muestra el panel de Login
        } else {
            container.classList.add('active'); // Muestra el panel de Registro
        }
    }
}

// --- Event Listeners para alternar paneles ---

if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        togglePanels(false); // Mostrar registro
        // Limpiar mensajes al cambiar de panel manualmente
        if (errorMessageElement) errorMessageElement.style.display = 'none';
        if (successMessageElement) successMessageElement.style.display = 'none';
    });
}

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        togglePanels(true); // Mostrar login
        // Limpiar mensajes al cambiar de panel manualmente
        if (errorMessageElement) errorMessageElement.style.display = 'none';
        if (successMessageElement) successMessageElement.style.display = 'none';
    });
}

// --- Lógica al cargar la página (manejo de URL y mensajes) ---
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    const successParam = urlParams.get('success');
    const showLoginParam = urlParams.get('showLogin'); // Ahora esperamos 'true' o 'false'

    // Por defecto, mostrar el panel de login
    togglePanels(true); 

    // 1. Manejar mensajes de error
    if (errorParam) {
        switch (errorParam) {
            case 'empty_fields':
                showMessage(errorMessageElement, 'Por favor, rellena todos los campos.', 'error');
                break;
            case 'invalid_credentials':
                showMessage(errorMessageElement, 'Usuario o contraseña incorrectos.', 'error');
                break;
            case 'db_connection_failed':
                showMessage(errorMessageElement, 'Error al conectar con la base de datos.', 'error');
                break;
            case 'db_query_error':
                showMessage(errorMessageElement, 'Error al procesar la solicitud de la base de datos.', 'error');
                break;
            case 'registration_failed':
                showMessage(errorMessageElement, 'Error en el registro. El usuario podría ya existir o hubo un problema.', 'error');
                break;
            case 'failed_to_create_scoreboard':
                showMessage(errorMessageElement, 'Error al crear el marcador. Por favor, inténtalo de nuevo.', 'error');
                break;
            default:
                showMessage(errorMessageElement, 'Ha ocurrido un error inesperado.', 'error');
        }
        // Si hay un error, asegúrate de que el panel de login esté visible (showLogin=true)
        togglePanels(true); 
    }

    // 2. Manejar mensajes de éxito
    if (successParam) {
        switch (successParam) {
            case 'registration':
                showMessage(successMessageElement, '¡Registro exitoso! Ahora puedes iniciar sesión.', 'success');
                break;
            // Agrega más casos si tienes otros mensajes de éxito desde PHP
            default:
                showMessage(successMessageElement, 'Operación realizada con éxito.', 'success');
        }
        // Si hay un éxito (ej. registro), asegúrate de que el panel de login esté visible
        togglePanels(true); 
    }

    // 3. Controlar la vista de login/registro si el parámetro showLogin se usa directamente sin error/success
    // Esto es útil si PHP siempre redirige con showLogin.
    if (showLoginParam === 'true') {
        togglePanels(true); // Mostrar login
    } else if (showLoginParam === 'false') {
        togglePanels(false); // Mostrar registro
    }


    // 4. Limpiar URL de los parámetros de error/éxito/showLogin después de ser procesados
    if (errorParam || successParam || showLoginParam) {
        urlParams.delete('error');
        urlParams.delete('success');
        urlParams.delete('showLogin');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, document.title, newUrl);
    }
});


// --- Funcionalidad del ojo (mostrar/ocultar contraseña) ---
document.querySelectorAll('.eye-icon').forEach(icon => {
    icon.addEventListener('click', () => {
        const input = icon.previousElementSibling;
        if (input && input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('bx-show', 'bx-hide');
        } else if (input) {
            input.type = 'password';
            icon.classList.replace('bx-hide', 'bx-show');
        }
    });
});