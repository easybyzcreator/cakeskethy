import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc,
  query,
  orderBy,
  where,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { db as firestore, auth } from '../firebase';
import { AppData, Product, Category, Order, CakeStyle, Customer, GalleryCategory } from '../types';

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(firestore, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

function sanitizeData(data: any): any {
  return JSON.parse(JSON.stringify(data, (_, value) => value === undefined ? null : value));
}

export const db = {
  async getAppData(): Promise<AppData | undefined> {
    const path = 'appData/main';
    try {
      const docSnap = await getDoc(doc(firestore, 'appData', 'main'));
      if (docSnap.exists()) {
        const data = docSnap.data() as AppData;
        // Ensure products and categories are handled separately now
        return { ...data, products: [], categories: [] };
      }
      return undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveAppData(data: AppData) {
    const path = 'appData/main';
    try {
      // Don't save products or categories in the main document anymore
      const { products, orders, styles, categories, ...rest } = data;
      const sanitizedData = sanitizeData(rest);
      return await setDoc(doc(firestore, 'appData', 'main'), sanitizedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getCategories(): Promise<Category[]> {
    const path = 'categories';
    try {
      const q = query(collection(firestore, 'categories'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveCategory(category: Category) {
    const path = `categories/${category.id}`;
    try {
      const sanitizedData = sanitizeData(category);
      return await setDoc(doc(firestore, 'categories', category.id), sanitizedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteCategory(id: string) {
    const path = `categories/${id}`;
    try {
      return await deleteDoc(doc(firestore, 'categories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getProducts(): Promise<Product[]> {
    const path = 'products';
    try {
      const querySnapshot = await getDocs(collection(firestore, 'products'));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Product));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async saveProduct(product: Product) {
    const path = `products/${product.id}`;
    try {
      const sanitizedData = sanitizeData(product);
      return await setDoc(doc(firestore, 'products', product.id), sanitizedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteProduct(id: string) {
    const path = `products/${id}`;
    try {
      return await deleteDoc(doc(firestore, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getStyles(): Promise<CakeStyle[]> {
    const path = 'styles';
    try {
      const querySnapshot = await getDocs(collection(firestore, 'styles'));
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CakeStyle));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async getGalleryCategories(): Promise<GalleryCategory[]> {
    const path = 'galleryCategories';
    try {
      const [catSnapshot, imgSnapshot] = await Promise.all([
        getDocs(collection(firestore, 'galleryCategories')),
        getDocs(collection(firestore, 'galleryImages'))
      ]);
      
      const imagesByCat: Record<string, string[]> = {};
      imgSnapshot.docs.forEach(imgDoc => {
        const data = imgDoc.data();
        const categoryId = data.categoryId;
        const index = data.index;
        const url = data.url;
        
        if (categoryId) {
          if (!imagesByCat[categoryId]) {
            imagesByCat[categoryId] = Array(12).fill('');
          }
          if (index !== undefined && index >= 0 && index < 12) {
            imagesByCat[categoryId][index] = url;
          }
        }
      });

      return catSnapshot.docs.map(doc => {
        const catData = doc.data();
        return {
          ...catData,
          id: doc.id,
          images: imagesByCat[doc.id] || Array(12).fill('')
        } as GalleryCategory;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getGalleryCategory(id: string): Promise<GalleryCategory | undefined> {
    const path = `galleryCategories/${id}`;
    try {
      const docSnap = await getDoc(doc(firestore, 'galleryCategories', id));
      if (docSnap.exists()) {
        const cat = { ...docSnap.data(), id: docSnap.id } as GalleryCategory;
        // Fetch images from flat collection
        const q = query(collection(firestore, 'galleryImages'), where('categoryId', '==', id));
        const imagesSnapshot = await getDocs(q);
        const images = Array(12).fill('');
        imagesSnapshot.docs.forEach(imgDoc => {
          const data = imgDoc.data();
          const index = data.index;
          if (index !== undefined && index >= 0 && index < 12) {
            images[index] = data.url;
          }
        });
        return { ...cat, images };
      }
      return undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveGalleryCategory(category: GalleryCategory) {
    const path = `galleryCategories/${category.id}`;
    try {
      // Only save the name in the main document
      const { images, ...rest } = category;
      const cleanData = sanitizeData(rest);
      await setDoc(doc(firestore, 'galleryCategories', category.id), cleanData);
      
      // Save images individually if provided
      if (images && images.length > 0) {
        const batch = writeBatch(firestore);
        images.forEach((url, index) => {
          if (url) {
            const imgId = `${category.id}_${index}`;
            const imgRef = doc(firestore, 'galleryImages', imgId);
            batch.set(imgRef, { categoryId: category.id, index, url });
          }
        });
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveGalleryImage(categoryId: string, index: number, url: string) {
    // Using flat structure for gallery images to avoid permission and size issues
    const imgId = `${categoryId}_${index}`;
    const path = `galleryImages/${imgId}`;
    try {
      const imgRef = doc(firestore, 'galleryImages', imgId);
      if (url) {
        await setDoc(imgRef, { categoryId, index, url });
      } else {
        await deleteDoc(imgRef);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteGalleryCategory(id: string) {
    const path = `galleryCategories/${id}`;
    try {
      // Delete associated images from flat collection
      const q = query(collection(firestore, 'galleryImages'), where('categoryId', '==', id));
      const imagesSnapshot = await getDocs(q);
      const batch = writeBatch(firestore);
      imagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      await deleteDoc(doc(firestore, 'galleryCategories', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async saveStyle(style: CakeStyle) {
    const path = `styles/${style.id}`;
    try {
      const sanitizedData = sanitizeData(style);
      return await setDoc(doc(firestore, 'styles', style.id), sanitizedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteStyle(id: string) {
    const path = `styles/${id}`;
    try {
      return await deleteDoc(doc(firestore, 'styles', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getCustomers(): Promise<Customer[]> {
    const path = 'customers';
    try {
      const querySnapshot = await getDocs(collection(firestore, 'customers'));
      return querySnapshot.docs.map(doc => doc.data() as Customer);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async saveCustomer(customer: Customer) {
    const path = `customers/${customer.phone}`;
    try {
      const sanitizedData = sanitizeData(customer);
      return await setDoc(doc(firestore, 'customers', customer.phone), sanitizedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getOrders(): Promise<Order[]> {
    const path = 'orders';
    try {
      const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Order));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async saveOrder(order: Order) {
    const path = `orders/${order.id}`;
    try {
      const sanitizedData = sanitizeData(order);
      return await setDoc(doc(firestore, 'orders', order.id), sanitizedData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteCustomer(phone: string) {
    const path = `customers/${phone}`;
    try {
      return await deleteDoc(doc(firestore, 'customers', phone));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async deleteOrdersByPhone(phone: string) {
    const path = `orders?customerPhone=${phone}`;
    try {
      const q = query(collection(firestore, 'orders'), where('customerPhone', '==', phone));
      const querySnapshot = await getDocs(q);
      
      const batch = writeBatch(firestore);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      return await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
