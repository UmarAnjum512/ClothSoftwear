import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { Role } from './models/Role.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { Brand } from './models/Brand.js';
import { Size } from './models/Size.js';
import { Color } from './models/Color.js';
import { Product } from './models/Product.js';
import { ProductVariant } from './models/ProductVariant.js';
import { Supplier } from './models/Supplier.js';
import { Customer } from './models/Customer.js';
import { Setting } from './models/Setting.js';
import { CashRegister } from './models/CashRegister.js';
import { StockMovement } from './models/StockMovement.js';

const seedDatabase = async () => {
  try {
    
const mongoUri =
  process.env.MONGODB_URI?.trim() ||
  'mongodb://127.0.0.1:27017/cloth_pos_db';

console.log(
  '[Seed] MongoDB URI source:',
  process.env.MONGODB_URI ? '.env' : 'fallback'
);

await mongoose.connect(mongoUri);
console.log('[Seed] Connected to MongoDB');


    // Clear existing collections
    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Size.deleteMany({}),
      Color.deleteMany({}),
      Product.deleteMany({}),
      ProductVariant.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      Setting.deleteMany({}),
      CashRegister.deleteMany({}),
      StockMovement.deleteMany({})
    ]);
    console.log('[Seed] Cleared old data');

    // 1. Roles
    const roles = await Role.insertMany([
      { name: 'Super Admin', description: 'Full system control and admin access' },
      { name: 'Manager', description: 'Branch management and inventory overview' },
      { name: 'Cashier', description: 'POS billing, customer checkout, returns' },
      { name: 'Store Keeper', description: 'Inventory receiving and warehouse stock' }
    ]);
    const adminRole = roles.find(r => r.name === 'Super Admin');
    const managerRole = roles.find(r => r.name === 'Manager');
    const cashierRole = roles.find(r => r.name === 'Cashier');
    const storekeeperRole = roles.find(r => r.name === 'Store Keeper');

    // 2. Users
    const users = await User.create([
      {
        name: 'Umar Farooq (Owner)',
        email: 'admin@hooriyaarts.com',
        password: 'admin123',
        role: 'Super Admin',
        roleId: adminRole._id,
        phone: '+92 300 1112233'
      },
      {
        name: 'Bilal Khan (Store Manager)',
        email: 'manager@hooriyaarts.com',
        password: 'manager123',
        role: 'Manager',
        roleId: managerRole._id,
        phone: '+92 312 3344556'
      },
      {
        name: 'Zainab Bibi (Head Cashier)',
        email: 'cashier@hooriyaarts.com',
        password: 'cashier123',
        role: 'Cashier',
        roleId: cashierRole._id,
        phone: '+92 333 4455667'
      },
      {
        name: 'Tariq Mehmood (Store Keeper)',
        email: 'storekeeper@hooriyaarts.com',
        password: 'store123',
        role: 'Store Keeper',
        roleId: storekeeperRole._id,
        phone: '+92 345 5566778'
      }
    ]);
    const adminUser = users[0];
    const cashierUser = users[2];

    // 3. Categories
    const categories = await Category.insertMany([
      { name: "Men's Eastern Wear", code: 'MEN-EAST', description: 'Kurtas, Shalwar Kameez, Waistcoats' },
      { name: "Men's Western & Denim", code: 'MEN-WEST', description: 'Shirts, Polo Tees, Jeans, Chinos' },
      { name: "Women's Pret Stitched", code: 'WOM-PRET', description: 'Ready to wear 1pc, 2pc, 3pc suits' },
      { name: "Women's Unstitched", code: 'WOM-UNST', description: 'Lawn, Chiffon, Linen suit cuts' },
      { name: 'Kids Casual & Festive', code: 'KID-ALL', description: 'Boy & Girl festive and casual apparel' }
    ]);

    // 4. Brands
    const brands = await Brand.insertMany([
      { name: 'J. Junaid Jamshed', description: 'Premium Pakistani Eastern Wear' },
      { name: 'Khaadi', description: 'Modern Handwoven & Contemporary Fashion' },
      { name: 'Gul Ahmed', description: 'Heritage fabrics and high-end apparel' },
      { name: "Levi's", description: 'Denim, Jeans and Jackets' },
      { name: 'Outfitters', description: 'Youth Casual and Streetwear' }
    ]);

    // 5. Sizes
    const sizes = await Size.insertMany([
      { name: 'S', type: 'Alpha', orderIndex: 1 },
      { name: 'M', type: 'Alpha', orderIndex: 2 },
      { name: 'L', type: 'Alpha', orderIndex: 3 },
      { name: 'XL', type: 'Alpha', orderIndex: 4 },
      { name: 'XXL', type: 'Alpha', orderIndex: 5 },
      { name: '30', type: 'Numeric', orderIndex: 10 },
      { name: '32', type: 'Numeric', orderIndex: 11 },
      { name: '34', type: 'Numeric', orderIndex: 12 },
      { name: '36', type: 'Numeric', orderIndex: 13 }
    ]);

    // 6. Colors
    const colors = await Color.insertMany([
      { name: 'Jet Black', hexCode: '#111827' },
      { name: 'Snow White', hexCode: '#FFFFFF' },
      { name: 'Navy Blue', hexCode: '#1E3A8A' },
      { name: 'Maroon', hexCode: '#831843' },
      { name: 'Olive Green', hexCode: '#365314' },
      { name: 'Heather Grey', hexCode: '#6B7280' }
    ]);

    // 7. Products and Variants
    const s_M = sizes.find(s => s.name === 'M');
    const s_L = sizes.find(s => s.name === 'L');
    const s_XL = sizes.find(s => s.name === 'XL');
    const s_32 = sizes.find(s => s.name === '32');
    const s_34 = sizes.find(s => s.name === '34');

    const c_Black = colors.find(c => c.name === 'Jet Black');
    const c_White = colors.find(c => c.name === 'Snow White');
    const c_Navy = colors.find(c => c.name === 'Navy Blue');
    const c_Maroon = colors.find(c => c.name === 'Maroon');
    const c_Grey = colors.find(c => c.name === 'Heather Grey');

    // Product 1: Premium Cotton Kurta
    const p1 = await Product.create({
      name: 'Premium Egyptian Cotton Kurta',
      code: 'PRD-KUR-01',
      categoryId: categories[0]._id,
      brandId: brands[0]._id,
      description: 'Finest 100% combed cotton, band collar with subtle embroidery detailing.',
      images: ['https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80']
    });

    const v1_1 = await ProductVariant.create({
      productId: p1._id,
      sku: 'KUR-BLK-M',
      barcode: '890100101',
      sizeId: s_M._id,
      colorId: c_Black._id,
      costPrice: 2200,
      salePrice: 3850,
      stockQuantity: 18,
      reorderLevel: 5
    });

    const v1_2 = await ProductVariant.create({
      productId: p1._id,
      sku: 'KUR-BLK-L',
      barcode: '890100102',
      sizeId: s_L._id,
      colorId: c_Black._id,
      costPrice: 2200,
      salePrice: 3850,
      stockQuantity: 14,
      reorderLevel: 5
    });

    const v1_3 = await ProductVariant.create({
      productId: p1._id,
      sku: 'KUR-WHT-M',
      barcode: '890100103',
      sizeId: s_M._id,
      colorId: c_White._id,
      costPrice: 2200,
      salePrice: 3850,
      stockQuantity: 3, // Low stock test!
      reorderLevel: 5
    });

    const v1_4 = await ProductVariant.create({
      productId: p1._id,
      sku: 'KUR-WHT-L',
      barcode: '890100104',
      sizeId: s_L._id,
      colorId: c_White._id,
      costPrice: 2200,
      salePrice: 3850,
      stockQuantity: 20,
      reorderLevel: 5
    });

    // Product 2: Embroidered Festive Pret 2PC (Women)
    const p2 = await Product.create({
      name: 'Embroidered Festive Pret 2PC',
      code: 'PRD-PRT-02',
      categoryId: categories[2]._id,
      brandId: brands[1]._id,
      description: 'Raw silk shirt paired with matching culottes, intricate zari thread work.',
      images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80']
    });

    const v2_1 = await ProductVariant.create({
      productId: p2._id,
      sku: 'PRT-MRN-M',
      barcode: '890100201',
      sizeId: s_M._id,
      colorId: c_Maroon._id,
      costPrice: 4200,
      salePrice: 6990,
      stockQuantity: 12,
      reorderLevel: 4
    });

    const v2_2 = await ProductVariant.create({
      productId: p2._id,
      sku: 'PRT-MRN-L',
      barcode: '890100202',
      sizeId: s_L._id,
      colorId: c_Maroon._id,
      costPrice: 4200,
      salePrice: 6990,
      stockQuantity: 0, // Out of stock test!
      reorderLevel: 4
    });

    // Product 3: Slim Stretch Chino Trouser
    const p3 = await Product.create({
      name: 'Slim Stretch Cotton Chino',
      code: 'PRD-CHN-03',
      categoryId: categories[1]._id,
      brandId: brands[4]._id,
      description: 'Comfort stretch cotton twill chino trousers with double welt pockets.',
      images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80']
    });

    const v3_1 = await ProductVariant.create({
      productId: p3._id,
      sku: 'CHN-GRY-32',
      barcode: '890100301',
      sizeId: s_32._id,
      colorId: c_Grey._id,
      costPrice: 1800,
      salePrice: 3200,
      stockQuantity: 22,
      reorderLevel: 6
    });

    const v3_2 = await ProductVariant.create({
      productId: p3._id,
      sku: 'CHN-NVY-34',
      barcode: '890100302',
      sizeId: s_34._id,
      colorId: c_Navy._id,
      costPrice: 1800,
      salePrice: 3200,
      stockQuantity: 16,
      reorderLevel: 6
    });

    // Product 4: Classic Denim Trucker Jacket
    const p4 = await Product.create({
      name: 'Classic Denim Trucker Jacket',
      code: 'PRD-JKT-04',
      categoryId: categories[1]._id,
      brandId: brands[3]._id,
      description: 'Heavyweight washed denim trucker jacket with button-flap chest pockets.',
      images: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80']
    });

    const v4_1 = await ProductVariant.create({
      productId: p4._id,
      sku: 'JKT-NVY-L',
      barcode: '890100401',
      sizeId: s_L._id,
      colorId: c_Navy._id,
      costPrice: 3800,
      salePrice: 6490,
      stockQuantity: 9,
      reorderLevel: 3
    });

    // Product 5: Formal Velvet Waistcoat
    const p5 = await Product.create({
      name: 'Festive Jacquard Waistcoat',
      code: 'PRD-WST-05',
      categoryId: categories[0]._id,
      brandId: brands[0]._id,
      description: 'Micro jacquard weave formal waistcoat with metal crest buttons.',
      images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80']
    });

    const v5_1 = await ProductVariant.create({
      productId: p5._id,
      sku: 'WST-BLK-M',
      barcode: '890100501',
      sizeId: s_M._id,
      colorId: c_Black._id,
      costPrice: 2800,
      salePrice: 4950,
      stockQuantity: 15,
      reorderLevel: 4
    });

    // Product 6: Printed Luxury Lawn 3PC (Women)
    const p6 = await Product.create({
      name: 'Printed Luxury Lawn 3PC Suit',
      code: 'PRD-LWN-06',
      categoryId: categories[3]._id,
      brandId: brands[2]._id,
      description: 'Swiss lawn printed shirt and trouser with chiffon dupatta.',
      images: ['https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80']
    });

    const v6_1 = await ProductVariant.create({
      productId: p6._id,
      sku: 'LWN-WHT-FS',
      barcode: '890100601',
      sizeId: s_M._id,
      colorId: c_White._id,
      costPrice: 3100,
      salePrice: 5200,
      stockQuantity: 18,
      reorderLevel: 5
    });

    // 8. Suppliers
    const suppliers = await Supplier.insertMany([
      {
        name: 'Al-Karam Textile Mills & Wholesalers',
        contactPerson: 'Kashif Sheikh',
        phone: '+92 300 9234567',
        email: 'sales@alkaramtextiles.com',
        address: 'SITE Industrial Area, Karachi',
        openingBalance: 0,
        currentBalance: 0
      },
      {
        name: 'Chenab Apparel & Finishing Works',
        contactPerson: 'Hamid Raza',
        phone: '+92 321 8877665',
        email: 'info@chenabapparel.pk',
        address: 'Nishatabad, Faisalabad',
        openingBalance: 15000,
        currentBalance: 15000
      }
    ]);

    // 9. Customers
    await Customer.insertMany([
      {
        name: 'Walk-in Customer',
        phone: '03000000000',
        email: 'walkin@hooriyaarts.com',
        address: 'Counter Direct',
        openingBalance: 0,
        currentBalance: 0
      },
      {
        name: 'Mohammad Ahmed',
        phone: '03019876543',
        email: 'ahmed.m@gmail.com',
        address: 'House # 45, Gulshan-e-Iqbal Block 6, Karachi',
        openingBalance: 0,
        currentBalance: 0
      },
      {
        name: 'Ayesha Siddiqua',
        phone: '03214567890',
        email: 'ayesha.s@yahoo.com',
        address: 'Apartment 12-B, Clifton, Karachi',
        openingBalance: 0,
        currentBalance: 0
      }
    ]);

    // 10. Open Cash Register for Cashier
    await CashRegister.create({
      userId: cashierUser._id,
      shiftNumber: 'SH-100001',
      openingCash: 5000,
      status: 'Open',
      openedAt: new Date(),
      notes: 'Morning Shift Initialized'
    });

    // 11. System Settings
    await Setting.insertMany([
      { key: 'storeName', value: 'HOORIYA ARTS' },
      { key: 'storePhone', value: '+92 300 1234567' },
      { key: 'storeEmail', value: 'contact@hooriyaarts.com' },
      { key: 'storeAddress', value: 'Shop # 14-16, Tariq Road Fashion Market, Karachi' },
      { key: 'currency', value: 'PKR' },
      { key: 'currencySymbol', value: 'Rs.' },
      { key: 'taxRate', value: 0 },
      { key: 'receiptFooterNote', value: 'Thank you for shopping with us! Exchange within 7 days with original receipt.' },
      { key: 'lowStockDefaultThreshold', value: 5 }
    ]);

    console.log('[Seed] Database successfully populated!');
    console.log('----------------------------------------------------');
    console.log('Login credentials:');
    console.log('Super Admin: admin@hooriyaarts.com       / admin123');
    console.log('Manager:     manager@hooriyaarts.com     / manager123');
    console.log('Cashier:     cashier@hooriyaarts.com     / cashier123');
    console.log('Storekeeper: storekeeper@hooriyaarts.com / store123');
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
