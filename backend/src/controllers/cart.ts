/**
 * Cart Controller - Mobile optimized
 * Simple cart with real-time calculations
 */

import { prisma } from '@/config/database';
import { ApiError } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { Prisma } from '@prisma/client';

// Mobile-friendly cart item
const CART_ITEM_SELECT = {
  id: true,
  quantity: true,
  unitPrice: true,
  total: true,
  product: {
    select: {
      id: true,
      name: true,
      nameGu: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      thumbnail: true,
      stock: true,
      isActive: true,
    },
  },
} as const;

export const cartController = {
  /**
   * Get or create user's cart
   */
  async getCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: CART_ITEM_SELECT,
          orderBy: { createdAt: 'asc' },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
            maxDiscount: true,
          },
        },
        subtotal: true,
        discount: true,
        total: true,
      },
    });

    // Create cart if doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        select: {
          id: true,
          items: {
            select: CART_ITEM_SELECT,
          },
          coupon: {
            select: {
              id: true,
              code: true,
              type: true,
              value: true,
              maxDiscount: true,
            },
          },
          subtotal: true,
          discount: true,
          total: true,
        },
      });
    }

    return {
      success: true,
      data: {
        id: cart.id,
        items: cart.items,
        coupon: cart.coupon,
        subtotal: Number(cart.subtotal),
        discount: Number(cart.discount),
        total: Number(cart.total),
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      },
    };
  },

  /**
   * Add item to cart
   */
  async addItem(userId: string, data: { productId: string; quantity: number }) {
    // Validate product
    const product = await prisma.product.findUnique({
      where: { id: data.productId, isActive: true },
      select: { id: true, price: true, stock: true, name: true },
    });

    if (!product) {
      throw new ApiError(404, 'પ્રોડક્ટ મળ્યું નથી');
    }

    if (product.stock < 1) {
      throw new ApiError(400, 'પ્રોડક્ટ સ્ટોકમાં નથી');
    }

    // Get or create cart
    const cart = await prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { id: true },
    });

    // Check if item already exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: data.productId,
        },
      },
    });

    let newQuantity = data.quantity;
    let unitPrice = product.price;

    if (existingItem) {
      newQuantity = existingItem.quantity + data.quantity;

      if (newQuantity > product.stock) {
        throw new ApiError(400, 'ફક્ત ' + product.stock + ' પ્રોડક્ટ ઉપલબ્ધ છે');
      }

      // Update existing item
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          total: newQuantity * Number(unitPrice),
        },
      });
    } else {
      if (data.quantity > product.stock) {
        throw new ApiError(400, 'ફક્ત ' + product.stock + ' પ્રોડક્ટ ઉપલબ્ધ છે');
      }

      // Add new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: data.productId,
          quantity: data.quantity,
          unitPrice: product.price,
          total: data.quantity * Number(product.price),
        },
      });
    }

    // Recalculate cart totals
    await this.recalculateCart(cart.id);

    logger.info(`Item added to cart: ${product.name} (${data.quantity})`);

    return {
      success: true,
      message: 'કાર્ટમાં ઉમેરવામાં આવ્યું',
      data: {
        productId: data.productId,
        quantity: newQuantity,
      },
    };
  },

  /**
   * Update cart item quantity
   */
  async updateItem(userId: string, itemId: string, quantity: number) {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      select: {
        id: true,
        cartId: true,
        quantity: true,
        unitPrice: true,
        product: {
          select: {
            id: true,
            stock: true,
          },
        },
      },
    });

    if (!cartItem) {
      throw new ApiError(404, 'કાર્ટ આઇટમ મળ્યું નથી');
    }

    if (quantity > cartItem.product.stock) {
      throw new ApiError(400, 'ફક્ત ' + cartItem.product.stock + ' પ્રોડક્ટ ઉપલબ્ધ છે');
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        total: quantity * Number(cartItem.unitPrice),
      },
    });

    await this.recalculateCart(cartItem.cartId);

    return {
      success: true,
      message: 'કાર્ટ અપડેટ થયું',
      data: { quantity },
    };
  },

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string) {
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: { userId },
      },
      select: { cartId: true },
    });

    if (!cartItem) {
      throw new ApiError(404, 'કાર્ટ આઇટમ મળ્યું નથી');
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    await this.recalculateCart(cartItem.cartId);

    return {
      success: true,
      message: 'કાર્ટમાંથી દૂર કરવામાં આવ્યું',
    };
  },

  /**
   * Clear entire cart
   */
  async clearCart(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      return { success: true, message: 'કાર્ટ પહેલેથી ખાલી છે' };
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponId: null,
        subtotal: 0,
        discount: 0,
        total: 0,
      },
    });

    return {
      success: true,
      message: 'કાર્ટ ખાલી કરવામાં આવ્યું',
    };
  },

  /**
   * Apply coupon code
   */
  async applyCoupon(userId: string, code: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        id: true,
        items: {
          select: {
            product: { select: { price: true } },
            quantity: true,
          },
        },
        subtotal: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, 'કાર્ટ ખાલી છે');
    }

    // Find valid coupon
    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        isActive: true,
        validFrom: { lte: new Date() },
        validUntil: { gte: new Date() },
        OR: [
          { usedCount: { lt: prisma.coupon.fields.maxUses } },
          { maxUses: 0 }, // Unlimited
        ],
      },
    });

    if (!coupon) {
      throw new ApiError(404, 'અમાન્ય કૂપન કોડ');
    }

    // Check minimum order value
    const subtotal = Number(cart.subtotal);
    if (subtotal < Number(coupon.minOrderValue)) {
      throw new ApiError(
        400,
        `ન્યૂનતમ ઓર્ડર ₹${coupon.minOrderValue} હોવું જોઈએ`
      );
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else if (coupon.type === 'FLAT') {
      discount = Number(coupon.value);
    } else if (coupon.type === 'FREE_SHIPPING') {
      discount = 50; // Standard shipping cost
    }

    // Update cart with coupon
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponId: coupon.id,
        discount,
        total: subtotal - discount,
      },
    });

    return {
      success: true,
      message: 'કૂપન લાગુ કરવામાં આવ્યું',
      data: {
        code: coupon.code,
        discount,
        total: subtotal - discount,
      },
    };
  },

  /**
   * Remove coupon code
   */
  async removeCoupon(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: { id: true, subtotal: true },
    });

    if (!cart) {
      throw new ApiError(404, 'કાર્ટ મળ્યું નથી');
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        couponId: null,
        discount: 0,
        total: cart.subtotal,
      },
    });

    return {
      success: true,
      message: 'કૂપન દૂર કરવામાં આવ્યું',
    };
  },

  /**
   * Get cart summary for checkout
   */
  async getSummary(userId: string) {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      select: {
        items: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            total: true,
            product: {
              select: {
                id: true,
                name: true,
                nameGu: true,
                slug: true,
                thumbnail: true,
                stock: true,
              },
            },
          },
        },
        coupon: {
          select: {
            id: true,
            code: true,
            type: true,
            value: true,
          },
        },
        subtotal: true,
        discount: true,
        total: true,
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        success: true,
        data: {
          isEmpty: true,
          itemCount: 0,
          subtotal: 0,
          discount: 0,
          shipping: 0,
          total: 0,
        },
      };
    }

    const subtotal = Number(cart.subtotal);
    const discount = Number(cart.discount);
    const shipping = subtotal >= 999 ? 0 : 50; // Free shipping over ₹999
    const total = subtotal - discount + shipping;

    return {
      success: true,
      data: {
        isEmpty: false,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        items: cart.items,
        coupon: cart.coupon,
        subtotal,
        discount,
        shipping,
        total,
        freeShipping: subtotal >= 999,
        freeShippingRemaining: Math.max(0, 999 - subtotal),
      },
    };
  },

  /**
   * Recalculate cart totals
   */
  async recalculateCart(cartId: string) {
    const items = await prisma.cartItem.findMany({
      where: { cartId },
      select: {
        total: true,
      },
    });

    const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);

    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      select: { couponId: true },
    });

    let discount = 0;
    if (cart?.couponId) {
      const coupon = await prisma.coupon.findUnique({
        where: { id: cart.couponId },
      });

      if (coupon) {
        if (coupon.type === 'PERCENTAGE') {
          discount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscount) {
            discount = Math.min(discount, Number(coupon.maxDiscount));
          }
        } else if (coupon.type === 'FLAT') {
          discount = Number(coupon.value);
        }
      }
    }

    await prisma.cart.update({
      where: { id: cartId },
      data: {
        subtotal,
        discount,
        total: subtotal - discount,
      },
    });
  },
};
