interface FeatureCardProps {
  icon: string
  title: string
  description: string
}

/**
 * FeatureCard Component
 * Reusable card component for displaying features with icon, title, and description
 * Used in hero sections and feature showcases
 */
export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    // Modern glass-morphism card with dark theme
    <div className="group bg-slate-800/40 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-slate-700/50">
      {/* Large icon with hover animation */}
      <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">{icon}</div>
      
      {/* Title with warm sunset gradient on hover */}
      <h3 className="text-2xl font-bold text-white mb-4 group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:via-pink-400 group-hover:to-yellow-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">
        {title}
      </h3>
      
      {/* Description text */}
      <p className="text-slate-400 leading-relaxed">{description}</p>
    </div>
  )
}
