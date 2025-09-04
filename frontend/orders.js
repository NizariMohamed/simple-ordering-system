const ORDERS_API_URL = "https://neez-ordering-system.onrender.com/api/orders";

async function loadOrders() {
  try {
    showLoadingSkeleton();
    const res = await fetch(ORDERS_API_URL);
    
    if (res.ok) {
      allOrders = await res.json();
    } else {
      console.error('Failed to fetch orders:', res.statusText);
      return;
    }
    
    updateOrderStats();
    applyOrderFilters();
    hideLoadingSkeleton();
  } catch (error) {
    console.error('Error loading orders:', error);
    hideLoadingSkeleton();
  }
}

function updateOrderStats() {
  const totalOrders = allOrders.length;
  const pending = allOrders.filter(o => o.status === 'pending').length;
  const confirmed = allOrders.filter(o => o.status === 'confirmed').length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  
  document.getElementById('totalOrders').textContent = totalOrders;
  document.getElementById('pendingOrders').textContent = pending;
  document.getElementById('confirmedOrders').textContent = confirmed;
  document.getElementById('totalRevenue').textContent = 'Tsh ' + totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 });
}

function applyOrderFilters() {
  const search = document.getElementById('orderSearchBox').value.toLowerCase();
  const status = document.getElementById('orderStatusFilter').value;
  const dateFilter = document.getElementById('orderDateFilter').value;
  const sortBy = document.getElementById('orderSortBy').value;
  
  filteredOrders = allOrders.filter(order => {
    // Search filter
    if (search && !order.order_id.toLowerCase().includes(search) && 
        !order.customer_phone.toLowerCase().includes(search)) {
      return false;
    }
    
    // Status filter
    if (status && order.status !== status) return false;
    
    // Date filter
    if (dateFilter && !isOrderInDateRange(order.created_at, dateFilter)) return false;
    
    return true;
  });

  sortOrders(filteredOrders, sortBy);
  currentOrderPage = 1;
  displayOrders();
  updateOrderPagination();
}

function isOrderInDateRange(orderDate, filter) {
  const now = new Date();
  const orderDateTime = new Date(orderDate);
  
  switch(filter) {
    case 'today':
      return orderDateTime.toDateString() === now.toDateString();
    case 'week':
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDateTime >= weekAgo;
    case 'month':
      return orderDateTime.getMonth() === now.getMonth() && orderDateTime.getFullYear() === now.getFullYear();
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      const orderQuarter = Math.floor(orderDateTime.getMonth() / 3);
      return orderQuarter === quarter && orderDateTime.getFullYear() === now.getFullYear();
    default:
      return true;
  }
}

function sortOrders(orders, sortBy) {
  const [field, direction] = sortBy.split('_');
  
  orders.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    if (field === 'total') {
      valueA = parseFloat(valueA);
      valueB = parseFloat(valueB);
    } else if (field === 'created_at') {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    } else {
      valueA = (valueA || '').toString().toLowerCase();
      valueB = (valueB || '').toString().toLowerCase();
    }
    
    if (direction === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });
}

