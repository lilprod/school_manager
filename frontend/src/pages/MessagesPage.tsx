import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { fetchContacts } from '../api/contacts'
import { fetchInbox, fetchSentMessages, markMessageAsRead, sendMessage, type SendMessagePayload } from '../api/messages'
import { Card } from '../components/Card'
import type { Message } from '../types'

type Tab = 'inbox' | 'sent'

export default function MessagesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('inbox')
  const [showForm, setShowForm] = useState(false)

  const inbox = useQuery({ queryKey: ['messages', 'inbox'], queryFn: fetchInbox })
  const sent = useQuery({ queryKey: ['messages', 'sent'], queryFn: fetchSentMessages })

  const contacts = useQuery({ queryKey: ['contacts'], queryFn: () => fetchContacts(), enabled: showForm })

  const { register, handleSubmit, reset } = useForm<SendMessagePayload>()

  const sendMutation = useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'sent'] })
      reset()
      setShowForm(false)
    },
  })

  const markReadMutation = useMutation({
    mutationFn: markMessageAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'inbox'] })
    },
  })

  const handleMessageClick = (message: Message) => {
    if (tab === 'inbox' && !message.readAt) {
      markReadMutation.mutate(message.id)
    }
  }

  const list = tab === 'inbox' ? inbox.data : sent.data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('messages.title')}</h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          {t('messages.compose')}
        </button>
      </div>

      {showForm && (
        <Card>
          <form
            onSubmit={handleSubmit((values) => sendMutation.mutate(values))}
            className="grid grid-cols-1 gap-3 sm:grid-cols-3"
          >
            <select
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              {...register('recipientId', { required: true })}
            >
              <option value="">{t('messages.selectRecipient')}</option>
              {contacts.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} — {t(`roles.${c.role}`)}
                  {c.schoolName ? ` (${c.schoolName})` : ''}
                </option>
              ))}
            </select>
            <textarea
              placeholder={t('messages.content') as string}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white sm:col-span-2"
              {...register('content', { required: true })}
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              {t('messages.send')}
            </button>
          </form>
        </Card>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('inbox')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'inbox'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {t('messages.inbox')}
        </button>
        <button
          type="button"
          onClick={() => setTab('sent')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'sent'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {t('messages.sent')}
        </button>
      </div>

      <Card>
        {list && list.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('messages.noMessages')}</p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list?.map((message) => {
              const counterpart = tab === 'inbox' ? message.sender : message.recipient
              const counterpartLabel = counterpart
                ? `${counterpart.firstName} ${counterpart.lastName}`
                : tab === 'inbox'
                  ? message.senderId
                  : message.recipientId
              const isUnread = tab === 'inbox' && !message.readAt
              return (
                <li
                  key={message.id}
                  onClick={() => handleMessageClick(message)}
                  className={`flex cursor-pointer flex-col gap-1 py-3 ${isUnread ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{counterpartLabel}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{message.content}</p>
                  {tab === 'inbox' && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {message.readAt ? t('messages.read') : t('messages.unread')}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
