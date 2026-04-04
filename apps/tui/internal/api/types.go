package api

// Task represents a task document from the Convex database.
type Task struct {
	ID          string   `json:"_id"`
	CreatedAt   float64  `json:"_creationTime"`
	ProjectID   string   `json:"projectId"`
	Title       string   `json:"title"`
	Description string   `json:"description,omitempty"`
	Status      string   `json:"status"`
	Priority    string   `json:"priority,omitempty"`
	Type        string   `json:"type,omitempty"`
	AssigneeIDs []string `json:"assigneeIds,omitempty"`
	Labels      []string `json:"labels,omitempty"`
	SprintID    string   `json:"sprintId,omitempty"`
	Estimate    float64  `json:"estimate,omitempty"`
	Progress    float64  `json:"progress,omitempty"`
}

// Sprint represents a sprint document from the Convex database.
type Sprint struct {
	ID        string  `json:"_id"`
	ProjectID string  `json:"projectId"`
	Name      string  `json:"name"`
	Goal      string  `json:"goal,omitempty"`
	Status    string  `json:"status"`
	StartDate float64 `json:"startDate"`
	EndDate   float64 `json:"endDate"`
}

// TriageSuggestion represents an AI triage suggestion.
type TriageSuggestion struct {
	ID                 string   `json:"_id"`
	TaskID             string   `json:"taskId"`
	SuggestedType      string   `json:"suggestedType,omitempty"`
	SuggestedPriority  string   `json:"suggestedPriority,omitempty"`
	SuggestedAssignees []string `json:"suggestedAssigneeIds,omitempty"`
	SuggestedLabels    []string `json:"suggestedLabels,omitempty"`
	Confidence         float64  `json:"confidence"`
	Reasoning          string   `json:"reasoning,omitempty"`
	Status             string   `json:"status"`
}

// Skill represents an agent skill.
type Skill struct {
	ID          string `json:"_id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Description string `json:"description"`
	Trigger     string `json:"trigger"`
	IsActive    bool   `json:"isActive"`
	IsBuiltIn   bool   `json:"isBuiltIn,omitempty"`
	UsageCount  int    `json:"usageCount,omitempty"`
}

// AgentActivity represents an agent activity log entry.
type AgentActivity struct {
	ID          string  `json:"_id"`
	CreatedAt   float64 `json:"_creationTime"`
	Type        string  `json:"type"`
	Description string  `json:"description"`
	TaskID      string  `json:"taskId,omitempty"`
}

// Workspace represents a workspace.
type Workspace struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
	Slug string `json:"slug"`
}

// Project represents a project.
type Project struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
	Key  string `json:"key"`
}

// Notification represents a notification.
type Notification struct {
	ID        string  `json:"_id"`
	CreatedAt float64 `json:"_creationTime"`
	Type      string  `json:"type"`
	Title     string  `json:"title"`
	Message   string  `json:"message,omitempty"`
	IsRead    bool    `json:"isRead"`
}
