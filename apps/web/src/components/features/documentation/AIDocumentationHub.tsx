import { useState } from 'react'
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
import { motion, AnimatePresence } from 'framer-motion'
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

export default function AIDocumentationHub({ 
  projectId, 
  workspaceId,
  tasks = [],
  sprints = [],
  projectDetails
}: AIDocumentationHubProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [generatingDoc, setGeneratingDoc] = useState(false)
  const [documentContent, setDocumentContent] = useState('')
  const [documentTitle, setDocumentTitle] = useState('')
  const [contextData, setContextData] = useState({
    includeTaskData: true,
    includeSprintData: true,
    includeProjectInfo: true,
    customContext: ''
  })
  const [savedDocuments, setSavedDocuments] = useState<any[]>([])
  const [editingDoc, setEditingDoc] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  const generateAIDocument = useMutation(api.ai.mutations.generateDocumentation)

  const handleGenerateDocument = async () => {
    if (!selectedTemplate) {
      toast.error('Please select a document type')
      return
    }

    setGeneratingDoc(true)
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

      setDocumentContent(result.content)
      setDocumentTitle(result.title || `${template?.title} - ${new Date().toLocaleDateString()}`)
      toast.success('Document generated successfully!')
    } catch (error) {
      toast.error('Failed to generate document')
      console.error(error)
    } finally {
      setGeneratingDoc(false)
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
    setSavedDocuments([newDoc, ...savedDocuments])
    toast.success('Document saved!')
  }

  return (
    <div className="space-y-24px">
      {/* Header */}
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
        <div className="flex items-center justify-between mb-16px">
          <div>
            <h2 className="text-brutal-lg font-bold uppercase flex items-center gap-8px">
              <HiOutlineSparkles className="w-24px h-24px text-primary-brutalist" />
              AI DOCUMENTATION HUB
            </h2>
            <p className="text-brutal-sm text-[var(--theme-foreground)]/60 mt-8px">
              Generate PRs, PRDs, API docs, and technical documentation with AI
            </p>
          </div>
          <div className="flex items-center gap-12px">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="brutal-btn-secondary flex items-center gap-8px"
            >
              <HiOutlineDocumentText className="w-16px h-16px" />
              {showPreview ? 'HIDE' : 'SHOW'} PREVIEW
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-24px">
        {/* Template Selection & Configuration */}
        <div className="lg:col-span-1 space-y-24px">
          {/* Document Templates */}
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
            <h3 className="text-brutal-md font-bold uppercase mb-16px">DOCUMENT TYPE</h3>
            <div className="space-y-12px">
              {DOCUMENT_TEMPLATES.map((template) => {
                const Icon = template.icon
                return (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template.id)
                      setDocumentTitle('')
                      setDocumentContent('')
                    }}
                    className={clsx(
                      'w-full p-16px border-2 text-left transition-all',
                      'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal',
                      selectedTemplate === template.id 
                        ? `${template.color} ${template.bgColor} shadow-brutal`
                        : 'border-[var(--theme-border)] hover:border-primary-brutalist'
                    )}
                  >
                    <div className="flex items-start gap-12px">
                      <Icon className="w-20px h-20px flex-shrink-0 mt-2px" />
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

          {/* Context Configuration */}
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
            <h3 className="text-brutal-md font-bold uppercase mb-16px">AI CONTEXT</h3>
            <div className="space-y-12px">
              <label className="flex items-center gap-8px cursor-pointer">
                <input
                  type="checkbox"
                  checked={contextData.includeTaskData}
                  onChange={(e) => setContextData({...contextData, includeTaskData: e.target.checked})}
                  className="w-16px h-16px"
                />
                <span className="text-brutal-sm">Include recent tasks</span>
              </label>
              <label className="flex items-center gap-8px cursor-pointer">
                <input
                  type="checkbox"
                  checked={contextData.includeSprintData}
                  onChange={(e) => setContextData({...contextData, includeSprintData: e.target.checked})}
                  className="w-16px h-16px"
                />
                <span className="text-brutal-sm">Include sprint data</span>
              </label>
              <label className="flex items-center gap-8px cursor-pointer">
                <input
                  type="checkbox"
                  checked={contextData.includeProjectInfo}
                  onChange={(e) => setContextData({...contextData, includeProjectInfo: e.target.checked})}
                  className="w-16px h-16px"
                />
                <span className="text-brutal-sm">Include project info</span>
              </label>
              
              <div className="mt-16px">
                <label className="block text-brutal-xs uppercase mb-8px">
                  ADDITIONAL CONTEXT
                </label>
                <textarea
                  value={contextData.customContext}
                  onChange={(e) => setContextData({...contextData, customContext: e.target.value})}
                  placeholder="Add specific details, requirements, or context for the AI..."
                  className="w-full h-80px px-12px py-8px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateDocument}
              disabled={!selectedTemplate || generatingDoc}
              className={clsx(
                'w-full mt-16px brutal-btn flex items-center justify-center gap-8px',
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
                  <HiOutlineSparkles className="w-16px h-16px" />
                  GENERATE WITH AI
                </>
              )}
            </button>
          </div>
        </div>

        {/* Document Editor & Preview */}
        <div className="lg:col-span-2 space-y-24px">
          {/* Editor */}
          <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)]">
            <div className="flex items-center justify-between p-16px border-b-2 border-[var(--theme-border)]">
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Document Title..."
                className="flex-1 px-12px py-8px bg-transparent font-mono text-brutal-md font-bold uppercase focus:outline-none"
              />
              <div className="flex items-center gap-8px">
                <button
                  onClick={handleCopyToClipboard}
                  disabled={!documentContent}
                  className="p-8px hover:bg-[var(--theme-background-secondary)] transition-colors disabled:opacity-50"
                  title="Copy to clipboard"
                >
                  <HiOutlineClipboardCopy className="w-16px h-16px" />
                </button>
                <button
                  onClick={handleExportMarkdown}
                  disabled={!documentContent}
                  className="p-8px hover:bg-[var(--theme-background-secondary)] transition-colors disabled:opacity-50"
                  title="Export as Markdown"
                >
                  <HiOutlineDownload className="w-16px h-16px" />
                </button>
                <button
                  onClick={handleSaveDocument}
                  disabled={!documentContent}
                  className="p-8px hover:bg-[var(--theme-background-secondary)] transition-colors disabled:opacity-50"
                  title="Save document"
                >
                  <HiOutlineCheck className="w-16px h-16px" />
                </button>
              </div>
            </div>
            
            <div className="p-24px">
              <textarea
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder={generatingDoc ? "AI is generating your document..." : "Start typing or generate with AI..."}
                className="w-full h-400px px-16px py-12px bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)] font-mono text-brutal-sm resize-none"
                disabled={generatingDoc}
              />
              
              {documentContent && (
                <div className="mt-16px flex items-center justify-between">
                  <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                    {documentContent.split(' ').length} words • {documentContent.length} characters
                  </div>
                  <button
                    onClick={() => handleGenerateDocument()}
                    className="brutal-btn-secondary flex items-center gap-8px"
                  >
                    <HiOutlineRefresh className="w-14px h-14px" />
                    REGENERATE
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview */}
          {showPreview && documentContent && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px"
            >
              <h3 className="text-brutal-md font-bold uppercase mb-16px">PREVIEW</h3>
              <div className="prose prose-invert max-w-none">
                <div 
                  className="font-mono text-brutal-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: documentContent
                      .replace(/^# (.+)$/gm, '<h1 class="text-brutal-lg font-bold uppercase mb-16px">$1</h1>')
                      .replace(/^## (.+)$/gm, '<h2 class="text-brutal-md font-bold uppercase mb-12px mt-24px">$1</h2>')
                      .replace(/^### (.+)$/gm, '<h3 class="text-brutal-sm font-bold uppercase mb-8px mt-16px">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/`(.+?)`/g, '<code class="px-4px py-2px bg-[var(--theme-background-secondary)] text-primary-brutalist">$1</code>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Saved Documents */}
      {savedDocuments.length > 0 && (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-24px">
          <h3 className="text-brutal-md font-bold uppercase mb-16px">SAVED DOCUMENTS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16px">
            {savedDocuments.map((doc) => {
              const template = DOCUMENT_TEMPLATES.find(t => t.id === doc.type)
              const Icon = template?.icon || HiOutlineDocumentText
              
              return (
                <div
                  key={doc.id}
                  className={clsx(
                    'p-16px border-2 cursor-pointer transition-all',
                    'hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal',
                    template?.color || 'border-[var(--theme-border)]'
                  )}
                  onClick={() => {
                    setDocumentTitle(doc.title)
                    setDocumentContent(doc.content)
                    setSelectedTemplate(doc.type)
                  }}
                >
                  <div className="flex items-start justify-between mb-8px">
                    <Icon className="w-20px h-20px" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSavedDocuments(savedDocuments.filter(d => d.id !== doc.id))
                        toast.success('Document deleted')
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
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}