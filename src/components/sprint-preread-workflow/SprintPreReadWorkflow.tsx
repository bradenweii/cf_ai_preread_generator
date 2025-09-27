import React, { useState, useCallback } from 'react';
import { Button } from '../button/Button';
import { Card } from '../card/Card';
import { FileUpload, type UploadedFile } from '../file-upload/FileUpload';
import { Textarea } from '../textarea/Textarea';
import { MemoizedMarkdown } from '../memoized-markdown';
import { 
  Upload, 
  Users, 
  Eye, 
  PaperPlaneTilt, 
  CalendarBlank,
  CheckCircle,
  ArrowRight
} from '@phosphor-icons/react';

type WorkflowStep = 'upload' | 'meeting-details' | 'attendees' | 'preview' | 'send';

interface MeetingDetails {
  title: string;
  date: string;
  time: string;
}

interface SprintPreReadWorkflowProps {
  onClose: () => void;
  onComplete?: (data: {
    sprintFile: UploadedFile;
    meetingDetails: MeetingDetails;
    attendeeEmails: string[];
    preReadContent: string;
  }) => void;
}

export function SprintPreReadWorkflow({ onClose, onComplete }: SprintPreReadWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [sprintFile, setSprintFile] = useState<UploadedFile | null>(null);
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
    title: '',
    date: '',
    time: ''
  });
  const [attendeeEmails, setAttendeeEmails] = useState<string>('');
  const [preReadContent, setPreReadContent] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditingPreRead, setIsEditingPreRead] = useState(false);

  const steps = {
    upload: { title: 'Upload Sprint File', icon: Upload },
    'meeting-details': { title: 'Meeting Details', icon: CalendarBlank },
    attendees: { title: 'Add Attendees', icon: Users },
    preview: { title: 'Preview Pre-Read', icon: Eye },
    send: { title: 'Send to Team', icon: PaperPlaneTilt }
  };

  const stepOrder: WorkflowStep[] = ['upload', 'meeting-details', 'attendees', 'preview', 'send'];
  const currentStepIndex = stepOrder.indexOf(currentStep);

  const handleFileSelect = useCallback((file: File, content?: string) => {
    const fileId = `${file.name}-${Date.now()}`;
    const newFile: UploadedFile = {
      id: fileId,
      file,
      content,
      error: content === undefined ? "Failed to extract text" : undefined,
      isProcessing: false
    };
    setSprintFile(newFile);
  }, []);

  const handleFileRemove = useCallback(() => {
    setSprintFile(null);
  }, []);

  const parseEmailsFromText = (text: string): string[] => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex) || [];
    
    // Also parse manual email list (comma or newline separated)
    const manualEmails = text
      .split(/[,\n;]/)
      .map(email => email.trim())
      .filter(email => email.includes('@') && email.includes('.'));
    
    return [...new Set([...emails, ...manualEmails])];
  };

  const generatePreRead = async () => {
    if (!sprintFile?.content || !meetingDetails.title || !meetingDetails.date) return;
    
    setIsGenerating(true);
    try {
      // Mock generation - in real implementation, this would call the AI
      const mockPreRead = `# Pre-Read: ${meetingDetails.title}
**Date:** ${meetingDetails.date} at ${meetingDetails.time}

## Purpose
Weekly team check-in to review progress, discuss blockers, and align on priorities for the coming week.

## Sprint Context
Based on the uploaded sprint document, here are the key areas to review:

### Current Sprint Goals
- Complete user authentication feature
- Implement dashboard redesign
- Fix critical performance issues

### Tasks In Progress
- Frontend login component (80% complete)
- API integration for user profiles
- Database optimization

### Blockers & Issues
- Waiting for design approval on new components
- Third-party API rate limiting affecting tests

### This Week's Priorities
- Finalize authentication flow
- Complete performance optimizations
- Begin next sprint planning

## Meeting Agenda
1. **Sprint Progress Review** - Updates on current tasks and deliverables
2. **Blockers & Challenges** - Issues requiring team discussion or escalation  
3. **Next Week's Priorities** - Focus areas and task assignments
4. **Quick Retrospective** - What went well, what could improve

## Preparation
Please come prepared to discuss:
- Status of your assigned tasks
- Any blockers you're encountering
- Your priorities for the upcoming week

---
*This pre-read was generated automatically from your sprint document. Please review and come prepared for focused discussion.*`;

      setPreReadContent(mockPreRead);
      setCurrentStep('preview');
    } catch (error) {
      console.error('Error generating pre-read:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'upload':
        return sprintFile && sprintFile.content && !sprintFile.error;
      case 'meeting-details':
        return meetingDetails.title && meetingDetails.date && meetingDetails.time;
      case 'attendees':
        return parseEmailsFromText(attendeeEmails).length > 0;
      case 'preview':
        return preReadContent.length > 0;
      case 'send':
        return preReadContent.length > 0 && parseEmailsFromText(attendeeEmails).length > 0;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 'attendees') {
      await generatePreRead();
    } else if (currentStep === 'preview') {
      setCurrentStep('send');
    } else if (currentStep === 'send') {
      // Complete the workflow and send the email
      if (sprintFile && onComplete) {
        const workflowData = {
          sprintFile,
          meetingDetails,
          attendeeEmails: parseEmailsFromText(attendeeEmails),
          preReadContent
        };
        
        // Call the completion handler which will trigger the email sending
        onComplete(workflowData);
      }
      onClose();
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < stepOrder.length) {
        setCurrentStep(stepOrder[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(stepOrder[prevIndex]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sprint Meeting Pre-Read Generator</h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="mt-4 flex items-center gap-2 text-sm">
            {stepOrder.map((step, index) => {
              const StepIcon = steps[step].icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <React.Fragment key={step}>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    isCompleted 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : isCurrent 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle size={16} />
                    ) : (
                      <StepIcon size={16} />
                    )}
                    <span className="font-medium">{steps[step].title}</span>
                  </div>
                  {index < stepOrder.length - 1 && (
                    <ArrowRight size={16} className="text-neutral-400" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentStep === 'upload' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-4">Upload Your Sprint Document</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-10 text-lg">
                  Upload your sprint plan, task list, or meeting notes. We'll analyze it to generate a comprehensive pre-read.
                </p>
              </div>
              
              <Card className="p-8">
                <FileUpload
                  onFileSelect={handleFileSelect}
                  onFileRemove={handleFileRemove}
                  uploadedFiles={sprintFile ? [sprintFile] : []}
                  acceptedTypes={['.pdf', '.txt', '.docx', '.md']}
                />
                
                {sprintFile && sprintFile.content && (
                  <div className="mt-6 p-5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle size={16} />
                      <span className="font-medium">File processed successfully!</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                      Extracted {sprintFile.content.length} characters from {sprintFile.file.name}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {currentStep === 'meeting-details' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-4">Meeting Details</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-10 text-lg">
                  Tell us about your upcoming sprint meeting.
                </p>
              </div>
              
              <Card className="p-8 space-y-8">
                <div>
                  <label className="block text-base font-medium mb-4">Meeting Title</label>
                  <input
                    type="text"
                    value={meetingDetails.title}
                    onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Weekly Sprint Check-in"
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md dark:bg-neutral-800 text-base"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-base font-medium mb-4">Date</label>
                    <input
                      type="date"
                      value={meetingDetails.date}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md dark:bg-neutral-800 text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium mb-4">Time</label>
                    <input
                      type="time"
                      value={meetingDetails.time}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-md dark:bg-neutral-800 text-base"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {currentStep === 'attendees' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-4">Add Attendees</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-10 text-lg">
                  Enter email addresses for team members who should receive the pre-read.
                </p>
              </div>
              
              <Card className="p-8 space-y-8">
                <div>
                  <label className="block text-base font-medium mb-4">
                    Email Addresses
                    <span className="text-neutral-500 font-normal ml-2">
                      (Enter one per line or comma-separated)
                    </span>
                  </label>
                  <Textarea
                    value={attendeeEmails}
                    onChange={(e) => setAttendeeEmails(e.target.value)}
                    placeholder={`john.doe@company.com
jane.smith@company.com
team-lead@company.com`}
                    rows={6}
                    className="w-full text-base px-4 py-3"
                  />
                </div>
                
                {attendeeEmails && (
                  <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-base font-medium text-blue-700 dark:text-blue-400 mb-4">
                      Found {parseEmailsFromText(attendeeEmails).length} email addresses:
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-500 space-y-2">
                      {parseEmailsFromText(attendeeEmails).map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle size={14} />
                          {email}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-4">Preview Pre-Read</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-10 text-lg">
                  Review and edit the generated pre-read document before sending to your team.
                </p>
              </div>
              
              <Card className="p-8">
                {preReadContent ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-lg font-semibold">Pre-Read Document</h4>
                      <Button
                        variant="secondary"
                        onClick={() => setIsEditingPreRead(!isEditingPreRead)}
                        className="px-4 py-2"
                      >
                        {isEditingPreRead ? 'Preview' : 'Edit'}
                      </Button>
                    </div>
                    
                    {isEditingPreRead ? (
                      <div className="space-y-4">
                        <Textarea
                          value={preReadContent}
                          onChange={(e) => setPreReadContent(e.target.value)}
                          rows={20}
                          className="w-full font-mono text-sm"
                          placeholder="Edit your pre-read content here..."
                        />
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          💡 Tip: You can edit the content above. Markdown formatting is supported.
                        </div>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert max-w-none prose-lg">
                        <MemoizedMarkdown
                          id="preread-preview"
                          content={preReadContent}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-6"></div>
                    <p className="text-lg">Generating pre-read document...</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {currentStep === 'send' && (
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl font-semibold mb-4">Send Pre-Read to Team</h3>
                <p className="text-neutral-600 dark:text-neutral-400 mb-10 text-lg">
                  Ready to distribute the pre-read to your team members.
                </p>
              </div>
              
              <Card className="p-8 space-y-8">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-4">
                    <CheckCircle size={18} />
                    <span className="font-semibold text-lg">Everything looks good!</span>
                  </div>
                  <ul className="text-base text-green-600 dark:text-green-500 space-y-3">
                    <li>• Meeting: {meetingDetails.title}</li>
                    <li>• Date: {meetingDetails.date} at {meetingDetails.time}</li>
                    <li>• Recipients: {parseEmailsFromText(attendeeEmails).length} team members</li>
                    <li>• Pre-read document: Ready</li>
                  </ul>
                </div>
                
                <div className="p-6 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <h4 className="font-semibold mb-4 text-lg">What happens next:</h4>
                  <ol className="text-base text-neutral-600 dark:text-neutral-400 space-y-3">
                    <li>1. We'll draft a professional email with the pre-read content</li>
                    <li>2. You'll review the email before it's sent</li>
                    <li>3. The email will be distributed to all attendees</li>
                    <li>4. You can optionally set up recurring automation</li>
                  </ol>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-neutral-200 dark:border-neutral-700 flex justify-between">
          <Button
            variant="secondary"
            onClick={currentStepIndex === 0 ? onClose : handleBack}
            disabled={isGenerating}
            className="px-6 py-3 text-base"
          >
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceedToNext() || isGenerating}
            className="min-w-[140px] px-6 py-3 text-base"
          >
            {isGenerating ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </div>
            ) : currentStep === 'send' ? (
              'Send Pre-Read'
            ) : currentStep === 'attendees' ? (
              'Generate Preview'
            ) : (
              'Next'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
