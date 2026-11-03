import { ReactNode } from 'react'
import clsx from 'clsx'
import { Loading } from './loading'

interface Column<T = any> {
  key: string
  label: string
  render?: (value: unknown, row: T) => ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  actions?: (row: T) => ReactNode
  className?: string
  emptyMessage?: string
}

export default function Table<T extends Record<string, any> = any>({
  columns,
  data,
  loading = false,
  actions,
  className,
  emptyMessage = 'No data found',
}: TableProps<T>) {
  if (loading) {
    return <Loading text="Loading data..." />
  }

  return (
    <div className={clsx('overflow-x-auto rounded-lg border border-border', className)}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {col.label}
              </th>
            ))}
            {actions && (
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-6 py-12 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={(row.id as string) || rowIndex}
                className="hover:bg-muted/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-6 py-4 text-sm text-card-foreground"
                  >
                    {col.render
                      ? col.render(row[col.key], row)
                      : (typeof row[col.key] === 'object' && row[col.key] !== null
                          ? JSON.stringify(row[col.key])
                          : (row[col.key] as ReactNode) ?? '-')}
                  </td>
                ))}
                {actions && (
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {actions(row)}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
