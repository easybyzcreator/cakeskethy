import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'cakes-kethy-crm';
const STORE_NAME = 'customers';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  email: string;
  address: string;
  number: string;
  zip: string;
  city: string;
  orders: any[];
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export const crmService = {
  async getCustomers(): Promise<Customer[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async saveCustomer(customer: Customer) {
    const db = await getDB();
    await db.put(STORE_NAME, customer);
  },

  async deleteCustomer(id: string) {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async updateOrderDeliveryPhoto(customerId: string, orderId: string, photo: string) {
    const db = await getDB();
    const customer = await db.get(STORE_NAME, customerId);
    if (customer) {
      const orderIndex = customer.orders.findIndex((o: any) => o.id === orderId);
      if (orderIndex !== -1) {
        customer.orders[orderIndex].deliveryPhoto = photo;
        await db.put(STORE_NAME, customer);
      }
    }
  },

  async syncCustomersFromOrders(orders: any[]) {
    const db = await getDB();
    const customers: Record<string, Customer> = {};

    orders.forEach(order => {
      const phone = order.customerPhone;
      if (!customers[phone]) {
        customers[phone] = {
          id: phone,
          name: order.customerName,
          phone: order.customerPhone,
          birthday: order.customerBirthday,
          email: order.customerEmail,
          address: order.customerAddress,
          number: order.customerNumber,
          zip: order.customerZip,
          city: order.customerCity,
          orders: []
        };
      }
      customers[phone].orders.push(order);
    });

    const tx = db.transaction(STORE_NAME, 'readwrite');
    for (const customer of Object.values(customers)) {
      await tx.store.put(customer);
    }
    await tx.done;
  }
};
