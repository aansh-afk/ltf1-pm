import { useState } from 'react'
import BrutalCheckbox from '../components/ui/BrutalCheckbox'

export default function TestCheckbox() {
  const [checked1, setChecked1] = useState(false)
  const [checked2, setChecked2] = useState(true)
  const [checked3, setChecked3] = useState(false)
  const [checked4, setChecked4] = useState(true)

  return (
    <div className="min-h-screen bg-[var(--theme-background-secondary)] p-48px">
      <div className="max-w-600px mx-auto">
        <h1 className="text-brutal-2xl text-[var(--theme-foreground)] mb-32px uppercase">
          Brutalist Checkbox Test
        </h1>
        
        <div className="space-y-24px">
          <div className="brutal-card p-24px">
            <h2 className="text-brutal-lg text-primary-brutalist mb-16px">DEFAULT VARIANT</h2>
            
            <div className="space-y-16px">
              <BrutalCheckbox
                size="sm"
                label="Small Checkbox"
                description="This is a small checkbox"
                checked={checked1}
                onChange={(e) => setChecked1(e.target.checked)}
              />
              
              <BrutalCheckbox
                size="md"
                label="Medium Checkbox"
                description="This is a medium checkbox (default size)"
                checked={checked2}
                onChange={(e) => setChecked2(e.target.checked)}
              />
              
              <BrutalCheckbox
                size="lg"
                label="Large Checkbox"
                description="This is a large checkbox"
                checked={checked3}
                onChange={(e) => setChecked3(e.target.checked)}
              />
            </div>
          </div>

          <div className="brutal-card p-24px">
            <h2 className="text-brutal-lg text-primary-brutalist mb-16px">COLOR VARIANTS</h2>
            
            <div className="space-y-16px">
              <BrutalCheckbox
                variant="default"
                label="Default (Yellow)"
                checked={checked4}
                onChange={(e) => setChecked4(e.target.checked)}
              />
              
              <BrutalCheckbox
                variant="success"
                label="Success (Green)"
                checked={true}
                readOnly
              />
              
              <BrutalCheckbox
                variant="danger"
                label="Danger (Red)"
                checked={true}
                readOnly
              />
              
              <BrutalCheckbox
                variant="warning"
                label="Warning (Magenta)"
                checked={true}
                readOnly
              />
            </div>
          </div>

          <div className="brutal-card p-24px">
            <h2 className="text-brutal-lg text-primary-brutalist mb-16px">STATES</h2>
            
            <div className="space-y-16px">
              <BrutalCheckbox
                label="Unchecked State"
                description="Click to check"
                checked={false}
                readOnly
              />
              
              <BrutalCheckbox
                label="Checked State"
                description="The tick should be clearly visible"
                checked={true}
                readOnly
              />
              
              <BrutalCheckbox
                label="Indeterminate State"
                indeterminate={true}
                checked={false}
                readOnly
              />
              
              <BrutalCheckbox
                label="Disabled State"
                disabled={true}
                checked={true}
              />
              
              <BrutalCheckbox
                label="Error State"
                error="This field is required"
                checked={false}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}