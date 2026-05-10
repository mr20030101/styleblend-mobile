import client from './client';

export const getSettings   = ()       => client.get('/settings');
export const getCategories = ()       => client.get('/categories');
export const getProducts   = (params) => client.get('/products', { params });
export const searchCustomers = (q)    => client.get('/customers/search', { params: { q } });
export const createCustomer  = (data) => client.post('/customers', data);
export const checkout        = (data) => client.post('/checkout', data);

export const getTransactions = (params) => client.get('/transactions', { params });
export const getTransaction  = (id)     => client.get(`/transactions/${id}`);
