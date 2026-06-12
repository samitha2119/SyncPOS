import { create } from 'zustand';
import axiosInstance from '../api/axiosInstance';
import { io } from 'socket.io-client';

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useStore = create((set, get) => ({
  // Authentication
  user: JSON.parse(localStorage.getItem('syncpos_user')) || null,
  token: localStorage.getItem('syncpos_token') || null,
  authError: null,
  login: async (email, password) => {
    try {
      set({ authError: null });
      const { data } = await axiosInstance.post('/auth/login', { email, password });
      localStorage.setItem('syncpos_token', data.token);
      localStorage.setItem('syncpos_user', JSON.stringify(data));
      set({ user: data, token: data.token });
      get().initSocket();
      get().fetchCurrentShift();
      get().fetchSettings();
    } catch (err) {
      set({ authError: err.response?.data?.message || 'Login failed' });
      throw err;
    }
  },
  pinLogin: async (pin) => {
    try {
      set({ authError: null });
      const { data } = await axiosInstance.post('/auth/pin-login', { pin });
      localStorage.setItem('syncpos_token', data.token);
      localStorage.setItem('syncpos_user', JSON.stringify(data));
      set({ user: data, token: data.token });
      get().initSocket();
      get().fetchCurrentShift();
      get().fetchSettings();
    } catch (err) {
      set({ authError: err.response?.data?.message || 'PIN login failed' });
      throw err;
    }
  },
  logout: () => {
    localStorage.removeItem('syncpos_token');
    localStorage.removeItem('syncpos_user');
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ user: null, token: null, currentShift: null, socket: null });
  },

  // Theme
  theme: localStorage.getItem('syncpos_theme') || 'dark',
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('syncpos_theme', nextTheme);
    set({ theme: nextTheme });
  },

  // Settings
  settings: null,
  fetchSettings: async () => {
    try {
      const { data } = await axiosInstance.get('/settings');
      set({ settings: data });
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  },
  updateSettings: async (newSettings) => {
    try {
      const { data } = await axiosInstance.put('/settings', newSettings);
      set({ settings: data });
    } catch (err) {
      console.error('Error updating settings:', err);
      throw err;
    }
  },

  // Shift Management
  currentShift: null,
  fetchCurrentShift: async () => {
    try {
      const { data } = await axiosInstance.get('/shifts/current');
      set({ currentShift: data || null });
    } catch (err) {
      console.error('Error checking active shift:', err);
    }
  },
  openShift: async (openingFloat) => {
    try {
      const { data } = await axiosInstance.post('/shifts/open', { openingFloat });
      set({ currentShift: data });
      return data;
    } catch (err) {
      console.error('Error opening shift:', err);
      throw err;
    }
  },
  closeShift: async (actualCash) => {
    try {
      const { currentShift } = get();
      if (!currentShift) return;
      const { data } = await axiosInstance.post(`/shifts/${currentShift._id}/close`, { actualCash });
      set({ currentShift: null });
      return data;
    } catch (err) {
      console.error('Error closing shift:', err);
      throw err;
    }
  },

  // POS Shopping Cart
  cartItems: [],
  cartCustomer: null,
  cartDiscount: 0, // flat amount
  discountType: 'flat', // 'flat' or 'percent'
  addToCart: (product, qty = 1) => {
    const { cartItems } = get();
    const existing = cartItems.find((item) => item.productId === product._id);
    
    if (existing) {
      const newQty = existing.quantity + qty;
      if (product.stock < newQty) {
        throw new Error(`Only ${product.stock} items available in inventory.`);
      }
      set({
        cartItems: cartItems.map((item) =>
          item.productId === product._id ? { ...item, quantity: newQty, subtotal: newQty * item.price } : item
        ),
      });
    } else {
      if (product.stock < qty) {
        throw new Error(`Only ${product.stock} items available in inventory.`);
      }
      set({
        cartItems: [
          ...cartItems,
          {
            productId: product._id,
            name: product.name,
            price: product.price,
            costPrice: product.costPrice,
            quantity: qty,
            subtotal: qty * product.price,
          },
        ],
      });
    }
  },
  removeFromCart: (productId) => {
    set({ cartItems: get().cartItems.filter((item) => item.productId !== productId) });
  },
  updateCartQty: (productId, qty) => {
    const { cartItems } = get();
    set({
      cartItems: cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity: qty, subtotal: qty * item.price } : item
      ),
    });
  },
  setCartCustomer: (customer) => {
    set({ cartCustomer: customer });
  },
  setCartDiscount: (val, type = 'flat') => {
    set({ cartDiscount: val, discountType: type });
  },
  clearCart: () => {
    set({ cartItems: [], cartCustomer: null, cartDiscount: 0, discountType: 'flat' });
  },

  // Real-Time Socket Connection
  socket: null,
  notifications: [],
  initSocket: () => {
    const { token, socket } = get();
    if (!token || socket) return;

    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      console.log('Connected to websocket server');
    });

    newSocket.on('inventory:update', ({ productId, newStock }) => {
      // Allow components to listen or we trigger a global notify
      set((state) => ({
        notifications: [
          { id: Date.now(), type: 'Inventory', message: `Product stock level updated.` },
          ...state.notifications,
        ],
      }));
    });

    newSocket.on('notificationUpdate', (notif) => {
      set((state) => ({
        notifications: [
          { id: Date.now(), ...notif },
          ...state.notifications,
        ],
      }));
    });

    set({ socket: newSocket });
  },
  clearNotifications: () => set({ notifications: [] }),
}));
