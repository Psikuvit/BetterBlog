import type { FeedOption, PostItem } from '@/types'

export const visibilityOptions: FeedOption[] = [
  { value: 'all', label: 'All posts' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'admin-private', label: 'Admin private' },
]

export const sortOptions: FeedOption<'recent' | 'oldest' | 'title'>[] = [
  { value: 'recent', label: 'Most recent' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title' },
]

export function isPostItem(value: unknown): value is PostItem {
  return typeof value === 'object' && value !== null && 'id' in value
}

export function getFeedLabel(options: FeedOption[], value: string, fallback: string): string {
  return options.find((item) => item.value === value)?.label || fallback
}
