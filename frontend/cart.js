let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Initialize cart UI when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    addCartHTML();
    updateCartUI();
});

// Add cart HTML elements to the page
function addCartHTML() {
    // Add cart button
    const cartButton = document.createElement('div');
    cartButton.innerHTML = `
        <div id="cartButton" class="cart-button" onclick="toggleCart()">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9"></path>
            </svg>
            <div id="cartBadge" class="cart-badge hidden">0</div>
        </div>
    `;
    document.body.appendChild(cartButton);

    // Add cart modal
    const cartModal = document.createElement('div');
    cartModal.innerHTML = `
        <div id="cartModal" class="modal-overlay fixed inset-0 z-50 flex items-center justify-center hidden">
            <div class="modal-content rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                <div class="flex items-center justify-between p-6 border-b border-white border-opacity-10">
                    <h3 class="modal-title text-xl font-bold flex items-center">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9"></path>
                        </svg>
                        Shopping Cart
                    </h3>
                    <button onclick="closeCart()" class="close-btn p-2 rounded-full hover:bg-gray-100 hover:bg-opacity-10 transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                
                <div class="p-6">
                    <div id="cartItems" class="space-y-3 mb-4">
                        <div class="empty-state text-center py-8">
                            <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9"></path>
                            </svg>
                            <p class="modal-description">Your cart is empty</p>
                        </div>
                    </div>
                    
                    <div id="cartTotal" class="cart-total hidden">
                        <div class="flex justify-between items-center mb-4">
                            <span class="modal-title text-lg font-bold">Total:</span>
                            <span id="totalAmount" class="price-tag text-xl font-bold">$0.00</span>
                        </div>
                        <button id="checkoutBtn" onclick="checkoutCart()" class="whatsapp-btn w-full py-3 px-4 rounded-xl font-semibold">
                            🛒 Checkout via WhatsApp
                        </button>
                    </div>
                    
                    <div class="mt-4">
                        <button onclick="clearCart()" class="w-full py-2 px-4 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 text-red-300 rounded-xl font-semibold hover:bg-opacity-30 transition-all">
                            🗑️ Clear Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(cartModal);

    // Add required CSS
    const cartCSS = document.createElement('style');
    cartCSS.textContent = `
        .cart-badge {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: bold;
            position: absolute;
            top: -8px;
            right: -8px;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        .cart-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(59, 130, 246, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(59, 130, 246, 0.2);
            color: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            z-index: 40;
        }

        .cart-button:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: rgba(59, 130, 246, 0.4);
            color: white;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            transform: scale(1.1);
        }

        .cart-item {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            transition: all 0.3s ease;
        }

        .cart-item:hover {
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.15);
        }

        .cart-total {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
            border: 1px solid rgba(59, 130, 246, 0.2);
            border-radius: 12px;
            padding: 1rem;
            margin-top: 1rem;
        }
    `;
    document.head.appendChild(cartCSS);
}

// Function to save cart to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Cart Functions
function addToCart(productIndex) {
    const product = allProducts[productIndex];
    if (!product) {
        showFeedback('Product not found!', 'error');
        return;
    }
    
    if (product.stock < 1) {
        showFeedback('Product out of stock!', 'error');
        return;
    }
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showFeedback('Cannot add more - insufficient stock!', 'error');
            return;
        }
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price.replace(/[^0-9.-]+/g, "")),
            quantity: 1,
            image: product.gallery ? JSON.parse(product.gallery)[0] : product.image
        });
    }
    
    saveCartToLocalStorage(); // Save cart to localStorage
    updateCartUI();
    showFeedback(`Added ${product.name} to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCartToLocalStorage(); // Save cart to localStorage
    updateCartUI();
    showFeedback('Item removed from cart', 'success');
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    const product = allProducts.find(p => p.id === productId);
    
    if (item && product) {
        if (newQuantity > product.stock) {
            showFeedback(`Only ${product.stock} items available`, 'error');
            return;
        }
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
            saveCartToLocalStorage(); // Save cart to localStorage
            updateCartUI();
        }
    }
}

