import React from 'react'

export default function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Mirrorball</h1>
      <p>Vite + React scaffold. Auth, upload, list, and delete features will be added next.</p>
      <ul>
        <li>API base URL: {import.meta.env.VITE_API_BASE_URL || '(unset)'}</li>
        <li>User Pool ID: {import.meta.env.VITE_USER_POOL_ID || '(unset)'}</li>
        <li>User Pool Client ID: {import.meta.env.VITE_USER_POOL_CLIENT_ID || '(unset)'}</li>
        <li>CloudFront domain: {import.meta.env.VITE_CLOUDFRONT_DOMAIN || '(unset)'}</li>
      </ul>
    </div>
  )
}
