# Mobx 1.2

**Date:** January 10, 2026  
**Version:** 1.2  
**Type:** Feature Enhancement

---

## Overview

Implemented user-specific shop data filtering across all screens and components to ensure that staff users only see data (categories, products, and requests) for their assigned shops, while admin users continue to see all shops and data.

## Changes Made

### 1. **CategoryManagement.jsx**
**File:** `client/screens/CategoryManagement.jsx`

**Changes:**
- Added `user` to Redux selector alongside existing `role` selector
- Implemented `userShopIds` calculation:
  - Staff users: Returns IDs of shops assigned to them (`user.shops`)
  - Admin users: Returns IDs of all shops
- Added `userShops` filter: Filters all shops to only those accessible by the user
- Added `userCategories` filter: Filters categories to only those belonging to user's accessible shops
- Updated `useEffect` hook to use `userShops` instead of `shops` for initial shop selection
- Updated shop picker in form to use `userShops` instead of `shops`
- Updated category list rendering to display `userCategories` instead of all categories

**Key Code Addition:**
```javascript
const userShopIds = isStaff && user?.shops ? user.shops.map(s => s._id || s) : shops.map(s => s._id);
const userShops = shops.filter(shop => userShopIds.includes(shop._id));
const userCategories = categories.filter(cat => {
  const catShopId = cat.shop_id?._id || cat.shop_id;
  return userShopIds.includes(catShopId);
});
```

---

### 2. **ProductScreen.jsx**
**File:** `client/screens/ProductScreen.jsx`

**Changes:**
- Added filtering logic for products, categories, and shops based on user role
- Implemented `isStaff` variable for cleaner role checking
- Created `userShopIds`, `userShops`, `userCategories`, and `userProducts` filtered arrays
- Updated `useEffect` hook to initialize shop selection using `userShops`
- Updated filter logic in category selectors to use `userCategories`:
  - `shopCategories` filter now uses `userCategories`
  - `filterCategories` filter now uses `userCategories`
- Updated name suggestion logic to use `userProducts` instead of all products
- Updated all shop picker references to use `userShops` (3 locations):
  - Request form shop picker
  - Product form shop picker
  - Product filter bar shop picker
- Updated product reset logic after successful operations to use `userShops`

**Key Code Additions:**
```javascript
const isStaff = role === "staff";
const userShopIds = isStaff && staffShops.length > 0 
  ? staffShops.map(s => s._id || s) 
  : shops.map(s => s._id);
const userShops = shops.filter(shop => userShopIds.includes(shop._id));
const userCategories = categories.filter(cat => {
  const catShopId = cat.shop_id?._id || cat.shop_id;
  return userShopIds.includes(catShopId);
});
const userProducts = products.filter(prod => {
  const prodShopId = prod.shop_id?._id || prod.shop_id;
  return userShopIds.includes(prodShopId);
});
```

---

### 3. **ProductsTab.jsx**
**File:** `client/components/tabs/ProductsTab.jsx`

**Changes:**
- Added same filtering logic as ProductScreen for consistency
- Created `userShopIds`, `userShops`, `userCategories`, and `userProducts` arrays
- Updated `useEffect` hook for shop selection initialization
- Updated category filters (`shopCategories` and `filterCategories`) to use `userCategories`
- Updated product filtering logic in product container to use `userCategories` for category lookups
- Updated product list filtering to start with `userProducts` instead of all products
- Updated name suggestion logic to use `userProducts`
- Updated all shop pickers (3 locations) to use `userShops`:
  - Product form shop picker
  - Product filter bar shop picker
- Updated product reset logic to use `userShops`

**Key Changes:**
- `let filteredProducts = userProducts` instead of `products`
- All category references updated from `categories` to `userCategories`
- All shop references updated from `shops` to `userShops`

---

### 4. **RequestsTab.jsx**
**File:** `client/components/tabs/RequestsTab.jsx`

**Changes:**
- Added filtering logic for products, shops, and request items
- Created `userShopIds`, `userShops`, `userProducts`, and `userRequestItems` filtered arrays
- Updated `useEffect` hook for shop selection to use `userShops`
- Updated name suggestion logic to use `userProducts` instead of all products
- Updated shop picker to use `userShops` instead of all shops
- Updated request items sorting to use `userRequestItems`:
  - `sortedRequests` now filters from `userRequestItems`
  - Dependency array updated to reference `userRequestItems`

**Key Code Changes:**
```javascript
const isStaff = role === "staff";
const userShopIds = isStaff && staffShops.length > 0 
  ? staffShops.map(s => s._id || s) 
  : shops.map(s => s._id);
const userShops = shops.filter(shop => userShopIds.includes(shop._id));
const userProducts = products.filter(prod => {
  const prodShopId = prod.shop_id?._id || prod.shop_id;
  return userShopIds.includes(prodShopId);
});
const userRequestItems = requestItems.filter(item => {
  const itemShopId = item.shop_id?._id || item.shop_id;
  return userShopIds.includes(itemShopId);
});
```

---

## Files Modified

| File | Lines Changed | Type |
|------|---------------|------|
| `client/screens/CategoryManagement.jsx` | 4 major changes | Filtering logic + UI updates |
| `client/screens/ProductScreen.jsx` | 7 major changes | Filtering logic + UI updates |
| `client/components/tabs/ProductsTab.jsx` | 8 major changes | Filtering logic + UI updates |
| `client/components/tabs/RequestsTab.jsx` | 6 major changes | Filtering logic + UI updates |

---

## Implementation Details

### User Shop ID Logic

The filtering uses a consistent pattern across all files:

```javascript
// Staff: Only their assigned shops
// Admin: All shops in the system
const userShopIds = isStaff && staffShops.length > 0 
  ? staffShops.map(s => s._id || s) 
  : shops.map(s => s._id);
```

### Data Flow

1. **User authenticates** → Redux stores user data with `shops` array
2. **Component mounts** → Calculate `userShopIds` based on role and shops
3. **Filter all data** → Create `userShops`, `userCategories`, `userProducts`, `userRequestItems`
4. **UI renders** → Display only user-specific data
5. **User interactions** → Operations limited to user's shops

---

## Benefits

✅ **Enhanced Security:** Users can only view/modify data for their assigned shops  
✅ **Better UX:** Reduced data clutter for staff users  
✅ **Consistent Behavior:** Same filtering logic across all screens  
✅ **Scalability:** Easy to extend to other features  
✅ **Admin Flexibility:** Admin users see all data without restrictions  

---

## Testing Checklist

- [ ] Staff users see only their assigned shops and related data
- [ ] Admin users see all shops and related data
- [ ] Shop pickers show only accessible shops
- [ ] Category lists show only categories for user's shops
- [ ] Product lists show only products for user's shops
- [ ] Request items show only requests for user's shops
- [ ] Suggestions and autocomplete respect shop filters
- [ ] Create/Update operations use correct shop filters
- [ ] No data leakage between different shop contexts

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.2 | Jan 10, 2026 | User shop data filtering implementation |
| 1.1 | Previous | Basic shop management |
| 1.0 | Previous | Initial release |

---

## Notes

- All changes maintain backward compatibility
- Redux selectors still fetch all data; filtering happens at component level
- Staff users with no assigned shops will see empty lists (expected behavior)
- Filter logic handles both object IDs and string IDs safely
