import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Package, Tag, Settings, LogOut, Plus, Edit2, Trash2, Eye, EyeOff, TrendingUp, Users, X, Save, Image as ImageIcon, Calendar, Phone, Mail, User, Search, Filter, MapPin, Cake, Check, CheckCircle, ChevronDown, ChevronUp, MessageCircle, Menu } from 'lucide-react';
import { api } from '../services/api';
import { crmService, Customer } from '../services/crm';
import { AppData, Product, Category, Order, GalleryCategory } from '../types';
import { Footer } from '../components/Footer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Admin() {
  const [data, setData] = useState<AppData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'settings' | 'crm' | 'gallery'>('dashboard');
  
  // CRM state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [crmFilter, setCrmFilter] = useState<'all' | 'birthday'>('all');
  const [crmSearch, setCrmSearch] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [isUploadingDelivery, setIsUploadingDelivery] = useState<string | null>(null);

  // Gallery state
  const [galleryCategories, setGalleryCategories] = useState<GalleryCategory[]>([]);
  const [activeGalleryCategory, setActiveGalleryCategory] = useState<string | null>(null);
  const [isUploadingGallery, setIsUploadingGallery] = useState<number | null>(null);
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isGalleryCategoryModalOpen, setIsGalleryCategoryModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingGalleryCategory, setEditingGalleryCategory] = useState<Partial<GalleryCategory> | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'week'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [p25Input, setP25Input] = useState('');
  const [p100Input, setP100Input] = useState('');
  
  // Settings local state
  const [localSettings, setLocalSettings] = useState({ whatsapp: '', slug: '' });
  const [newPassword, setNewPassword] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    const manifestLink = document.querySelector('link[rel="manifest"]');
    const appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
    const favicon = document.querySelector('link[rel="icon"]');
    const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    const oldTitle = document.title;
    
    if (manifestLink) manifestLink.setAttribute('href', '/manifest-admin.json');
    if (appleIcon) appleIcon.setAttribute('href', 'https://i.ibb.co/wG9J2LT/cake-kethy-admin.png');
    if (favicon) favicon.setAttribute('href', 'https://i.ibb.co/wG9J2LT/cake-kethy-admin.png');
    if (appleTitle) appleTitle.setAttribute('content', 'Cakes Kethy Admin');
    document.title = "Cakes Kethy Admin";

    return () => {
      if (manifestLink) manifestLink.setAttribute('href', '/manifest.json');
      if (appleIcon) appleIcon.setAttribute('href', 'https://raw.githubusercontent.com/easybyzcreator/imagens/9f6ed6752725671cee6475766827d45d2e7dcceb/patitour%20-%202026-10-30T102834.271.png');
      if (favicon) favicon.setAttribute('href', 'https://raw.githubusercontent.com/easybyzcreator/imagens/9f6ed6752725671cee6475766827d45d2e7dcceb/patitour%20-%202026-10-30T102834.271.png');
      if (appleTitle) appleTitle.setAttribute('content', 'CAKES KETHY');
      document.title = "CAKES KETHY | Cardápio Digital";
    };
  }, []);

  useEffect(() => {
    if (token) {
      api.getData().then(d => {
        setData(d);
        setLocalSettings({ whatsapp: d.settings.whatsapp, slug: d.settings.slug });
        setGalleryCategories(d.settings.galleryCategories || []);
        if (d.settings.galleryCategories?.length && !activeGalleryCategory) {
          setActiveGalleryCategory(d.settings.galleryCategories[0].id);
        }
        crmService.syncCustomersFromOrders(d.orders).then(() => {
          crmService.getCustomers().then(setCustomers);
        });
      });
      return api.onUpdate(d => {
        setData(d);
        setLocalSettings({ whatsapp: d.settings.whatsapp, slug: d.settings.slug });
        setGalleryCategories(d.settings.galleryCategories || []);
        
        crmService.syncCustomersFromOrders(d.orders).then(() => {
          crmService.getCustomers().then(setCustomers);
        });
      });
    }
  }, [token]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
    } catch (err) {
      showNotification('Erro ao copiar link', 'error');
    }
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    try {
      // Ensure whatsapp starts with +1
      const whatsapp = localSettings.whatsapp.startsWith('+1') 
        ? localSettings.whatsapp 
        : `+1${localSettings.whatsapp.replace(/\D/g, '')}`;
        
      await api.updateSettings({ ...localSettings, whatsapp }, token);
      showNotification('Configurações salvas com sucesso!');
    } catch (err) {
      showNotification('Erro ao salvar configurações', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!token || !newPassword) return;
    setConfirmModal({
      title: 'Alterar Senha',
      message: 'Tem certeza que deseja alterar a senha de acesso?',
      onConfirm: async () => {
        try {
          await api.updateSettings({ adminPassword: newPassword }, token);
          showNotification('Senha alterada com sucesso!');
          setNewPassword('');
        } catch (err) {
          showNotification('Erro ao alterar senha', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file || !token || !activeGalleryCategory) return;

    setIsUploadingGallery(index);
    try {
      const { imageUrl } = await api.uploadImage(file, token);
      const category = galleryCategories.find(cat => cat.id === activeGalleryCategory);
      if (category) {
        await api.saveGalleryImage(activeGalleryCategory, index, imageUrl, token);
        
        const newImages = [...category.images];
        newImages[index] = imageUrl;
        const newCategories = galleryCategories.map(cat => 
          cat.id === activeGalleryCategory ? { ...cat, images: newImages } : cat
        );
        setGalleryCategories(newCategories);
      }
    } catch (err) {
      showNotification('Erro ao fazer upload da imagem', 'error');
    } finally {
      setIsUploadingGallery(null);
    }
  };

  const handleRemoveGalleryImage = async (index: number) => {
    if (!token || !activeGalleryCategory) return;
    setConfirmModal({
      title: 'Remover Imagem',
      message: 'Tem certeza que deseja remover esta imagem?',
      onConfirm: async () => {
        try {
          const category = galleryCategories.find(cat => cat.id === activeGalleryCategory);
          if (category) {
            await api.saveGalleryImage(activeGalleryCategory, index, '', token);
            
            const newImages = [...category.images];
            newImages[index] = '';
            const newCategories = galleryCategories.map(cat => 
              cat.id === activeGalleryCategory ? { ...cat, images: newImages } : cat
            );
            setGalleryCategories(newCategories);
          }
        } catch (err) {
          showNotification('Erro ao remover imagem', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleSaveGalleryCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingGalleryCategory) return;

    try {
      if (editingGalleryCategory.id) {
        await api.updateGalleryCategory(editingGalleryCategory.id, { name: editingGalleryCategory.name || 'Sem Nome' }, token);
      } else {
        const newCat = await api.createGalleryCategory({
          name: editingGalleryCategory.name || 'Nova Galeria',
          images: Array(12).fill('')
        }, token);
        setActiveGalleryCategory(newCat.id);
      }
      
      setIsGalleryCategoryModalOpen(false);
      setEditingGalleryCategory(null);
      showNotification('Galeria salva com sucesso!');
    } catch (err) {
      console.error('Error in handleSaveGalleryCategory:', err);
      showNotification('Erro ao salvar categoria da galeria', 'error');
    }
  };

  const handleDeleteGalleryCategory = async (id: string) => {
    if (!token) return;
    setConfirmModal({
      title: 'Excluir Categoria',
      message: 'Tem certeza que deseja excluir esta categoria de galeria? Todas as imagens serão perdidas.',
      onConfirm: async () => {
        try {
          await api.deleteGalleryCategory(id, token);
          if (activeGalleryCategory === id) {
            setActiveGalleryCategory(null);
          }
          showNotification('Categoria excluída com sucesso!');
        } catch (err) {
          showNotification('Erro ao excluir categoria', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleDeliveryPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, customerId: string, orderId: string) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingDelivery(orderId);
    try {
      const { imageUrl } = await api.uploadImage(file, token);
      await crmService.updateOrderDeliveryPhoto(customerId, orderId, imageUrl);
      const updated = await crmService.getCustomers();
      setCustomers(updated);
      showNotification('Foto de entrega enviada com sucesso!');
    } catch (err) {
      showNotification('Erro ao fazer upload da foto de entrega', 'error');
    } finally {
      setIsUploadingDelivery(null);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = (c.name || '').toLowerCase().includes(crmSearch.toLowerCase()) || 
                         (c.phone || '').includes(crmSearch);
    
    if (crmFilter === 'birthday') {
      if (!c.birthday) return false;
      const parts = c.birthday.split('/');
      if (parts.length < 2) return false;
      
      const [month, day] = parts.map(Number);
      if (!month || !day) return false;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      const today = new Date(currentYear, now.getMonth(), now.getDate());
      
      // Create birthday date for this year
      const bday = new Date(currentYear, month - 1, day);
      
      // If birthday already passed this year, check next year
      if (bday < today) {
        bday.setFullYear(currentYear + 1);
      }
      
      const diffTime = bday.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return matchesSearch && diffDays >= 0 && diffDays <= 7;
    }
    
    return matchesSearch;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploading(true);
    try {
      const { imageUrl } = await api.uploadImage(file, token);
      setEditingProduct(prev => ({ ...prev, image: imageUrl } as any));
    } catch (err) {
      showNotification('Erro ao fazer upload da imagem', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token } = await api.login(password);
      setToken(token);
      localStorage.setItem('admin_token', token);
      showNotification('Login realizado com sucesso!');
    } catch (err) {
      showNotification('Senha incorreta', 'error');
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  const toggleProductStatus = async (product: Product) => {
    if (!token) return;
    try {
      await api.updateProduct(product.id, { active: !product.active }, token);
      showNotification(`Produto ${!product.active ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (err) {
      showNotification('Erro ao alterar status do produto', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!token) return;
    setConfirmModal({
      title: 'Excluir Produto',
      message: 'Tem certeza que deseja excluir este produto?',
      onConfirm: async () => {
        try {
          await api.deleteProduct(id, token);
          showNotification('Produto excluído com sucesso!');
        } catch (err) {
          showNotification('Erro ao excluir produto', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const number = parseInt(digits) / 100;
    if (isNaN(number)) return '0.00';
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const parseCurrency = (value: string) => {
    const normalized = value.replace(/,/g, '');
    return parseFloat(normalized) || 0;
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setPriceInput(formatted);
    setEditingProduct(prev => ({ ...prev, price: parseCurrency(formatted) } as any));
  };

  const handleP25Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    const value = parseCurrency(formatted);
    setP25Input(formatted);
    setEditingProduct(prev => ({ 
      ...prev, 
      batchPrices: { ...(prev?.batchPrices || { p25: 0, p100: 0 }), p25: value },
      price: value,
      showStartingFrom: true
    } as any));
    setPriceInput(formatted);
  };

  const handleP100Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    const value = parseCurrency(formatted);
    setP100Input(formatted);
    setEditingProduct(prev => ({ 
      ...prev, 
      batchPrices: { ...(prev?.batchPrices || { p25: 0, p100: 0 }), p100: value } 
    } as any));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;

    try {
      if (editingProduct.id) {
        await api.updateProduct(editingProduct.id, editingProduct, token);
      } else {
        await api.createProduct({ ...editingProduct, active: true }, token);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      showNotification('Produto salvo com sucesso!');
    } catch (err) {
      showNotification('Erro ao salvar produto', 'error');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!token) return;
    setConfirmModal({
      title: 'Excluir Categoria',
      message: 'Tem certeza que deseja excluir esta categoria?',
      onConfirm: async () => {
        try {
          await api.deleteCategory(id, token);
          showNotification('Categoria excluída com sucesso!');
        } catch (err) {
          showNotification('Erro ao excluir categoria', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleDeleteCustomer = async (id: string) => {
    setConfirmModal({
      title: 'Excluir Cliente',
      message: 'Tem certeza que deseja excluir este cliente e TODO o seu histórico de pedidos?',
      onConfirm: async () => {
        try {
          // Delete from Firestore (cascading)
          await api.deleteCustomer(id);
          // Delete from local CRM
          await crmService.deleteCustomer(id);
          
          const updated = await crmService.getCustomers();
          setCustomers(updated);
          showNotification('Cliente e pedidos excluídos com sucesso!');
        } catch (err) {
          showNotification('Erro ao excluir cliente', 'error');
        }
        setConfirmModal(null);
      }
    });
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !editingCustomer.id) return;
    
    const sanitizedCustomer = {
      ...editingCustomer,
      orders: editingCustomer.orders.map(o => ({
        ...o,
        total: typeof o.total === 'string' ? parseFloat(o.total.replace(',', '.')) || 0 : o.total
      }))
    };
    
    await crmService.saveCustomer(sanitizedCustomer as Customer);
    const updated = await crmService.getCustomers();
    setCustomers(updated);
    setIsCustomerModalOpen(false);
    setEditingCustomer(null);
    showNotification('Dados do cliente salvos com sucesso!');
  };

  const handleMoveCategory = async (id: string, direction: 'up' | 'down') => {
    if (!token || !data) return;
    
    const categories = [...data.categories].sort((a, b) => a.order - b.order);
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return;
    
    if (direction === 'up' && index > 0) {
      const temp = categories[index].order;
      categories[index].order = categories[index - 1].order;
      categories[index - 1].order = temp;
    } else if (direction === 'down' && index < categories.length - 1) {
      const temp = categories[index].order;
      categories[index].order = categories[index + 1].order;
      categories[index + 1].order = temp;
    } else {
      return;
    }
    
    try {
      await api.reorderCategories(categories, token);
      const updatedData = await api.getData();
      setData(updatedData);
    } catch (err) {
      showNotification('Erro ao reordenar categorias', 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingCategory) return;

    try {
      if (editingCategory.id) {
        await api.updateCategory(editingCategory.id, editingCategory, token);
      } else {
        await api.createCategory(editingCategory, token);
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      showNotification('Categoria salva com sucesso!');
    } catch (err) {
      showNotification('Erro ao salvar categoria', 'error');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen relative flex flex-col items-center justify-center p-6">
        {/* Background Image & Overlay */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("https://raw.githubusercontent.com/easybyzcreator/imagens/67f98a068d984be73f96ae2217305d69684aeeaa/kethy%20cake.png")' }}
        />
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-white/95 to-white/90" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl text-center"
        >
          <img src="https://raw.githubusercontent.com/easybyzcreator/imagens/9f6ed6752725671cee6475766827d45d2e7dcceb/LOGO%20CAKES%20KETHY%20FUNDOTRANSPARENTE.png" alt="Logo" className="w-24 mx-auto mb-8" referrerPolicy="no-referrer" />
          <h1 className="text-2xl font-serif text-primary italic mb-8">Painel Administrativo</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              placeholder="Senha de Acesso"
              className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-colors">
              Entrar
            </button>
          </form>
        </motion.div>
        <div className="relative z-10">
          <Footer />
        </div>
      </div>
    );
  }

  if (!data) return <div className="flex items-center justify-center h-screen text-primary">Carregando...</div>;

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-stone-100 p-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <img src="https://raw.githubusercontent.com/easybyzcreator/imagens/9f6ed6752725671cee6475766827d45d2e7dcceb/LOGO%20CAKES%20KETHY%20FUNDOTRANSPARENTE.png" alt="Logo" className="w-10" referrerPolicy="no-referrer" />
          <span className="text-primary font-serif italic text-sm">Admin</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-stone-400 hover:text-primary transition-colors"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-stone-100 flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 border-b border-stone-100 flex flex-col items-center relative">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-stone-400 hover:text-primary"
          >
            <X size={20} />
          </button>
          <img src="https://raw.githubusercontent.com/easybyzcreator/imagens/9f6ed6752725671cee6475766827d45d2e7dcceb/LOGO%20CAKES%20KETHY%20FUNDOTRANSPARENTE.png" alt="Logo" className="w-20 mb-4" referrerPolicy="no-referrer" />
          <h2 className="text-primary font-serif italic text-lg">Cakes Kethy Admin</h2>
        </div>
        
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'products', icon: Package, label: 'Produtos' },
            { id: 'categories', icon: Tag, label: 'Categorias' },
            { id: 'crm', icon: Users, label: 'Clientes & CRM' },
            { id: 'gallery', icon: ImageIcon, label: 'Galeria de Estilos' },
            { id: 'settings', icon: Settings, label: 'Configurações' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center space-x-4 px-6 py-4 rounded-xl transition-all",
                activeTab === item.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-stone-400 hover:bg-stone-50 hover:text-primary"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-stone-100">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-4 px-6 py-4 rounded-xl text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair do Painel</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 md:p-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif text-primary italic capitalize">{activeTab}</h1>
            <p className="text-stone-400 mt-1 text-sm md:text-base">Gerencie seu negócio em tempo real</p>
          </div>
          
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-2xl border border-stone-100 flex items-center space-x-3 w-full md:w-auto justify-center md:justify-start">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs md:text-sm font-medium text-stone-600">Sincronizado</span>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="bg-accent/5 border border-accent/20 p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h3 className="text-primary font-bold">Seu Cardápio Digital está Online!</h3>
                <p className="text-sm text-stone-500">Compartilhe o link abaixo com seus clientes:</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-3">
                  <a 
                    href={`${window.location.origin}/#/order/${data.settings?.slug}`} 
                    target="_blank" 
                    className="text-accent font-mono text-[10px] sm:text-xs hover:underline break-all"
                  >
                    {window.location.origin}/#/order/{data.settings?.slug}
                  </a>
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}/#/order/${data.settings?.slug}`)}
                    className="text-[10px] uppercase tracking-widest font-bold text-accent hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {isCopying ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(true)}
                className="w-full md:w-auto bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary transition-colors whitespace-nowrap"
              >
                Ver Cardápio
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-serif text-primary italic">Próximas Entregas / Retiradas</h2>
                <div className="flex bg-stone-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setDashboardFilter('all')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      dashboardFilter === 'all' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    Todos os Pedidos
                  </button>
                  <button 
                    onClick={() => setDashboardFilter('week')}
                    className={cn(
                      "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      dashboardFilter === 'week' ? "bg-white text-primary shadow-sm" : "text-stone-400 hover:text-stone-600"
                    )}
                  >
                    Pedidos da Semana
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {(() => {
                  const now = new Date();
                  const nextWeek = new Date();
                  nextWeek.setDate(now.getDate() + 7);

                  const allOrders = data.orders.map(order => {
                    let deliveryDateObj = new Date(0);
                    if (order.deliveryDate) {
                      const [m, d, y] = order.deliveryDate.split('/').map(Number);
                      if (m && d && y) {
                        deliveryDateObj = new Date(y, m - 1, d);
                      }
                    }
                    return { ...order, deliveryDateObj };
                  })
                  .filter(order => {
                    if (!order.deliveryDate) return false;
                    if (dashboardFilter === 'week') {
                      return order.deliveryDateObj >= now && order.deliveryDateObj <= nextWeek;
                    }
                    return true;
                  })
                  .sort((a, b) => a.deliveryDateObj.getTime() - b.deliveryDateObj.getTime());

                  if (allOrders.length === 0) {
                    return (
                      <div className="bg-white p-12 rounded-3xl border border-stone-100 text-center">
                        <Calendar size={48} className="mx-auto text-stone-200 mb-4" />
                        <p className="text-stone-400 font-medium">
                          {dashboardFilter === 'week' 
                            ? "Nenhum pedido agendado para os próximos 7 dias." 
                            : "Nenhuma entrega agendada para os próximos dias."}
                        </p>
                      </div>
                    );
                  }

                  return allOrders.slice(0, 10).map(order => (
                    <div key={order.id} className="bg-white p-6 rounded-2xl border border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                          <Calendar size={24} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-bold text-primary">{order.customerName}</h3>
                            <span className="text-[10px] px-2 py-0.5 bg-accent/10 text-accent rounded-full font-bold uppercase tracking-wider">
                              {order.deliveryDate}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1">
                            {order.items.length} {order.items.length === 1 ? 'item' : 'itens'} • Total: ${Number(order.total || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setActiveTab('crm');
                          setCrmSearch(order.customerName);
                        }}
                        className="text-xs font-bold uppercase tracking-widest text-accent hover:text-primary transition-colors"
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-serif text-primary italic">Catálogo de Produtos</h2>
              <button 
                onClick={() => {
                  setEditingProduct({ categoryId: data.categories[0]?.id, isComplex: false, price: 0, showStartingFrom: false, priceOnRequest: false });
                  setPriceInput('0,00');
                  setP25Input('0,00');
                  setP100Input('0,00');
                  setIsProductModalOpen(true);
                }}
                className="w-full sm:w-auto bg-accent text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-primary transition-colors"
              >
                <Plus size={20} />
                <span>Novo Produto</span>
              </button>
            </div>

            <div className="grid gap-4">
              {data.products.map(product => (
                <div key={product.id} className="bg-white p-6 rounded-2xl border border-stone-100 flex items-center space-x-6 hover:shadow-md transition-shadow">
                  <img src={product.image} alt={product.name} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-primary font-bold">{product.name}</h3>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider",
                        product.active ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">{product.description}</p>
                    <p className="text-[10px] text-stone-300 uppercase tracking-widest mt-2">
                      {data.categories.find(c => c.id === product.categoryId)?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-accent font-bold">
                      {product.priceOnRequest ? (
                        'Sob Consulta'
                      ) : product.isBatchProduct ? (
                        `$${(product.batchPrices?.p25 || 0).toFixed(2)} / $${(product.batchPrices?.p100 || 0).toFixed(2)}`
                      ) : (
                        `$${(product.price || 0).toFixed(2)}`
                      )}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <button 
                        onClick={() => toggleProductStatus(product)}
                        className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-colors"
                        title={product.active ? "Desativar" : "Ativar"}
                      >
                        {product.active ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button 
                        onClick={() => {
                          setEditingProduct(product);
                          setPriceInput((product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                          setP25Input((product.batchPrices?.p25 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                          setP100Input((product.batchPrices?.p100 || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                          setIsProductModalOpen(true);
                        }}
                        className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id)}
                        className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-serif text-primary italic">Categorias do Cardápio</h2>
              <button 
                onClick={() => {
                  setEditingCategory({ name: '', order: (data?.categories?.length || 0) });
                  setIsCategoryModalOpen(true);
                }}
                className="w-full sm:w-auto bg-accent text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-primary transition-colors"
              >
                <Plus size={20} />
                <span>Nova Categoria</span>
              </button>
            </div>

            <div className="grid gap-4">
              {data.categories.sort((a, b) => a.order - b.order).map((category, index) => (
                <div key={category.id} className="bg-white p-6 rounded-2xl border border-stone-100 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <button 
                        disabled={index === 0}
                        onClick={() => handleMoveCategory(category.id, 'up')}
                        className="p-1 text-stone-300 hover:text-accent disabled:opacity-0 transition-colors"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button 
                        disabled={index === data.categories.length - 1}
                        onClick={() => handleMoveCategory(category.id, 'down')}
                        className="p-1 text-stone-300 hover:text-accent disabled:opacity-0 transition-colors"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <h3 className="text-primary font-bold">{category.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => {
                        setEditingCategory(category);
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-2 text-stone-400 hover:text-primary hover:bg-stone-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'crm' && (
          <div className="space-y-8">
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-8 border border-stone-100 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
                <h2 className="text-2xl font-serif text-[#725a36] italic">Gestão de Clientes</h2>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
                    <button 
                      onClick={() => setCrmFilter('all')}
                      className={cn(
                        "px-6 py-2.5 rounded-xl font-bold text-xs transition-all",
                        crmFilter === 'all' 
                          ? "bg-[#a88141] text-white shadow-lg shadow-[#a88141]/20" 
                          : "text-stone-400 hover:text-[#725a36]"
                      )}
                    >
                      Todos os Clientes
                    </button>
                    <button 
                      onClick={() => setCrmFilter('birthday')}
                      className={cn(
                        "px-6 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition-all",
                        crmFilter === 'birthday' 
                          ? "bg-[#a88141] text-white shadow-lg shadow-[#a88141]/20" 
                          : "text-stone-400 hover:text-[#725a36]"
                      )}
                    >
                      <Calendar size={14} />
                      <span>Aniversariantes da Semana</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                    <input 
                      type="text"
                      placeholder="Buscar cliente..."
                      className="pl-12 pr-6 py-3 rounded-2xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-[#a88141]/20 transition-all text-sm w-full sm:w-64"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-3xl border border-stone-100 scrollbar-visible">
                <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100">
                      <th className="px-4 sm:px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Cliente</th>
                      <th className="px-4 sm:px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Contato</th>
                      <th className="px-4 sm:px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Último Pedido</th>
                      <th className="px-4 sm:px-8 py-5 text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold text-right">Ações</th>
                      <th className="px-2 sm:px-4 py-5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCustomers.map(customer => {
                      const lastOrder = customer.orders[customer.orders.length - 1];
                      const isExpanded = expandedCustomer === customer.id;
                      
                      return (
                        <React.Fragment key={customer.id}>
                          <tr 
                            className={cn(
                              "group transition-all cursor-pointer",
                              isExpanded ? "bg-stone-50/80" : "hover:bg-stone-50/30"
                            )}
                            onClick={() => setExpandedCustomer(isExpanded ? null : customer.id)}
                          >
                            <td className="px-4 sm:px-8 py-6">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 rounded-full bg-[#beb29f]/20 flex items-center justify-center text-[#725a36] font-bold text-lg border border-[#beb29f]/30">
                                  {customer.name.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#725a36] text-base break-words">{customer.name}</p>
                                  <p className="text-xs text-stone-400 font-medium break-all">{customer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-6">
                              <div className="flex items-center space-x-2 text-stone-600 font-medium">
                                <Phone size={14} className="text-[#a88141]" />
                                <span>{customer.phone}</span>
                                <a 
                                  href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1.5 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-all ml-1 flex items-center justify-center shadow-sm"
                                  onClick={e => e.stopPropagation()}
                                  title="Enviar mensagem no WhatsApp"
                                >
                                  <MessageCircle size={12} fill="currentColor" />
                                </a>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-6">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#725a36]">
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(lastOrder.total)}
                                </span>
                                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-0.5">
                                  {new Date(lastOrder.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-8 py-6 text-right">
                              <div className="flex items-center justify-end space-x-1" onClick={e => e.stopPropagation()}>
                                <button 
                                  onClick={() => {
                                    setEditingCustomer(customer);
                                    setIsCustomerModalOpen(true);
                                  }}
                                  className="p-2.5 text-stone-400 hover:text-[#a88141] hover:bg-white rounded-xl transition-all"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCustomer(customer.id)}
                                  className="p-2.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                            <td className="px-2 sm:px-4 py-6">
                              <div className={cn(
                                "text-stone-300 transition-transform duration-300",
                                isExpanded ? "rotate-180 text-[#a88141]" : ""
                              )}>
                                <ChevronDown size={20} />
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr>
                                <td colSpan={5} className="px-0 py-0 overflow-hidden bg-stone-50/50">
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                  >
                                    <div className="px-4 sm:px-12 py-6 sm:py-8 border-t border-stone-100 space-y-8 overflow-x-auto scrollbar-visible">
                                      {/* Customer Details Grid */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                                        <div className="space-y-2 min-w-0">
                                          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Endereço Completo</p>
                                          <div className="flex items-start space-x-2 text-stone-600">
                                            <MapPin size={16} className="text-[#a88141] mt-0.5 flex-shrink-0" />
                                            <span className="text-sm leading-relaxed break-words">
                                              {customer.address}, {customer.number}
                                              {customer.city && <><br />{customer.city}</>}
                                              {customer.zip && <><br />Zip Code: {customer.zip}</>}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Telefone</p>
                                          <div className="flex items-center space-x-2 text-stone-600">
                                            <Phone size={16} className="text-[#a88141] flex-shrink-0" />
                                            <span className="text-sm break-all">{customer.phone}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">E-mail de Contato</p>
                                          <div className="flex items-center space-x-2 text-stone-600">
                                            <Mail size={16} className="text-[#a88141] flex-shrink-0" />
                                            <span className="text-sm break-all">{customer.email}</span>
                                          </div>
                                        </div>
                                        <div className="space-y-2 min-w-0">
                                          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Data de Aniversário</p>
                                          <div className="flex items-center space-x-2 text-stone-600">
                                            <Cake size={16} className="text-[#a88141] flex-shrink-0" />
                                            <span className="text-sm font-bold">{customer.birthday}</span>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Order History */}
                                      <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Histórico de Pedidos ({customer.orders.length})</p>
                                          <div className="h-px bg-stone-100 flex-1 mx-4" />
                                        </div>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                          {[...customer.orders].reverse().map((order, idx) => (
                                            <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-100 flex flex-col justify-between gap-4 hover:shadow-md transition-all h-full">
                                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                                <div className="flex items-start space-x-3 sm:space-x-4 w-full">
                                                  <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center text-stone-400 flex-shrink-0">
                                                    <Package size={20} />
                                                  </div>
                                                  <div className="min-w-0 flex-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1">
                                                      <p className="text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">
                                                        Pedido em: {new Date(order.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                                      </p>
                                                      {order.deliveryDate && (
                                                        <div className="flex items-center space-x-1 text-accent whitespace-nowrap">
                                                          <Calendar size={12} />
                                                          <p className="text-[10px] font-bold uppercase tracking-widest">Retirada: {order.deliveryDate}</p>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="text-sm text-[#725a36] font-medium mt-1.5 space-y-2">
                                                      {order.items.map((item: any, i: number) => (
                                                        <div key={i} className="border-l-2 border-stone-100 pl-3 py-1 min-w-0">
                                                          <p className="font-bold break-words">• {item.quantity}x {item.name}</p>
                                                          {item.options && (
                                                            <div className="text-[10px] text-stone-400 space-y-0.5 mt-1 break-words">
                                                              {item.options.tamanho && <p><span className="font-bold uppercase">Tamanho:</span> {item.options.tamanho}</p>}
                                                              {item.options.massa && <p><span className="font-bold uppercase">Massa:</span> {item.options.massa}</p>}
                                                              {item.options.recheio && <p><span className="font-bold uppercase">Recheio:</span> {item.options.recheio}</p>}
                                                              {item.options.cobertura && <p><span className="font-bold uppercase">Cobertura:</span> {item.options.cobertura}</p>}
                                                              {item.options.estilo && (
                                                                <p><span className="font-bold uppercase">Estilo:</span> {
                                                                  item.options.estilo === 'custom' 
                                                                    ? `Personalizado - ${item.options.estiloPersonalizado || 'Não descrito'}`
                                                                    : (item.options.galleryCategoryName && item.options.galleryPhotoIndex !== undefined
                                                                        ? `Galeria ${item.options.galleryCategoryName} - Foto #${(item.options.galleryPhotoIndex + 1).toString().padStart(2, '0')}`
                                                                        : `Modelo ${item.options.estilo.replace('style-', '')}`)
                                                                }</p>
                                                              )}
                                                            </div>
                                                          )}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                </div>
                                                
                                                {order.customerNotes && (
                                                  <div className="mt-2 p-4 bg-stone-50 rounded-xl border border-stone-100">
                                                    <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-1">Observações do Cliente</p>
                                                    <p className="text-sm text-[#725a36] italic">"{order.customerNotes}"</p>
                                                  </div>
                                                )}
                                                
                                                <div className="text-right">
                                                  <span className="text-base font-bold text-[#a88141]">
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(order.total)}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Delivery Photo Section */}
                                              <div className="pt-4 border-t border-stone-50">
                                                <div className="flex items-center justify-between mb-3">
                                                  <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Foto da Entrega</p>
                                                  {!order.deliveryPhoto && (
                                                    <label className="text-[10px] uppercase tracking-widest font-bold text-accent hover:text-primary cursor-pointer transition-colors">
                                                      {isUploadingDelivery === order.id ? 'Enviando...' : 'Anexar Foto'}
                                                      <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        className="hidden" 
                                                        onChange={(e) => handleDeliveryPhotoUpload(e, customer.id, order.id)}
                                                        disabled={isUploadingDelivery !== null}
                                                      />
                                                    </label>
                                                  )}
                                                </div>
                                                
                                                {order.deliveryPhoto ? (
                                                  <div className="relative w-24 h-24 rounded-xl overflow-hidden group">
                                                    <img src={order.deliveryPhoto} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                      <label className="cursor-pointer">
                                                        <Edit2 size={14} className="text-white" />
                                                        <input 
                                                          type="file" 
                                                          accept="image/*" 
                                                          className="hidden" 
                                                          onChange={(e) => handleDeliveryPhotoUpload(e, customer.id, order.id)}
                                                          disabled={isUploadingDelivery !== null}
                                                        />
                                                      </label>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-100 bg-stone-50/50 flex flex-col items-center justify-center text-stone-300">
                                                    <ImageIcon size={20} className="mb-1" />
                                                    <span className="text-[8px] uppercase font-bold">Sem Foto</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                  <div className="p-20 text-center">
                    <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-200">
                      <Users size={32} />
                    </div>
                    <p className="text-stone-400 font-medium">Nenhum cliente encontrado com os filtros atuais.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gallery' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-serif text-primary italic">Galerias de Estilos</h2>
                <p className="text-sm text-stone-400">Crie categorias e gerencie as 12 imagens de cada uma</p>
              </div>
              <button 
                onClick={() => {
                  setEditingGalleryCategory({});
                  setIsGalleryCategoryModalOpen(true);
                }}
                className="w-full sm:w-auto bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 hover:bg-accent transition-all"
              >
                <Plus size={18} />
                <span>Nova Categoria</span>
              </button>
            </div>

            {galleryCategories.length > 0 ? (
              <div className="space-y-8">
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-3">
                  {galleryCategories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => {
                        if (activeGalleryCategory === cat.id) {
                          setEditingGalleryCategory(cat);
                          setIsGalleryCategoryModalOpen(true);
                        } else {
                          setActiveGalleryCategory(cat.id);
                        }
                      }}
                      className={cn(
                        "px-6 py-3 rounded-xl font-bold text-sm transition-all border flex items-center space-x-2 group",
                        activeGalleryCategory === cat.id 
                          ? "bg-accent text-white border-accent shadow-lg shadow-accent/20" 
                          : "bg-white text-stone-400 border-stone-100 hover:text-primary hover:border-stone-200"
                      )}
                    >
                      <span>{cat.name}</span>
                      {activeGalleryCategory === cat.id && (
                        <Edit2 size={12} className="opacity-60" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Images Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {(galleryCategories.find(c => c.id === activeGalleryCategory)?.images || []).map((style, index) => (
                    <div key={index} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm flex flex-col items-center relative">
                      <div className="absolute top-8 left-8 z-10 w-6 h-6 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] font-bold text-primary border border-stone-100 shadow-sm">
                        {index + 1}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-stone-300 mb-4">Modelo {index + 1}</span>
                      
                      <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden group">
                        {style ? (
                          <>
                            <img src={style} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                              <label className="p-2 bg-white rounded-lg cursor-pointer hover:bg-accent hover:text-white transition-all">
                                <Edit2 size={18} />
                                <input 
                                  type="file" 
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleGalleryUpload(e, index)}
                                  disabled={isUploadingGallery !== null}
                                />
                              </label>
                              <button 
                                onClick={() => handleRemoveGalleryImage(index)}
                                className="p-2 bg-white rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center text-stone-300">
                            <ImageIcon size={32} className="mb-2" />
                            <span className="text-[10px] font-bold uppercase">Vazio</span>
                            <input 
                              type="file" 
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => handleGalleryUpload(e, index)}
                              disabled={isUploadingGallery !== null}
                            />
                          </div>
                        )}
                        
                        {isUploadingGallery === index && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-20 rounded-[2.5rem] border border-stone-100 shadow-sm text-center">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-200">
                  <ImageIcon size={40} />
                </div>
                <h3 className="text-xl font-serif text-primary italic mb-2">Nenhuma Galeria Criada</h3>
                <p className="text-stone-400 max-w-md mx-auto mb-8">Crie sua primeira categoria de galeria para começar a organizar as fotos dos seus modelos.</p>
                <button 
                  onClick={() => {
                    setEditingGalleryCategory({});
                    setIsGalleryCategoryModalOpen(true);
                  }}
                  className="bg-primary text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-all"
                >
                  Criar Primeira Galeria
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8 max-w-2xl">
            <div className="bg-white p-6 sm:p-10 rounded-3xl border border-stone-100 shadow-sm">
              <h2 className="text-xl font-serif text-primary italic mb-8">Configurações do Negócio</h2>
              <div className="space-y-8">
                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">WhatsApp para Pedidos</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400 font-bold">+1</span>
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-6 py-4 rounded-xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      value={localSettings?.whatsapp?.replace('+1', '') || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setLocalSettings({ ...localSettings, whatsapp: `+1${val}` });
                      }}
                      placeholder="(000) 000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Slug da Loja (Link)</label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:space-x-4">
                    <input 
                      type="text" 
                      className="flex-1 px-6 py-4 rounded-xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                      value={localSettings?.slug || ''}
                      onChange={(e) => setLocalSettings({ ...localSettings, slug: e.target.value })}
                    />
                    <button 
                      onClick={() => copyToClipboard(`${window.location.origin}/#/order/${localSettings?.slug}`)}
                      className="px-6 py-4 rounded-xl border border-stone-100 text-xs font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-50 transition-colors whitespace-nowrap"
                    >
                      {isCopying ? 'Copiado!' : 'Copiar Link'}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-2 italic break-all">Seu link será: {window.location.origin}/order/{localSettings?.slug}</p>
                </div>
                
                <button 
                  onClick={handleSaveSettings}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center space-x-2"
                >
                  <Save size={20} />
                  <span>Salvar Configurações</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-stone-100 shadow-sm">
              <h2 className="text-xl font-serif text-primary italic mb-8">Segurança</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Nova Senha de Acesso</label>
                  <input 
                    type="password" 
                    placeholder="Digite a nova senha"
                    className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleChangePassword}
                  className="w-full border-2 border-primary text-primary py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center space-x-2"
                >
                  <span>Alterar Senha</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>

      {/* Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-3xl p-10 overflow-y-auto max-h-[90vh]">
              <h2 className="text-2xl font-serif text-primary italic mb-8">{editingProduct.id ? 'Editar Produto' : 'Novo Produto'}</h2>
              <form onSubmit={handleSaveProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Nome do Produto</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingProduct.name || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Descrição</label>
                    <textarea 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50 h-24"
                      value={editingProduct.description || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Categoria</label>
                    <select 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingProduct.categoryId || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, categoryId: e.target.value })}
                    >
                      {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Galeria Vinculada</label>
                    <select 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingProduct.galleryCategoryId || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, galleryCategoryId: e.target.value })}
                    >
                      <option value="">Nenhuma galeria</option>
                      {galleryCategories.map(gc => (
                        <option key={gc.id} value={gc.id}>{gc.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block italic">Tipo de Produto</label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
                      <button 
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, isBatchProduct: false })}
                        className={cn(
                          "flex-1 py-3 rounded-xl border font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all",
                          !editingProduct.isBatchProduct ? "bg-primary text-white border-primary" : "border-stone-100 text-stone-400"
                        )}
                      >
                        Normal
                      </button>
                      <button 
                        type="button"
                        onClick={() => setEditingProduct({ 
                          ...editingProduct, 
                          isBatchProduct: true,
                          batchPrices: editingProduct.batchPrices || { p25: 0, p100: 0 },
                          showStartingFrom: true,
                          price: editingProduct.batchPrices?.p25 || editingProduct.price || 0
                        })}
                        className={cn(
                          "flex-1 py-3 px-2 rounded-xl border font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-all whitespace-nowrap",
                          editingProduct.isBatchProduct ? "bg-primary text-white border-primary" : "border-stone-100 text-stone-400"
                        )}
                      >
                        Unidade/Cento
                      </button>
                    </div>
                  </div>
                  {editingProduct.isBatchProduct && (
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-stone-50 rounded-2xl border border-stone-100">
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2 block">Preço 25 Unid. ($)</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white"
                          value={p25Input}
                          onChange={handleP25Change}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-2 block">Preço Cento ($)</label>
                        <input 
                          type="text"
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white"
                          value={p100Input}
                          onChange={handleP100Change}
                          placeholder="0,00"
                        />
                      </div>
                    </div>
                  )}
                  {!editingProduct.isBatchProduct && (
                    <div>
                      <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Preço ($)</label>
                      <input 
                        type="text" 
                        disabled={editingProduct.priceOnRequest}
                        className={cn(
                          "w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50 transition-opacity",
                          editingProduct.priceOnRequest && "opacity-50"
                        )}
                        value={priceInput}
                        onChange={handlePriceChange}
                        placeholder="0,00"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:space-x-8 bg-stone-50 p-6 rounded-xl border border-stone-100">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        editingProduct.showStartingFrom ? "bg-accent border-accent" : "border-stone-200 group-hover:border-accent"
                      )}>
                        {editingProduct.showStartingFrom && <Check size={14} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={editingProduct.showStartingFrom || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, showStartingFrom: e.target.checked })}
                      />
                      <span className="text-sm font-medium text-stone-600">Exibir "A partir de"</span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                        editingProduct.priceOnRequest ? "bg-accent border-accent" : "border-stone-200 group-hover:border-accent"
                      )}>
                        {editingProduct.priceOnRequest && <Check size={14} className="text-white" />}
                      </div>
                      <input 
                        type="checkbox" 
                        className="hidden"
                        checked={editingProduct.priceOnRequest || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEditingProduct({ 
                            ...editingProduct, 
                            priceOnRequest: checked,
                            price: checked ? 0 : editingProduct.price 
                          });
                          if (checked) setPriceInput('0,00');
                        }}
                      />
                      <span className="text-sm font-medium text-stone-600">Preço sob consulta</span>
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Imagem do Produto</label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <div className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50 flex items-center justify-center overflow-hidden group shrink-0">
                        {editingProduct.image ? (
                          <>
                            <img src={editingProduct.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Edit2 className="text-white" size={20} />
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="text-stone-300" size={32} />
                        )}
                        <input 
                          type="file" 
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                          disabled={isUploading}
                        />
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-stone-500 mb-2">Clique no quadro ao lado para fazer o upload da imagem.</p>
                        <p className="text-[10px] text-stone-400 uppercase tracking-widest">Formatos aceitos: JPG, PNG, WEBP</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                  <button type="submit" className="w-full sm:flex-1 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                    <Save size={20} />
                    <span>Salvar Produto</span>
                  </button>
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="w-full sm:w-auto px-8 py-4 rounded-xl border border-stone-100 font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-50">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && editingCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCategoryModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-3xl p-6 sm:p-10">
              <h2 className="text-2xl font-serif text-primary italic mb-8">{editingCategory.id ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <form onSubmit={handleSaveCategory} className="space-y-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Nome da Categoria</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                    value={editingCategory.name || ''}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                  <button type="submit" className="w-full sm:flex-1 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                    <Save size={20} />
                    <span>Salvar Categoria</span>
                  </button>
                  <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="w-full sm:w-auto px-8 py-4 rounded-xl border border-stone-100 font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-50">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Gallery Category Modal */}
      <AnimatePresence>
        {isGalleryCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGalleryCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-serif text-primary italic mb-8">
                {editingGalleryCategory?.id ? 'Editar Categoria da Galeria' : 'Nova Categoria da Galeria'}
              </h2>
              <form onSubmit={handleSaveGalleryCategory} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-stone-400 ml-2">Nome da Categoria</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Casamento, Infantil, 15 Anos"
                    className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                    value={editingGalleryCategory?.name || ''}
                    onChange={(e) => setEditingGalleryCategory(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                  <button type="submit" className="w-full sm:flex-1 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                    <Save size={20} />
                    <span>Salvar Galeria</span>
                  </button>
                  {editingGalleryCategory?.id && (
                    <button 
                      type="button" 
                      onClick={() => {
                        if (editingGalleryCategory.id) {
                          handleDeleteGalleryCategory(editingGalleryCategory.id);
                          setIsGalleryCategoryModalOpen(false);
                        }
                      }}
                      className="w-full sm:w-auto px-6 py-4 rounded-xl border border-red-100 text-red-500 font-bold uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 size={20} />
                      <span className="sm:hidden">Excluir</span>
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCustomerModalOpen && editingCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCustomerModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-serif text-primary italic mb-8">Editar Cliente e Pedidos</h2>
              <form onSubmit={handleSaveCustomer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Nome</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingCustomer.name || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Telefone</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingCustomer.phone || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">E-mail</label>
                    <input 
                      required
                      type="email" 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingCustomer.email || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Aniversário (MM/DD/AAAA)</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingCustomer.birthday || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, birthday: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Endereço (Rua/Av)</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                      value={editingCustomer.address || ''}
                      onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Nº/Apto</label>
                      <input 
                        type="text" 
                        className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                        value={editingCustomer.number || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Zip Code</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                        value={editingCustomer.zip || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, zip: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest text-stone-400 font-bold mb-2 block">Cidade</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-6 py-4 rounded-xl border border-stone-100 bg-stone-50"
                    value={editingCustomer.city || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                  />
                </div>

                <div className="pt-6 border-t border-stone-100">
                  <h3 className="text-lg font-serif text-primary italic mb-4">Histórico de Pedidos</h3>
                  <div className="space-y-6">
                    {editingCustomer.orders.map((order, idx) => (
                      <div key={idx} className="p-6 rounded-2xl bg-stone-50 border border-stone-100 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Pedido #{idx + 1} - {new Date(order.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 block">Valor Total ($)</label>
                            <input 
                              type="text"
                              className="w-full px-4 py-2 rounded-lg border border-stone-200 bg-white"
                              value={order.total}
                              onChange={(e) => {
                                const val = e.target.value.replace(',', '.');
                                const newOrders = [...editingCustomer.orders];
                                newOrders[idx] = { ...order, total: val };
                                setEditingCustomer({ ...editingCustomer, orders: newOrders });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 block">Data de Retirada (MM/DD/AAAA)</label>
                            <input 
                              type="text"
                              placeholder="MM/DD/AAAA"
                              className="w-full px-4 py-2 rounded-lg border border-stone-200 bg-white"
                              value={order.deliveryDate || ''}
                              onChange={(e) => {
                                const newOrders = [...editingCustomer.orders];
                                newOrders[idx] = { ...order, deliveryDate: e.target.value };
                                setEditingCustomer({ ...editingCustomer, orders: newOrders });
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] uppercase tracking-widest text-stone-400 font-bold mb-1 block">Notas do Pedido</label>
                          <textarea 
                            className="w-full px-4 py-2 rounded-lg border border-stone-200 bg-white text-sm"
                            rows={2}
                            value={order.customerNotes || ''}
                            onChange={(e) => {
                              const newOrders = [...editingCustomer.orders];
                              newOrders[idx] = { ...order, customerNotes: e.target.value };
                              setEditingCustomer({ ...editingCustomer, orders: newOrders });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
                  <button type="submit" className="w-full sm:flex-1 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                    <Save size={20} />
                    <span>Salvar Alterações</span>
                  </button>
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="w-full sm:w-auto px-8 py-4 rounded-xl border border-stone-100 font-bold uppercase tracking-widest text-stone-400 hover:bg-stone-50">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Menu Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-stone-100 w-[95%] h-[95%] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/20"
            >
              {/* Header */}
              <div className="bg-white px-8 py-4 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h2 className="font-serif text-primary italic text-lg leading-none">Visão do Cliente</h2>
                    <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1">Simulador Mobile</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-primary"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Content / Smartphone Frame */}
              <div className="flex-1 flex items-center justify-center p-8 bg-stone-50">
                <div className="relative w-[375px] h-[700px] bg-white rounded-[3rem] shadow-2xl border-[12px] border-black overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-20" />
                  
                  {/* Iframe */}
                  {data?.settings?.slug ? (
                    <iframe 
                      src={`/#/order/${data.settings.slug}`}
                      className="w-full h-full border-none"
                      title="Menu Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                      Carregando visualização...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border",
              notification.type === 'success' 
                ? "bg-white border-green-100 text-green-600" 
                : "bg-white border-red-100 text-red-600"
            )}
          >
            {notification.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-serif text-primary italic mb-2">{confirmModal.title}</h3>
              <p className="text-stone-500 mb-8">{confirmModal.message}</p>
              <div className="flex space-x-4">
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 border border-stone-100 text-stone-400 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
