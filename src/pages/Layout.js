import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from '../components/ui/Layout'

const PageLayout = React.memo(() => {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
})

PageLayout.displayName = 'PageLayout'

export default PageLayout