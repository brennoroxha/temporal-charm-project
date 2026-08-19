# Plan - Implement Shopping Cart Lateral Drawer

Implement the shopping cart as a lateral drawer (side sheet) instead of a standalone page, ensuring a smoother user experience across the store.

## User Review Required

> [!IMPORTANT]
> The current project has a `/carrinho` route. With the new drawer, this page will be replaced by the lateral UI accessible from any page via the header.

- **Drawer Layout**: A side-panel that slides from the right.
- **Cart Logic**: Reuse existing `src/lib/lojaCart.ts` and `lojaProducts` data.
- **Trigger**: The cart icon in `LojaHeader` will now open the drawer instead of navigating to `/carrinho`.

## Proposed Changes

### Components & UI

#### [NEW] `src/components/CartDrawer.tsx`
- Create a new component using the existing `Sheet` component from `src/components/ui/sheet.tsx`.
- Implement cart item listing with quantity controls (plus/minus/remove).
- Show total price and a "Finalizar Compra" button that leads to `/checkout`.

#### `src/components/LojaHeader.tsx`
- Add state to manage the drawer open/close.
- Update the cart icon click handler to toggle the drawer.
- Render the `CartDrawer` component.

#### `src/routes/loja.tsx` & `src/routes/produto.$slug.tsx`
- Update the `onCartClick` prop in `LojaHeader` to trigger the drawer.
- Ensure the drawer opens automatically when an item is added to the cart (optional enhancement).

### Routes

#### `src/routes/carrinho.tsx`
- Mark as deprecated or redirect to the store with the drawer open if accessed directly.

## Technical Details

- **State Management**: Use a simple local state in `LojaHeader` or a shared state/context if needed to open the drawer from product pages.
- **Animations**: Use Radix UI / Shadcn `Sheet` animations for the slide-in effect.
- **Persistence**: Continue using `localStorage` (via `lojaCart.ts`) to ensure cart items persist across refreshes.

## Verification Plan

### Manual Verification
- Go to `/loja`, click the cart icon, and verify the drawer opens from the right.
- Add an item to the cart and check if the drawer shows the new item.
- Update quantities and remove items inside the drawer.
- Click "Finalizar Compra" and verify it redirects to `/checkout`.
- Test on mobile to ensure the drawer is responsive (width adjustment).
