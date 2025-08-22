import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

// Custom field types
export type CustomFieldType = 
  | "text" 
  | "number" 
  | "date" 
  | "select" 
  | "multiselect" 
  | "boolean" 
  | "url" 
  | "email"

// Create custom field definition
export const createCustomField = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    entityType: v.union(v.literal("task"), v.literal("project"), v.literal("user")),
    key: v.string(),
    label: v.string(),
    type: v.union(
      v.literal("text"),
      v.literal("number"),
      v.literal("date"),
      v.literal("select"),
      v.literal("multiselect"),
      v.literal("boolean"),
      v.literal("url"),
      v.literal("email")
    ),
    options: v.optional(v.array(v.string())),
    required: v.optional(v.boolean()),
    defaultValue: v.optional(v.any()),
    validation: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      message: v.optional(v.string()),
    })),
    permissions: v.optional(v.object({
      view: v.array(v.string()),
      edit: v.array(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Check if field with same key already exists
    const existing = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_key", (q) => 
        q.eq("workspaceId", args.workspaceId)
         .eq("entityType", args.entityType)
         .eq("key", args.key)
      )
      .first()

    if (existing) {
      throw new Error(`Field with key '${args.key}' already exists for ${args.entityType}`)
    }

    // Get the next order number
    const fields = await ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("entityType"), args.entityType))
      .collect()

    const maxOrder = Math.max(0, ...fields.map(f => f.order))

    // Create field definition
    const fieldId = await ctx.db.insert("customFieldDefinitions", {
      workspaceId: args.workspaceId,
      entityType: args.entityType,
      key: args.key,
      label: args.label,
      type: args.type,
      options: args.options,
      required: args.required || false,
      defaultValue: args.defaultValue,
      validation: args.validation,
      permissions: args.permissions,
      order: maxOrder + 1,
      active: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return fieldId
  },
})

// Update custom field definition
export const updateCustomField = mutation({
  args: {
    fieldId: v.id("customFieldDefinitions"),
    label: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    required: v.optional(v.boolean()),
    defaultValue: v.optional(v.any()),
    validation: v.optional(v.object({
      min: v.optional(v.number()),
      max: v.optional(v.number()),
      pattern: v.optional(v.string()),
      message: v.optional(v.string()),
    })),
    permissions: v.optional(v.object({
      view: v.array(v.string()),
      edit: v.array(v.string()),
    })),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const field = await ctx.db.get(args.fieldId)
    if (!field) {
      throw new Error("Field not found")
    }

    // Update field definition
    const updates: Partial<Doc<"customFieldDefinitions">> = {
      updatedAt: Date.now(),
    }

    if (args.label !== undefined) updates.label = args.label
    if (args.options !== undefined) updates.options = args.options
    if (args.required !== undefined) updates.required = args.required
    if (args.defaultValue !== undefined) updates.defaultValue = args.defaultValue
    if (args.validation !== undefined) updates.validation = args.validation
    if (args.permissions !== undefined) updates.permissions = args.permissions
    if (args.active !== undefined) updates.active = args.active

    await ctx.db.patch(args.fieldId, updates)

    return { success: true }
  },
})

// Delete custom field definition
export const deleteCustomField = mutation({
  args: {
    fieldId: v.id("customFieldDefinitions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const field = await ctx.db.get(args.fieldId)
    if (!field) {
      throw new Error("Field not found")
    }

    // Delete all values for this field
    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_field", (q) => q.eq("fieldDefinitionId", args.fieldId))
      .collect()

    for (const value of values) {
      await ctx.db.delete(value._id)
    }

    // Delete field definition
    await ctx.db.delete(args.fieldId)

    return { success: true }
  },
})

// Reorder custom fields
export const reorderCustomFields = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    entityType: v.union(v.literal("task"), v.literal("project"), v.literal("user")),
    fieldOrders: v.array(v.object({
      fieldId: v.id("customFieldDefinitions"),
      order: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Update order for each field
    for (const fieldOrder of args.fieldOrders) {
      await ctx.db.patch(fieldOrder.fieldId, {
        order: fieldOrder.order,
        updatedAt: Date.now(),
      })
    }

    return { success: true }
  },
})

// Get custom field definitions
export const getCustomFields = query({
  args: {
    workspaceId: v.id("workspaces"),
    entityType: v.optional(v.union(v.literal("task"), v.literal("project"), v.literal("user"))),
    active: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    let query = ctx.db
      .query("customFieldDefinitions")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))

    let fields = await query.collect()

    // Filter by entity type
    if (args.entityType) {
      fields = fields.filter(f => f.entityType === args.entityType)
    }

    // Filter by active status
    if (args.active !== undefined) {
      fields = fields.filter(f => f.active === args.active)
    }

    // Sort by order
    fields.sort((a, b) => a.order - b.order)

    return fields
  },
})

