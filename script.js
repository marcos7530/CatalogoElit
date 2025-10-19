// Configuración de la API
const API_CONFIG = {
    baseUrl: 'https://clientes.elit.com.ar/v1/api',
    endpoints: {
        productos: '/productos',
        meta: '/productos/meta',
        csv: '/productos/csv'
    }
};

// Estado global de la aplicación
let appState = {
    isAuthenticated: false,
    userId: '30440', // Credenciales por defecto
    token: 'geuai36y0u4', // Credenciales por defecto
    products: [],
    filteredProducts: [],
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    filters: {
        search: '',
        brand: '',
        category: '',
        stock: '',
        limit: 100
    },
    brands: new Set(),
    categories: new Set()
};

// Elementos del DOM
const elements = {
    authSection: document.getElementById('authSection'),
    productsSection: document.getElementById('productsSection'),
    authForm: document.getElementById('authForm'),
    userIdInput: document.getElementById('userId'),
    tokenInput: document.getElementById('token'),
    searchInput: document.getElementById('searchInput'),
    brandFilter: document.getElementById('brandFilter'),
    categoryFilter: document.getElementById('categoryFilter'),
    stockFilter: document.getElementById('stockFilter'),
    limitInput: document.getElementById('limitInput'),
    applyFiltersBtn: document.getElementById('applyFilters'),
    productsGrid: document.getElementById('productsGrid'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    resultsCount: document.getElementById('resultsCount'),
    pageInfo: document.getElementById('pageInfo'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    productModal: document.getElementById('productModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    modalClose: document.getElementById('modalClose'),
    configBtn: document.getElementById('configBtn'),
    reloadBtn: document.getElementById('reloadBtn'),
    loadingText: document.getElementById('loadingText'),
    loadingProgress: document.getElementById('loadingProgress'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    loadAllBtn: document.getElementById('loadAllBtn'),
    clearFiltersBtn: document.getElementById('clearFilters')
};

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkStoredCredentials();
});

function initializeApp() {
    console.log('Inicializando aplicación Catálogo ELIT...');
}

function setupEventListeners() {
    // Formulario de autenticación
    elements.authForm.addEventListener('submit', handleAuthentication);
    
    // Filtros y búsqueda
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.brandFilter.addEventListener('change', handleFilterChange);
    elements.categoryFilter.addEventListener('change', handleFilterChange);
    elements.stockFilter.addEventListener('change', handleFilterChange);
    elements.limitInput.addEventListener('change', handleFilterChange);
    elements.applyFiltersBtn.addEventListener('click', applyFilters);
    
    // Paginación
    elements.prevPageBtn.addEventListener('click', () => changePage(-1));
    elements.nextPageBtn.addEventListener('click', () => changePage(1));
    
    // Modal
    elements.modalClose.addEventListener('click', closeModal);
    elements.productModal.addEventListener('click', function(e) {
        if (e.target === elements.productModal) {
            closeModal();
        }
    });
    
    // Cerrar modal con Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
    
    // Botón de configuración
    elements.configBtn.addEventListener('click', toggleConfigPanel);
    
    // Botón de recargar
    elements.reloadBtn.addEventListener('click', () => {
        console.log('Recargando todos los productos manualmente...');
        loadProducts();
    });
    
    // Botón de cargar todos
    elements.loadAllBtn.addEventListener('click', async () => {
        console.log('Cargando todos los productos...');
        await loadAllProductsWithPagination();
    });
    
    // Botón para limpiar filtros
    elements.clearFiltersBtn.addEventListener('click', clearAllFilters);
    
    // El filtro de categoría se maneja a través de handleFilterChange y applyFilters
}

function checkStoredCredentials() {
    // Usar credenciales por defecto automáticamente
    appState.isAuthenticated = true;
    
    // Llenar los campos del formulario con las credenciales por defecto
    elements.userIdInput.value = appState.userId;
    elements.tokenInput.value = appState.token;
    
    // Mostrar directamente la sección de productos
    showProductsSection();
    
    // Probar conexión y cargar productos automáticamente
    testConnectionAndLoadProducts();
}

// Función para probar la conexión y cargar productos
async function testConnectionAndLoadProducts() {
    console.log('Iniciando conexión con API ELIT...');
    console.log('Credenciales configuradas:', { userId: appState.userId, token: appState.token });
    
    try {
        await loadProducts();
    } catch (error) {
        console.error('Error en la carga inicial:', error);
        // Intentar recargar después de un breve delay
        setTimeout(() => {
            console.log('Reintentando carga de todos los productos...');
            loadProducts();
        }, 2000);
    }
}

// Manejo de autenticación
async function handleAuthentication(e) {
    e.preventDefault();
    
    const userId = elements.userIdInput.value.trim();
    const token = elements.tokenInput.value.trim();
    
    if (!userId || !token) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    showLoading(true);
    
    try {
        // Guardar credenciales
        localStorage.setItem('elit_userId', userId);
        localStorage.setItem('elit_token', token);
        
        appState.userId = userId;
        appState.token = token;
        appState.isAuthenticated = true;
        
        // Probar la conexión cargando productos
        await loadProducts();
        
        showProductsSection();
        hideError();
        
    } catch (error) {
        console.error('Error de autenticación:', error);
        showError('Error de autenticación. Verifica tus credenciales.');
        appState.isAuthenticated = false;
    } finally {
        showLoading(false);
    }
}

// Cargar productos desde la API con paginación
async function loadProducts() {
    if (!appState.isAuthenticated) {
        throw new Error('No autenticado');
    }
    
    showLoading(true);
    hideError();
    
    try {
        // Cargar TODOS los productos automáticamente
        await loadAllProducts();
        
        // Extraer marcas y categorías únicas
        extractFilters();
        
        // Actualizar filtros en el DOM
        updateFilterOptions();
        
        // Renderizar productos
        renderProducts();
        updateResultsInfo();
        
        console.log(`Cargados exitosamente ${appState.products.length} productos de todas las categorías`);
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        showError(`Error cargando productos: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Cargar la primera página de productos (sin offset)
async function loadFirstPage() {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.productos}?limit=100`;
    
    console.log('Cargando primera página de productos...');
    
    // Usando exactamente el formato de la documentación oficial
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    
    var raw = JSON.stringify({
        "user_id": parseInt(appState.userId),
        "token": appState.token
    });
    
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
    };
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error de respuesta:', errorText);
        throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error);
    }
    
    // Extraer productos de la respuesta
    let products = [];
    if (data.resultado && Array.isArray(data.resultado)) {
        products = data.resultado;
    } else if (Array.isArray(data)) {
        products = data;
    }
    
    // Ordenar productos por stock de mayor a menor (orden decreciente)
    products.sort((a, b) => {
        const stockA = a.stock_total || 0;
        const stockB = b.stock_total || 0;
        return stockB - stockA; // Orden decreciente (mayor a menor)
    });
    
    appState.products = products;
    appState.filteredProducts = [...appState.products];
    appState.totalItems = appState.products.length;
    
    console.log(`Primera página cargada: ${appState.products.length} productos ordenados por stock (mayor a menor)`);
    
    // Mostrar información de paginación si está disponible
    if (data.paginador) {
        console.log(`Total de productos disponibles: ${data.paginador.total}`);
        console.log(`Límite por página: ${data.paginador.limit}`);
    }
}

// Cargar todos los productos usando paginación completa
async function loadAllProductsWithPagination() {
    if (!appState.isAuthenticated) {
        throw new Error('No autenticado');
    }
    
    showLoading(true);
    hideError();
    
    try {
        // Cargar todos los productos usando paginación
        await loadAllProducts();
        
        // Extraer marcas y categorías únicas
        extractFilters();
        
        // Actualizar filtros en el DOM
        updateFilterOptions();
        
        // Renderizar productos
        renderProducts();
        updateResultsInfo();
        
        console.log(`Cargados exitosamente ${appState.products.length} productos de todas las categorías`);
        
    } catch (error) {
        console.error('Error cargando todos los productos:', error);
        showError(`Error cargando todos los productos: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Cargar todos los productos usando paginación
async function loadAllProducts() {
    let allProducts = [];
    let offset = 1; // La API requiere offset >= 1
    const limit = 100; // Máximo permitido por la API
    let hasMoreProducts = true;
    let totalProducts = 0;
    
    console.log('Iniciando carga de todos los productos con paginación...');
    
    // Mostrar barra de progreso
    elements.loadingProgress.style.display = 'block';
    elements.loadingText.textContent = 'Cargando catálogo completo...';
    
    while (hasMoreProducts) {
        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.productos}?limit=${limit}&offset=${offset}`;
        const currentPage = Math.floor((offset - 1)/limit) + 1;
        
        console.log(`Cargando página ${currentPage} - Offset: ${offset}`);
        
        // Actualizar texto de progreso
        elements.loadingText.textContent = `Cargando página ${currentPage}...`;
        
        // Usando exactamente el formato de la documentación oficial
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        
        var raw = JSON.stringify({
            "user_id": parseInt(appState.userId),
            "token": appState.token
        });
        
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error de respuesta:', errorText);
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Extraer productos de la respuesta
        let products = [];
        if (data.resultado && Array.isArray(data.resultado)) {
            products = data.resultado;
        } else if (Array.isArray(data)) {
            products = data;
        }
        
        // Agregar productos a la lista total
        allProducts = allProducts.concat(products);
        
        // Actualizar información de paginación y progreso
        if (data.paginador) {
            totalProducts = data.paginador.total;
            console.log(`Página ${currentPage}: ${products.length} productos. Total: ${allProducts.length}/${totalProducts}`);
            
            // Actualizar barra de progreso
            const progress = (allProducts.length / totalProducts) * 100;
            elements.progressFill.style.width = `${progress}%`;
            elements.progressText.textContent = `${allProducts.length}/${totalProducts} productos`;
        }
        
        // Verificar si hay más productos
        if (products.length < limit || allProducts.length >= totalProducts) {
            hasMoreProducts = false;
        } else {
            offset += limit; // Incrementar offset para la siguiente página
        }
        
        // Pequeña pausa para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Ordenar productos por stock de mayor a menor (orden decreciente)
    allProducts.sort((a, b) => {
        const stockA = a.stock_total || 0;
        const stockB = b.stock_total || 0;
        return stockB - stockA; // Orden decreciente (mayor a menor)
    });
    
    appState.products = allProducts;
    appState.filteredProducts = [...appState.products];
    appState.totalItems = appState.products.length;
    
    console.log(`Carga completa: ${appState.products.length} productos ordenados por stock (mayor a menor)`);
}

// Cargar productos por categoría específica
async function loadProductsByCategory(category) {
    if (!appState.isAuthenticated) {
        throw new Error('No autenticado');
    }
    
    showLoading(true);
    hideError();
    
    try {
        console.log(`Cargando productos de la categoría: ${category}`);
        
        // Usar el parámetro 'nombre' para buscar por categoría
        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.productos}?limit=100&nombre=${encodeURIComponent(category)}`;
        
        // Usando exactamente el formato de la documentación oficial
        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        
        var raw = JSON.stringify({
            "user_id": parseInt(appState.userId),
            "token": appState.token
        });
        
        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };
        
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error de respuesta:', errorText);
            throw new Error(`Error HTTP: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Extraer productos de la respuesta
        let products = [];
        if (data.resultado && Array.isArray(data.resultado)) {
            products = data.resultado;
        } else if (Array.isArray(data)) {
            products = data;
        }
        
        // Filtrar productos que realmente pertenecen a la categoría
        const categoryProducts = products.filter(product => 
            product.categoria && product.categoria.toLowerCase() === category.toLowerCase()
        );
        
        // Ordenar productos por stock de mayor a menor (orden decreciente)
        categoryProducts.sort((a, b) => {
            const stockA = a.stock_total || 0;
            const stockB = b.stock_total || 0;
            return stockB - stockA; // Orden decreciente (mayor a menor)
        });
        
        appState.products = categoryProducts;
        appState.filteredProducts = [...appState.products];
        appState.totalItems = appState.products.length;
        
        console.log(`Productos de la categoría "${category}": ${appState.products.length} ordenados por stock (mayor a menor)`);
        
        // Extraer marcas y categorías únicas
        extractFilters();
        
        // Actualizar filtros en el DOM
        updateFilterOptions();
        
        // Renderizar productos
        renderProducts();
        updateResultsInfo();
        
    } catch (error) {
        console.error('Error cargando productos por categoría:', error);
        showError(`Error cargando productos de la categoría: ${error.message}`);
    } finally {
        showLoading(false);
    }
}

// Extraer filtros únicos de los productos
function extractFilters() {
    appState.brands.clear();
    appState.categories.clear();
    
    appState.products.forEach(product => {
        if (product.marca) {
            appState.brands.add(product.marca);
        }
        if (product.categoria) {
            appState.categories.add(product.categoria);
        }
    });
    
    console.log('Marcas extraídas:', Array.from(appState.brands));
    console.log('Categorías extraídas:', Array.from(appState.categories));
}

// Actualizar opciones de filtros en el DOM
function updateFilterOptions() {
    // Actualizar filtro de marcas
    elements.brandFilter.innerHTML = '<option value="">Todas las marcas</option>';
    Array.from(appState.brands).sort().forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        elements.brandFilter.appendChild(option);
    });
    
    // Actualizar filtro de categorías
    elements.categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
    Array.from(appState.categories).sort().forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        elements.categoryFilter.appendChild(option);
    });
}

