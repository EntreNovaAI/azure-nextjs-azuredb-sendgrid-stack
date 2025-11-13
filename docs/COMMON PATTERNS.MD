# Common Patterns

## Data Fetching Pattern

```typescript
'use client'

import { useEffect, useState } from 'react'
import { PageStates } from '@/src/components/ui'

export default function DataPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])
  
  if (loading) return <PageStates.Loading />
  if (error) return <PageStates.Error message={error.message} />
  if (!data) return <PageStates.Empty />
  
  return (
    // Render data
  )
}
```

## Form Pattern

```typescript
'use client'

import { useState } from 'react'
import { Button, Input, Label } from '@/src/components/ui'
import { getColors } from '@/src/constants/colors'

export default function FormPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            name: e.target.value 
          }))}
        />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

## Interactive Component Pattern

```typescript
'use client'

import { useState } from 'react'
import { Card, Button } from '@/src/components/ui'
import { getColors } from '@/src/constants/colors'
import { useTheme } from 'next-themes'

export default function InteractiveComponent() {
  const [activeTab, setActiveTab] = useState('tab1')
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => setMounted(true), [])
  const colors = getColors(mounted ? resolvedTheme === 'dark' : false)
  
  return (
    <Card>
      <div className="flex gap-2 mb-4">
        {['tab1', 'tab2', 'tab3'].map(tab => (
          <Button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              backgroundColor: activeTab === tab 
                ? colors.primary 
                : 'transparent'
            }}
          >
            {tab}
          </Button>
        ))}
      </div>
      <div>
        {/* Tab content */}
      </div>
    </Card>
  )
}

```typescript
