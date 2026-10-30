import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Plus, Minus, X, Instagram, Facebook, Phone, MapPin, ChevronRight, User, Mail, Cake, Hash, FileText, Calendar } from 'lucide-react';
import { api } from '../services/api';
import { AppData, Product, Category, OrderItem } from '../types';
import { Footer } from '../components/Footer';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const DEFAULT_SIZES = [
  { name: '7 inch - 15 a 20 fatias - 2kg a 2,5kg', price: 0 },
  { name: '8 inch - 25 a 28 fatias - 2kg a 3kg', price: 0 },
  { name: '9 inch - 25 a 30 fatias - 3kg a 3,5kg', price: 0 },
  { name: '10 inch - 40 fatias - 4 kg a 4,5kg', price: 0 }
];

const DEFAULT_MASSAS = ['Branca / Blanca', 'Chocolate'];

const DEFAULT_RECHEIOS = [
  'Abacaxi / Piña', 'Abacaxi com coco / Piña con coco', 'Morango / Fresa', 'Pêssego / Durazno', 'Pêssego e doce de leite / Durazno y dulce de leche',
  'Leite Ninho / Leche Ninho', 'Brigadeiro (chocolate)', 'Brigadeiro e morango / Brigadeiro y fresa', 'Prestígio (coco/chocolate)', 'Beijinho (coco)',
  'Beijinho e morango / Beijinho y fresa', 'Doce de leite / Dulce de leche', 'Doce de leite e ameixa / Dulce de leche y ciruela', 'Nozes / Nueces'
];

const DEFAULT_COBERTURAS = ['Chantilly', 'Buttercream'];