// Set custom field value
export const setCustomFieldValue = mutation({
  args: {
    fieldDefinitionId: v.id("customFieldDefinitions"),
    entityId: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Get field definition
    const fieldDef = await ctx.db.get(args.fieldDefinitionId)
    if (!fieldDef) {
      throw new Error("Field definition not found")
    }

    // Validate value based on field type
    await validateFieldValue(fieldDef, args.value)

    // Check if value already exists
    const existingValue = await ctx.db
      .query("customFieldValues")
      .withIndex("by_field_and_entity", (q) => 
        q.eq("fieldDefinitionId", args.fieldDefinitionId)
         .eq("entityId", args.entityId)
      )
      .first()

    if (existingValue) {
      // Update existing value
      await ctx.db.patch(existingValue._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      })
    } else {
      // Create new value
      await ctx.db.insert("customFieldValues", {
        fieldDefinitionId: args.fieldDefinitionId,
        entityId: args.entityId,
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: identity.subject,
      })
    }

    return { success: true }
  },
})

// Get custom field values for an entity
export const getCustomFieldValues = query({
  args: {
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .collect()

    // Join with field definitions
    const result = await Promise.all(
      values.map(async (value) => {
        const fieldDef = await ctx.db.get(value.fieldDefinitionId)
        return {
          ...value,
          fieldDefinition: fieldDef,
        }
      })
    )

    return result.filter(v => v.fieldDefinition?.active)
  },
})

