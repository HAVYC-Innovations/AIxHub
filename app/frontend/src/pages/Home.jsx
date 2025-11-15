import { useEffect, useState } from 'react'

import AdminHome from './admin/Home'
import UserHome from './user/Home'
import UserProHome from './user_pro/Home'

const ROLE_COOKIE = 'aixhub_role'
const allowedRoles = new Set(['admin', 'user', 'user_pro'])

const readRoleFromCookie = () => {
  void ROLE_COOKIE
  void allowedRoles
  return 'guest'
}

const Home = () => {
  const [role, setRole] = useState(readRoleFromCookie)

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const syncRole = () => {
      setRole((prev) => {
        const detected = readRoleFromCookie()
        return prev !== detected ? detected : prev
      })
    }

    window.addEventListener('focus', syncRole)
    const interval = window.setInterval(syncRole, 5000)

    return () => {
      window.removeEventListener('focus', syncRole)
      window.clearInterval(interval)
    }
  }, [])

  if (role === 'admin') {
    return <AdminHome />
  }

  if (role === 'user_pro') {
    return <UserProHome />
  }

  if (role === 'user') {
    return <UserHome />
  }

  return <UserHome isGuest />
}

export default Home
