import { useReducer } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import { 
  HiOutlineDocumentText, 
  HiOutlineCode, 
  HiOutlinePencilAlt,
  HiOutlineSparkles,
  HiOutlineClipboardCopy,
  HiOutlineDownload,
  HiOutlineShare,
  HiOutlineTemplate,
  HiOutlineBookOpen,
  HiOutlineLightBulb,
  HiOutlineChat,
  HiOutlineCheck,
  HiOutlineRefresh,
  HiOutlineTrash
} from 'react-icons/hi'
import { m, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import LoadingSpinner from '../../common/LoadingSpinner'

interface AIDocumentationHubProps {
  projectId: string
  workspaceId: string
  tasks?: any[]
  sprints?: any[]
  projectDetails?: any
}

// Document templates with AI prompts
const DOCUMENT_TEMPLATES = [
  {
    id: 'pr',
    title: 'PULL REQUEST',
    icon: HiOutlineCode,
    description: 'Generate PR description with changes, testing, and impact',
    color: 'border-brutal-info',
    bgColor: 'bg-brutal-info/10',
    fields: ['branch', 'changes', 'testing', 'breaking_changes'],
    aiPrompt: 'Generate a comprehensive PR description including: summary of changes, technical details, testing done, and any breaking changes'
  },
  {
    id: 'prd',
    title: 'PRD',
    icon: HiOutlineDocumentText,
    description: 'Product Requirements Document with user stories and specs',
    color: 'border-brutal-success',
    bgColor: 'bg-brutal-success/10',
    fields: ['objective', 'user_stories', 'requirements', 'success_metrics'],
    aiPrompt: 'Create a detailed PRD including: objectives, user stories, functional requirements, non-functional requirements, and success metrics'
  },
  {
    id: 'api',
    title: 'API DOCS',
    icon: HiOutlineCode,
    description: 'RESTful API documentation with endpoints and examples',
    color: 'border-primary-brutalist',
    bgColor: 'bg-primary-brutalist/10',
    fields: ['endpoints', 'authentication', 'request_examples', 'response_examples'],
    aiPrompt: 'Generate API documentation with endpoints, methods, parameters, authentication, and request/response examples'
  },
  {
    id: 'readme',
    title: 'README',
    icon: HiOutlineBookOpen,
    description: 'Project README with setup, usage, and contribution guide',
    color: 'border-brutal-warning',
    bgColor: 'bg-brutal-warning/10',
    fields: ['overview', 'installation', 'usage', 'contributing'],
    aiPrompt: 'Create a comprehensive README including: project overview, installation, usage, API reference, and contribution guidelines'
  },
  {
    id: 'tech_spec',
    title: 'TECH SPEC',
    icon: HiOutlineLightBulb,
    description: 'Technical specification with architecture and implementation',
    color: 'border-brutal-error',
    bgColor: 'bg-brutal-error/10',
    fields: ['architecture', 'technologies', 'implementation', 'security'],
    aiPrompt: 'Write a technical specification covering: system architecture, technology stack, implementation details, and security considerations'
  },
  {
    id: 'release',
    title: 'RELEASE NOTES',
    icon: HiOutlineSparkles,
    description: 'Release notes with features, fixes, and breaking changes',
    color: 'border-brutal-info',
    bgColor: 'bg-brutal-info/10',
    fields: ['version', 'features', 'fixes', 'breaking_changes'],
    aiPrompt: 'Generate release notes including: new features, bug fixes, improvements, breaking changes, and migration guide'
  }
]

const EMPTY_TASKS: NonNullable<AIDocumentationHubProps['tasks']> = []
const EMPTY_SPRINTS: NonNullable<AIDocumentationHubProps['sprints']> = []

type AIDocumentationHubState = {
  selectedTemplate: string | null
  generatingDoc: boolean
  documentContent: string
  documentTitle: string
  contextData: {
    includeTaskData: boolean
    includeSprintData: boolean
    includeProjectInfo: boolean
    customContext: string
  }
  savedDocuments: any[]
  editingDoc: string | null
  showPreview: boolean
}

const aiDocumentationHubInitialState: AIDocumentationHubState = {
  selectedTemplate: null,
  generatingDoc: false,
  documentContent: '',
  documentTitle: '',
  contextData: {
    includeTaskData: true,
    includeSprintData: true,
    includeProjectInfo: true,
    customContext: '',
  },
  savedDocuments: [],
  editingDoc: null,
  showPreview: true,
}

type AIDocumentationHubAction =
  | { type: 'UPDATE'; field: keyof AIDocumentationHubState; value: AIDocumentationHubState[keyof AIDocumentationHubState] }
  | { type: 'RESET' }

function aiDocumentationHubReducer(state: AIDocumentationHubState, action: AIDocumentationHubAction): AIDocumentationHubState {
  switch (action.type) {
    case 'UPDATE':
      return { ...state, [action.field]: action.value }
    case 'RESET':
      return aiDocumentationHubInitialState
    default:
      return state
  }
}

// --- Sub-components ---

interface TemplateSelectionPanelProps {
  selectedTemplate: string | null
  onSelectTemplate: (templateId: string) => void
}

function TemplateSelectionPanel({ selectedTemplate, onSelectTemplate }: TemplateSelectionPanelProps) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
      <h3 className="text-brutal-md font-bold uppercase mb-[8px]">DOCUMENT TYPE</h3>
      <div className="space-y-[6px]">
        {DOCUMENT_TEMPLATES.map((template) => {
          const Icon = template.icon
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={clsx(
                'w-full p-[10px] border-2 text-left transition-all',
                'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal',
                selectedTemplate === template.id
                  ? `${template.color} ${template.bgColor} shadow-brutal`
                  : 'border-[var(--theme-border)] hover:border-primary-brutalist'
              )}
            >
              <div className="flex items-start gap-[6px]">
                <Icon className="w-5 h-5 flex-shrink-0 mt-2px" />
                <div className="flex-1">
                  <h4 className="font-mono text-brutal-sm font-bold uppercase">
                    {template.title}
                  </h4>
                  <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-4px">
                    {template.description}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface ContextConfigPanelProps {
  contextData: AIDocumentationHubState['contextData']
  onContextDataChange: (data: AIDocumentationHubState['contextData']) => void
  selectedTemplate: string | null
  generatingDoc: boolean
  onGenerate: () => void
}

function ContextConfigPanel({ contextData, onContextDataChange, selectedTemplate, generatingDoc, onGenerate }: ContextConfigPanelProps) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
      <h3 className="text-brutal-md font-bold uppercase mb-[8px]">AI CONTEXT</h3>
      <div className="space-y-[6px]">
        <label htmlFor="ai-doc-include-tasks" className="flex items-center gap-[8px] cursor-pointer">
          <input
            id="ai-doc-include-tasks"
            type="checkbox"
            checked={contextData.includeTaskData}
            onChange={(e) => onContextDataChange({...contextData, includeTaskData: e.target.checked})}
            className="w-4 h-4"
          />
          <span className="text-brutal-sm">Include recent tasks</span>
        </label>
        <label htmlFor="ai-doc-include-sprints" className="flex items-center gap-[8px] cursor-pointer">
          <input
            id="ai-doc-include-sprints"
            type="checkbox"
            checked={contextData.includeSprintData}
            onChange={(e) => onContextDataChange({...contextData, includeSprintData: e.target.checked})}
            className="w-4 h-4"
          />
          <span className="text-brutal-sm">Include sprint data</span>
        </label>
        <label htmlFor="ai-doc-include-project" className="flex items-center gap-[8px] cursor-pointer">
          <input
            id="ai-doc-include-project"
            type="checkbox"
            checked={contextData.includeProjectInfo}
            onChange={(e) => onContextDataChange({...contextData, includeProjectInfo: e.target.checked})}
            className="w-4 h-4"
          />
          <span className="text-brutal-sm">Include project info</span>
        </label>

        <div className="mt-[8px]">
          <label htmlFor="ai-doc-custom-context" className="block text-brutal-xs uppercase mb-[8px]">
            ADDITIONAL CONTEXT
          </label>
          <textarea
            id="ai-doc-custom-context"
            value={contextData.customContext}
            onChange={(e) => onContextDataChange({...contextData, customContext: e.target.value})}
            placeholder="Add specific details, requirements, or context for the AI..."
            className="w-full h-80px px-[12px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm resize-none"
          />
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={!selectedTemplate || generatingDoc}
        className={clsx(
          'w-full mt-[8px] brutal-btn flex items-center justify-center gap-[8px]',
          (!selectedTemplate || generatingDoc) && 'opacity-50 cursor-not-allowed'
        )}
      >
        {generatingDoc ? (
          <>
            <LoadingSpinner size="sm" />
            GENERATING...
          </>
        ) : (
          <>
            <HiOutlineSparkles className="w-4 h-4" />
            GENERATE WITH AI
          </>
        )}
      </button>
    </div>
  )
}

interface DocumentEditorPanelProps {
  documentTitle: string
  documentContent: string
  generatingDoc: boolean
  showPreview: boolean
  onTitleChange: (title: string) => void
  onContentChange: (content: string) => void
  onCopy: () => void
  onExport: () => void
  onSave: () => void
  onRegenerate: () => void
}

function DocumentEditorPanel({ documentTitle, documentContent, generatingDoc, showPreview, onTitleChange, onContentChange, onCopy, onExport, onSave, onRegenerate }: DocumentEditorPanelProps) {
  return (
    <div className="lg:col-span-2 space-y-[12px]">
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
        <div className="flex items-center justify-between p-[10px] border-b-2 border-[var(--theme-border)]">
          <input
            type="text"
            value={documentTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Document Title..."
            aria-label="Document title"
            className="flex-1 px-[12px] py-[8px] bg-transparent font-mono text-brutal-md font-bold uppercase focus:outline-none"
          />
          <div className="flex items-center gap-[8px]">
            <button
              onClick={onCopy}
              disabled={!documentContent}
              className="p-[8px] hover:bg-[var(--theme-background-secondary)] transition-colors disabled:opacity-50"
              title="Copy to clipboard"
            >
              <HiOutlineClipboardCopy className="w-4 h-4" />
            </button>
            <button
              onClick={onExport}
              disabled={!documentContent}
              className="p-[8px] hover:bg-[var(--theme-background-secondary)] transition-colors disabled:opacity-50"
              title="Export as Markdown"
            >
              <HiOutlineDownload className="w-4 h-4" />
            </button>
            <button
              onClick={onSave}
              disabled={!documentContent}
              className="p-[8px] hover:bg-[var(--theme-background-secondary)] transition-colors disabled:opacity-50"
              title="Save document"
            >
              <HiOutlineCheck className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-[16px]">
          <textarea
            value={documentContent}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder={generatingDoc ? "AI is generating your document..." : "Start typing or generate with AI..."}
            aria-label="Document content"
            className="w-full h-400px px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm resize-none"
            disabled={generatingDoc}
          />

          {documentContent && (
            <div className="mt-[8px] flex items-center justify-between">
              <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                {documentContent.split(' ').length} words • {documentContent.length} characters
              </div>
              <button
                onClick={onRegenerate}
                className="brutal-btn-secondary flex items-center gap-[8px]"
              >
                <HiOutlineRefresh className="w-14px h-14px" />
                REGENERATE
              </button>
            </div>
          )}
        </div>
      </div>

      {showPreview && documentContent && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]"
        >
          <h3 className="text-brutal-md font-bold uppercase mb-[8px]">PREVIEW</h3>
          <div className="prose prose-invert max-w-none">
            <pre className="font-mono text-brutal-sm whitespace-pre-wrap bg-transparent border-0 p-0 m-0">
              {documentContent}
            </pre>
          </div>
        </m.div>
      )}
    </div>
  )
}

interface SavedDocument {
  id: string
  title: string
  content: string
  type: string
  createdAt: string
  projectId: string
}

interface SavedDocumentsGridProps {
  savedDocuments: SavedDocument[]
  onSelectDocument: (doc: SavedDocument) => void
  onDeleteDocument: (docId: string) => void
}

function SavedDocumentsGrid({ savedDocuments, onSelectDocument, onDeleteDocument }: SavedDocumentsGridProps) {
  return (
    <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
      <h3 className="text-brutal-md font-bold uppercase mb-[8px]">SAVED DOCUMENTS</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
        {savedDocuments.map((doc) => {
          const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.type)
          const Icon = template?.icon || HiOutlineDocumentText

          return (
            <button
              type="button"
              key={doc.id}
              className={clsx(
                'p-[10px] border-2 cursor-pointer transition-all text-left w-full',
                'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal',
                template?.color || 'border-[var(--theme-border)]'
              )}
              onClick={() => onSelectDocument(doc)}
            >
              <div className="flex items-start justify-between mb-[8px]">
                <Icon className="w-5 h-5" />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteDocument(doc.id)
                  }}
                  className="p-4px hover:bg-[var(--theme-background-secondary)] transition-colors"
                >
                  <HiOutlineTrash className="w-14px h-14px text-brutal-error" />
                </button>
              </div>
              <h4 className="font-mono text-brutal-sm font-bold uppercase truncate">
                {doc.title}
              </h4>
              <p className="text-brutal-xs text-[var(--theme-foreground)]/60 mt-4px">
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Main Component ---

export default function AIDocumentationHub({
  projectId,
  workspaceId,
  tasks = EMPTY_TASKS,
  sprints = EMPTY_SPRINTS,
  projectDetails
}: AIDocumentationHubProps) {
  const [state, dispatch] = useReducer(aiDocumentationHubReducer, aiDocumentationHubInitialState)
  const { selectedTemplate, generatingDoc, documentContent, documentTitle, contextData, savedDocuments, editingDoc, showPreview } = state

  const generateAIDocument = useMutation(api.ai.mutations.generateDocumentation)

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a document type')
      return
    }

    dispatch({ type: 'UPDATE', field: 'generatingDoc', value: true })
    const template = DOCUMENT_TEMPLATES.find(t => t.id === selectedTemplate)

    try {
      // Prepare context for AI
      const context = {
        projectName: projectDetails?.name || 'Project',
        projectDescription: projectDetails?.description || '',
        tasks: contextData.includeTaskData ? tasks.slice(0, 10) : [],
        sprints: contextData.includeSprintData ? sprints.slice(0, 5) : [],
        customContext: contextData.customContext,
        template: template?.aiPrompt
      }

      const result = await generateAIDocument({
        projectId: projectId as any,
        documentType: selectedTemplate,
        context: JSON.stringify(context)
      })

      dispatch({ type: 'UPDATE', field: 'documentContent', value: result.content })
      dispatch({ type: 'UPDATE', field: 'documentTitle', value: result.title || `${template?.title} - ${new Date().toLocaleDateString()}` })
      toast.success('Document generated successfully!')
    } catch (error) {
      toast.error('Failed to generate document')
      console.error(error)
    } finally {
      dispatch({ type: 'UPDATE', field: 'generatingDoc', value: false })
    }
  }

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(documentContent)
    toast.success('Copied to clipboard!')
  }

  const handleExportMarkdown = () => {
    const blob = new Blob([documentContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.replace(/\s+/g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Document exported!')
  }

  const handleSaveDocument = () => {
    const newDoc = {
      id: Date.now().toString(),
      title: documentTitle,
      content: documentContent,
      type: selectedTemplate,
      createdAt: new Date().toISOString(),
      projectId
    }
    dispatch({ type: 'UPDATE', field: 'savedDocuments', value: [newDoc, ...savedDocuments] })
    toast.success('Document saved!')
  }

  return (
    <div className="space-y-[12px]">
      {/* Header */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[16px]">
        <div className="flex items-center justify-between mb-[8px]">
          <div>
            <h2 className="text-brutal-lg font-bold uppercase flex items-center gap-[8px]">
              <HiOutlineSparkles className="w-4 h-4 text-primary-brutalist" />
              AI DOCUMENTATION HUB
            </h2>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mt-8px">
              Generate PRs, PRDs, API docs, and technical documentation with AI
            </p>
          </div>
          <div className="flex items-center gap-[6px]">
            <button 
              onClick={() => dispatch({ type: 'UPDATE', field: 'showPreview', value: !showPreview })}
              className="brutal-btn-secondary flex items-center gap-[8px]"
            >
              <HiOutlineDocumentText className="w-4 h-4" />
              {showPreview ? 'HIDE' : 'SHOW'} PREVIEW
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px]">
        {/* Template Selection & Configuration */}
        <div className="lg:col-span-1 space-y-[12px]">
          <TemplateSelectionPanel
            selectedTemplate={selectedTemplate}
            onSelectTemplate={(templateId) => {
              dispatch({ type: 'UPDATE', field: 'selectedTemplate', value: templateId })
              dispatch({ type: 'UPDATE', field: 'documentTitle', value: '' })
              dispatch({ type: 'UPDATE', field: 'documentContent', value: '' })
            }}
          />

          <ContextConfigPanel
            contextData={contextData}
            onContextDataChange={(data) => dispatch({ type: 'UPDATE', field: 'contextData', value: data })}
            selectedTemplate={selectedTemplate}
            generatingDoc={generatingDoc}
            onGenerate={handleGenerateDocument}
          />
        </div>

        {/* Document Editor & Preview */}
        <DocumentEditorPanel
          documentTitle={documentTitle}
          documentContent={documentContent}
          generatingDoc={generatingDoc}
          showPreview={showPreview}
          onTitleChange={(title) => dispatch({ type: 'UPDATE', field: 'documentTitle', value: title })}
          onContentChange={(content) => dispatch({ type: 'UPDATE', field: 'documentContent', value: content })}
          onCopy={handleCopyToClipboard}
          onExport={handleExportMarkdown}
          onSave={handleSaveDocument}
          onRegenerate={handleGenerateDocument}
        />
      </div>

      {/* Saved Documents */}
      {savedDocuments.length > 0 && (
        <SavedDocumentsGrid
          savedDocuments={savedDocuments}
          onSelectDocument={(doc) => {
            dispatch({ type: 'UPDATE', field: 'documentTitle', value: doc.title })
            dispatch({ type: 'UPDATE', field: 'documentContent', value: doc.content })
            dispatch({ type: 'UPDATE', field: 'selectedTemplate', value: doc.type })
          }}
          onDeleteDocument={(docId) => {
            dispatch({ type: 'UPDATE', field: 'savedDocuments', value: savedDocuments.filter((d: any) => d.id !== docId) })
            toast.success('Document deleted')
          }}
        />
      )}
    </div>
  )
}