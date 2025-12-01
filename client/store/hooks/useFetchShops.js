import { useDispatch, useSelector } from "react-redux";
import { fetchShops } from "../slices/shopsSlice";
import { useState, useCallback } from "react";

/**
 * Custom hook to fetch shops with loading state
 * Usage: const { loading, error, refetch } = useFetchShops();
 */
export const useFetchShops = () => {
  const dispatch = useDispatch();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);
  const shopsStatus = useSelector((state) => state.shops.status);
  const shops = useSelector((state) => state.shops?.shops || []);

  const refetch = useCallback(async () => {
    setLocalLoading(true);
    setError(null);
    try {
      await dispatch(fetchShops()).unwrap();
    } catch (err) {
      setError(err?.message || "Failed to fetch shops");
      console.error("Error fetching shops:", err);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  return {
    shops,
    loading: localLoading || shopsStatus === "loading",
    error,
    refetch,
    isLoaded: shops.length > 0,
  };
};
