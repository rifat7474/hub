import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DayCount {
  day: string
  count: string
}

interface ActivityChartProps {
  usersByDay: DayCount[]
  postsByDay: DayCount[]
  messagesByDay: DayCount[]
}

function buildSeries(usersByDay: DayCount[], postsByDay: DayCount[], messagesByDay: DayCount[]) {
  const days = new Map<string, { day: string; users: number; posts: number; messages: number }>()
  const today = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.set(key, { day: key.slice(5), users: 0, posts: 0, messages: 0 })
  }
  for (const row of usersByDay) {
    const entry = days.get(row.day)
    if (entry) entry.users = Number(row.count)
  }
  for (const row of postsByDay) {
    const entry = days.get(row.day)
    if (entry) entry.posts = Number(row.count)
  }
  for (const row of messagesByDay) {
    const entry = days.get(row.day)
    if (entry) entry.messages = Number(row.count)
  }
  return Array.from(days.values())
}

export function ActivityChart({ usersByDay, postsByDay, messagesByDay }: ActivityChartProps) {
  const data = buildSeries(usersByDay, postsByDay, messagesByDay)

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-density-lg shadow-retool-sm">
      <p className="text-sm font-semibold text-foreground mb-density-md">Activity — last 14 days</p>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-3))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area type="monotone" dataKey="users" name="New users" stroke="hsl(var(--chart-1))" fill="url(#colorUsers)" strokeWidth={2} />
          <Area type="monotone" dataKey="posts" name="Posts" stroke="hsl(var(--chart-2))" fill="url(#colorPosts)" strokeWidth={2} />
          <Area type="monotone" dataKey="messages" name="Messages" stroke="hsl(var(--chart-3))" fill="url(#colorMessages)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