// Manejar búsqueda
function handleSearch(e) {
    appState.filters.search = e.target.value.toLowerCase();
    applyFilters();
    
    // Mostrar sugerencias si hay texto
    if (appState.filters.search.length > 0) {
        showSearchSuggestions(appState.filters.search);
    } else {
        hideSearchSuggestions();
    }
}

// Mostrar sugerencias de búsqueda
function showSearchSuggestions(searchTerm) {
    const suggestions = [];
    const maxSuggestions = 5;
    
    // Buscar sugerencias en nombres, marcas y categorías
    appState.products.forEach(product => {
        if (product.nombre && product.nombre.toLowerCase().includes(searchTerm)) {
            suggestions.push(product.nombre);
        }
        if (product.marca && product.marca.toLowerCase().includes(searchTerm)) {
            suggestions.push(product.marca);
        }
        if (product.categoria && product.categoria.toLowerCase().includes(searchTerm)) {
            suggestions.push(product.categoria);
        }
    });
    
    // Eliminar duplicados y limitar
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, maxSuggestions);
    
    if (uniqueSuggestions.length > 0) {
        console.log('Sugerencias de búsqueda:', uniqueSuggestions);
    }
}

// Ocultar sugerencias de búsqueda
function hideSearchSuggestions() {
    // Por ahora solo log, se puede implementar UI más adelante
}