function updateCartUI() {
    const cartBadge = document.getElementById('cartBadge');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const totalAmount = document.getElementById('totalAmount');
    
    if (!cartBadge || !cartItems || !cartTotal || !totalAmount) return;
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart badge
    if (totalItems > 0) {
        cartBadge.textContent = totalItems;
        cartBadge.classList.remove('hidden');
    } else {
        cartBadge.classList.add('hidden');
    }
    
    // Update cart items display
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state text-center py-8">
                <svg class="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9m-9 0h9"></path>
                </svg>
                <p class="modal-description">Your cart is empty</p>
            </div>`;
        cartTotal.classList.add('hidden');
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item flex items-center space-x-3">
                <img src="http://localhost:5000${item.image}" class="w-12 h-12 object-cover rounded">
                <div class="flex-1">
                    <h4 class="modal-text font-semibold text-sm">${item.name}</h4>
                    <p class="modal-description text-xs">$${item.price.toFixed(2)} each</p>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})" class="w-6 h-6 bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 text-red-300 rounded text-xs hover:bg-opacity-30">-</button>
                    <span class="modal-text text-sm w-8 text-center">${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})" class="w-6 h-6 bg-green-500 bg-opacity-20 border border-green-400 border-opacity-30 text-green-300 rounded text-xs hover:bg-opacity-30">+</button>
                </div>
                <button onclick="removeFromCart(${item.id})" class="text-red-400 hover:text-red-300 text-xs">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `).join('');
        
        totalAmount.textContent = `$${totalPrice.toFixed(2)}`;
        cartTotal.classList.remove('hidden');
    }
}

function toggleCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) return;
    
    cartModal.classList.toggle('hidden');
    if (!cartModal.classList.contains('hidden')) {
        setTimeout(() => cartModal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    } else {
        cartModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

function closeCart() {
    const cartModal = document.getElementById('cartModal');
    if (!cartModal) return;
    
    cartModal.classList.remove('show');
    setTimeout(() => {
        cartModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

function clearCart() {
    cart = [];
    localStorage.removeItem('cart'); // Clear cart in localStorage
    updateCartUI();
    showFeedback('Cart cleared!', 'success');
}

function checkoutCart() {
    if (cart.length === 0) {
        showFeedback('Your cart is empty!', 'error');
        return;
    }
    
    const phone = "255750761558";
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let message = "Hello! I would like to order the following items:\n\n";
    cart.forEach(item => {
        message += `📦 ${item.name}\n`;
        message += `   Quantity: ${item.quantity}\n`;
        message += `   Price: $${item.price.toFixed(2)} each\n`;
        message += `   Subtotal: $${(item.price * item.quantity).toFixed(2)}\n\n`;
    });
    
    message += `💰 Total: $${totalPrice.toFixed(2)}\n\n`;
    message += "Please confirm availability and delivery details. Thank you!";
    
    // Process orders for stock management
    cart.forEach(item => {
        const product = allProducts.find(p => p.id === item.id);
        if (product) {
            fetch(`http://localhost:5000/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: item.id,
                    productName: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.price * item.quantity,
                    customerPhone: phone,
                    status: "pending"
                })
            }).then(() => {
                product.stock -= item.quantity;
            }).catch(console.error);
        }
    });
    
    clearCart(); // This will also clear localStorage
    closeCart();
    // Refresh product display if displayProducts function exists
    if (typeof displayProducts === 'function' && typeof filteredProducts !== 'undefined') {
        displayProducts(filteredProducts);
    }
    showFeedback('Order sent! Stock updated.', 'success');
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
}

// Event listeners
document.addEventListener('click', function(e) {
    const cartModal = document.getElementById('cartModal');
    if (e.target === cartModal) {
        closeCart();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeCart();
    }
});

// Share Functions (bonus feature)
function shareProduct(name, price, platform) {
    const url = window.location.href;
    const text = `Check out this amazing product: ${name} for ${price}!`;
    
    let shareUrl = '';
    switch(platform) {
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
            break;
        default:
            return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    showFeedback('Opening share window...', 'success');
}

function copyProductLink(productName) {
    const url = window.location.href + `#${productName.toLowerCase().replace(/\s+/g, '-')}`;
    
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        showFeedback('Product link copied to clipboard!', 'success');
    } catch (err) {
        showFeedback('Failed to copy link', 'error');
    }
    
    document.body.removeChild(textarea);
}