// Bulk set custom field values
export const bulkSetCustomFieldValues = mutation({
  args: {
    entityId: v.string(),
    values: v.array(v.object({
      fieldDefinitionId: v.id("customFieldDefinitions"),
      value: v.any(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    for (const fieldValue of args.values) {
      // Get field definition
      const fieldDef = await ctx.db.get(fieldValue.fieldDefinitionId)
      if (!fieldDef) continue

      // Validate value
      await validateFieldValue(fieldDef, fieldValue.value)

      // Check if value already exists
      const existingValue = await ctx.db
        .query("customFieldValues")
        .withIndex("by_field_and_entity", (q) => 
          q.eq("fieldDefinitionId", fieldValue.fieldDefinitionId)
           .eq("entityId", args.entityId)
        )
        .first()

      if (existingValue) {
        // Update existing value
        await ctx.db.patch(existingValue._id, {
          value: fieldValue.value,
          updatedAt: Date.now(),
          updatedBy: identity.subject,
        })
      } else {
        // Create new value
        await ctx.db.insert("customFieldValues", {
          fieldDefinitionId: fieldValue.fieldDefinitionId,
          entityId: args.entityId,
          value: fieldValue.value,
          updatedAt: Date.now(),
          updatedBy: identity.subject,
        })
      }
    }

    return { success: true }
  },
})

// Delete custom field values for an entity
export const deleteCustomFieldValues = mutation({
  args: {
    entityId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const values = await ctx.db
      .query("customFieldValues")
      .withIndex("by_entity", (q) => q.eq("entityId", args.entityId))
      .collect()

    for (const value of values) {
      await ctx.db.delete(value._id)
    }

    return { success: true, deletedCount: values.length }
  },
})

// Search entities by custom field values
export const searchByCustomFields = query({
  args: {
    workspaceId: v.id("workspaces"),
    entityType: v.union(v.literal("task"), v.literal("project"), v.literal("user")),
    filters: v.array(v.object({
      fieldDefinitionId: v.id("customFieldDefinitions"),
      operator: v.union(
        v.literal("equals"),
        v.literal("not_equals"),
        v.literal("contains"),
        v.literal("not_contains"),
        v.literal("greater_than"),
        v.literal("less_than"),
        v.literal("between"),
        v.literal("is_empty"),
        v.literal("is_not_empty")
      ),
      value: v.any(),
      value2: v.optional(v.any()), // For "between" operator
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    // Get all entities of the specified type
    let entities: any[] = []
    
    switch (args.entityType) {
      case "task":
        // Get all tasks in workspace
        const projects = await ctx.db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          .collect()
        
        for (const project of projects) {
          const tasks = await ctx.db
            .query("tasks")
            .withIndex("by_project", (q) => q.eq("projectId", project._id))
            .collect()
          entities.push(...tasks)
        }
        break
      
      case "project":
        entities = await ctx.db
          .query("projects")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          .collect()
        break
      
      case "user":
        // Get workspace members
        const members = await ctx.db
          .query("workspaceMembers")
          .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
          .collect()
        
        for (const member of members) {
          const user = await ctx.db.get(member.userId)
          if (user) entities.push(user)
        }
        break
    }

    // Filter entities based on custom field values
    const matchingEntities = []
    
    for (const entity of entities) {
      let matches = true
      
      for (const filter of args.filters) {
        const value = await ctx.db
          .query("customFieldValues")
          .withIndex("by_field_and_entity", (q) => 
            q.eq("fieldDefinitionId", filter.fieldDefinitionId)
             .eq("entityId", entity._id)
          )
          .first()
        
        const fieldValue = value?.value
        
        switch (filter.operator) {
          case "equals":
            if (fieldValue !== filter.value) matches = false
            break
          
          case "not_equals":
            if (fieldValue === filter.value) matches = false
            break
          
          case "contains":
            if (!fieldValue || !String(fieldValue).includes(String(filter.value))) {
              matches = false
            }
            break
          
          case "not_contains":
            if (fieldValue && String(fieldValue).includes(String(filter.value))) {
              matches = false
            }
            break
          
          case "greater_than":
            if (!fieldValue || Number(fieldValue) <= Number(filter.value)) {
              matches = false
            }
            break
          
          case "less_than":
            if (!fieldValue || Number(fieldValue) >= Number(filter.value)) {
              matches = false
            }
            break
          
          case "between":
            if (!fieldValue || 
                Number(fieldValue) < Number(filter.value) || 
                Number(fieldValue) > Number(filter.value2)) {
              matches = false
            }
            break
          
          case "is_empty":
            if (fieldValue !== null && fieldValue !== undefined && fieldValue !== "") {
              matches = false
            }
            break
          
          case "is_not_empty":
            if (fieldValue === null || fieldValue === undefined || fieldValue === "") {
              matches = false
            }
            break
        }
        
        if (!matches) break
      }
      
      if (matches) {
        matchingEntities.push(entity)
      }
    }

    return matchingEntities
  },
})

// Validate field value based on field definition
async function validateFieldValue(fieldDef: Doc<"customFieldDefinitions">, value: any): Promise<void> {
  // Check required
  if (fieldDef.required && (value === null || value === undefined || value === "")) {
    throw new Error(`Field '${fieldDef.label}' is required`)
  }

  // Skip validation if value is empty and not required
  if (!fieldDef.required && (value === null || value === undefined || value === "")) {
    return
  }

  // Type-specific validation
  switch (fieldDef.type) {
    case "text":
      if (typeof value !== "string") {
        throw new Error(`Field '${fieldDef.label}' must be a string`)
      }
      if (fieldDef.validation?.pattern) {
        const regex = new RegExp(fieldDef.validation.pattern)
        if (!regex.test(value)) {
          throw new Error(fieldDef.validation.message || `Field '${fieldDef.label}' format is invalid`)
        }
      }
      if (fieldDef.validation?.min && value.length < fieldDef.validation.min) {
        throw new Error(`Field '${fieldDef.label}' must be at least ${fieldDef.validation.min} characters`)
      }
      if (fieldDef.validation?.max && value.length > fieldDef.validation.max) {
        throw new Error(`Field '${fieldDef.label}' must be at most ${fieldDef.validation.max} characters`)
      }
      break

    case "number":
      if (typeof value !== "number") {
        throw new Error(`Field '${fieldDef.label}' must be a number`)
      }
      if (fieldDef.validation?.min !== undefined && value < fieldDef.validation.min) {
        throw new Error(`Field '${fieldDef.label}' must be at least ${fieldDef.validation.min}`)
      }
      if (fieldDef.validation?.max !== undefined && value > fieldDef.validation.max) {
        throw new Error(`Field '${fieldDef.label}' must be at most ${fieldDef.validation.max}`)
      }
      break

    case "date":
      if (typeof value !== "number" && typeof value !== "string") {
        throw new Error(`Field '${fieldDef.label}' must be a date`)
      }
      const date = new Date(value)
      if (isNaN(date.getTime())) {
        throw new Error(`Field '${fieldDef.label}' is not a valid date`)
      }
      break

    case "select":
      if (fieldDef.options && !fieldDef.options.includes(value)) {
        throw new Error(`Field '${fieldDef.label}' must be one of: ${fieldDef.options.join(", ")}`)
      }
      break

    case "multiselect":
      if (!Array.isArray(value)) {
        throw new Error(`Field '${fieldDef.label}' must be an array`)
      }
      if (fieldDef.options) {
        for (const v of value) {
          if (!fieldDef.options.includes(v)) {
            throw new Error(`Field '${fieldDef.label}' values must be from: ${fieldDef.options.join(", ")}`)
          }
        }
      }
      break

    case "boolean":
      if (typeof value !== "boolean") {
        throw new Error(`Field '${fieldDef.label}' must be true or false`)
      }
      break

    case "url":
      if (typeof value !== "string") {
        throw new Error(`Field '${fieldDef.label}' must be a string`)
      }
      try {
        new URL(value)
      } catch {
        throw new Error(`Field '${fieldDef.label}' must be a valid URL`)
      }
      break

    case "email":
      if (typeof value !== "string") {
        throw new Error(`Field '${fieldDef.label}' must be a string`)
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        throw new Error(`Field '${fieldDef.label}' must be a valid email address`)
      }
      break
  }
}