/* ===== GLOBAL CART ENGINE ===== */

function getCart(){
  return JSON.parse(localStorage.getItem("rtb_cart") || "{}");
}

function saveCart(cart){
  localStorage.setItem("rtb_cart", JSON.stringify(cart));
}

function cartCount(){
  let cart=getCart();
  return Object.values(cart).reduce((a,b)=>a+b,0);
}

function addToCart(id){
  let cart=getCart();
  cart[id]=(cart[id]||0)+1;
  saveCart(cart);
}

function removeFromCart(id){
  let cart=getCart();
  cart[id]--;
  if(cart[id]<=0) delete cart[id];
  saveCart(cart);
}

function getQty(id){
  let cart=getCart();
  return cart[id]||0;
}
