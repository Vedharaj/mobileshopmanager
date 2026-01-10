import { useDispatch, useSelector } from "react-redux";
import { useState, useCallback } from "react";
import { fetchShops } from "../slices/shopsSlice";
import { fetchProducts } from "../slices/productSlice";
import { fetchCategories } from "../slices/categorySlice";
import { fetchCustomers } from "../slices/customerSlice";
import { fetchServices } from "../slices/serviceSlice";
import { fetchSales } from "../slices/salesSlice";
import { fetchRequestItems } from "../slices/requestItemsSlice";

/**
 * Custom hook to load all initial app data
 * This hook centralizes data fetching to avoid redundant API calls
 * Usage: const { loading, error, loadAllData } = useInitialDataLoad();
 */
export const useInitialDataLoad = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const shopsStatus = useSelector((state) => state.shops.status);
  const productsStatus = useSelector((state) => state.products.status);
  const categoriesStatus = useSelector((state) => state.categories.status);
  const customersStatus = useSelector((state) => state.customers.status);
  const servicesStatus = useSelector((state) => state.services.status);
  const salesStatus = useSelector((state) => state.sales.status);

  const loadAllData = useCallback(async (options = {}) => {
    const { days = 7, force = false } = options;
    
    setLoading(true);
    setError(null);
    
    const errors = [];

    try {
      // Fetch data in parallel for better performance
      const fetchPromises = [];

      // Always fetch shops if not already loaded
      if (force || shopsStatus === 'idle') {
        fetchPromises.push(
          dispatch(fetchShops()).unwrap().catch((err) => {
            errors.push({ type: 'shops', error: err });
            console.error("Error fetching shops:", err);
          })
        );
      }

      // Fetch other data in parallel
      if (force || productsStatus === 'idle') {
        fetchPromises.push(
          dispatch(fetchProducts()).unwrap().catch((err) => {
            errors.push({ type: 'products', error: err });
            console.error("Error fetching products:", err);
          })
        );
      }

      if (force || categoriesStatus === 'idle') {
        fetchPromises.push(
          dispatch(fetchCategories()).unwrap().catch((err) => {
            errors.push({ type: 'categories', error: err });
            console.error("Error fetching categories:", err);
          })
        );
      }

      if (force || customersStatus === 'idle') {
        fetchPromises.push(
          dispatch(fetchCustomers()).unwrap().catch((err) => {
            errors.push({ type: 'customers', error: err });
            console.error("Error fetching customers:", err);
          })
        );
      }

      if (force || servicesStatus === 'idle') {
        fetchPromises.push(
          dispatch(fetchServices()).unwrap().catch((err) => {
            errors.push({ type: 'services', error: err });
            console.error("Error fetching services:", err);
          })
        );
      }

      if (force || salesStatus === 'idle') {
        fetchPromises.push(
          dispatch(fetchSales({ days })).unwrap().catch((err) => {
            errors.push({ type: 'sales', error: err });
            console.error("Error fetching sales:", err);
          })
        );
      }

      // Request items are optional
      fetchPromises.push(
        dispatch(fetchRequestItems()).unwrap().catch((err) => {
          errors.push({ type: 'requestItems', error: err });
          console.error("Error fetching request items:", err);
        })
      );

      // Wait for all fetches to complete
      await Promise.all(fetchPromises);

      if (errors.length > 0) {
        setError(errors);
      }

      return { success: errors.length === 0, errors };
    } catch (err) {
      console.error("Critical error loading data:", err);
      setError([{ type: 'critical', error: err }]);
      return { success: false, errors: [{ type: 'critical', error: err }] };
    } finally {
      setLoading(false);
    }
  }, [dispatch, shopsStatus, productsStatus, categoriesStatus, customersStatus, servicesStatus, salesStatus]);

  const isAnyLoading = 
    shopsStatus === 'loading' ||
    productsStatus === 'loading' ||
    categoriesStatus === 'loading' ||
    customersStatus === 'loading' ||
    servicesStatus === 'loading' ||
    salesStatus === 'loading';

  return {
    loading: loading || isAnyLoading,
    error,
    loadAllData,
  };
};
