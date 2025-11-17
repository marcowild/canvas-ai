export function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">CanvasAI</h1>
      <p className="text-xl text-gray-600 mb-8">AI-Powered Workflow Builder</p>
      <div className="space-x-4">
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Login
        </a>
        <a
          href="/signup"
          className="inline-block px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
        >
          Sign Up
        </a>
      </div>
    </div>
  )
}
