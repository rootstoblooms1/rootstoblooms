# Security hardening rollout

These files are prepared against `main` commit `219d5a454f9625f089066becd61467e4e76df595`.

## What is safe to deploy now

The HTML changes are backward-compatible with the current endpoints:

- Checkout still sends every existing order field and adds `payloadVersion`, `requestId`, and `cartItems`.
- Restock requests still send every existing field and add `payloadVersion` and `requestId`.
- Calendly messages must now come from the configured Calendly origin and contain a Calendly API URI.
- Contact and restock buttons reject duplicate clicks while a request is in flight.
- The contact form includes FormSubmit's supported `_honey` honeypot field.

The existing Apps Script handlers should ignore the additional JSON fields. Do not remove the legacy `items`, `subtotal`, `deliveryFee`, or `total` fields until the new backend has been deployed and verified.

## Backend contract to implement before enforcing server authority

### Order request

The backend should prefer these new fields:

```json
{
  "payloadVersion": 2,
  "requestId": "order_<uuid>",
  "cartItems": [
    { "productId": "string", "quantity": 1 }
  ]
}
```

It must:

1. Reject a previously processed `requestId`, returning the existing order result for a legitimate retry.
2. Validate allowed fields, data types, lengths, quantities, and fulfillment values.
3. Load canonical products, prices, stock, and delivery rules from server-controlled data.
4. Reject unknown products, invalid quantities, and unavailable stock.
5. Recalculate subtotal, delivery, and total. Never trust the legacy browser totals.
6. Treat the Calendly browser URI as an unverified hint until confirmed through Calendly's API or webhook state.
7. Generate the authoritative order ID and timestamp on the server.
8. Escape spreadsheet cells that begin with `=`, `+`, `-`, or `@` before writing user text.
9. Return a minimal JSON response such as `{"ok":true,"orderId":"..."}`.

### Restock request

The backend should deduplicate by `requestId` and normalize the email and product ID. It should obtain the product name from server-controlled product data rather than trusting the browser.

## Turnstile rollout

Do not add the widget until the backend can validate it.

1. Create separate Turnstile widgets for production and testing.
2. Add the public site key to the frontend.
3. Store the secret only in server-side properties.
4. Send the browser token with each order, restock, and contact request.
5. Validate it server-side with Siteverify, checking success, hostname, action, expiration, and single use.
6. Reject the business operation when validation fails.

## Calendly rollout

The browser event is now origin-checked, but it is still not proof of a booking.

Preferred:

1. Create an `invitee.created` / `invitee.canceled` webhook subscription.
2. Store the Calendly credential and webhook signing secret only on the server.
3. Record invitee and event URIs received from Calendly.
4. Match an order to an active invitee URI and customer email.
5. Mark unmatched orders as `pending pickup confirmation` rather than rejecting or accepting them as verified.

## Deployment sequence

1. Export the existing Apps Script source and manifest into version control.
2. Add server-side validation while preserving the current response shape.
3. Deploy a new Apps Script version and smoke-test product GET, restock POST, pickup order, and delivery order.
4. Merge the prepared HTML changes.
5. Observe logs and duplicate/error rates.
6. Add Turnstile and server-side Calendly verification in a separate deployment.
7. Remove legacy client-calculated order fields only after all clients and the backend use payload version 2.

## Required checks

- Shop pages load products and preserve the existing cart.
- Restock modal submits once and restores its button on failure.
- Pickup remains disabled until a genuine Calendly embed event is received.
- Delivery checkout works without Calendly.
- Order success clears the cart; failure preserves it and reuses the same request ID.
- Contact form succeeds once and recovers after a failed request.
- Mobile cart and checkout layouts remain unchanged.

