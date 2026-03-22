export interface Category {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  type: 'add' | 'remove' | 'choice';
  options?: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  gradient: string;
  available: boolean;
  allergens: string[];
  extras: Extra[];
  popular?: boolean;
  promo?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedExtras: { extraId: string; value: string }[];
  notes: string;
}

export interface Order {
  id: string;
  number: number;
  tableId: string;
  tableName: string;
  items: { name: string; quantity: number; extras: string[]; notes: string }[];
  status: 'received' | 'preparing' | 'ready' | 'delivered';
  timestamp: string;
  observations: string;
  priority: 'normal' | 'high';
  station: 'cocina' | 'bar' | 'postres';
  total: number;
}

export interface Table {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: 'free' | 'occupied' | 'with-order' | 'pending-payment';
  zone: string;
  qrCode: string;
  activeOrders: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'cocina' | 'cajero' | 'mesero' | 'supervisor';
  active: boolean;
  avatar: string;
}

export const categories: Category[] = [
  { id: 'entradas', name: 'Entradas', emoji: '🥗', count: 6 },
  { id: 'fondos', name: 'Fondos', emoji: '🍽️', count: 8 },
  { id: 'postres', name: 'Postres', emoji: '🍰', count: 5 },
  { id: 'bebidas', name: 'Bebidas', emoji: '🍹', count: 7 },
  { id: 'promos', name: 'Promos', emoji: '🔥', count: 3 },
];

const foodGradients = [
  'from-amber-100 to-orange-100',
  'from-emerald-100 to-teal-100',
  'from-rose-100 to-pink-100',
  'from-sky-100 to-blue-100',
  'from-violet-100 to-purple-100',
  'from-lime-100 to-green-100',
  'from-yellow-100 to-amber-100',
  'from-red-100 to-rose-100',
];

