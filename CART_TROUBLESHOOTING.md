# Cart Troubleshooting Guide

## Issue: Cart Always Shows Empty

### Quick Checks:

1. **Open Browser DevTools Console** (F12 or Cmd+Option+I)
   - Check for any JavaScript errors
   - Look for localStorage warnings

2. **Check localStorage**
   - Open DevTools → Application tab → Local Storage
   - Look for keys starting with `shopos_cart_`
   - Example: `shopos_cart_96c35110-3114-4f40-a711-db5985b95ca9`
   - Click on it to see the stored cart data

3. **Test Adding to Cart**
   ```javascript
   // Open Console and run:
   localStorage.getItem('shopos_cart_96c35110-3114-4f40-a711-db5985b95ca9')
   // Should show cart data if items were added
   ```

### Common Causes:

#### 1. **Page Refresh Clears Cart**
- **Symptom**: Cart shows items, then disappears after refresh
- **Cause**: localStorage not persisting
- **Fix**: Check if browser is in private/incognito mode

#### 2. **Different orgId on Each Load**
- **Symptom**: Cart key changes each time
- **Cause**: orgId parameter changing
- **Fix**: Check the URL - should be `/shop/[same-org-id]`

#### 3. **localStorage Disabled**
- **Symptom**: No cart data in localStorage
- **Cause**: Browser settings or extensions blocking localStorage
- **Fix**: Check browser settings, disable extensions

#### 4. **Cart Cleared After Order**
- **Symptom**: Cart empties after placing order
- **Cause**: `clear()` called on successful order
- **Expected**: This is correct behavior

### Debug Steps:

#### Step 1: Check if Items Are Being Added
```javascript
// In browser console:
const orgId = '96c35110-3114-4f40-a711-db5985b95ca9'; // Your org ID
const key = `shopos_cart_${orgId}`;
console.log('Cart key:', key);
console.log('Cart data:', localStorage.getItem(key));
```

#### Step 2: Manually Add Test Item
```javascript
// In browser console:
const orgId = '96c35110-3114-4f40-a711-db5985b95ca9';
const key = `shopos_cart_${orgId}`;
const testCart = [{
  product: {
    id: 'test-product-id',
    name: 'Test Product',
    price: 100,
    stock: 10,
    images: []
  },
  qty: 1
}];
localStorage.setItem(key, JSON.stringify(testCart));
console.log('Test cart added. Refresh the page.');
```

#### Step 3: Check Cart Hook Execution
Add console.logs to `useCart.ts`:

```typescript
// In apps/platform-admin/lib/hooks/useCart.ts

// Add after line 11:
console.log('[useCart] Hook called with orgId:', orgId);

// Add in hydrate useEffect (after line 16):
console.log('[useCart] Hydrating from localStorage, key:', key);
console.log('[useCart] Stored data:', stored);
console.log('[useCart] Parsed items:', JSON.parse(stored));

// Add in persist useEffect (after line 23):
console.log('[useCart] Persisting to localStorage:', items);
```

### Solutions:

#### Solution 1: Add Loading State
The cart might be showing empty during hydration. Add a loading state:

```typescript
// In useCart.ts
const [items, setItems] = useState<CartItem[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  if (!orgId) return
  try {
    const stored = localStorage.getItem(key)
    if (stored) setItems(JSON.parse(stored))
  } catch { /* ignore */ }
  finally {
    setIsLoading(false)
  }
}, [key, orgId])

return { items, count, total, add, setQty, remove, clear, isLoading }
```

#### Solution 2: Use useLayoutEffect for Immediate Hydration
```typescript
// Change useEffect to useLayoutEffect for synchronous hydration
import { useLayoutEffect } from "react"

useLayoutEffect(() => {
  if (!orgId) return
  try {
    const stored = localStorage.getItem(key)
    if (stored) setItems(JSON.parse(stored))
  } catch { /* ignore */ }
}, [key, orgId])
```

#### Solution 3: Backend Cart Sync (Future Enhancement)
Once cart API endpoints are implemented, sync with backend:

```typescript
// Sync with backend on mount
useEffect(() => {
  if (!userId) return
  
  // Fetch cart from backend
  api.cart.get(orgId).then(backendCart => {
    // Merge with localStorage
    const merged = mergeCart(items, backendCart)
    setItems(merged)
  })
}, [orgId, userId])
```

### Verification:

After applying fixes, verify:

1. ✅ Add item to cart
2. ✅ Refresh page - item still there
3. ✅ Close tab, reopen - item still there
4. ✅ Add more items - count increases
5. ✅ Remove item - count decreases
6. ✅ Place order - cart clears

### Still Not Working?

If cart is still empty after all checks:

1. **Clear all localStorage**:
   ```javascript
   localStorage.clear()
   ```

2. **Hard refresh**: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

3. **Check Network tab**: Look for failed API calls

4. **Check for React StrictMode**: In development, React StrictMode runs effects twice, which might cause issues

5. **Try different browser**: Rule out browser-specific issues

### Expected Behavior:

- **Add to cart**: Item appears immediately
- **Refresh page**: Item persists
- **Change quantity**: Updates immediately
- **Remove item**: Disappears immediately
- **Place order**: Cart clears, success message shows
- **Navigate away and back**: Cart persists

### Current Implementation Status:

- ✅ localStorage cart (working)
- ⏳ Backend cart API (not yet implemented)
- ⏳ Cart sync across devices (requires backend)
- ⏳ Cart persistence after logout (requires backend)

### Next Steps:

To fully fix cart persistence, we need to:

1. Create cart API endpoints (GET, POST, PATCH, DELETE)
2. Update useCart hook to sync with backend
3. Implement cart merge logic (localStorage + backend)
4. Add cart migration on login

See `IMPLEMENTATION_SUMMARY.md` for the full cart API implementation plan.
