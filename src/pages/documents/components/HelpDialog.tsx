import React, { useState } from 'react';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Text,
  Tab,
  TabList,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Input,
  Link,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { 
  QuestionCircle20Regular, 
  BookRegular, 
  VideoRegular, 
  ChatRegular,
  SendRegular
} from '@fluentui/react-icons';

const useStyles = makeStyles({
  dialog: {
    minWidth: '600px',
    maxWidth: '800px',
    maxHeight: '80vh'
  },
  tab: {
    padding: '16px',
    height: '400px',
    overflowY: 'auto'
  },
  faqItem: {
    marginBottom: '8px'
  },
  videoItem: {
    padding: '12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: '8px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground2
    }
  },
  contactSection: {
    padding: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    marginBottom: '12px'
  },
  messageInput: {
    width: '100%',
    minHeight: '80px',
    marginTop: '8px'
  }
});

interface HelpDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const faqData = [
  {
    question: "How do I upload documents?",
    answer: "Click the 'Upload' button in the toolbar and select 'From Device', 'From Cloud', or 'From Portal'. Choose your files and fill in the required metadata."
  },
  {
    question: "How do I share documents with clients?",
    answer: "Select the documents you want to share and click the 'Share' button. Add client email addresses and set appropriate permissions."
  },
  {
    question: "What does 'Lock Document' mean?",
    answer: "Locking a document prevents others from editing it while you're working on it. This ensures document integrity during collaborative work."
  },
  {
    question: "How do I move documents between Firm and Client sides?",
    answer: "Right-click on a document and select 'Move to Client Side' or 'Move to Firm Side' depending on where you want to move it."
  },
  {
    question: "What are the different document statuses?",
    answer: "Document statuses include: Active (ready for use), Pending Validation (awaiting review), Validation in Process (being reviewed), Pending Review (awaiting approval), Locked (being edited), and Access Closed (restricted access)."
  },
  {
    question: "How do I download documents?",
    answer: "Right-click on a document and select 'Download', or select multiple documents and use the bulk actions menu."
  }
];

const videoTutorials = [
  {
    title: "Getting Started with Document Management",
    duration: "5:30",
    description: "Learn the basics of uploading, organizing, and managing documents."
  },
  {
    title: "Sharing and Collaboration Features",
    duration: "8:15",
    description: "How to share documents with clients and collaborate effectively."
  },
  {
    title: "Advanced Filtering and Search",
    duration: "6:45",
    description: "Master the search and filtering capabilities to find documents quickly."
  },
  {
    title: "Document Status and Workflow Management",
    duration: "7:20",
    description: "Understanding document statuses and managing approval workflows."
  }
];

export const HelpDialog: React.FC<HelpDialogProps> = ({
  isOpen,
  onClose
}) => {
  const styles = useStyles();
  const [activeTab, setActiveTab] = useState<'faq' | 'videos' | 'contact'>('faq');
  const [contactMessage, setContactMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleSendMessage = () => {
    // Simulate sending support message
    console.log('Support message sent:', { email: contactEmail, message: contactMessage });
    setContactMessage('');
    setContactEmail('');
    // Could show a success notification here
    alert('Your message has been sent to our support team. We\'ll get back to you within 24 hours.');
  };

  const handleVideoClick = (video: any) => {
    // In a real app, this would open a video player or navigate to video
    alert(`Opening video: ${video.title}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialog}>
        <DialogBody>
          <DialogTitle>
            <QuestionCircle20Regular style={{ marginRight: '8px' }} />
            Help & Support
          </DialogTitle>
          <DialogContent>
            <TabList
              selectedValue={activeTab}
              onTabSelect={(_, data) => setActiveTab(data.value as 'faq' | 'videos' | 'contact')}
            >
              <Tab value="faq" icon={<BookRegular />}>FAQ</Tab>
              <Tab value="videos" icon={<VideoRegular />}>Video Tutorials</Tab>
              <Tab value="contact" icon={<ChatRegular />}>Contact Support</Tab>
            </TabList>

            <div className={styles.tab}>
              {activeTab === 'faq' && (
                <div>
                  <Text size={400} weight="semibold" style={{ marginBottom: '16px' }}>
                    Frequently Asked Questions
                  </Text>
                  <Accordion multiple collapsible>
                    {faqData.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionHeader>{faq.question}</AccordionHeader>
                        <AccordionPanel>
                          <Text>{faq.answer}</Text>
                        </AccordionPanel>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

              {activeTab === 'videos' && (
                <div>
                  <Text size={400} weight="semibold" style={{ marginBottom: '16px' }}>
                    Video Tutorials
                  </Text>
                  {videoTutorials.map((video, index) => (
                    <div 
                      key={index} 
                      className={styles.videoItem}
                      onClick={() => handleVideoClick(video)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <Text weight="semibold">{video.title}</Text>
                          <br />
                          <Text size={200}>{video.description}</Text>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <VideoRegular />
                          <br />
                          <Text size={200}>{video.duration}</Text>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'contact' && (
                <div>
                  <Text size={400} weight="semibold" style={{ marginBottom: '16px' }}>
                    Contact Support
                  </Text>
                  
                  <div className={styles.contactSection}>
                    <Text weight="semibold">Quick Contact</Text>
                    <br />
                    <Text size={300}>Email: <Link href="mailto:support@filemanager.com">support@filemanager.com</Link></Text>
                    <br />
                    <Text size={300}>Phone: +1 (555) 123-4567</Text>
                    <br />
                    <Text size={300}>Hours: Monday - Friday, 9 AM - 6 PM EST</Text>
                  </div>

                  <Text weight="semibold">Send us a message:</Text>
                  <Input
                    placeholder="Your email address"
                    value={contactEmail}
                    onChange={(_, data) => setContactEmail(data.value)}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                  <textarea
                    className={styles.messageInput}
                    placeholder="Describe your issue or question..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: tokens.borderRadiusMedium,
                      border: `1px solid ${tokens.colorNeutralStroke1}`,
                      fontFamily: tokens.fontFamilyBase,
                      fontSize: tokens.fontSizeBase300
                    }}
                  />
                  <Button
                    appearance="primary"
                    icon={<SendRegular />}
                    onClick={handleSendMessage}
                    disabled={!contactMessage.trim() || !contactEmail.trim()}
                    style={{ marginTop: '8px' }}
                  >
                    Send Message
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};