function displayOrders() {
  const startIndex = (currentOrderPage - 1) * orderItemsPerPage;
  const endIndex = startIndex + orderItemsPerPage;
  const ordersToShow = filteredOrders.slice(startIndex, endIndex);
  
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = ordersToShow.map(order => {
    const orderDate = new Date(order.date); // Ensure this is the correct property
    const formattedDate = orderDate.toLocaleDateString(); // Format the date correctly
    return `
      <tr class="hover:bg-gray-700 transition-colors">
        <td class="p-4">
          <input type="checkbox" class="order-checkbox w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded" 
                 data-order-id="${order.id}" ${selectedOrders.has(order.id) ? 'checked' : ''}>
        </td>
        <td class="p-4">
          <div class="font-semibold text-blue-400">${order.id}</div>
        </td>
        <td class="p-4">
          <div class="font-semibold text-blue-400">${order.product_id}</div>
        </td>
        <td class="p-4">
          <div class="font-semibold text-gray-100">${order.customer_phone}</div>
        </td>
        <td class="p-4 text-gray-300">
          ${formattedDate} <!-- Use the formatted date here -->
        </td>
        <td class="p-4 text-gray-300">
          ${order.quantity} items
        </td>
        <td class="p-4">
          <div class="font-semibold text-green-400">Tsh ${parseFloat(order.total).toLocaleString()}</div>
        </td>
        <td class="p-4">
          <span class="px-2 py-1 rounded-full text-xs ${getOrderStatusStyle(order.status)}">
            ${getOrderStatusText(order.status)}
          </span>
        </td>
        <td class="p-4">
          <div class="flex gap-2">
            <button onclick="viewOrderDetails(${order.id})" class="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">
              👁️ View
            </button>
            ${order.status === 'pending' ? `
              <button onclick="confirmOrder(${order.id})" class="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700">
                ✅ Confirm
              </button>
            ` : ''}
            <button onclick="updateOrderStatus(${order.id})" class="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700">
              📝 Update
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  // Add checkbox event listeners
  document.querySelectorAll('.order-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', handleOrderSelect);
  });
}

function getOrderStatusStyle(status) {
  const styles = {
    pending: 'bg-yellow-600 text-white',
    confirmed: 'bg-blue-600 text-white',
    processing: 'bg-purple-600 text-white',
    shipped: 'bg-indigo-600 text-white',
    delivered: 'bg-green-600 text-white',
    cancelled: 'bg-red-600 text-white'
  };
  return styles[status] || styles.pending;
}

function getOrderStatusText(status) {
  const texts = {
    pending: '⏳ Pending',
    confirmed: '✅ Confirmed',
    processing: '🔄 Processing',
    shipped: '🚚 Shipped',
    delivered: '📦 Delivered',
    cancelled: '❌ Cancelled'
  };
  return texts[status] || texts.pending;
}

async function viewOrderDetails(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (!order) return;
  
  const modal = document.getElementById('orderModal');
  const detailsContainer = document.getElementById('orderDetails');
  
  detailsContainer.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-200">Order Information</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-400">Order ID:</span>
            <span class="font-semibold">${order.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Date:</span>
            <span>${new Date(order.date).toLocaleDateString()}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Status:</span>
            <span class="px-2 py-1 rounded-full text-xs ${getOrderStatusStyle(order.status)}">
              ${getOrderStatusText(order.status)}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Total:</span>
            <span class="font-semibold text-green-400">Tsh ${parseFloat(order.total).toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-gray-200">Customer Information</h3>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-400">Phone:</span>
            <span>${order.customer_phone}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Set up action buttons
  const confirmBtn = document.getElementById('confirmOrderBtn');
  const cancelBtn = document.getElementById('cancelOrderBtn');
  
  confirmBtn.onclick = () => confirmOrder(orderId);
  cancelBtn.onclick = () => cancelOrder(orderId);
  
  // Hide confirm button if already confirmed
  if (order.status !== 'pending') {
    confirmBtn.style.display = 'none';
  }
  
  modal.classList.remove('hidden');
}

function closeOrderModal() {
  document.getElementById('orderModal').classList.add('hidden');
}

async function confirmOrder(orderId) {
  try {
    const res = await fetch(`${ORDERS_API_URL}/${orderId}/confirm`, { method: 'PUT' });

    if (res.ok) {
      // Update local data
      const order = allOrders.find(o => o.id === orderId);
      if (order) {
        order.status = 'confirmed';
        updateOrderStats();
        displayOrders();
        closeOrderModal();
        showToast('Order confirmed successfully', 'success');
        addActivity(`Confirmed order ${order.order_id}`, 'update');
      }
    } else {
      const errorData = await res.json();
      showToast(`Error confirming order: ${errorData.error}`, 'error');
    }
  } catch (error) {
    showToast('Error confirming order', 'error');
  }
}

async function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;
  
  try {
    const res = await fetch(`${ORDERS_API_URL}/${orderId}/cancel`, { method: 'PUT' });

    if (res.ok) {
      const order = allOrders.find(o => o.id === orderId);
      if (order) {
        order.status = 'cancelled';
        updateOrderStats();
        displayOrders();
        closeOrderModal();
        showToast('Order cancelled successfully', 'success');
        addActivity(`Cancelled order ${order.order_id}`, 'update');
      }
    } else {
      const errorData = await res.json();
      showToast(`Error cancelling order: ${errorData.error}`, 'error');
    }
  } catch (error) {
    showToast('Error cancelling order', 'error');
  }
}

function handleOrderSelect(e) {
  const orderId = parseInt(e.target.dataset.orderId);
  
  if (e.target.checked) {
    selectedOrders.add(orderId);
  } else {
    selectedOrders.delete(orderId);
  }
}

function updateOrderPagination() {
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / orderItemsPerPage);
  
  document.getElementById('prevOrderPage').disabled = currentOrderPage === 1;
  document.getElementById('nextOrderPage').disabled = currentOrderPage === totalPages;
  
  // Update page numbers (similar to product pagination)
  const container = document.getElementById('orderPageNumbers');
  container.innerHTML = '';
  
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    const button = document.createElement('button');
    button.textContent = i;
    button.className = `px-3 py-1 rounded-lg ${
      i === currentOrderPage 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
    }`;
    button.onclick = () => {
      currentOrderPage = i;
      displayOrders();
      updateOrderPagination();
    };
    container.appendChild(button);
  }
}

// Order pagination
document.getElementById("prevOrderPage").addEventListener("click", () => {
  if (currentOrderPage > 1) {
    currentOrderPage--;
    displayOrders();
    updateOrderPagination();
  }
});
document.getElementById("nextOrderPage").addEventListener("click", () => {
  const totalPages = Math.ceil(filteredOrders.length / orderItemsPerPage);
  if (currentOrderPage < totalPages) {
    currentOrderPage++;
    displayOrders();
    updateOrderPagination();
  }
});

// Bulk actions
document.getElementById("selectAllOrders").addEventListener("change", (e) => {
  const checkboxes = document.querySelectorAll('.order-checkbox');
  checkboxes.forEach(cb => {
    cb.checked = e.target.checked;
    const orderId = parseInt(cb.dataset.orderId);
    if (e.target.checked) {
      selectedOrders.add(orderId);
    } else {
      selectedOrders.delete(orderId);
    }
  });
});

document.getElementById("bulkConfirmOrders").addEventListener("click", () => {
  if (selectedOrders.size === 0) {
    showToast('No orders selected', 'warning');
    return;
  }
  
  if (confirm(`Confirm ${selectedOrders.size} selected orders?`)) {
    selectedOrders.forEach(orderId => {
      const order = allOrders.find(o => o.id === orderId);
      if (order && order.status === 'pending') {
        order.status = 'confirmed';
      }
    });
    
    selectedOrders.clear();
    updateOrderStats();
    displayOrders();
    showToast('Selected orders confirmed', 'success');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
});