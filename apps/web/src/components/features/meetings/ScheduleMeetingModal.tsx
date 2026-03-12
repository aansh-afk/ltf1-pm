import { useEffect, useReducer } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import type { Id } from "../../../../../../convex/_generated/dataModel";
import toast from "react-hot-toast";
import BrutalModal from "../../ui/BrutalModal";
import BrutalSelect from "../../ui/BrutalSelect";
import MultiSelect from "../../ui/MultiSelect";
import {
  HiOutlineVideoCamera,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineUsers,
  HiOutlineTemplate,
  HiOutlineRefresh,
} from "react-icons/hi";

interface ScheduleMeetingData {
  _id: Id<"meetings">
  title: string
  description?: string
  type: 'standup' | 'retrospective' | 'planning' | 'review' | 'custom'
  startTime: number
  endTime: number
  location?: string
  meetingUrl?: string
  attendees?: Array<{ userId: Id<"users">; status: string }>
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    interval: number
    endDate?: number
  }
  template?: {
    agenda?: string[]
    duration?: number
    isRecurring: boolean
  }
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  sprintId?: string;
  workspaceId: string;
  meeting?: ScheduleMeetingData;
  onSuccess?: () => void;
}

const meetingTypes = [
  { value: "standup", label: "DAILY STANDUP", icon: "🏃", duration: 15 },
  { value: "retrospective", label: "RETROSPECTIVE", icon: "🔄", duration: 60 },
  { value: "planning", label: "SPRINT PLANNING", icon: "📋", duration: 120 },
  { value: "review", label: "SPRINT REVIEW", icon: "👥", duration: 60 },
  { value: "custom", label: "CUSTOM MEETING", icon: "⚙️", duration: 30 },
];

// --- Form State ---

type MeetingFormAction =
  | { type: "SET_FIELD"; field: string; value: string | number | boolean | string[] }
  | { type: "RESET" }
  | { type: "POPULATE"; data: Partial<MeetingFormState> }
  | { type: "ADD_AGENDA" }
  | { type: "UPDATE_AGENDA"; index: number; value: string }
  | { type: "REMOVE_AGENDA"; index: number };

interface MeetingFormState {
  title: string;
  description: string;
  meetingType: "standup" | "retrospective" | "planning" | "review" | "custom";
  startDate: string;
  startTime: string;
  duration: number;
  location: string;
  meetingUrl: string;
  selectedAttendees: string[];
  isRecurring: boolean;
  recurrenceFreq: "daily" | "weekly" | "monthly";
  recurrenceInterval: number;
  recurrenceEndDate: string;
  agenda: string[];
  isCreating: boolean;
}

const formInitialState: MeetingFormState = {
  title: "",
  description: "",
  meetingType: "standup",
  startDate: "",
  startTime: "",
  duration: 30,
  location: "",
  meetingUrl: "",
  selectedAttendees: [],
  isRecurring: false,
  recurrenceFreq: "weekly",
  recurrenceInterval: 1,
  recurrenceEndDate: "",
  agenda: [""],
  isCreating: false,
};

function formReducer(
  state: MeetingFormState,
  action: MeetingFormAction,
): MeetingFormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return formInitialState;
    case "POPULATE":
      return { ...state, ...action.data };
    case "ADD_AGENDA":
      return { ...state, agenda: [...state.agenda, ""] };
    case "UPDATE_AGENDA": {
      const newAgenda = [...state.agenda];
      newAgenda[action.index] = action.value;
      return { ...state, agenda: newAgenda };
    }
    case "REMOVE_AGENDA":
      if (state.agenda.length > 1) {
        return {
          ...state,
          agenda: state.agenda.filter((_, i) => i !== action.index),
        };
      }
      return state;
    default:
      return state;
  }
}

// --- Sub-components ---

interface MeetingTypeSelectorProps {
  selectedType: string;
  onSelectType: (type: string) => void;
}

