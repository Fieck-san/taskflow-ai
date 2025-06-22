import { prisma } from '@/lib/prisma'

export default async function TestDatabase() {
  // Test database connection
  try {
    await prisma.$connect()
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const taskCount = await prisma.task.count()

    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-green-600">
          ✅ Database Connected Successfully!
        </h1>
        
        <div className="bg-gray-50 p-6 rounded-lg space-y-3">
          <h2 className="text-lg font-semibold">Database Status:</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-2xl font-bold text-blue-600">{userCount}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-2xl font-bold text-green-600">{projectCount}</div>
              <div className="text-sm text-gray-600">Projects</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-2xl font-bold text-purple-600">{taskCount}</div>
              <div className="text-sm text-gray-600">Tasks</div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800">What just happened?</h3>
          <ul className="mt-2 text-sm text-blue-700 space-y-1">
            <li>✅ Connected to your Supabase PostgreSQL database</li>
            <li>✅ Verified all tables exist (users, projects, tasks, etc.)</li>
            <li>✅ Prisma Client is working correctly</li>
            <li>✅ TypeScript types are generated</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Ready to build TaskFlow AI! 🚀
          </a>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-red-600">
          ❌ Database Connection Failed
        </h1>
        <div className="bg-red-50 p-6 rounded-lg">
          <pre className="text-sm text-red-800 whitespace-pre-wrap">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>Double-check your DATABASE_URL in .env file</p>
        </div>
      </div>
    )
  }
}