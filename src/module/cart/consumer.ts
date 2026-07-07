/** @format */
// onEvent<EventContract>(EventType.ORDER_PLACED).subscribe({
//  next: async (payload) => {
//   const { userId, cartId } = payload.payload;
//   console.log("Deleting user cart for order placement:", cartId);

//   await CartService.deleteCartAndItem(userId, cartId);
//  },
//  error: (error) => {
//   console.error(error);
//  },
// });
