import ChatExperience from '../../components/chat/ChatExperience'

const userIntro = [
  'Hey there! I am ready to turn your notes, briefs, or ideas into polished outputs.',
  'Drop a request, mention key constraints, and I will handle the rest.',
]

const guestIntro = [
  'Welcome! You are in guest mode. Try two prompts to experience the workflow.',
  'Create an account to remove limits and unlock file uploads.',
]

const UserHome = ({ isGuest = false }) => {
  const copy = isGuest
    ? {
        headline: 'How can I help you today?',
        subheadline: 'Preview two prompts, see the responses, and upgrade when you need uploads or longer sessions.',
        intro: guestIntro,
        promptLimit: 2,
      }
    : {
        headline: 'AI assistant for daily workflows',
        subheadline: 'Work faster with a copilot that remembers context, drafts updates, and polishes deliverables.',
        intro: userIntro,
        promptLimit: 5,
      }

  return (
    <ChatExperience
      role={isGuest ? 'guest' : 'user'}
      headline={copy.headline}
      subheadline={copy.subheadline}
      attachmentsEnabled={!isGuest}
      promptLimit={copy.promptLimit}
      introMessages={copy.intro}
    />
  )
}

export default UserHome