export const products: Product[] = [
  // Entradas
  {
    id: 'p1', name: 'Ceviche Clásico', description: 'Pescado fresco marinado en limón con cebolla morada, cilantro y ají. Servido con camote y choclo.',
    price: 38, categoryId: 'entradas', image: '🐟', gradient: foodGradients[0], available: true,
    allergens: ['Pescado', 'Mariscos'], popular: true,
    extras: [
      { id: 'e1', name: 'Extra leche de tigre', price: 8, type: 'add' },
      { id: 'e2', name: 'Sin cebolla', price: 0, type: 'remove' },
    ],
  },
  {
    id: 'p2', name: 'Anticuchos de Corazón', description: 'Brochetas de corazón de res marinadas en ají panca, servidas con papas doradas y crema de huacatay.',
    price: 32, categoryId: 'entradas', image: '🥩', gradient: foodGradients[7], available: true,
    allergens: [],
    extras: [
      { id: 'e3', name: 'Porción doble', price: 18, type: 'add' },
      { id: 'e4', name: 'Término', price: 0, type: 'choice', options: ['Medio', 'Tres cuartos', 'Bien cocido'] },
    ],
  },
  {
    id: 'p3', name: 'Causa Limeña', description: 'Capas de papa amarilla con atún, palta y mayonesa de ají amarillo.',
    price: 28, categoryId: 'entradas', image: '🥔', gradient: foodGradients[6], available: true,
    allergens: ['Pescado', 'Huevo'], extras: [],
  },
  {
    id: 'p4', name: 'Ensalada Mediterránea', description: 'Mix de hojas verdes, tomates cherry, aceitunas kalamata, queso feta y vinagreta balsámica.',
    price: 24, categoryId: 'entradas', image: '🥗', gradient: foodGradients[1], available: true,
    allergens: ['Lácteos'], extras: [
      { id: 'e5', name: 'Agregar pollo', price: 12, type: 'add' },
    ],
  },
  {
    id: 'p5', name: 'Tequeños de Queso', description: 'Palitos de masa wantán rellenos de queso crema, servidos con salsa de guacamole.',
    price: 22, categoryId: 'entradas', image: '🧀', gradient: foodGradients[6], available: false,
    allergens: ['Gluten', 'Lácteos'], extras: [],
  },
  {
    id: 'p6', name: 'Tiradito Nikkei', description: 'Láminas de pescado con salsa de maracuyá y soya, toque de sésamo y cebollín.',
    price: 42, categoryId: 'entradas', image: '🍣', gradient: foodGradients[0], available: true,
    allergens: ['Pescado', 'Soya'], popular: true, extras: [],
  },
  // Fondos
  {
    id: 'p7', name: 'Lomo Saltado', description: 'Tiras de lomo fino salteadas al wok con tomate, cebolla y ají amarillo. Acompañado de arroz y papas fritas.',
    price: 48, categoryId: 'fondos', image: '🥘', gradient: foodGradients[7], available: true,
    allergens: ['Soya'], popular: true,
    extras: [
      { id: 'e6', name: 'Término de carne', price: 0, type: 'choice', options: ['Jugoso', 'Medio', 'Tres cuartos', 'Bien cocido'] },
      { id: 'e7', name: 'Extra arroz', price: 5, type: 'add' },
    ],
  },
  {
    id: 'p8', name: 'Risotto de Hongos', description: 'Arroz arborio cremoso con mix de hongos silvestres, parmesano y trufa negra.',
    price: 44, categoryId: 'fondos', image: '🍚', gradient: foodGradients[1], available: true,
    allergens: ['Lácteos', 'Gluten'], extras: [],
  },
  {
    id: 'p9', name: 'Pescado a la Parrilla', description: 'Filete de corvina a la parrilla con puré de camote, espárragos grillados y salsa de alcaparras.',
    price: 52, categoryId: 'fondos', image: '🐠', gradient: foodGradients[3], available: true,
    allergens: ['Pescado'],
    extras: [
      { id: 'e8', name: 'Cambiar a lenguado', price: 15, type: 'add' },
    ],
  },
  {
    id: 'p10', name: 'Pollo al Horno', description: 'Medio pollo marinado en hierbas finas, cocido lentamente al horno con papas rústicas.',
    price: 38, categoryId: 'fondos', image: '🍗', gradient: foodGradients[6], available: true,
    allergens: [], extras: [],
  },
  {
    id: 'p11', name: 'Pasta Carbonara', description: 'Spaghetti al dente con panceta crocante, yema de huevo, pecorino y pimienta negra.',
    price: 36, categoryId: 'fondos', image: '🍝', gradient: foodGradients[6], available: true,
    allergens: ['Gluten', 'Huevo', 'Lácteos'], extras: [
      { id: 'e9', name: 'Sin panceta', price: 0, type: 'remove' },
      { id: 'e10', name: 'Extra queso', price: 6, type: 'add' },
    ],
  },
  {
    id: 'p12', name: 'Ají de Gallina', description: 'Clásico guiso cremoso de gallina con ají amarillo, nueces y queso parmesano. Con arroz y papa.',
    price: 34, categoryId: 'fondos', image: '🐔', gradient: foodGradients[6], available: true,
    allergens: ['Frutos secos', 'Lácteos', 'Gluten'], extras: [],
  },
  // Postres
  {
    id: 'p13', name: 'Suspiro Limeño', description: 'Dulce de leche con merengue de oporto y canela. Receta tradicional peruana.',
    price: 22, categoryId: 'postres', image: '🍮', gradient: foodGradients[6], available: true,
    allergens: ['Lácteos', 'Huevo'], extras: [],
  },
  {
    id: 'p14', name: 'Brownie con Helado', description: 'Brownie tibio de chocolate belga con helado de vainilla y salsa de frutos rojos.',
    price: 26, categoryId: 'postres', image: '🍫', gradient: foodGradients[7], available: true,
    allergens: ['Gluten', 'Huevo', 'Lácteos'], popular: true,
    extras: [
      { id: 'e11', name: 'Helado extra', price: 6, type: 'add' },
      { id: 'e12', name: 'Sin salsa de frutos rojos', price: 0, type: 'remove' },
    ],
  },
  {
    id: 'p15', name: 'Cheesecake de Maracuyá', description: 'Base de galleta con crema de queso suave y coulis de maracuyá natural.',
    price: 24, categoryId: 'postres', image: '🍰', gradient: foodGradients[6], available: true,
    allergens: ['Gluten', 'Lácteos'], extras: [],
  },
  {
    id: 'p16', name: 'Tres Leches', description: 'Bizcocho esponjoso empapado en leche condensada, evaporada y crema, con merengue tostado.',
    price: 20, categoryId: 'postres', image: '🥛', gradient: foodGradients[0], available: true,
    allergens: ['Gluten', 'Lácteos', 'Huevo'], extras: [],
  },
  {
    id: 'p17', name: 'Picarones', description: 'Donas peruanas de camote y zapallo bañadas en miel de chancaca.',
    price: 18, categoryId: 'postres', image: '🍩', gradient: foodGradients[6], available: false,
    allergens: ['Gluten'], extras: [],
  },
  // Bebidas
  {
    id: 'p18', name: 'Pisco Sour', description: 'Cóctel clásico peruano con pisco quebranta, limón, jarabe, clara de huevo y bitter de angostura.',
    price: 28, categoryId: 'bebidas', image: '🍸', gradient: foodGradients[4], available: true,
    allergens: ['Huevo'], popular: true,
    extras: [
      { id: 'e13', name: 'Sin hielo', price: 0, type: 'remove' },
      { id: 'e14', name: 'Doble pisco', price: 12, type: 'add' },
    ],
  },
  {
    id: 'p19', name: 'Chicha Morada', description: 'Bebida refrescante de maíz morado con piña, canela, clavo y limón.',
    price: 12, categoryId: 'bebidas', image: '🥤', gradient: foodGradients[4], available: true,
    allergens: [], extras: [],
  },
  {
    id: 'p20', name: 'Limonada Frozen', description: 'Limonada helada con hierbabuena fresca y un toque de jengibre.',
    price: 14, categoryId: 'bebidas', image: '🍋', gradient: foodGradients[1], available: true,
    allergens: [], extras: [
      { id: 'e15', name: 'Sin jengibre', price: 0, type: 'remove' },
    ],
  },
  {
    id: 'p21', name: 'Cerveza Artesanal IPA', description: 'Cerveza artesanal local con notas cítricas y amargor equilibrado. 330ml.',
    price: 18, categoryId: 'bebidas', image: '🍺', gradient: foodGradients[6], available: true,
    allergens: ['Gluten'], extras: [],
  },
  {
    id: 'p22', name: 'Agua Mineral', description: 'Agua mineral natural sin gas o con gas. 500ml.',
    price: 6, categoryId: 'bebidas', image: '💧', gradient: foodGradients[3], available: true,
    allergens: [],
    extras: [
      { id: 'e16', name: 'Tipo', price: 0, type: 'choice', options: ['Sin gas', 'Con gas'] },
    ],
  },
  {
    id: 'p23', name: 'Café Espresso', description: 'Espresso doble con granos de café orgánico de Chanchamayo.',
    price: 10, categoryId: 'bebidas', image: '☕', gradient: foodGradients[7], available: true,
    allergens: [], extras: [
      { id: 'e17', name: 'Con leche', price: 3, type: 'add' },
    ],
  },
  {
    id: 'p24', name: 'Jugo Natural', description: 'Jugo recién exprimido. Elige entre naranja, piña, papaya o mixto.',
    price: 14, categoryId: 'bebidas', image: '🧃', gradient: foodGradients[0], available: true,
    allergens: [],
    extras: [
      { id: 'e18', name: 'Fruta', price: 0, type: 'choice', options: ['Naranja', 'Piña', 'Papaya', 'Mixto'] },
    ],
  },
  // Promos
  {
    id: 'p25', name: 'Combo Pareja', description: '2 fondos + 2 bebidas + 1 postre para compartir. Ideal para dos.',
    price: 89, categoryId: 'promos', image: '💑', gradient: foodGradients[7], available: true,
    allergens: [], promo: true,
    extras: [],
  },
  {
    id: 'p26', name: 'Happy Hour Pisco', description: '2x1 en Pisco Sour y Chilcano. De lunes a jueves de 5pm a 7pm.',
    price: 28, categoryId: 'promos', image: '🎉', gradient: foodGradients[4], available: true,
    allergens: ['Huevo'], promo: true, extras: [],
  },
  {
    id: 'p27', name: 'Menú Ejecutivo', description: 'Entrada + fondo + bebida + postre del día. Disponible de lunes a viernes.',
    price: 42, categoryId: 'promos', image: '💼', gradient: foodGradients[1], available: true,
    allergens: [], promo: true, extras: [],
  },
];

