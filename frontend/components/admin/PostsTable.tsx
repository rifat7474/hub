import { useMemo, useState } from 'react'
import { Search, Trash2, Heart, MessageSquare } from 'lucide-react'
import { Input } from '../../lib/shadcn/input'
import { Button } from '../../lib/shadcn/button'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../lib/shadcn/table'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '../../lib/shadcn/alert-dialog'
import { UserAvatar } from '../UserAvatar'
import { timeAgo } from '../../utils/timeAgo'

interface AdminPost {
  id: number
  content: string
  image_url: string | null
  created_at: string
  author_id: number
  author_name: string
  author_avatar: string | null
  like_count: string | number
  comment_count: string | number
}

interface PostsTableProps {
  posts: AdminPost[]
  onDelete: (postId: number) => void
  deleting: boolean
}

export function PostsTable({ posts, onDelete, deleting }: PostsTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) => p.author_name.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
  }, [posts, query])

  return (
    <div className="rounded-2xl border border-border/70 bg-card shadow-retool-sm overflow-hidden">
      <div className="p-density-md border-b border-border/60">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter posts..."
            className="pl-9 h-9 rounded-full bg-muted/40 border-transparent focus-visible:bg-background"
          />
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Author</TableHead>
            <TableHead>Content</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-right">Engagement</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <div className="flex items-center gap-density-sm">
                  <UserAvatar name={p.author_name} avatarUrl={p.author_avatar} size="sm" />
                  <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{p.author_name}</p>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <p className="text-sm text-foreground truncate">{p.content || <span className="text-muted-foreground">(image only)</span>}</p>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{timeAgo(p.created_at)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-density-sm text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" /> {Number(p.like_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5" /> {Number(p.comment_count)}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      aria-label="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes the post by {p.author_name} along with its likes and comments. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleting}
                        onClick={() => onDelete(p.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-density-lg">
                No posts match your search.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
