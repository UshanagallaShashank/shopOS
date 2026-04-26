# Cart endpoints — manage user shopping carts
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from middleware.auth import get_current_user
from models.cart import CartItem
from models.product import Product
from models.product_variant import ProductVariant
from models.user import User
from schemas.cart import CartItemCreate, CartItemResponse, CartItemUpdate

router = APIRouter()


@router.get("/items", response_model=List[CartItemResponse])
async def get_cart_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all cart items for the current user"""
    result = await db.execute(
        select(CartItem)
        .where(CartItem.user_id == current_user.id)
        .options(
            selectinload(CartItem.product),
            selectinload(CartItem.variant)
        )
    )
    items = result.scalars().all()
    return items


@router.post("/items", response_model=CartItemResponse, status_code=status.HTTP_201_CREATED)
async def add_to_cart(
    item_data: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add item to cart or update quantity if already exists"""
    
    # Verify product exists
    product = await db.get(Product, item_data.product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Verify variant if provided
    if item_data.variant_id:
        variant = await db.get(ProductVariant, item_data.variant_id)
        if not variant or variant.product_id != product.id:
            raise HTTPException(status_code=404, detail="Variant not found")
    
    # Check if item already in cart
    result = await db.execute(
        select(CartItem)
        .where(
            CartItem.user_id == current_user.id,
            CartItem.product_id == item_data.product_id,
            CartItem.variant_id == item_data.variant_id
        )
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        # Update quantity
        existing.quantity += item_data.quantity
        await db.commit()
        await db.refresh(existing)
        return existing
    
    # Create new cart item
    cart_item = CartItem(
        user_id=current_user.id,
        org_id=product.org_id,
        product_id=item_data.product_id,
        variant_id=item_data.variant_id,
        quantity=item_data.quantity,
    )
    db.add(cart_item)
    await db.commit()
    await db.refresh(cart_item)
    
    # Load relationships
    await db.refresh(cart_item, ["product", "variant"])
    
    return cart_item


@router.patch("/items/{item_id}", response_model=CartItemResponse)
async def update_cart_item(
    item_id: UUID,
    update_data: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update cart item quantity"""
    cart_item = await db.get(CartItem, item_id)
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if cart_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if update_data.quantity is not None:
        if update_data.quantity <= 0:
            await db.delete(cart_item)
            await db.commit()
            raise HTTPException(status_code=204, detail="Item removed from cart")
        cart_item.quantity = update_data.quantity
    
    await db.commit()
    await db.refresh(cart_item)
    await db.refresh(cart_item, ["product", "variant"])
    
    return cart_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_cart(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove item from cart"""
    cart_item = await db.get(CartItem, item_id)
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    if cart_item.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.delete(cart_item)
    await db.commit()


@router.delete("/items", status_code=status.HTTP_204_NO_CONTENT)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear all items from cart"""
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == current_user.id)
    )
    items = result.scalars().all()
    
    for item in items:
        await db.delete(item)
    
    await db.commit()