const DEFAULT_TOPOS = ['Flores', 'Topper'];

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Menu() {
  const [data, setData] = useState<AppData | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    birthday: '',
    address: '',
    number: '',
    zip: '',
    city: '',
    notes: '',
    deliveryDate: ''
  });

  useEffect(() => {
    const savedData = localStorage.getItem('customer_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCustomerData(prev => ({ ...prev, ...parsed, notes: '', deliveryDate: '' }));
      } catch (e) {
        console.error('Error loading saved customer data');
      }
    }
  }, []);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    // For USA: strictly 10 digits after +1
    // If it starts with 1 and has 11 digits, treat as +1
    let clean = digits;
    if (clean.length === 11 && clean.startsWith('1')) {
      clean = clean.substring(1);
    }
    
    if (clean.length <= 10) {
      return clean.replace(/(\d{3})(\d{3})?(\d{0,4})?/, (_, p1, p2, p3) => {
        let res = `+1 (${p1}`;
        if (p2) res += `) ${p2}`;
        if (p3) res += `-${p3}`;
        return res;
      });
    }
    return `+1 ${clean.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}`;
  };

  const formatBirthday = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const formatZip = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 5);
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getProductQuantity = (productId: string) => {
    return cart.filter(item => item.productId === productId).reduce((acc, item) => acc + item.quantity, 0);
  };

  const formatDeliveryDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatchProduct, setSelectedBatchProduct] = useState<Product | null>(null);
  const [complexOptions, setComplexOptions] = useState<{
    massa?: string;
    tamanho?: string;
    recheio?: string;
    cobertura?: string;
    estilo?: string;
    estiloPersonalizado?: string;
    galleryCategoryName?: string;
    galleryPhotoIndex?: number;
  }>({});

  useEffect(() => {
    api.getData().then(setData);
    return api.onUpdate(setData);
  }, []);

  const getBatchQuantity = (productId: string, batchType: string) => {
    return cart.filter(i => i.productId === productId && i.batchType === batchType).length;
  };

  const addToCart = (product: Product, options?: any) => {
    let price = product.price;
    if (options?.isBatch) {
      price = options.batchType === '25' ? product.batchPrices?.p25 : product.batchPrices?.p100;
    } else if (product.isComplex && product.options?.tamanhos) {
      price = product.options.tamanhos.find(t => t.name === options.tamanho)?.price || 0;
    } else if (product.galleryCategoryId && options.tamanho) {
      price = product.price;
    }

    const item: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: options?.isBatch ? `${product.name} (${options.batchType === '25' ? '25 unidades' : 'Cento'})` : product.name,
      price: price || 0,
      quantity: 1,
      priceOnRequest: product.priceOnRequest,
      isBatch: options?.isBatch,
      batchType: options?.batchType,
      options
    };
    setCart([...cart, item]);
    
    // Only close modals if it's NOT a batch product being added
    if (!options?.isBatch) {
      setSelectedProduct(null);
      setSelectedBatchProduct(null);
      setComplexOptions({});
    }
  };

  const removeBatchFromCart = (productId: string, batchType: string) => {
    let lastIndex = -1;
    for (let i = cart.length - 1; i >= 0; i--) {
      if (cart[i].productId === productId && cart[i].batchType === batchType) {
        lastIndex = i;
        break;
      }
    }
    if (lastIndex !== -1) {
      const newCart = [...cart];
      newCart.splice(lastIndex, 1);
      setCart(newCart);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const removeOneFromCart = (productId: string) => {
    const lastIndex = cart.map(i => i.productId).lastIndexOf(productId);
    if (lastIndex !== -1) {
      const newCart = [...cart];
      newCart.splice(lastIndex, 1);
      setCart(newCart);
    }
  };

  const cartTotal = cart.reduce((acc, item) => acc + (Number(item.price) || 0) * item.quantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    // Ensure total is a valid number
    const finalTotal = Number(cartTotal) || 0;
    
    let message = `*NOVO PEDIDO - CAKES KETHY*\n\n`;
    message += `• *Data de Entrega:* ${customerData.deliveryDate}\n\n`;
    
    message += `*DADOS DO CLIENTE*\n`;
    message += `• *Nome:* ${customerData.name}\n`;
    message += `• *Telefone:* ${customerData.phone}\n`;
    message += `• *E-mail:* ${customerData.email}\n`;
    message += `• *Aniversário:* ${customerData.birthday}\n`;
    message += `• *Endereço:* ${customerData.address}, ${customerData.number}\n`;
    message += `• *Zip Code:* ${customerData.zip} - *Cidade:* ${customerData.city}\n`;
    if (customerData.notes) message += `• *Obs:* ${customerData.notes}\n`;
    message += `\n`;
    
    let hasPriceOnRequest = false;
    message += `*ITENS DO PEDIDO*\n\n`;
    cart.forEach(item => {
      const cleanName = item.name.trim();
      const productData = data.products.find(p => p.id === item.productId);
      
      // Título inteligente: Só aparece para bolos personalizados (com massa/recheio ou galeria)
      // e ignoramos para itens de Unidade/Cento (isBatch)
      const isCustomCake = !item.isBatch && (item.options?.massa || item.options?.recheio || !!productData?.galleryCategoryId);

      if (isCustomCake) {
        message += `• *Pedido de Bolo Personalizado:*\n`;
      } else {
        message += `• `;
      }

      // Nome do produto e quantidade (limpando espaços para não quebrar o negrito do WhatsApp)
      message += `*${cleanName}*${item.isBatch ? '' : ` (x${item.quantity})`}\n`;
      
      // Detalhes/Opções com etiquetas em negrito
      if (item.options) {
        if (item.options.tamanho) message += `*Tamanho:* ${item.options.tamanho}\n`;
        if (item.options.massa) message += `*Massa:* ${item.options.massa}\n`;
        if (item.options.recheio) message += `*Recheio:* ${item.options.recheio}\n`;
        if (item.options.cobertura) message += `*Cobertura:* ${item.options.cobertura}\n`;
        
        if (item.isBatch) {
          message += `*Tipo:* ${item.batchType === '25' ? '25 Unidades' : 'Cento (100 Unidades)'}\n`;
        }
        
        if (item.options.estilo) {
          if (item.options.estilo === 'custom') {
            message += `*Modelo:* Personalizado - ${item.options.estiloPersonalizado || 'Não descrito'}\n`;
          } else if (item.options.galleryCategoryName && item.options.galleryPhotoIndex !== undefined) {
            message += `*Modelo:* Galeria ${item.options.galleryCategoryName} - Foto #${(item.options.galleryPhotoIndex + 1).toString().padStart(2, '0')}\n`;
          }
        }
      }

      // Valor formatado
      if (item.priceOnRequest) {
        message += `*Valor:* A combinar\n\n`;
        hasPriceOnRequest = true;
      } else {
        message += `*Valor:* $ ${(item.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}\n\n`;
      }
    });
    
    message += `*TOTAL: $ ${(cartTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}*${hasPriceOnRequest ? ' + Orçamento a combinar / Presupuesto a convenir' : ''}\n\n`;
    
    if (hasPriceOnRequest) {
      message += `*Nota / Nota:* Este pedido contém itens com preço sob consulta. O orçamento final será alinhado após o contato. / Este pedido contiene artículos con precio bajo consulta. El presupuesto final se alineará tras el contacto.\n\n`;
    }

    if (customerData.notes) {
      message += `*Observações / Observaciones:*\n${customerData.notes}\n\n`;
    }

    message += `*IMPORTANTE / IMPORTANTE:*\n`;
    message += `- Para confirmação do pedido, é necessário o pagamento de 50% do valor. / Para la confirmación del pedido, es necesario el pago del 50% del valor.\n`;
    message += `- O restante é pago no dia da retirada. / El resto se paga el día de la recogida.\n`;
    message += `- Este pedido é apenas para RETIRADA (Pickup). / Este pedido es solo para RECOGIDA (Pickup).\n\n`;
    
    message += `_Enviado via Cardápio Digital / Enviado a través del Menú Digital_`;

    const whatsappUrl = `https://wa.me/${data.settings.whatsapp}?text=${encodeURIComponent(message)}`;
    
    try {
      localStorage.setItem('customer_data', JSON.stringify({
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        birthday: customerData.birthday,
        address: customerData.address,
        number: customerData.number,
        zip: customerData.zip,
        city: customerData.city
      }));

      await api.createOrder({
        items: cart,
        total: finalTotal,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerEmail: customerData.email,
        customerBirthday: customerData.birthday,
        customerAddress: customerData.address,
        customerNumber: customerData.number,
        customerZip: customerData.zip,
        customerCity: customerData.city,
        customerNotes: customerData.notes,
        deliveryDate: customerData.deliveryDate
      });
      
      // Detect iOS to use window.location.href instead of window.open
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIOS) {
        window.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }

      setCart([]);
      setIsCartOpen(false);
      setIsCheckoutModalOpen(false);
      showNotification('Pedido enviado com sucesso!');
    } catch (err) {
      showNotification('Erro ao processar pedido. Tente novamente.', 'error');
    }
  };

  if (!data) return <div className="flex items-center justify-center h-screen text-primary">Carregando...</div>;

  return (
    <div className="min-h-screen relative">
      {/* Background Image & Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://raw.githubusercontent.com/easybyzcreator/imagens/67f98a068d984be73f96ae2217305d69684aeeaa/kethy%20cake.png")' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-white/95 to-white/90" />

      <div className="relative z-10 pb-24">
        {/* Header */}
      <header className="pt-16 pb-12 px-6 text-center">
        <motion.img 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          src="https://raw.githubusercontent.com/easybyzcreator/imagens/9f6ed6752725671cee6475766827d45d2e7dcceb/LOGO%20CAKES%20KETHY%20FUNDOTRANSPARENTE.png" 
          alt="Cakes Kethy Logo" 
          className="w-36 h-auto mx-auto mb-6"
          referrerPolicy="no-referrer"
        />
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-serif text-primary italic mb-3"
        >
          Cakes Kethy
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-secondary font-light tracking-wide"
        >
          Sabores brasileiros em Hamptons, NY
        </motion.p>
        
        <div className="mt-10 flex flex-col items-center justify-center space-y-3">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-stone-500 uppercase tracking-widest">Aceitando Pedidos</span>
          </div>
          <p className="text-[10px] text-accent uppercase tracking-[0.2em] font-bold bg-accent/5 px-4 py-1.5 rounded-full border border-accent/10">
            Pedidos com pelo menos 7 dias de antecedência
          </p>
        </div>
      </header>

      {/* Categories & Products */}
      <main className="max-w-2xl mx-auto px-6 space-y-16">
        {data.categories.sort((a, b) => a.order - b.order).map(category => {
          const products = data.products.filter(p => p.categoryId === category.id && p.active);
          if (products.length === 0) return null;

          return (
            <section key={category.id}>
              <h2 className="text-xl font-serif text-primary italic mb-6 border-b border-stone-100 pb-2">
                {category.name}
              </h2>
              <div className="grid gap-6">
                {products.map(product => (
                  <motion.div 
                    key={product.id}
                    layout
                    className="flex items-center space-x-4 p-4 rounded-2xl bg-white border border-stone-100 premium-shadow hover:border-accent/30 transition-colors"
                  >
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-24 h-24 rounded-xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-primary font-medium truncate">{product.name}</h3>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{product.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-accent font-semibold">
                          {product.priceOnRequest ? (
                            'Consultar Valor'
                          ) : (
                            <>
                              {product.showStartingFrom && <span className="text-[10px] uppercase tracking-tighter mr-1">A partir de</span>}
                              $ {(product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </>
                          )}
                        </span>
                        <div className="flex items-center space-x-2">
                          {getProductQuantity(product.id) > 0 && (
                            <button
                              onClick={() => removeOneFromCart(product.id)}
                              className="h-9 w-9 bg-stone-100 text-stone-500 rounded-full hover:bg-stone-200 transition-all flex items-center justify-center"
                            >
                              <Minus size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              if (product.isBatchProduct) {
                                setSelectedBatchProduct(product);
                              } else if (product.isComplex || product.galleryCategoryId) {
                                setSelectedProduct(product);
                              } else {
                                addToCart(product);
                              }
                            }}
                            className="h-9 px-3 bg-accent text-white rounded-full hover:bg-primary transition-all flex items-center space-x-1.5"
                          >
                            <Plus size={16} />
                            {getProductQuantity(product.id) > 0 && (
                              <span className="text-sm font-bold border-l border-white/20 pl-1.5">
                                {getProductQuantity(product.id)}
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {/* Social Links */}
      <div className="mt-12 flex justify-center space-x-6">
        <a href="https://www.instagram.com/cakes_kethy" target="_blank" className="text-primary hover:text-accent transition-colors">
          <Instagram size={24} />
        </a>
        <a href="https://www.facebook.com/Cakeskethy?mibextid=ZbWKwL" target="_blank" className="text-primary hover:text-accent transition-colors">
          <Facebook size={24} />
        </a>
      </div>

      <Footer />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white px-8 py-4 rounded-full shadow-2xl flex items-center space-x-4 z-40"
        >
          <div className="relative">
            <ShoppingCart size={20} />
            <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          </div>
          <span className="font-medium tracking-wide uppercase text-sm">Ver Pedido</span>
          <span className="font-bold border-l border-white/20 pl-4">
            $ {(cartTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            {cart.some(i => i.priceOnRequest) && '+'}
          </span>
        </motion.button>
      )}

      {/* Complex Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-8 overflow-y-auto max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 text-stone-400 hover:text-primary"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-serif text-primary italic mb-2">{selectedProduct.name}</h2>
              <p className="text-stone-500 text-sm mb-8">{selectedProduct.description}</p>

              <div className="space-y-8">
                {/* Tamanho */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-black mb-4 block">Tamanho / Tamaño (Escolha uma opção / Elija una opción)</label>
                  <div className="grid grid-cols-1 gap-3">
                    {(selectedProduct.galleryCategoryId ? DEFAULT_SIZES : (selectedProduct.options?.tamanhos || [])).map(t => (
                      <button
                        key={t.name}
                        onClick={() => setComplexOptions({ ...complexOptions, tamanho: t.name })}
                        className={cn(
                          "flex justify-between items-center p-4 rounded-xl border transition-all",
                          complexOptions.tamanho === t.name 
                            ? "border-accent bg-accent/5 text-primary" 
                            : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        <span className="font-medium">{t.name}</span>
                        {!selectedProduct.galleryCategoryId && (
                          <span className="text-accent font-bold">
                            {selectedProduct.priceOnRequest ? 'Consultar' : (t.price > 0 ? `$ ${(t.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : (selectedProduct.price > 0 ? `$ ${(selectedProduct.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Consultar'))}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Massa */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-black mb-4 block">Massa / Masa (Escolha uma opção / Elija una opción)</label>
                  <div className="flex flex-wrap gap-3">
                    {(selectedProduct.galleryCategoryId ? DEFAULT_MASSAS : (selectedProduct.options?.massas || [])).map(m => (
                      <button
                        key={m}
                        onClick={() => setComplexOptions({ ...complexOptions, massa: m })}
                        className={cn(
                          "px-6 py-3 rounded-full border transition-all",
                          complexOptions.massa === m 
                            ? "border-accent bg-accent text-white" 
                            : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recheio */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-black mb-4 block">RECHEIO / RELLENO (ESCOLHA ATÉ 2 OPÇÕES / ELIJA HASTA 2 OPCIONES)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[...(selectedProduct.galleryCategoryId ? DEFAULT_RECHEIOS : (selectedProduct.options?.recheios || []))].sort((a, b) => a.localeCompare(b)).map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          const currentRecheios = complexOptions.recheio ? complexOptions.recheio.split(' | ') : [];
                          if (currentRecheios.includes(r)) {
                            setComplexOptions({ ...complexOptions, recheio: currentRecheios.filter(item => item !== r).join(' | ') });
                          } else if (currentRecheios.length < 2) {
                            setComplexOptions({ ...complexOptions, recheio: [...currentRecheios, r].join(' | ') });
                          }
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-sm transition-all text-left",
                          complexOptions.recheio?.split(' | ').includes(r)
                            ? "border-accent bg-accent/5 text-primary" 
                            : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cobertura */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-black mb-4 block">COBERTURA / COBERTURA (Escolha uma opção / Elija una opción)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {DEFAULT_COBERTURAS.map(c => (
                      <button
                        key={c}
                        onClick={() => setComplexOptions({ ...complexOptions, cobertura: c })}
                        className={cn(
                          "p-3 rounded-xl border text-sm transition-all text-left",
                          complexOptions.cobertura === c 
                            ? "border-accent bg-accent/5 text-primary" 
                            : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topo do Bolo */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-black mb-4 block">TOPO DO BOLO / DECORACIÓN SUPERIOR (Escolha uma opção / Elija una opción)</label>
                  <div className="grid grid-cols-2 gap-3">
                    {DEFAULT_TOPOS.map(t => (
                      <button
                        key={t}
                        onClick={() => setComplexOptions({ ...complexOptions, topo: t })}
                        className={cn(
                          "p-3 rounded-xl border text-sm transition-all text-left",
                          complexOptions.topo === t 
                            ? "border-accent bg-accent/5 text-primary" 
                            : "border-stone-100 hover:border-stone-200"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Estilo do Bolo */}
                <div>
                  <label className="text-xs uppercase tracking-widest text-primary font-black mb-4 block">Escolha o Estilo do Bolo (Escolha uma opção)</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {(() => {
                      const category = data.settings.galleryCategories?.find(c => c.id === selectedProduct.galleryCategoryId);
                      const images = (category?.images || []).filter(url => url && url.trim() !== '');
                      
                      return images.map((imageUrl, i) => {
                        const styleId = `style-${i + 1}`;
                        return (
                          <button
                            key={styleId}
                            onClick={() => setComplexOptions({ 
                              ...complexOptions, 
                              estilo: styleId, 
                              estiloPersonalizado: '',
                              galleryCategoryName: category?.name || 'Geral',
                              galleryPhotoIndex: i
                            })}
                            className={cn(
                              "aspect-square rounded-lg overflow-hidden border-2 transition-all relative",
                              complexOptions.estilo === styleId 
                                ? "border-accent scale-95" 
                                : "border-stone-100"
                            )}
                          >
                            <img 
                              src={imageUrl} 
                              alt={`Modelo ${i + 1}`} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-1 left-1 w-5 h-5 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                              {i + 1}
                            </div>
                          </button>
                        );
                      });
                    })()}
                  </div>
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setComplexOptions({ ...complexOptions, estilo: 'custom' })}
                      className={cn(
                        "text-sm font-medium transition-colors",
                        complexOptions.estilo === 'custom' ? "text-accent" : "text-stone-400 hover:text-primary"
                      )}
                    >
                      Quero um modelo diferente
                    </button>
                    
                    {complexOptions.estilo === 'custom' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-3"
                      >
                        <textarea
                          placeholder="Descreva o modelo ou forneça um link externo (ex: Pinterest)"
                          className="w-full p-4 rounded-xl border border-stone-100 focus:border-accent/50 focus:outline-none text-sm resize-none"
                          rows={3}
                          value={complexOptions.estiloPersonalizado || ''}
                          onChange={(e) => setComplexOptions({ ...complexOptions, estiloPersonalizado: e.target.value })}
                        />
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <button
                disabled={
                  ((selectedProduct.galleryCategoryId || selectedProduct.options?.tamanhos?.length) ? !complexOptions.tamanho : false) ||
                  ((selectedProduct.galleryCategoryId || selectedProduct.options?.massas?.length) ? !complexOptions.massa : false) ||
                  ((selectedProduct.galleryCategoryId || selectedProduct.options?.recheios?.length) ? !complexOptions.recheio : false) ||
                  (selectedProduct.galleryCategoryId ? !complexOptions.cobertura : false) ||
                  (selectedProduct.galleryCategoryId ? !complexOptions.estilo : false)
                }
                onClick={() => addToCart(selectedProduct, complexOptions)}
                className="w-full mt-10 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
              >
                Adicionar ao Pedido
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Product Modal */}
      <AnimatePresence>
        {selectedBatchProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedBatchProduct(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white w-full max-w-md rounded-3xl p-8 overflow-y-auto max-h-[90vh]">
              <button onClick={() => setSelectedBatchProduct(null)} className="absolute top-6 right-6 text-stone-400 hover:text-primary"><X size={24} /></button>
              <h2 className="text-2xl font-serif text-primary italic mb-2">{selectedBatchProduct.name}</h2>
              <p className="text-stone-500 text-sm mb-8">Escolha a quantidade desejada:</p>
              
              <div className="space-y-4">
                {/* 25 Unidades */}
                <button 
                  onClick={() => addToCart(selectedBatchProduct, { isBatch: true, batchType: '25' })}
                  className="w-full p-5 rounded-2xl border border-stone-100 hover:border-accent hover:bg-accent/5 transition-all text-left flex items-center group relative"
                >
                  <div className="flex-1">
                    <span className="block font-bold text-primary group-hover:text-accent transition-colors">25 Unidades</span>
                    <span className="text-[10px] text-stone-400">Ideal para pequenas porções</span>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-accent">$ {(selectedBatchProduct.batchPrices?.p25 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      {getBatchQuantity(selectedBatchProduct.id, '25') > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBatchFromCart(selectedBatchProduct.id, '25');
                          }}
                          className="h-10 w-10 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center hover:bg-stone-200 hover:text-primary transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                      )}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(selectedBatchProduct, { isBatch: true, batchType: '25' });
                        }}
                        className="h-12 w-12 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 active:scale-95 transition-transform cursor-pointer"
                      >
                        <Plus size={20} />
                      </div>
                    </div>
                    {getBatchQuantity(selectedBatchProduct.id, '25') > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-primary leading-none">No pedido</span>
                        <span className="text-xs font-black text-accent">{getBatchQuantity(selectedBatchProduct.id, '25')}x</span>
                      </div>
                    )}
                  </div>
                </button>

                {/* Cento */}
                <button 
                  onClick={() => addToCart(selectedBatchProduct, { isBatch: true, batchType: '100' })}
                  className="w-full p-5 rounded-2xl border border-stone-100 hover:border-accent hover:bg-accent/5 transition-all text-left flex items-center group relative"
                >
                  <div className="flex-1">
                    <span className="block font-bold text-primary group-hover:text-accent transition-colors">Cento (100 Unidades)</span>
                    <span className="text-[10px] text-stone-400">Melhor custo-benefício</span>
                    <div className="mt-2">
                      <span className="text-lg font-bold text-accent">$ {(selectedBatchProduct.batchPrices?.p100 || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2 ml-4">
                    <div className="flex items-center space-x-2">
                      {getBatchQuantity(selectedBatchProduct.id, '100') > 0 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            removeBatchFromCart(selectedBatchProduct.id, '100');
                          }}
                          className="h-10 w-10 bg-stone-100 text-stone-400 rounded-xl flex items-center justify-center hover:bg-stone-200 hover:text-primary transition-colors"
                        >
                          <Minus size={18} />
                        </button>
                      )}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(selectedBatchProduct, { isBatch: true, batchType: '100' });
                        }}
                        className="h-12 w-12 bg-accent text-white rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 active:scale-95 transition-transform cursor-pointer"
                      >
                        <Plus size={20} />
                      </div>
                    </div>
                    {getBatchQuantity(selectedBatchProduct.id, '100') > 0 && (
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] uppercase font-bold text-primary leading-none">No pedido</span>
                        <span className="text-xs font-black text-accent">{getBatchQuantity(selectedBatchProduct.id, '100')}x</span>
                      </div>
                    )}
                  </div>
                </button>
              </div>
              
              <button 
                onClick={() => setSelectedBatchProduct(null)}
                className="w-full mt-8 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-accent transition-colors shadow-lg shadow-primary/10"
              >
                Concluir Seleção
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                <h2 className="text-xl font-serif text-primary italic">Seu Pedido</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-stone-400 hover:text-primary">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex space-x-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-primary">{item.name}</h4>
                      {item.options && (
                        <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">
                          {item.options.tamanho} • {item.options.massa} • {item.options.recheio}
                          {item.options.cobertura && <> • {item.options.cobertura}</>}
                          {item.options.estilo && (
                            <> • {item.options.estilo === 'custom' ? 'Personalizado' : (item.options.galleryCategoryName ? `Galeria ${item.options.galleryCategoryName} - Foto #${(item.options.galleryPhotoIndex ?? 0) + 1}` : `Modelo ${item.options.estilo.replace('style-', '')}`)}</>
                          )}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-accent font-bold">
                          {item.priceOnRequest ? 'A combinar' : `$ ${((item.price || 0) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </span>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-stone-300 hover:text-red-500 transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-stone-50 space-y-6">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-stone-500">Total</span>
                  <div className="text-right">
                    <span className="font-bold text-primary text-2xl">$ {(cartTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    {cart.some(i => i.priceOnRequest) && (
                      <p className="text-[10px] text-accent uppercase tracking-widest font-bold">+ Orçamento a combinar</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setIsCheckoutModalOpen(true)}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-bold uppercase tracking-[0.2em] hover:bg-accent transition-colors flex items-center justify-center space-x-3"
                >
                  <span>Finalizar no WhatsApp</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Checkout Modal */}
    <AnimatePresence>
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 overflow-y-auto pt-10 pb-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-primary w-full max-w-lg rounded-[2rem] p-8 border border-white/10 shadow-2xl my-auto"
            >
              <button 
                onClick={() => setIsCheckoutModalOpen(false)}
                className="absolute top-6 right-6 text-white/40 hover:text-white"
              >
                <X size={24} />
              </button>

              <h2 className="text-2xl font-serif text-white italic mb-2 text-center">Detalhes do seu Pedido / Detalles de su Pedido</h2>
              <p className="text-white/80 text-[10px] sm:text-xs text-center mb-6 px-4 leading-relaxed">
                Ficamos muito felizes com seu pedido! Por favor, preencha os dados abaixo para que possamos organizar sua retirada. / 
                ¡Estamos muy felices con su pedido! Por favor, complete los datos a continuación para que podamos organizar su recogida.
              </p>

              <div className="mb-8 space-y-3">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">50%</span>
                  </div>
                  <p className="text-[11px] text-white leading-tight">
                    <span className="font-bold uppercase block mb-1">Confirmação do Pedido / Confirmación del Pedido</span>
                    Para confirmar seu pedido, é necessário o pagamento de 50% do valor via sinal. O restante é pago no ato da retirada. / 
                    Para confirmar su pedido, es necesario el pago del 50% del valor como depósito. El resto se paga al momento de la recogida.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/10 rounded-2xl p-4 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-white">
                    <MapPin size={14} />
                  </div>
                  <p className="text-[11px] text-white leading-tight">
                    <span className="font-bold uppercase block mb-1 text-white">Retirada no Local / Recogida en el Local</span>
                    Trabalhamos apenas com retirada (pickup). O endereço exato será enviado após a confirmação do sinal. / 
                    Trabajamos solo con recogida (pickup). La dirección exacta será enviada después de la confirmación del depósito.
                  </p>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                {/* Nome Completo */}
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Nome Completo / Nombre Completo"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.name}
                    onChange={e => setCustomerData({...customerData, name: e.target.value})}
                  />
                </div>

                {/* Telefone */}
                <div className="relative">
                  <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="tel"
                    placeholder="Telefone (WhatsApp) / Teléfono"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.phone}
                    onChange={e => setCustomerData({...customerData, phone: formatPhone(e.target.value)})}
                  />
                </div>

                {/* E-mail */}
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="email"
                    placeholder="E-mail"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.email}
                    onChange={e => setCustomerData({...customerData, email: e.target.value})}
                  />
                </div>

                {/* Aniversário */}
                <div className="relative">
                  <Cake className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Aniversário (MM/DD/AAAA) / Cumpleaños"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.birthday}
                    onChange={e => setCustomerData({...customerData, birthday: formatBirthday(e.target.value)})}
                  />
                </div>

                {/* Rua/Avenida */}
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Rua/Avenida / Calle/Avenida"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.address}
                    onChange={e => setCustomerData({...customerData, address: e.target.value})}
                  />
                </div>

                {/* Nº/Apto */}
                <div className="relative">
                  <Hash className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    type="text"
                    placeholder="Nº/Apto / Nº/Depto"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.number}
                    onChange={e => setCustomerData({...customerData, number: e.target.value})}
                  />
                </div>

                {/* Zip Code */}
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Zip Code / Código Postal"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.zip}
                    onChange={e => setCustomerData({...customerData, zip: formatZip(e.target.value)})}
                  />
                </div>

                {/* Cidade */}
                <div className="relative">
                  <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Cidade / Ciudad"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.city}
                    onChange={e => setCustomerData({...customerData, city: e.target.value})}
                  />
                </div>

                {/* Data de Entrega */}
                <div className="relative">
                  <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Data da Retirada (MM/DD/AAAA) / Fecha de Recogida"
                    className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all"
                    value={customerData.deliveryDate}
                    onChange={e => setCustomerData({...customerData, deliveryDate: formatDeliveryDate(e.target.value)})}
                  />
                </div>

                {/* Observações */}
                <div className="relative">
                  <FileText className="absolute left-6 top-6 text-white/30" size={20} />
                  <textarea 
                    placeholder="Observações (Opcional) / Observaciones (Opcional)"
                    rows={3}
                    className="w-full bg-white/10 border border-white/10 rounded-[2rem] py-5 pl-14 pr-8 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/40 transition-all resize-none"
                    value={customerData.notes}
                    onChange={e => setCustomerData({...customerData, notes: e.target.value})}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-accent text-white py-5 rounded-full font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-primary transition-all mt-4"
                >
                  Finalizar no WhatsApp / Finalizar en WhatsApp
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={cn(
              "fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border bg-white",
              notification.type === 'success' 
                ? "border-green-100 text-green-600" 
                : "border-red-100 text-red-600"
            )}
          >
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