export const orders: Order[] = [
  {
    id: 'o1', number: 147, tableId: 't3', tableName: 'Mesa 3', status: 'received',
    timestamp: '14:23', observations: 'Cliente con alergia a mariscos',
    priority: 'high', station: 'cocina', total: 86,
    items: [
      { name: 'Lomo Saltado', quantity: 2, extras: ['Término: Medio'], notes: '' },
      { name: 'Ensalada Mediterránea', quantity: 1, extras: ['Agregar pollo'], notes: 'Sin aceitunas' },
    ],
  },
  {
    id: 'o2', number: 148, tableId: 't7', tableName: 'Mesa 7', status: 'preparing',
    timestamp: '14:28', observations: '',
    priority: 'normal', station: 'cocina', total: 104,
    items: [
      { name: 'Risotto de Hongos', quantity: 1, extras: [], notes: '' },
      { name: 'Pescado a la Parrilla', quantity: 1, extras: [], notes: 'Sin alcaparras' },
      { name: 'Ceviche Clásico', quantity: 1, extras: ['Extra leche de tigre'], notes: '' },
    ],
  },
  {
    id: 'o3', number: 149, tableId: 't1', tableName: 'Mesa 1', status: 'preparing',
    timestamp: '14:31', observations: 'Mesa VIP - cumpleaños',
    priority: 'high', station: 'cocina', total: 156,
    items: [
      { name: 'Anticuchos de Corazón', quantity: 2, extras: ['Porción doble'], notes: '' },
      { name: 'Ají de Gallina', quantity: 1, extras: [], notes: '' },
      { name: 'Brownie con Helado', quantity: 2, extras: ['Helado extra'], notes: 'Con vela de cumpleaños' },
    ],
  },
  {
    id: 'o4', number: 150, tableId: 't5', tableName: 'Mesa 5', status: 'ready',
    timestamp: '14:15', observations: '',
    priority: 'normal', station: 'cocina', total: 62,
    items: [
      { name: 'Pasta Carbonara', quantity: 1, extras: ['Extra queso'], notes: '' },
      { name: 'Brownie con Helado', quantity: 1, extras: [], notes: '' },
    ],
  },
  {
    id: 'o5', number: 151, tableId: 't9', tableName: 'Mesa 9', status: 'received',
    timestamp: '14:35', observations: '',
    priority: 'normal', station: 'bar', total: 56,
    items: [
      { name: 'Pisco Sour', quantity: 2, extras: [], notes: '' },
      { name: 'Chicha Morada', quantity: 1, extras: [], notes: '' },
      { name: 'Limonada Frozen', quantity: 1, extras: ['Sin jengibre'], notes: '' },
    ],
  },
  {
    id: 'o6', number: 152, tableId: 't2', tableName: 'Mesa 2', status: 'received',
    timestamp: '14:38', observations: 'Servir postres después de los fondos',
    priority: 'normal', station: 'postres', total: 66,
    items: [
      { name: 'Suspiro Limeño', quantity: 2, extras: [], notes: '' },
      { name: 'Cheesecake de Maracuyá', quantity: 1, extras: [], notes: '' },
    ],
  },
  {
    id: 'o7', number: 153, tableId: 't11', tableName: 'Mesa 11', status: 'ready',
    timestamp: '14:10', observations: '',
    priority: 'normal', station: 'bar', total: 40,
    items: [
      { name: 'Cerveza Artesanal IPA', quantity: 2, extras: [], notes: '' },
      { name: 'Tequeños de Queso', quantity: 1, extras: [], notes: '' },
    ],
  },
];

