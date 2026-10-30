import { 
  onSnapshot, 
  doc, 
  setDoc, 
  collection, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { AppData, Order, CakeStyle, Customer, Category, GalleryCategory } from '../types';
import { db as dbService } from './db';
import { db as firestore } from '../firebase';

const DEFAULT_DATA: AppData = {
  categories: [],
  products: [],
  settings: {
    whatsapp: '5511999999999',
    slug: 'cakes-kethy'
  },
  orders: [],
  styles: []
};

export const api = {
  async getData(): Promise<AppData> {
    const safeFetch = async <T>(promise: Promise<T>, fallback: T): Promise<T> => {
      try {
        return await promise;
      } catch (e) {
        console.error('Fetch error:', e);
        return fallback;
      }
    };

    try {
      const [data, products, styles, orders, categories, galleryCategories] = await Promise.all([
        safeFetch(dbService.getAppData(), undefined),
        safeFetch(dbService.getProducts(), []),
        safeFetch(dbService.getStyles(), []),
        safeFetch(dbService.getOrders(), []),
        safeFetch(dbService.getCategories(), []),
        safeFetch(dbService.getGalleryCategories(), [])
      ]);

      const baseData = data || DEFAULT_DATA;
      const merged = { ...baseData, products, styles, orders };
      
      return {
        ...merged,
        categories: categories || [],
        settings: {
          ...(merged.settings || DEFAULT_DATA.settings),
          galleryCategories: galleryCategories
        }
      };
    } catch (error) {
      console.error('Error in api.getData:', error);
      return DEFAULT_DATA;
    }
  },

  async login(password: string): Promise<{ token: string }> {
    const data = await this.getData();
    if (password === (data.settings.adminPassword || 'admin123')) {
      return { token: 'mock-token-' + Date.now() };
    }
    throw new Error('Senha incorreta');
  },

  async uploadImage(file: File, _token: string): Promise<{ imageUrl: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Max dimensions
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({ imageUrl: dataUrl });
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString()
    };
    await dbService.saveOrder(newOrder);
    
    // Save/Update customer
    const customer: Customer = {
      id: order.customerPhone,
      name: order.customerName,
      phone: order.customerPhone,
      email: order.customerEmail,
      birthday: order.customerBirthday,
      address: order.customerAddress,
      number: order.customerNumber,
      zip: order.customerZip,
      city: order.customerCity,
      lastOrderDate: new Date().toISOString()
    };
    await dbService.saveCustomer(customer);

    return newOrder;
  },

  async createProduct(product: any, _token: string) {
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    await dbService.saveProduct(newProduct);
    return newProduct;
  },

  async updateProduct(id: string, product: any, _token: string) {
    const updatedProduct = { ...product, id };
    await dbService.saveProduct(updatedProduct);
    return updatedProduct;
  },

  async deleteProduct(id: string, _token: string) {
    await dbService.deleteProduct(id);
    return { success: true };
  },

  async createCategory(category: any, _token: string) {
    try {
      const categories = await dbService.getCategories();
      const maxOrder = categories.length > 0 
        ? categories.reduce((max, c) => Math.max(max, c.order || 0), 0)
        : 0;
      
      const newCategory = { 
        ...category, 
        id: Math.random().toString(36).substr(2, 9),
        order: category.order !== undefined ? Number(category.order) : maxOrder + 1
      };
      
      await dbService.saveCategory(newCategory);
      return newCategory;
    } catch (error) {
      console.error('Error in createCategory:', error);
      throw error;
    }
  },

  async updateCategory(id: string, category: any, _token: string) {
    const existing = await dbService.getCategories();
    const cat = existing.find(c => c.id === id);
    if (!cat) throw new Error('Category not found');
    const updated = { ...cat, ...category };
    await dbService.saveCategory(updated);
    return updated;
  },

  async reorderCategories(categories: Category[], _token: string) {
    for (const cat of categories) {
      await dbService.saveCategory(cat);
    }
    return categories;
  },

  async deleteCategory(id: string, _token: string) {
    await dbService.deleteCategory(id);
    return { success: true };
  },

  async updateSettings(settings: any, _token: string) {
    const appData = await dbService.getAppData();
    if (!appData) throw new Error('Could not fetch app data');
    
    // Remove galleryCategories from settings to be saved in appData
    // They are now stored in their own collection
    const { galleryCategories: _, ...settingsToSave } = { ...appData.settings, ...settings };
    
    await dbService.saveAppData({ ...appData, settings: settingsToSave });
    return settingsToSave;
  },

  // Styles methods
  async getStyles(): Promise<CakeStyle[]> {
    return dbService.getStyles();
  },

  async saveStyle(style: Omit<CakeStyle, 'id'>): Promise<CakeStyle> {
    const newStyle = { ...style, id: Math.random().toString(36).substr(2, 9) };
    await dbService.saveStyle(newStyle);
    return newStyle;
  },

  async deleteStyle(id: string) {
    return dbService.deleteStyle(id);
  },

  // Gallery Categories methods
  async getGalleryCategories(): Promise<GalleryCategory[]> {
    return dbService.getGalleryCategories();
  },

  async createGalleryCategory(category: Omit<GalleryCategory, 'id'>, _token: string) {
    const id = Math.random().toString(36).substr(2, 9);
    const newCategory = { ...category, id };
    await dbService.saveGalleryCategory(newCategory);
    return newCategory;
  },

  async updateGalleryCategory(id: string, category: Partial<GalleryCategory>, _token: string) {
    const existing = await dbService.getGalleryCategory(id);
    if (!existing) throw new Error('Gallery category not found');
    const updated = { ...existing, ...category };
    await dbService.saveGalleryCategory(updated);
    return updated;
  },

  async saveGalleryImage(categoryId: string, index: number, url: string, _token: string) {
    await dbService.saveGalleryImage(categoryId, index, url);
    return { success: true };
  },

  async deleteGalleryCategory(id: string, _token: string) {
    return dbService.deleteGalleryCategory(id);
  },

  // Customers methods
  async getCustomers(): Promise<Customer[]> {
    return dbService.getCustomers();
  },

  async deleteCustomer(phone: string) {
    await dbService.deleteCustomer(phone);
    await dbService.deleteOrdersByPhone(phone);
    return { success: true };
  },

  onUpdate(callback: (data: AppData) => void) {
    let currentAppData: any = null;
    let currentProducts: any[] = [];
    let currentStyles: any[] = [];
    let currentOrders: any[] = [];
    let currentGalleryCategories: any[] = [];
    let currentCategories: any[] = [];

    const notify = () => {
      if (currentAppData) {
        callback({
          ...currentAppData,
          products: currentProducts,
          styles: currentStyles,
          orders: currentOrders,
          categories: currentCategories,
          settings: {
            ...(currentAppData.settings || DEFAULT_DATA.settings),
            galleryCategories: currentGalleryCategories
          }
        });
      }
    };

    let rawGalleryCategories: any[] = [];
    let currentGalleryImages: any[] = [];

    const updateGalleryCategories = () => {
      const imagesByCat: Record<string, string[]> = {};
      currentGalleryImages.forEach((img: any) => {
        if (img.categoryId) {
          if (!imagesByCat[img.categoryId]) {
            imagesByCat[img.categoryId] = Array(12).fill('');
          }
          if (img.index !== undefined && img.index >= 0 && img.index < 12) {
            imagesByCat[img.categoryId][img.index] = img.url;
          }
        }
      });

      currentGalleryCategories = rawGalleryCategories.map((cat: any) => ({
        ...cat,
        images: imagesByCat[cat.id] || Array(12).fill('')
      }));
      notify();
    };

    const unsubAppData = onSnapshot(doc(firestore, 'appData', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        currentAppData = docSnap.data();
        notify();
      }
    }, (error) => {
      console.error('Firestore Error in onUpdate (appData):', error);
    });

    const unsubProducts = onSnapshot(collection(firestore, 'products'), (snapshot) => {
      currentProducts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      notify();
    }, (error) => {
      console.error('Firestore Error in onUpdate (products):', error);
    });

    const unsubCategories = onSnapshot(collection(firestore, 'categories'), (snapshot) => {
      currentCategories = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id }))
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      notify();
    }, (error) => {
      console.error('Firestore Error in onUpdate (categories):', error);
    });

    const unsubStyles = onSnapshot(collection(firestore, 'styles'), (snapshot) => {
      currentStyles = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      notify();
    }, (error) => {
      console.error('Firestore Error in onUpdate (styles):', error);
    });

    const unsubOrders = onSnapshot(collection(firestore, 'orders'), (snapshot) => {
      currentOrders = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      notify();
    }, (error) => {
      console.error('Firestore Error in onUpdate (orders):', error);
    });

    const unsubGallery = onSnapshot(collection(firestore, 'galleryCategories'), (snapshot) => {
      rawGalleryCategories = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      updateGalleryCategories();
    }, (error) => {
      console.error('Firestore Error in onUpdate (gallery):', error);
    });

    const unsubGalleryImages = onSnapshot(collection(firestore, 'galleryImages'), (snapshot) => {
      currentGalleryImages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      updateGalleryCategories();
    }, (error) => {
      console.error('Firestore Error in onUpdate (galleryImages):', error);
    });

    return () => {
      unsubAppData();
      unsubProducts();
      unsubCategories();
      unsubStyles();
      unsubOrders();
      unsubGallery();
      unsubGalleryImages();
    };
  },

  onNewOrder(callback: (order: Order) => void) {
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          callback({ ...change.doc.data(), id: change.doc.id } as Order);
        }
      });
    }, (error) => {
      console.error('Firestore Error in onNewOrder:', error);
    });
    return unsub;
  }
};
