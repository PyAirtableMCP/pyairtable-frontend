"use client"

import * as React from "react"
import { useAirtableStore } from "@/stores/airtableStore"
import { airtableClient } from "@/lib/airtable-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Save, X } from "lucide-react"
import { toast } from "react-hot-toast"
import type { AirtableRecord, AirtableField } from "@/lib/airtable-client"

interface RecordEditorProps {
  record?: AirtableRecord | null
  onClose: () => void
  onSave: (record: AirtableRecord) => void
}

export function RecordEditor({ record, onClose, onSave }: RecordEditorProps) {
  const {
    selectedBase,
    selectedTable,
    addRecords,
    updateRecord,
    setError,
  } = useAirtableStore()

  const [formData, setFormData] = React.useState<Record<string, any>>({})
  const [isSaving, setIsSaving] = React.useState(false)
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  const isEditing = !!record
  const isOpen = true // Component only renders when modal should be open

  // Initialize form data
  React.useEffect(() => {
    if (record) {
      setFormData({ ...record.fields })
    } else {
      // Initialize with empty values for new record
      const initialData: Record<string, any> = {}
      selectedTable?.fields?.forEach(field => {
        initialData[field.name] = getDefaultValueForField(field)
      })
      setFormData(initialData)
    }
    setValidationErrors({})
  }, [record, selectedTable])

  const getDefaultValueForField = (field: AirtableField) => {
    switch (field.type) {
      case 'checkbox':
        return false
      case 'multipleSelects':
      case 'multipleRecordLinks':
        return []
      case 'number':
      case 'currency':
      case 'percent':
      case 'duration':
        return null
      case 'date':
      case 'dateTime':
        return null
      default:
        return ''
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    selectedTable?.fields?.forEach(field => {
      const value = formData[field.name]
      
      // Check required fields (assuming primary field is required)
      if (field.id === selectedTable.primaryFieldId && (!value || value.toString().trim() === '')) {
        errors[field.name] = 'This field is required'
      }
      
      // Type-specific validation
      if (value != null && value !== '') {
        switch (field.type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              errors[field.name] = 'Please enter a valid email address'
            }
            break
          case 'url':
            try {
              new URL(value)
            } catch {
              errors[field.name] = 'Please enter a valid URL'
            }
            break
          case 'phoneNumber':
            if (!/^[\+]?[\d\s\-\(\)]+$/.test(value)) {
              errors[field.name] = 'Please enter a valid phone number'
            }
            break
        }
      }
    })
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!selectedBase || !selectedTable || !validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      if (isEditing && record) {
        // Update existing record
        const response = await airtableClient.updateRecords(
          selectedBase.id,
          selectedTable.id,
          [{ id: record.id, ...formData }]
        )
        
        if (response.records?.[0]) {
          updateRecord(record.id, response.records[0])
          toast.success('Record updated successfully')
          onSave(response.records[0])
        }
      } else {
        // Create new record
        const response = await airtableClient.createRecords(
          selectedBase.id,
          selectedTable.id,
          [formData]
        )
        
        if (response.records?.[0]) {
          addRecords(response.records)
          toast.success('Record created successfully')
          onSave(response.records[0])
        }
      }
      
      onClose()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save record'
      setError(message)
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
    
    // Clear validation error for this field
    if (validationErrors[fieldName]) {
      setValidationErrors(prev => {
        const { [fieldName]: _, ...rest } = prev
        return rest
      })
    }
  }

  const renderFieldInput = (field: AirtableField) => {
    const value = formData[field.name]
    const error = validationErrors[field.name]
    const isRequired = field.id === selectedTable?.primaryFieldId

    const fieldId = `field-${field.id}`

    switch (field.type) {
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
            />
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
          </div>
        )

      case 'singleSelect':
        const options = field.options?.choices || []
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={(val) => handleFieldChange(field.name, val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {options.map((option: any) => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'multipleSelects':
        const multiOptions = field.options?.choices || []
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
              {(value as string[] || []).map((item: string) => (
                <Badge key={item} variant="secondary">
                  {item}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newValue = (value as string[]).filter(v => v !== item)
                      handleFieldChange(field.name, newValue)
                    }}
                    className="ml-1 h-4 w-4 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Select onValueChange={(val) => {
              const currentValue = value as string[] || []
              if (!currentValue.includes(val)) {
                handleFieldChange(field.name, [...currentValue, val])
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Add option" />
              </SelectTrigger>
              <SelectContent>
                {multiOptions.map((option: any) => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'multilineText':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              rows={3}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'number':
      case 'currency':
      case 'percent':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="number"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, parseFloat(e.target.value) || null)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={fieldId}
              type="date"
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={fieldId} className="text-sm font-medium">
              {field.name} {isRequired && <span className="text-destructive">*</span>}
            </Label>
            <Input
              id={fieldId}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Record' : 'Create New Record'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Make changes to the record fields below.' 
              : `Create a new record in ${selectedTable?.name || 'this table'}.`
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-6">
          <div className="space-y-4">
            {selectedTable?.fields?.map((field) => (
              <div key={field.id}>
                {renderFieldInput(field)}
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            {isEditing ? 'Save Changes' : 'Create Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}