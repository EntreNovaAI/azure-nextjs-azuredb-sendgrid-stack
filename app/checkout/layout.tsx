export const metadata = {
  title: 'Checkout - Azure Next Stack',
  description: 'Secure checkout powered by Stripe. Complete your purchase safely and securely.',
}

/**
 * Checkout Layout Component
 * Provides layout structure specifically for checkout pages
 * Inherits auth and navigation from parent layout
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="checkout-layout">
      {/* Uses theme background colors */}
      <div className="min-h-screen bg-light-bg-alt dark:bg-dark-bg-alt py-8">
        {children}
      </div>
    </div>
  )
}
