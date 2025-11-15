import ChatExperience from '../../components/chat/ChatExperience'

const adminIntro = [
	'Welcome back, Admin. All workspaces are synchronized and ready for your directives.',
	'Share a to-do, upload new governance docs, or ask for a board-ready presentation.',
]

const AdminHome = () => (
	<ChatExperience
		role="admin"
		headline="AIxHub Control Center"
		subheadline="Monitor every workspace, publish prompts, and orchestrate assets without leaving the chat."
		attachmentsEnabled
		introMessages={adminIntro}
	/>
)

export default AdminHome
