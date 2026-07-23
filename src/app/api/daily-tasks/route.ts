import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, created } from '@/lib/api'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const assigneeId = searchParams.get('assigneeId')
    const completed = searchParams.get('completed')

    const now = new Date()
    const targetDate = date
      ? new Date(date)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
    const endOfDay = new Date(startOfDay)
    endOfDay.setDate(endOfDay.getDate() + 1)

    const tasks = await db.dailyTask.findMany({
      where: {
        taskDate: { gte: startOfDay, lt: endOfDay },
        ...(assigneeId ? { assigneeId } : {}),
        ...(completed === 'true' ? { isCompleted: true } : {}),
        ...(completed === 'false' ? { isCompleted: false } : {}),
      },
      include: { assignee: true },
      orderBy: [{ isCompleted: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
    })

    return ok(tasks)
  } catch (e) {
    return serverError('Error al listar tareas', e)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.title) return badRequest('Título es obligatorio')

    const now = new Date()
    const taskDate = body.taskDate
      ? new Date(body.taskDate)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const maxSort = await db.dailyTask.aggregate({
      _max: { sortOrder: true },
      where: { taskDate: { gte: taskDate, lt: new Date(taskDate.getTime() + 86400000) } },
    })

    const task = await db.dailyTask.create({
      data: {
        title: body.title,
        description: body.description || null,
        assigneeId: body.assigneeId || null,
        taskDate,
        priority: body.priority || 'normal',
        isRecurring: body.isRecurring || false,
        recurringRule: body.recurringRule || null,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      },
      include: { assignee: true },
    })

    return created(task)
  } catch (e) {
    return serverError('Error al crear tarea', e)
  }
}
