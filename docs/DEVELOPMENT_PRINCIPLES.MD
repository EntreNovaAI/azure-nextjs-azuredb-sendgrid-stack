# Development Principles

> **Building with clarity and simplicity** ✨

Welcome! These principles are designed to help guide how we organize and build projects. They're designed to make development smooth, changes easy, and collaboration peasy.

---

## 🎯 Core Philosophy

### Explicit Over Implicit

**Clarity is the ultimate optimization.** Every component, every file, every decision should be as obvious and intentional as possible.

- Mark all client components with `'use client'` at the top
- Mark all server components with `'use server'` at the top  
- Be explicit about what things do and where they belong
- Resist the urge to rely on assumptions or "obvious" behavior

### Modular & Changeable

**We want to build for flexibility.** Everything should be easy to modify without massive refactoring.

- Keep components small and focused
- Separate concerns clearly
- Think: "How easy would this be to change in 6 months"

---

## 📁 Project Structure

### Clean Separation of Concerns

 Here's where everything lives:

#### 🎨 Marketing & Content

**App Routes:**
- `app/(marketing)/` - Landing pages, about, pricing, etc.
- `app/(legal)/` - Terms, privacy, contact pages
etc.

**Content Philosophy:**

- Store all text in objects at the top of each page when it makes sense to do so
- We'd like to make marketing updates fast and easy.
- No hunting through JSX/HTML to change wording
- Marketing team can update content without touching logic

**Example:**
```typescript
// ✅ Good - Text separated at top
const content = {
  hero: {
    title: "Build Amazing Things",
    subtitle: "Start shipping faster",
  }
}

export default function LandingPage() {
  return <h1>{content.hero.title}</h1>
}

// ❌ Bad - Text mixed in JSX
export default function LandingPage() {
  return <h1>Build Amazing Things</h1>
}
```

#### 🔧 Application Logic

**Source Code:**

- `src/` - All business logic, utilities, and libraries
- `src/product/` - Product-specific logic and features
- `src/lib/` - Shared libraries (auth, database, etc.)
- `src/components/` - Reusable UI components

**App Routes:**

- `app/(product)/` - Dashboard, settings, product pages
- `app/(app)/api/` - API routes and endpoints

**Principle:** Logic lives in `src/`, pages live in `app/`.

#### 🌐 Public Assets

**Static Files:**

- `public/` - Images, icons, fonts, any public static files
- These are served directly at the root URL path

---

## 🧩 Component Guidelines

### Server vs Client Components

**Always be explicit:**

```typescript
// Client component - interactive, uses hooks
'use client'

export function InteractiveButton() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>Click me</button>
}
```

```typescript
// Server component - data fetching, no interactivity
'use server'

export async function UserProfile() {
  const user = await fetchUser()
  return <div>{user.name}</div>
}
```

**Why?** Makes it crystal clear what runs where. No guessing.

### Content Separation

**For pages with text content:**

```typescript
'use client'

// Content object at the top - easy to find and update
const pageContent = {
  title: "Welcome to Our Platform",
  description: "Build something amazing today",
  cta: {
    primary: "Get Started",
    secondary: "Learn More"
  },
  features: [
    "Fast deployment",
    "Secure by default",
    "Scale with ease"
  ]
}

export default function MarketingPage() {
  return (
    <div>
      <h1>{pageContent.title}</h1>
      <p>{pageContent.description}</p>
      {/* Use content object throughout */}
    </div>
  )
}
```

**Benefits:**

- Marketing updates don't touch code logic
- Easy to find all text in one place
- Simple to make the content dynamic later
- Clear separation of what vs how

---

## 🚀 Workflow Optimization

### Cursor Commands for Repetitive Tasks

**If you find yourself doing the same simple task repeatedly, consider creating a Cursor command.**

Example: We have `/style` command for updating colors and fonts to help streamline the design iteration process for example.

**When to create a command:**

- Task is simple and well-defined
- You do it more than 3 times
- It follows a clear pattern
- It would save time for others

**See:** `.cursor/commands/style.md` for an example

---

## ✅ Quick Checklist

Before committing code, ask yourself:

- [ ] Is it clear if this is a client or server component?
- [ ] Is the logic in `src/` and the page in `app/`?
- [ ] Is marketing text in a content object at the top?
- [ ] Would this be easy to change in 6 months?
- [ ] Is it modular and focused on one thing?
- [ ] Have I been explicit about what this does?

---

## 🎨 Why These Principles?

**For Marketing Team:**

- Update copy and content without touching code
- No risk of breaking functionality
- Fast iteration on messaging

**For Developers:**

- Clear structure makes onboarding fast
- Easy to find things
- Changes don't cascade unexpectedly
- Less refactoring, more building

**For Everyone:**

- Explicit code is maintainable code
- Modular structure prevents spaghetti
- Good organization scales with the team

---

**Remember:** We know that most of these things are obvious to you. This is designed to serve simply as a reminder and an effort to help us stay united in our development goals. These principles, are just that, principles! If something doesn't make sense for your use case, that's okay!

Happy coding! 🚀