function MeetingTypeSelector({
  selectedType,
  onSelectType,
}: MeetingTypeSelectorProps) {
  return (
    <div>
      <span className="block text-brutal-sm uppercase mb-[6px]">
        <HiOutlineTemplate className="inline w-16px h-16px mr-[4px]" />
        MEETING TYPE
      </span>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-[4px]">
        {meetingTypes.map((meetingType) => (
          <button
            key={meetingType.value}
            type="button"
            onClick={() => onSelectType(meetingType.value)}
            className={`p-[8px] border-2 text-center transition-colors ${
              selectedType === meetingType.value
                ? "bg-[var(--theme-primary)] border-[var(--theme-primary)] text-[var(--theme-background)]"
                : "bg-[var(--theme-background-secondary)] border-[var(--theme-border)] text-[var(--theme-foreground)] hover:border-[var(--theme-primary)]"
            }`}
          >
            <div className="text-lg mb-[2px]">{meetingType.icon}</div>
            <div className="font-mono text-brutal-xs uppercase">
              {meetingType.label}
            </div>
            <div className="font-mono text-brutal-xs text-[var(--theme-foreground)]/60">
              {meetingType.duration}min
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

interface RecurrenceOptionsPanelProps {
  isRecurring: boolean;
  onRecurringChange: (isRecurring: boolean) => void;
  recurrenceFreq: "daily" | "weekly" | "monthly";
  onFreqChange: (freq: string) => void;
  recurrenceInterval: number;
  onIntervalChange: (interval: number) => void;
  recurrenceEndDate: string;
  onEndDateChange: (date: string) => void;
}

function RecurrenceOptionsPanel({
  isRecurring,
  onRecurringChange,
  recurrenceFreq,
  onFreqChange,
  recurrenceInterval,
  onIntervalChange,
  recurrenceEndDate,
  onEndDateChange,
}: RecurrenceOptionsPanelProps) {
  return (
    <div>
      <label className="flex items-center gap-[4px] mb-[8px]">
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => onRecurringChange(e.target.checked)}
          className="w-16px h-16px"
        />
        <HiOutlineRefresh className="w-16px h-16px" />
        <span className="text-brutal-sm uppercase">RECURRING MEETING</span>
      </label>

      {isRecurring && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[8px] p-[10px] bg-[var(--theme-background-secondary)] border border-[var(--theme-border)]">
          <div>
            <BrutalSelect
              id="schedule-meeting-frequency"
              label="FREQUENCY"
              value={recurrenceFreq}
              onChange={(v) => onFreqChange(v)}
              options={[
                { value: 'daily', label: 'DAILY' },
                { value: 'weekly', label: 'WEEKLY' },
                { value: 'monthly', label: 'MONTHLY' },
              ]}
              fullWidth
            />
          </div>
          <div>
            <label
              htmlFor="schedule-meeting-interval"
              className="block text-brutal-xs uppercase mb-[4px]"
            >
              INTERVAL
            </label>
            <input
              id="schedule-meeting-interval"
              type="number"
              value={recurrenceInterval}
              onChange={(e) => onIntervalChange(parseInt(e.target.value) || 1)}
              min={1}
              max={12}
              className="w-full px-[8px] py-[4px] bg-[var(--theme-background)] border border-[var(--theme-border)] font-mono text-brutal-xs"
            />
          </div>
          <div>
            <label
              htmlFor="schedule-meeting-end-date"
              className="block text-brutal-xs uppercase mb-[4px]"
            >
              END DATE
            </label>
            <input
              id="schedule-meeting-end-date"
              type="date"
              value={recurrenceEndDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="w-full px-[8px] py-[4px] bg-[var(--theme-background)] border border-[var(--theme-border)] font-mono text-brutal-xs"
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface AgendaItemsEditorProps {
  agenda: string[];
  onUpdate: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function AgendaItemsEditor({
  agenda,
  onUpdate,
  onAdd,
  onRemove,
}: AgendaItemsEditorProps) {
  return (
    <div>
      <span className="block text-brutal-sm uppercase mb-[4px]">AGENDA</span>
      <div className="space-y-[4px]">
        {agenda.map((item, index) => (
          <div key={`agenda-${item || "empty"}`} className="flex gap-[4px]">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdate(index, e.target.value)}
              aria-label={`Agenda item ${index + 1}`}
              placeholder={`AGENDA ITEM ${index + 1}`}
              className="flex-1 px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                       font-mono text-brutal-sm placeholder:text-[var(--theme-foreground-secondary)]
                       focus:border-[var(--theme-primary)] focus:outline-none"
            />
            {agenda.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="px-[8px] py-[8px] bg-[var(--theme-error)] border-2 border-[var(--theme-error)] text-[var(--theme-background)] hover:bg-[var(--theme-error)]/80"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          className="w-full px-[10px] py-[8px] border-2 border-dashed border-[var(--theme-border)]
                   text-[var(--theme-foreground)]/60 hover:text-[var(--theme-foreground)] hover:border-[var(--theme-primary)]
                   transition-colors font-mono text-brutal-sm"
        >
          + ADD AGENDA ITEM
        </button>
      </div>
    </div>
  );
}

interface MeetingFormFieldsProps {
  title: string;
  description: string;
  duration: number;
  startDate: string;
  startTime: string;
  location: string;
  meetingUrl: string;
  selectedAttendees: string[];
  attendeeOptions: Array<{ value: string; label: string; avatar?: string }>;
  onFieldChange: (field: string, value: string | number | boolean | string[]) => void;
}

function MeetingFormFields({
  title,
  description,
  duration,
  startDate,
  startTime,
  location,
  meetingUrl,
  selectedAttendees,
  attendeeOptions,
  onFieldChange,
}: MeetingFormFieldsProps) {
  return (
    <>
      {/* Title & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[8px]">
        <div>
          <label
            htmlFor="schedule-meeting-title"
            className="block text-brutal-sm uppercase mb-[4px]"
          >
            TITLE
          </label>
          <input
            id="schedule-meeting-title"
            type="text"
            value={title}
            onChange={(e) => onFieldChange("title", e.target.value)}
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-sm focus:border-[var(--theme-primary)] focus:outline-none"
            required
          />
        </div>
        <div>
          <label
            htmlFor="schedule-meeting-duration"
            className="block text-brutal-sm uppercase mb-[4px]"
          >
            DURATION (MINUTES)
          </label>
          <input
            id="schedule-meeting-duration"
            type="number"
            value={duration}
            onChange={(e) =>
              onFieldChange("duration", parseInt(e.target.value) || 30)
            }
            min={5}
            max={480}
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-sm focus:border-[var(--theme-primary)] focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="schedule-meeting-description"
          className="block text-brutal-sm uppercase mb-[4px]"
        >
          DESCRIPTION
        </label>
        <textarea
          id="schedule-meeting-description"
          value={description}
          onChange={(e) => onFieldChange("description", e.target.value)}
          rows={2}
          className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                   font-mono text-brutal-sm focus:border-[var(--theme-primary)] focus:outline-none resize-none"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[8px]">
        <div>
          <label
            htmlFor="schedule-meeting-date"
            className="block text-brutal-sm uppercase mb-[4px]"
          >
            <HiOutlineCalendar className="inline w-16px h-16px mr-[4px]" />
            DATE
          </label>
          <input
            id="schedule-meeting-date"
            type="date"
            value={startDate}
            onChange={(e) => onFieldChange("startDate", e.target.value)}
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-sm focus:border-[var(--theme-primary)] focus:outline-none"
            required
          />
        </div>
        <div>
          <label
            htmlFor="schedule-meeting-time"
            className="block text-brutal-sm uppercase mb-[4px]"
          >
            <HiOutlineClock className="inline w-16px h-16px mr-[4px]" />
            TIME
          </label>
          <input
            id="schedule-meeting-time"
            type="time"
            value={startTime}
            onChange={(e) => onFieldChange("startTime", e.target.value)}
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-sm focus:border-[var(--theme-primary)] focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Location & Meeting URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[8px]">
        <div>
          <label
            htmlFor="schedule-meeting-location"
            className="block text-brutal-sm uppercase mb-[4px]"
          >
            <HiOutlineLocationMarker className="inline w-16px h-16px mr-[4px]" />
            LOCATION
          </label>
          <input
            id="schedule-meeting-location"
            type="text"
            value={location}
            onChange={(e) => onFieldChange("location", e.target.value)}
            placeholder="CONFERENCE ROOM A"
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-sm placeholder:text-[var(--theme-foreground-secondary)]
                     focus:border-[var(--theme-primary)] focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="schedule-meeting-url"
            className="block text-brutal-sm uppercase mb-[4px]"
          >
            <HiOutlineVideoCamera className="inline w-16px h-16px mr-[4px]" />
            MEETING URL
          </label>
          <input
            id="schedule-meeting-url"
            type="url"
            value={meetingUrl}
            onChange={(e) => onFieldChange("meetingUrl", e.target.value)}
            placeholder="HTTPS://MEET.GOOGLE.COM/..."
            className="w-full px-[10px] py-[8px] bg-[var(--theme-background-secondary)] border-2 border-[var(--theme-border)]
                     font-mono text-brutal-sm placeholder:text-[var(--theme-foreground-secondary)]
                     focus:border-[var(--theme-primary)] focus:outline-none"
          />
        </div>
      </div>

      {/* Attendees */}
      <div>
        <span className="block text-brutal-sm uppercase mb-[4px]">
          <HiOutlineUsers className="inline w-16px h-16px mr-[4px]" />
          ATTENDEES
        </span>
        <MultiSelect
          options={attendeeOptions}
          value={selectedAttendees}
          onChange={(val: string[]) => onFieldChange("selectedAttendees", val)}
          placeholder="SELECT TEAM MEMBERS"
        />
      </div>
    </>
  );
}

// --- Main Component ---

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  projectId,
  sprintId,
  workspaceId,
  meeting,
  onSuccess,
}: ScheduleMeetingModalProps) {
  const [form, formDispatch] = useReducer(formReducer, formInitialState);
  const {
    title,
    description,
    meetingType: type,
    startDate,
    startTime,
    duration,
    location,
    meetingUrl,
    selectedAttendees,
    isRecurring,
    recurrenceFreq,
    recurrenceInterval,
    recurrenceEndDate,
    agenda,
    isCreating,
  } = form;

  const createMeeting = useMutation(api.meetings.mutations.createMeeting);
  const updateMeeting = useMutation(api.meetings.mutations.updateMeeting);
  const templates = useQuery(api.meetings.queries.getMeetingTemplates);

  // Get workspace members for attendee selection
  const workspaceMembers = useQuery(
    api.workspaces.queries.getWorkspaceMembers,
    workspaceId ? { workspaceId: workspaceId as Id<"workspaces"> } : "skip",
  );

  // Auto-populate from existing meeting if editing
  useEffect(() => {
    if (meeting && isOpen) {
      const data: Partial<MeetingFormState> = {
        title: meeting.title || "",
        description: meeting.description || "",
        meetingType: meeting.type || "custom",
        duration: Math.round((meeting.endTime - meeting.startTime) / 60000),
        location: meeting.location || "",
        meetingUrl: meeting.meetingUrl || "",
        selectedAttendees: meeting.attendees?.map((a) => a.userId as string) || [],
      };

      if (meeting.startTime) {
        const startDateTime = new Date(meeting.startTime);
        data.startDate = startDateTime.toISOString().split("T")[0];
        data.startTime = startDateTime.toTimeString().slice(0, 5);
      }

      if (meeting.template?.agenda) {
        data.agenda = meeting.template.agenda;
      }

      if (meeting.recurrence) {
        data.isRecurring = true;
        data.recurrenceFreq = meeting.recurrence.frequency;
        data.recurrenceInterval = meeting.recurrence.interval;
        if (meeting.recurrence.endDate) {
          data.recurrenceEndDate = new Date(meeting.recurrence.endDate)
            .toISOString()
            .split("T")[0];
        }
      }

      formDispatch({ type: "POPULATE", data });
    }
  }, [meeting, isOpen]);

  // Auto-populate based on meeting type (only if not editing)
  useEffect(() => {
    if (!meeting) {
      const selectedType = meetingTypes.find((t) => t.value === type);
      const template = templates?.find((t) => t.type === type);

      if (selectedType && template) {
        const data: Partial<MeetingFormState> = {
          title: template.title,
          duration: template.duration,
          agenda: template.agenda || [""],
          isRecurring: template.isRecurring,
        };
        if (template.defaultRecurrence) {
          data.recurrenceFreq = template.defaultRecurrence.frequency;
          data.recurrenceInterval = template.defaultRecurrence.interval;
        }
        formDispatch({ type: "POPULATE", data });
      } else if (selectedType) {
        formDispatch({
          type: "POPULATE",
          data: { title: selectedType.label, duration: selectedType.duration },
        });
      }
    }
  }, [type, templates, meeting]);

  // Set default date/time
  useEffect(() => {
    if (isOpen && !startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const defaultTimes: Record<string, string> = {
        standup: "09:00",
        retrospective: "14:00",
        planning: "10:00",
        review: "15:00",
        custom: "14:00",
      };
      formDispatch({
        type: "POPULATE",
        data: {
          startDate: tomorrow.toISOString().split("T")[0],
          startTime: defaultTimes[type],
        },
      });
    }
  }, [isOpen, startDate, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Meeting title is required");
      return;
    }

    if (!startDate || !startTime) {
      toast.error("Start date and time are required");
      return;
    }

    if (selectedAttendees.length === 0) {
      toast.error("At least one attendee is required");
      return;
    }

    formDispatch({ type: "SET_FIELD", field: "isCreating", value: true });

    try {
      const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
      const endDateTime = startDateTime + duration * 60 * 1000;

      const recurrence = isRecurring
        ? {
            frequency: recurrenceFreq,
            interval: recurrenceInterval,
            endDate: recurrenceEndDate
              ? new Date(recurrenceEndDate).getTime()
              : undefined,
          }
        : undefined;

      const template = {
        agenda: agenda.filter((item) => item.trim()),
        duration,
        isRecurring,
      };

      if (meeting) {
        // Update existing meeting
        await updateMeeting({
          meetingId: meeting._id,
          title: title.trim(),
          description: description.trim() || undefined,
          startTime: startDateTime,
          endTime: endDateTime,
          location: location.trim() || undefined,
          meetingUrl: meetingUrl.trim() || undefined,
        });
        toast.success("Meeting updated successfully");
      } else {
        // Create new meeting
        await createMeeting({
          workspaceId: workspaceId as Id<"workspaces">,
          projectId: projectId ? (projectId as Id<"projects">) : undefined,
          sprintId: sprintId ? (sprintId as Id<"sprints">) : undefined,
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          startTime: startDateTime,
          endTime: endDateTime,
          location: location.trim() || undefined,
          meetingUrl: meetingUrl.trim() || undefined,
          attendeeIds: selectedAttendees as Id<"users">[],
          template,
          recurrence,
        });
        toast.success("Meeting scheduled successfully");
      }
      onSuccess?.();
      onClose();
      resetForm();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting");
    } finally {
      formDispatch({ type: "SET_FIELD", field: "isCreating", value: false });
    }
  };

  const resetForm = () => {
    formDispatch({ type: "RESET" });
  };

  const addAgendaItem = () => {
    formDispatch({ type: "ADD_AGENDA" });
  };

  const updateAgendaItem = (index: number, value: string) => {
    formDispatch({ type: "UPDATE_AGENDA", index, value });
  };

  const removeAgendaItem = (index: number) => {
    formDispatch({ type: "REMOVE_AGENDA", index });
  };

  const attendeeOptions =
    workspaceMembers
      ?.map((member) => ({
        value: member.user?._id || "",
        label: member.user?.name || "Unknown User",
        avatar: member.user?.avatarUrl,
      }))
      .filter((option) => option.value) || [];

  return (
    <BrutalModal
      isOpen={isOpen}
      onClose={onClose}
      title={meeting ? "EDIT MEETING" : "SCHEDULE MEETING"}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-[12px]">
        <MeetingTypeSelector
          selectedType={type}
          onSelectType={(val) =>
            formDispatch({
              type: "SET_FIELD",
              field: "meetingType",
              value: val,
            })
          }
        />

        <MeetingFormFields
          title={title}
          description={description}
          duration={duration}
          startDate={startDate}
          startTime={startTime}
          location={location}
          meetingUrl={meetingUrl}
          selectedAttendees={selectedAttendees}
          attendeeOptions={attendeeOptions}
          onFieldChange={(field, value) =>
            formDispatch({ type: "SET_FIELD", field, value })
          }
        />

        <RecurrenceOptionsPanel
          isRecurring={isRecurring}
          onRecurringChange={(val) =>
            formDispatch({
              type: "SET_FIELD",
              field: "isRecurring",
              value: val,
            })
          }
          recurrenceFreq={recurrenceFreq}
          onFreqChange={(val) =>
            formDispatch({
              type: "SET_FIELD",
              field: "recurrenceFreq",
              value: val,
            })
          }
          recurrenceInterval={recurrenceInterval}
          onIntervalChange={(val) =>
            formDispatch({
              type: "SET_FIELD",
              field: "recurrenceInterval",
              value: val,
            })
          }
          recurrenceEndDate={recurrenceEndDate}
          onEndDateChange={(val) =>
            formDispatch({
              type: "SET_FIELD",
              field: "recurrenceEndDate",
              value: val,
            })
          }
        />

        <AgendaItemsEditor
          agenda={agenda}
          onUpdate={updateAgendaItem}
          onAdd={addAgendaItem}
          onRemove={removeAgendaItem}
        />

        {/* Action Buttons */}
        <div className="flex gap-[8px] justify-end pt-[12px] border-t-2 border-[var(--theme-border)]">
          <button
            type="button"
            onClick={onClose}
            className="brutal-btn-secondary"
            disabled={isCreating}
          >
            CANCEL
          </button>
          <button type="submit" className="brutal-btn" disabled={isCreating}>
            {isCreating
              ? meeting
                ? "UPDATING..."
                : "SCHEDULING..."
              : meeting
                ? "UPDATE MEETING"
                : "SCHEDULE MEETING"}
          </button>
        </div>
      </form>
    </BrutalModal>
  );
}
