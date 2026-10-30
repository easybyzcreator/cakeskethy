export interface Category {
  id: string;
  name: string;
  order: number;
}

export interface GalleryCategory {
  id: string;
  name: string;
  images: string[]; // Always 12 images
}

export interface Product {
  id: string;
  categoryId: string;
  galleryCategoryId?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  active: boolean;
  isComplex?: boolean;
  showStartingFrom?: boolean;
  priceOnRequest?: boolean;
  isBatchProduct?: boolean;
  batchPrices?: {
    p25: number;
    p100: number;
  };
  options?: {
    massas: string[];
    tamanhos: { name: string; price: number }[];
    recheios: string[];
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  priceOnRequest?: boolean;
  isBatch?: boolean;
  batchType?: '25' | '100';
  options?: {
    massa?: string;
    tamanho?: string;
    recheio?: string;
    cobertura?: string;
    estilo?: string;
    estiloPersonalizado?: string;
    galleryCategoryName?: string;
    galleryPhotoIndex?: number;
  };
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerBirthday: string;
  customerAddress: string;
  customerNumber: string;
  customerZip: string;
  customerCity: string;
  customerNotes?: string;
  deliveryDate: string;
  createdAt: string;
  deliveryPhoto?: string;
}

export interface Settings {
  whatsapp: string;
  slug: string;
  adminPassword?: string;
  cakeStyles?: string[]; // Legacy, keep for compatibility
  galleryCategories?: GalleryCategory[];
}

export interface AppData {
  categories: Category[];
  products: Product[];
  settings: Settings;
  orders: Order[];
  styles: CakeStyle[];
}

export interface CakeStyle {
  id: string;
  imageUrl: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  birthday: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  lastOrderDate: string;
}