export const tables: Table[] = [
  { id: 't1', number: 1, name: 'Mesa 1', capacity: 4, status: 'with-order', zone: 'Interior', qrCode: 'QR-M01', activeOrders: 1 },
  { id: 't2', number: 2, name: 'Mesa 2', capacity: 2, status: 'with-order', zone: 'Interior', qrCode: 'QR-M02', activeOrders: 1 },
  { id: 't3', number: 3, name: 'Mesa 3', capacity: 6, status: 'with-order', zone: 'Interior', qrCode: 'QR-M03', activeOrders: 1 },
  { id: 't4', number: 4, name: 'Mesa 4', capacity: 4, status: 'free', zone: 'Interior', qrCode: 'QR-M04', activeOrders: 0 },
  { id: 't5', number: 5, name: 'Mesa 5', capacity: 2, status: 'with-order', zone: 'Terraza', qrCode: 'QR-M05', activeOrders: 1 },
  { id: 't6', number: 6, name: 'Mesa 6', capacity: 4, status: 'free', zone: 'Terraza', qrCode: 'QR-M06', activeOrders: 0 },
  { id: 't7', number: 7, name: 'Mesa 7', capacity: 8, status: 'with-order', zone: 'Terraza', qrCode: 'QR-M07', activeOrders: 1 },
  { id: 't8', number: 8, name: 'Mesa 8', capacity: 2, status: 'free', zone: 'Barra', qrCode: 'QR-M08', activeOrders: 0 },
  { id: 't9', number: 9, name: 'Mesa 9', capacity: 4, status: 'occupied', zone: 'Barra', qrCode: 'QR-M09', activeOrders: 1 },
  { id: 't10', number: 10, name: 'Mesa 10', capacity: 6, status: 'pending-payment', zone: 'Interior', qrCode: 'QR-M10', activeOrders: 0 },
  { id: 't11', number: 11, name: 'Mesa 11', capacity: 4, status: 'with-order', zone: 'Terraza', qrCode: 'QR-M11', activeOrders: 1 },
  { id: 't12', number: 12, name: 'Mesa 12', capacity: 2, status: 'occupied', zone: 'Interior', qrCode: 'QR-M12', activeOrders: 0 },
];

