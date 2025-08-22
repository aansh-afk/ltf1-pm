import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineViewGrid,
  HiOutlineMenuAlt2,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamation,
  HiOutlineInformationCircle,
  HiOutlineFilter,
  HiOutlineSearch,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineDocumentText,
  HiOutlineFolder,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineSelector
} from 'react-icons/hi'

interface CustomFieldsManagerProps {
  workspaceId: Id<'workspaces'>
}

type EntityType = 'task' | 'project' | 'user'
type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'boolean' | 'url' | 'email'

interface CustomField {
  _id: Id<'customFieldDefinitions'>
  _creationTime: number
  workspaceId: Id<'workspaces'>
  entityType: EntityType
  key: string
  label: string
  type: FieldType
  options?: string[]
  required: boolean
  defaultValue?: string | number | boolean | string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
  permissions?: {
    view: string[]
    edit: string[]
  }
  order: number
  active: boolean
  createdAt: number
  updatedAt: number
}

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: 'text', label: 'Text', icon: <HiOutlineDocumentText /> },
  { value: 'number', label: 'Number', icon: '#' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'select', label: 'Select', icon: <HiOutlineSelector /> },
  { value: 'multiselect', label: 'Multi-Select', icon: '☑️' },
  { value: 'boolean', label: 'Checkbox', icon: '✓' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '@' },
]

const ENTITY_TYPES: { value: EntityType; label: string; icon: React.ReactNode }[] = [
  { value: 'task', label: 'Tasks', icon: <HiOutlineDocumentText /> },
  { value: 'project', label: 'Projects', icon: <HiOutlineFolder /> },
  { value: 'user', label: 'Users', icon: <HiOutlineUser /> },
]