// Manejar cambios en filtros
function handleFilterChange(e) {
    const filterName = e.target.id.replace('Filter', '').replace('Input', '');
    appState.filters[filterName] = e.target.value;
    
    console.log(`Filtro ${filterName} cambiado a:`, e.target.value);
    
    // Aplicar filtros automáticamente
    applyFilters();
}

// Aplicar filtros
function applyFilters() {
    let filtered = [...appState.products];
    
    console.log('Aplicando filtros...', appState.filters);
    console.log('Productos antes de filtrar:', filtered.length);
    
    // Filtro de búsqueda (búsqueda más flexible)
    if (appState.filters.search) {
        const searchTerm = appState.filters.search.toLowerCase();
        filtered = filtered.filter(product => {
            const nombre = product.nombre?.toLowerCase() || '';
            const codigo = product.codigo_producto?.toLowerCase() || '';
            const marca = product.marca?.toLowerCase() || '';
            const categoria = product.categoria?.toLowerCase() || '';
            const codigoAlfa = product.codigo_alfa?.toLowerCase() || '';
            
            return nombre.includes(searchTerm) ||
                   codigo.includes(searchTerm) ||
                   marca.includes(searchTerm) ||
                   categoria.includes(searchTerm) ||
                   codigoAlfa.includes(searchTerm);
        });
        console.log('Después de búsqueda:', filtered.length);
    }
    
    // Filtro de marca
    if (appState.filters.brand) {
        filtered = filtered.filter(product => product.marca === appState.filters.brand);
        console.log('Después de filtro de marca:', filtered.length);
    }
    
    // Filtro de categoría
    if (appState.filters.category) {
        filtered = filtered.filter(product => product.categoria === appState.filters.category);
        console.log('Después de filtro de categoría:', filtered.length);
    }
    
    // Filtro de stock
    if (appState.filters.stock) {
        if (appState.filters.stock === 'sin_stock') {
            filtered = filtered.filter(product => (product.stock_total || 0) === 0);
        } else {
            filtered = filtered.filter(product => product.nivel_stock === appState.filters.stock);
        }
        console.log('Después de filtro de stock:', filtered.length);
    }
    
    // Ordenar productos filtrados por stock de mayor a menor
    filtered.sort((a, b) => {
        const stockA = a.stock_total || 0;
        const stockB = b.stock_total || 0;
        return stockB - stockA; // Orden decreciente (mayor a menor)
    });
    
    appState.filteredProducts = filtered;
    appState.totalItems = filtered.length;
    appState.currentPage = 1;
    
    console.log('Productos filtrados finales:', filtered.length, 'ordenados por stock (mayor a menor)');
    
    renderProducts();
    updateResultsInfo();
}

