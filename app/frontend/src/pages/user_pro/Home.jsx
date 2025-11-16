import ChatExperience from '../../components/chat/ChatExperience'
import ModelKnowledgeCenter from '../../components/models/ModelKnowledgeCenter'

const proIntro = [
  'You are in Pro mode. I can ingest heavy research packets and deliver polished assets end-to-end.',
  'Tell me what type of deliverable you need and attach the context to get started.',
]

const UserProHome = () => (
  <ChatExperience
    role="user_pro"
    headline="Full creative workspace"
    subheadline="Upload deep context, generate multi-format deliverables, and keep every conversation in sync."
    attachmentsEnabled
    introMessages={proIntro}
    knowledgeCenterSlot={<ModelKnowledgeCenter role="user_pro" />}
  />
)

export default UserProHome