export default function CustomFieldsManager({ workspaceId }: CustomFieldsManagerProps) {
  const [activeTab, setActiveTab] = useState<EntityType>('task')
  const [showNewField, setShowNewField] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [showTestValues, setShowTestValues] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [testEntityId, setTestEntityId] = useState<string>('')
  const [testValues, setTestValues] = useState<Record<string, any>>({})
  
  // Form state for new/edit field
  const [fieldForm, setFieldForm] = useState({
    key: '',
    label: '',
    type: 'text' as FieldType,
    options: [] as string[],
    required: false,
    defaultValue: undefined as any,
    validation: {
      min: undefined as number | undefined,
      max: undefined as number | undefined,
      pattern: '',
      message: '',
    },
    permissions: {
      view: [] as string[],
      edit: [] as string[],
    },
  })

  // Queries
  const customFields = useQuery(api.customFields.getCustomFields, {
    workspaceId,
    entityType: activeTab,
    active: true,
  })

  const fieldValues = useQuery(
    api.customFields.getCustomFieldValues,
    testEntityId ? { entityId: testEntityId } : 'skip'
  )

  // Mutations
  const createCustomField = useMutation(api.customFields.createCustomField)
  const updateCustomField = useMutation(api.customFields.updateCustomField)
  const deleteCustomField = useMutation(api.customFields.deleteCustomField)
  const reorderCustomFields = useMutation(api.customFields.reorderCustomFields)
  const setCustomFieldValue = useMutation(api.customFields.setCustomFieldValue)
  const bulkSetCustomFieldValues = useMutation(api.customFields.bulkSetCustomFieldValues)

  // Reset form when switching modes
  useEffect(() => {
    if (!showNewField && !editingField) {
      setFieldForm({
        key: '',
        label: '',
        type: 'text',
        options: [],
        required: false,
        defaultValue: undefined,
        validation: { min: undefined, max: undefined, pattern: '', message: '' },
        permissions: { view: [], edit: [] },
      })
    }
  }, [showNewField, editingField])

  // Load field data when editing
  useEffect(() => {
    if (editingField) {
      setFieldForm({
        key: editingField.key,
        label: editingField.label,
        type: editingField.type,
        options: editingField.options || [],
        required: editingField.required,
        defaultValue: editingField.defaultValue,
        validation: editingField.validation || { min: undefined, max: undefined, pattern: '', message: '' },
        permissions: editingField.permissions || { view: [], edit: [] },
      })
    }
  }, [editingField])

  // Handle drag end for reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !customFields) return

    const items = Array.from(customFields)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    const fieldOrders = items.map((field, index) => ({
      fieldId: field._id,
      order: index,
    }))

    await reorderCustomFields({
      workspaceId,
      entityType: activeTab,
      fieldOrders,
    })
  }

  // Handle create field
  const handleCreateField = async () => {
    if (!fieldForm.key || !fieldForm.label) return

    await createCustomField({
      workspaceId,
      entityType: activeTab,
      key: fieldForm.key.toLowerCase().replace(/\s+/g, '_'),
      label: fieldForm.label,
      type: fieldForm.type,
      options: fieldForm.options.length > 0 ? fieldForm.options : undefined,
      required: fieldForm.required,
      defaultValue: fieldForm.defaultValue,
      validation: fieldForm.validation.min || fieldForm.validation.max || fieldForm.validation.pattern
        ? fieldForm.validation
        : undefined,
      permissions: fieldForm.permissions.view.length > 0 || fieldForm.permissions.edit.length > 0
        ? fieldForm.permissions
        : undefined,
    })

    setShowNewField(false)
  }

  // Handle update field
  const handleUpdateField = async () => {
    if (!editingField || !fieldForm.label) return

    await updateCustomField({
      fieldId: editingField._id,
      label: fieldForm.label,
      options: fieldForm.options.length > 0 ? fieldForm.options : undefined,
      required: fieldForm.required,
      defaultValue: fieldForm.defaultValue,
      validation: fieldForm.validation.min || fieldForm.validation.max || fieldForm.validation.pattern
        ? fieldForm.validation
        : undefined,
      permissions: fieldForm.permissions.view.length > 0 || fieldForm.permissions.edit.length > 0
        ? fieldForm.permissions
        : undefined,
    })

    setEditingField(null)
  }

  // Handle delete field
  const handleDeleteField = async (fieldId: Id<'customFieldDefinitions'>) => {
    if (confirm('Are you sure you want to delete this field? All associated values will be lost.')) {
      await deleteCustomField({ fieldId })
    }
  }

  // Handle test value change
  const handleTestValueChange = (fieldId: Id<'customFieldDefinitions'>, value: any) => {
    setTestValues(prev => ({ ...prev, [fieldId]: value }))
  }

  // Save test values
  const handleSaveTestValues = async () => {
    if (!testEntityId) return

    const values = Object.entries(testValues).map(([fieldId, value]) => ({
      fieldDefinitionId: fieldId as Id<'customFieldDefinitions'>,
      value,
    }))

    await bulkSetCustomFieldValues({
      entityId: testEntityId,
      values,
    })
  }

  // Add option to select/multiselect
  const addOption = () => {
    const newOption = prompt('Enter option value:')
    if (newOption) {
      setFieldForm(prev => ({
        ...prev,
        options: [...prev.options, newOption],
      }))
    }
  }

  // Remove option from select/multiselect
  const removeOption = (index: number) => {
    setFieldForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }))
  }

  // Render field input based on type
  const renderFieldInput = (field: CustomField, value: any, onChange: (value: any) => void) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 bg-black text-white border-2 border-white font-mono"
            placeholder={field.label}
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.valueAsNumber)}
            min={field.validation?.min}
            max={field.validation?.max}
            className="w-full p-2 bg-black text-white border-2 border-white font-mono"
            placeholder={field.label}
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => onChange(e.target.valueAsDate?.getTime())}
            className="w-full p-2 bg-black text-white border-2 border-white font-mono"
          />
        )
      
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 bg-black text-white border-2 border-white font-mono"
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        )
      
      case 'multiselect':
        return (
          <div className="space-y-1">
            {field.options?.map(option => (
              <label key={option} className="flex items-center text-white">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option)}
                  onChange={(e) => {
                    const current = value || []
                    if (e.target.checked) {
                      onChange([...current, option])
                    } else {
                      onChange(current.filter((v: string) => v !== option))
                    }
                  }}
                  className="mr-2"
                />
                {option}
              </label>
            ))}
          </div>
        )
      
      case 'boolean':
        return (
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => onChange(e.target.checked)}
              className="mr-2"
            />
            {field.label}
          </label>
        )
      
      case 'url':
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 bg-black text-white border-2 border-white font-mono"
            placeholder="https://example.com"
          />
        )
      
      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 bg-black text-white border-2 border-white font-mono"
            placeholder="email@example.com"
          />
        )
      
      default:
        return null
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-white text-2xl font-bold mb-4">Custom Fields Manager</h2>
        
        {/* Entity Type Tabs */}
        <div className="flex space-x-2 mb-6">
          {ENTITY_TYPES.map(entity => (
            <button
              key={entity.value}
              onClick={() => setActiveTab(entity.value)}
              className={`px-4 py-2 border-2 ${activeTab === entity.value ? 'border-cyan-400 bg-cyan-400/20' : 'border-white'} hover:bg-white/10 flex items-center space-x-2`}
            >
              {entity.icon}
              <span className="text-white font-mono">{entity.label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4 mb-4">
          <button
            onClick={() => setShowNewField(true)}
            className="px-4 py-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300 flex items-center"
          >
            <HiOutlinePlus className="mr-2" />
            Add Field
          </button>
          
          <button
            onClick={() => setShowTestValues(!showTestValues)}
            className="px-4 py-2 bg-black text-white font-bold border-2 border-white hover:bg-white/10 flex items-center"
          >
            <HiOutlineCog className="mr-2" />
            Test Values
          </button>
        </div>
      </div>

      {/* Fields List */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {customFields?.map((field, index) => (
                <Draggable key={field._id} draggableId={field._id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-4 border-2 ${snapshot.isDragging ? 'border-cyan-400 bg-cyan-400/10' : 'border-white'} bg-black`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <div {...provided.dragHandleProps} className="mr-4 cursor-move">
                            <HiOutlineMenuAlt2 className="text-gray-400" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-bold">{field.label}</span>
                              <span className="text-gray-400 text-sm font-mono">({field.key})</span>
                              {field.required && (
                                <span className="text-red-500 text-sm">*Required</span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-cyan-400 text-sm">
                                {FIELD_TYPES.find(t => t.value === field.type)?.label}
                              </span>
                              
                              {field.options && (
                                <span className="text-gray-400 text-sm">
                                  {field.options.length} options
                                </span>
                              )}
                              
                              {field.validation && (
                                <span className="text-yellow-400 text-sm">
                                  Has validation
                                </span>
                              )}
                              
                              {field.defaultValue !== undefined && (
                                <span className="text-green-400 text-sm">
                                  Has default
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingField(field)}
                            className="p-2 text-white hover:text-cyan-400"
                          >
                            <HiOutlinePencil />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteField(field._id)}
                            className="p-2 text-white hover:text-red-500"
                          >
                            <HiOutlineTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Test Values Section */}
      {showTestValues && customFields && customFields.length > 0 && (
        <div className="mt-6 p-4 border-2 border-white bg-black">
          <h3 className="text-white text-lg font-bold mb-4">Test Field Values</h3>
          
          <div className="mb-4">
            <label className="text-white text-sm">Entity ID</label>
            <input
              type="text"
              value={testEntityId}
              onChange={(e) => setTestEntityId(e.target.value)}
              className="w-full p-2 bg-black text-white border-2 border-white font-mono"
              placeholder={`Enter ${activeTab} ID to test values`}
            />
          </div>
          
          <div className="space-y-4">
            {customFields.map(field => (
              <div key={field._id}>
                <label className="text-white text-sm">{field.label}</label>
                {renderFieldInput(
                  field,
                  testValues[field._id],
                  (value) => handleTestValueChange(field._id, value)
                )}
              </div>
            ))}
          </div>
          
          <button
            onClick={handleSaveTestValues}
            disabled={!testEntityId}
            className="mt-4 px-4 py-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300 disabled:opacity-50"
          >
            Save Test Values
          </button>
        </div>
      )}

      {/* New/Edit Field Modal */}
      {(showNewField || editingField) && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-black border-2 border-white p-6 w-full max-w-2xl my-8">
            <h3 className="text-white text-xl font-bold mb-4">
              {editingField ? 'Edit Field' : 'Create New Field'}
            </h3>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm">Field Key</label>
                  <input
                    type="text"
                    value={fieldForm.key}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, key: e.target.value }))}
                    disabled={!!editingField}
                    className="w-full p-2 bg-black text-white border-2 border-white font-mono disabled:opacity-50"
                    placeholder="field_key"
                  />
                </div>
                
                <div>
                  <label className="text-white text-sm">Display Label</label>
                  <input
                    type="text"
                    value={fieldForm.label}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full p-2 bg-black text-white border-2 border-white font-mono"
                    placeholder="Field Label"
                  />
                </div>
              </div>
              
              {/* Field Type */}
              <div>
                <label className="text-white text-sm">Field Type</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm(prev => ({ ...prev, type: e.target.value as FieldType }))}
                  disabled={!!editingField}
                  className="w-full p-2 bg-black text-white border-2 border-white font-mono disabled:opacity-50"
                >
                  {FIELD_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Options for select/multiselect */}
              {(fieldForm.type === 'select' || fieldForm.type === 'multiselect') && (
                <div>
                  <label className="text-white text-sm">Options</label>
                  <div className="space-y-2">
                    {fieldForm.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...fieldForm.options]
                            newOptions[index] = e.target.value
                            setFieldForm(prev => ({ ...prev, options: newOptions }))
                          }}
                          className="flex-1 p-2 bg-black text-white border-2 border-white font-mono"
                        />
                        <button
                          onClick={() => removeOption(index)}
                          className="p-2 text-red-500 hover:bg-red-500/20"
                        >
                          <HiOutlineX />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={addOption}
                      className="px-3 py-1 bg-black text-white border-2 border-white hover:bg-white/10"
                    >
                      <HiOutlinePlus className="inline mr-1" />
                      Add Option
                    </button>
                  </div>
                </div>
              )}
              
              {/* Validation */}
              {(fieldForm.type === 'text' || fieldForm.type === 'number') && (
                <div>
                  <label className="text-white text-sm">Validation</label>
                  <div className="grid grid-cols-2 gap-2">
                    {fieldForm.type === 'number' && (
                      <>
                        <input
                          type="number"
                          value={fieldForm.validation.min || ''}
                          onChange={(e) => setFieldForm(prev => ({
                            ...prev,
                            validation: { ...prev.validation, min: e.target.valueAsNumber || undefined }
                          }))}
                          className="p-2 bg-black text-white border-2 border-white font-mono"
                          placeholder="Min value"
                        />
                        <input
                          type="number"
                          value={fieldForm.validation.max || ''}
                          onChange={(e) => setFieldForm(prev => ({
                            ...prev,
                            validation: { ...prev.validation, max: e.target.valueAsNumber || undefined }
                          }))}
                          className="p-2 bg-black text-white border-2 border-white font-mono"
                          placeholder="Max value"
                        />
                      </>
                    )}
                    {fieldForm.type === 'text' && (
                      <>
                        <input
                          type="number"
                          value={fieldForm.validation.min || ''}
                          onChange={(e) => setFieldForm(prev => ({
                            ...prev,
                            validation: { ...prev.validation, min: e.target.valueAsNumber || undefined }
                          }))}
                          className="p-2 bg-black text-white border-2 border-white font-mono"
                          placeholder="Min length"
                        />
                        <input
                          type="number"
                          value={fieldForm.validation.max || ''}
                          onChange={(e) => setFieldForm(prev => ({
                            ...prev,
                            validation: { ...prev.validation, max: e.target.valueAsNumber || undefined }
                          }))}
                          className="p-2 bg-black text-white border-2 border-white font-mono"
                          placeholder="Max length"
                        />
                        <input
                          type="text"
                          value={fieldForm.validation.pattern || ''}
                          onChange={(e) => setFieldForm(prev => ({
                            ...prev,
                            validation: { ...prev.validation, pattern: e.target.value }
                          }))}
                          className="p-2 bg-black text-white border-2 border-white font-mono col-span-2"
                          placeholder="Regex pattern (optional)"
                        />
                      </>
                    )}
                    <input
                      type="text"
                      value={fieldForm.validation.message || ''}
                      onChange={(e) => setFieldForm(prev => ({
                        ...prev,
                        validation: { ...prev.validation, message: e.target.value }
                      }))}
                      className="p-2 bg-black text-white border-2 border-white font-mono col-span-2"
                      placeholder="Validation error message"
                    />
                  </div>
                </div>
              )}
              
              {/* Required & Default */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm(prev => ({ ...prev, required: e.target.checked }))}
                    className="mr-2"
                  />
                  Required Field
                </label>
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-6 flex space-x-2">
              <button
                onClick={editingField ? handleUpdateField : handleCreateField}
                disabled={!fieldForm.key || !fieldForm.label}
                className="flex-1 p-2 bg-cyan-400 text-black font-bold border-2 border-white hover:bg-cyan-300 disabled:opacity-50"
              >
                {editingField ? 'Update Field' : 'Create Field'}
              </button>
              <button
                onClick={() => {
                  setShowNewField(false)
                  setEditingField(null)
                }}
                className="flex-1 p-2 bg-black text-white font-bold border-2 border-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}