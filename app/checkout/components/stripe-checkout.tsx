import * as React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import { createCheckoutAction } from '@lib/stripe/stripe-actions';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
// This follows Stripe's recommended pattern from their docs
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function StripeCheckout() {
  // Create fetchClientSecret function following Stripe's recommended async pattern
  const fetchClientSecret = React.useCallback(async () => {
    try {
      // Get the selected product from sessionStorage
      const selectedProduct = sessionStorage.getItem('selectedProduct') || 'basic'

      // Create a Checkout Session using Server Action
      const result = await createCheckoutAction(selectedProduct);

      console.log('Checkout Action Response:', result);
      
      // Check if the action was successful
      if (!result.success || !result.data?.clientSecret) {
        throw new Error(result.error || 'No client secret returned');
      }
      
      return result.data.clientSecret;
    } catch (error) {
      console.error('Error in fetchClientSecret:', error);
      throw error; // Re-throw to let Stripe handle it
    }
  }, []);

  const options = { fetchClientSecret };

  return (
    <div id="checkout">
      {/* Checkout will insert the payment form here */}
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={options}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}