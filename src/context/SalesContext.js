import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
    const [sales, setSales] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load
    useEffect(() => {
        loadSales();
    }, []);

    const loadSales = async () => {
        try {
            const response = await api.get('/sales');
            setSales(response.data);
        } catch (error) {
            console.error('Failed to load sales:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addSale = async (newSale) => {
        try {
            const response = await api.post('/sales', newSale);
            setSales([response.data, ...sales]);
            return { success: true };
        } catch (error) {
            console.error('Failed to add sale:', error);
            return { success: false, error };
        }
    };

    const deleteSale = async (id) => {
        try {
            await api.delete(`/sales/${id}`);
            // Update local state by removing the deleted sale
            // The API returns the deleted sale or success message, 
            // relying on ID matching for optimistic update or refetch
            setSales(prevSales => prevSales.filter(sale => sale._id !== id));
        } catch (error) {
            console.error('Failed to delete sale:', error);
        }
    };

    return (
        <SalesContext.Provider value={{ sales, addSale, deleteSale, isLoading, loadSales }}>
            {children}
        </SalesContext.Provider>
    );
};

export const useSales = () => {
    const context = useContext(SalesContext);
    if (!context) {
        throw new Error('useSales must be used within a SalesProvider');
    }
    return context;
};