export const users: User[] = [
  { id: 'u1', name: 'Carlos Mendoza', email: 'carlos@restaurante.com', role: 'admin', active: true, avatar: 'CM' },
  { id: 'u2', name: 'María Torres', email: 'maria@restaurante.com', role: 'supervisor', active: true, avatar: 'MT' },
  { id: 'u3', name: 'José Rivera', email: 'jose@restaurante.com', role: 'cocina', active: true, avatar: 'JR' },
  { id: 'u4', name: 'Ana Gutiérrez', email: 'ana@restaurante.com', role: 'cocina', active: true, avatar: 'AG' },
  { id: 'u5', name: 'Luis Paredes', email: 'luis@restaurante.com', role: 'mesero', active: true, avatar: 'LP' },
  { id: 'u6', name: 'Rosa Castillo', email: 'rosa@restaurante.com', role: 'mesero', active: true, avatar: 'RC' },
  { id: 'u7', name: 'Pedro Salazar', email: 'pedro@restaurante.com', role: 'cajero', active: true, avatar: 'PS' },
  { id: 'u8', name: 'Diana Flores', email: 'diana@restaurante.com', role: 'mesero', active: false, avatar: 'DF' },
];

export const RESTAURANT = {
  name: 'Mesa Viva',
  tagline: 'Sabores que conectan',
  currentTable: 'Mesa 12',
  tableNumber: 12,
  sessionToken: 'tk_m12_abc123',
};

export const dailyStats = {
  occupiedTables: 8,
  totalTables: 12,
  activeOrders: 7,
  totalSalesToday: 4_287,
  avgPrepTime: 18, // minutes
  completedOrders: 34,
};

export const topProducts = [
  { name: 'Lomo Saltado', orders: 47, revenue: 2256 },
  { name: 'Ceviche Clásico', orders: 38, revenue: 1444 },
  { name: 'Pisco Sour', orders: 35, revenue: 980 },
  { name: 'Brownie con Helado', orders: 29, revenue: 754 },
  { name: 'Pasta Carbonara', orders: 24, revenue: 864 },
  { name: 'Anticuchos', orders: 22, revenue: 704 },
];

export const salesByDay = [
  { day: 'Lun', sales: 3200 },
  { day: 'Mar', sales: 2800 },
  { day: 'Mié', sales: 3600 },
  { day: 'Jue', sales: 3100 },
  { day: 'Vie', sales: 4800 },
  { day: 'Sáb', sales: 5200 },
  { day: 'Dom', sales: 4287 },
];

export const prepTimes = [
  { hour: '11:00', avg: 12 },
  { hour: '12:00', avg: 16 },
  { hour: '13:00', avg: 22 },
  { hour: '14:00', avg: 19 },
  { hour: '15:00', avg: 14 },
  { hour: '16:00', avg: 10 },
  { hour: '17:00', avg: 11 },
  { hour: '18:00', avg: 15 },
  { hour: '19:00', avg: 20 },
  { hour: '20:00', avg: 24 },
  { hour: '21:00', avg: 18 },
];
