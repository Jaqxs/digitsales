import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/stores/dataStore';

export function DataLoader() {
    const { isAuthenticated } = useAuth();
    const {
        fetchProducts,
        fetchCustomers,
        fetchEmployees,
        fetchSales,
        fetchStockRecords
    } = useDataStore();

    useEffect(() => {
        if (isAuthenticated) {
            // Fetch all initial data when user is authenticated
            fetchProducts();
            fetchCustomers();
            fetchEmployees();
            fetchSales();
            fetchStockRecords();
        }
    }, [isAuthenticated, fetchProducts, fetchCustomers, fetchEmployees, fetchSales, fetchStockRecords]);

    return null;
}