// Limpiar todos los filtros
function clearAllFilters() {
    console.log('Limpiando todos los filtros...');
    
    // Limpiar el estado de filtros
    appState.filters = {
        search: '',
        brand: '',
        category: '',
        stock: '',
        limit: 100
    };
    
    // Limpiar los campos del formulario
    elements.searchInput.value = '';
    elements.brandFilter.value = '';
    elements.categoryFilter.value = '';
    elements.stockFilter.value = '';
    elements.limitInput.value = '100';
    
    // Restaurar todos los productos y ordenarlos por stock
    appState.filteredProducts = [...appState.products];
    appState.filteredProducts.sort((a, b) => {
        const stockA = a.stock_total || 0;
        const stockB = b.stock_total || 0;
        return stockB - stockA; // Orden decreciente (mayor a menor)
    });
    appState.totalItems = appState.products.length;
    appState.currentPage = 1;
    
    // Renderizar productos
    renderProducts();
    updateResultsInfo();
    
    console.log('Filtros limpiados. Mostrando todos los productos ordenados por stock:', appState.products.length);
}

// Renderizar productos
function renderProducts() {
    const startIndex = (appState.currentPage - 1) * appState.itemsPerPage;
    const endIndex = startIndex + appState.itemsPerPage;
    const productsToShow = appState.filteredProducts.slice(startIndex, endIndex);
    
    elements.productsGrid.innerHTML = '';
    
    if (productsToShow.length === 0) {
        elements.productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No se encontraron productos</h3>
                <p>Intenta ajustar los filtros de búsqueda</p>
            </div>
        `;
        return;
    }
    
    productsToShow.forEach(product => {
        const productCard = createProductCard(product);
        elements.productsGrid.appendChild(productCard);
    });
}

// Crear tarjeta de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.onclick = () => showProductDetails(product);
    
    const imageUrl = product.imagenes && product.imagenes.length > 0 
        ? product.imagenes[0] 
        : null;
    
    // Determinar estado del stock
    const stockTotal = product.stock_total || 0;
    const isOutOfStock = stockTotal === 0;
    
    let stockClass, stockText;
    if (isOutOfStock) {
        stockClass = 'stock-none';
        stockText = 'Sin Stock';
    } else {
        stockClass = product.nivel_stock === 'alto' ? 'stock-high' : 'stock-low';
        stockText = product.nivel_stock === 'alto' ? 'Stock Alto' : 'Stock Bajo';
    }
    
    // Botón de agregar al carrito
    const addToCartButton = isOutOfStock 
        ? `<button class="btn-add-cart btn-disabled" disabled title="Producto sin stock">
                <i class="fas fa-ban"></i> Sin Stock
            </button>`
        : `<button class="btn-add-cart" onclick="event.stopPropagation(); addToCart('${product.id}')">
                <i class="fas fa-cart-plus"></i> Agregar
            </button>`;
    
    card.innerHTML = `
        <div class="product-image">
            ${imageUrl ? `<img src="${imageUrl}" alt="${product.nombre}" loading="lazy">` : '<i class="fas fa-image"></i>'}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.nombre || 'Sin nombre'}</h3>
            <p class="product-brand">${product.marca || 'Sin marca'}</p>
            <p class="product-category">${product.categoria || 'Sin categoría'}</p>
            <div class="product-prices">
                <span class="price-usd">$${formatPrice(product.pvp_usd)}</span>
                <span class="price-ars">$${formatPrice(product.pvp_ars)} ARS</span>
            </div>
            <div class="product-stock">
                <span class="stock-level ${stockClass}">${stockText}</span>
                <span class="stock-quantity">${stockTotal} unidades</span>
            </div>
            <div class="product-actions">
                ${addToCartButton}
                <button class="btn-details" onclick="event.stopPropagation(); showProductDetails('${product.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Mostrar detalles del producto en modal
function showProductDetails(product) {
    if (typeof product === 'string') {
        product = appState.products.find(p => p.id === product);
    }
    
    if (!product) return;
    
    elements.modalTitle.textContent = product.nombre || 'Detalles del Producto';
    
    const images = product.imagenes || [];
    const thumbnails = product.miniaturas || [];
    const attributes = product.atributos || [];
    
    elements.modalBody.innerHTML = `
        <div class="product-details">
            <div class="product-images">
                ${images.length > 0 ? `
                    <div class="main-image">
                        <img src="${images[0]}" alt="${product.nombre}" style="width: 100%; max-height: 300px; object-fit: contain;">
                    </div>
                    ${images.length > 1 ? `
                        <div class="image-thumbnails">
                            ${images.slice(1, 5).map(img => `
                                <img src="${img}" alt="${product.nombre}" style="width: 60px; height: 60px; object-fit: cover; margin: 5px; cursor: pointer;">
                            `).join('')}
                        </div>
                    ` : ''}
                ` : '<div class="no-image"><i class="fas fa-image"></i> Sin imagen</div>'}
            </div>
            
            <div class="product-details-info">
                <h4>Información General</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Código ELIT:</strong> ${product.codigo_alfa || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>SKU:</strong> ${product.codigo_producto || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Marca:</strong> ${product.marca || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Categoría:</strong> ${product.categoria || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Subcategoría:</strong> ${product.sub_categoria || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>EAN:</strong> ${product.ean || 'N/A'}
                    </div>
                </div>
                
                <h4>Precios</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Precio Costo:</strong> $${formatPrice(product.precio)}
                    </div>
                    <div class="detail-item">
                        <strong>Precio USD:</strong> $${formatPrice(product.pvp_usd)}
                    </div>
                    <div class="detail-item">
                        <strong>Precio ARS:</strong> $${formatPrice(product.pvp_ars)}
                    </div>
                    <div class="detail-item">
                        <strong>Markup:</strong> ${product.markup || 'N/A'}
                    </div>
                    <div class="detail-item">
                        <strong>Cotización:</strong> $${formatPrice(product.cotizacion)}
                    </div>
                </div>
                
                <h4>Stock</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Nivel:</strong> <span class="stock-level ${(product.stock_total || 0) === 0 ? 'stock-none' : (product.nivel_stock === 'alto' ? 'stock-high' : 'stock-low')}">${(product.stock_total || 0) === 0 ? 'Sin Stock' : (product.nivel_stock === 'alto' ? 'Alto' : 'Bajo')}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Stock Total:</strong> ${product.stock_total || 0} unidades
                    </div>
                    <div class="detail-item">
                        <strong>Stock Cliente:</strong> ${product.stock_deposito_cliente || 0} unidades
                    </div>
                    <div class="detail-item">
                        <strong>Stock CD:</strong> ${product.stock_deposito_cd || 0} unidades
                    </div>
                </div>
                
                ${attributes.length > 0 ? `
                    <h4>Características</h4>
                    <div class="attributes">
                        ${attributes.map(attr => `
                            <div class="attribute">
                                <strong>${attr.nombre || 'Característica'}:</strong> ${attr.valor || 'N/A'}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <div class="modal-actions">
                    ${(product.stock_total || 0) === 0 
                        ? `<button class="btn btn-primary btn-disabled" disabled title="Producto sin stock">
                                <i class="fas fa-ban"></i> Sin Stock
                            </button>`
                        : `<button class="btn btn-primary" onclick="addToCart('${product.id}')">
                                <i class="fas fa-cart-plus"></i> Agregar al Carrito
                            </button>`
                    }
                    ${product.link ? `
                        <a href="${product.link}" target="_blank" class="btn btn-secondary">
                            <i class="fas fa-external-link-alt"></i> Ver en ELIT
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    elements.productModal.style.display = 'block';
}

// Cerrar modal
function closeModal() {
    elements.productModal.style.display = 'none';
}

// Agregar al carrito (funcionalidad básica)
function addToCart(productId) {
    const product = appState.products.find(p => p.id === productId);
    if (!product) return;
    
    // Aquí podrías implementar la lógica del carrito
    console.log('Agregando al carrito:', product.nombre);
    
    // Mostrar notificación temporal
    showNotification(`"${product.nombre}" agregado al carrito`, 'success');
}

// Cambiar página
function changePage(direction) {
    const totalPages = Math.ceil(appState.totalItems / appState.itemsPerPage);
    const newPage = appState.currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        appState.currentPage = newPage;
        renderProducts();
        updateResultsInfo();
    }
}

// Actualizar información de resultados
function updateResultsInfo() {
    const totalPages = Math.ceil(appState.totalItems / appState.itemsPerPage);
    const startItem = (appState.currentPage - 1) * appState.itemsPerPage + 1;
    const endItem = Math.min(appState.currentPage * appState.itemsPerPage, appState.totalItems);
    
    elements.resultsCount.textContent = `${appState.totalItems} productos encontrados`;
    elements.pageInfo.textContent = `Página ${appState.currentPage} de ${totalPages}`;
    
    elements.prevPageBtn.disabled = appState.currentPage <= 1;
    elements.nextPageBtn.disabled = appState.currentPage >= totalPages;
}

// Mostrar sección de productos
function showProductsSection() {
    elements.authSection.style.display = 'none';
    elements.productsSection.style.display = 'block';
}

// Alternar panel de configuración
function toggleConfigPanel() {
    if (elements.authSection.style.display === 'none' || elements.authSection.style.display === '') {
        elements.authSection.style.display = 'block';
        elements.productsSection.style.display = 'none';
    } else {
        elements.authSection.style.display = 'none';
        elements.productsSection.style.display = 'block';
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    elements.loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Mostrar error
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'flex';
}

// Ocultar error
function hideError() {
    elements.errorMessage.style.display = 'none';
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Estilos para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Formatear precio
function formatPrice(price) {
    if (!price || isNaN(price)) return '0.00';
    return parseFloat(price).toFixed(2);
}

// Función debounce para optimizar búsquedas
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Agregar estilos CSS para notificaciones y detalles del producto
const additionalStyles = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .product-details {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
    }
    
    .product-images {
        text-align: center;
    }
    
    .main-image {
        margin-bottom: 1rem;
    }
    
    .image-thumbnails {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    
    .no-image {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        background: #f3f4f6;
        border-radius: 8px;
        color: #9ca3af;
        font-size: 3rem;
    }
    
    .product-details-info h4 {
        color: var(--primary-color);
        margin: 1.5rem 0 1rem 0;
        font-size: 1.2rem;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .detail-item {
        padding: 0.5rem;
        background: #f8fafc;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    
    .attributes {
        display: grid;
        gap: 0.5rem;
    }
    
    .attribute {
        padding: 0.5rem;
        background: #f8fafc;
        border-radius: 4px;
        font-size: 0.9rem;
    }
    
    .modal-actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
    }
    
    .no-products {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    
    .no-products i {
        font-size: 3rem;
        margin-bottom: 1rem;
        color: var(--text-muted);
    }
    
    @media (max-width: 768px) {
        .product-details {
            grid-template-columns: 1fr;
        }
        
        .detail-grid {
            grid-template-columns: 1fr;
        }
        
        .modal-actions {
            flex-direction: column;
        }
    }
`;

// Agregar estilos adicionales al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

console.log('Aplicación Catálogo ELIT cargada correctamente');
